import { readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const manifestPath = new URL('../data/gallery.yaml', import.meta.url);
const outputPath = new URL('../data/gallery-metadata.json', import.meta.url);
const manifest = await readFile(manifestPath, 'utf8');
const sources = [...manifest.matchAll(/^\s*- src:\s*["']?([^"'\n]+)["']?\s*$/gm)].map((match) => match[1]);
let previous = {};
try { previous = JSON.parse(await readFile(outputPath, 'utf8')); } catch {}

function readExifDate(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 2;

  while (offset + 4 < bytes.length) {
    if (view.getUint8(offset) !== 0xff) { offset += 1; continue; }
    const marker = view.getUint8(offset + 1);
    if (marker === 0xda || marker === 0xd9) break;
    const length = view.getUint16(offset + 2, false);
    if (marker === 0xe1 && length >= 8) {
      const signature = new TextDecoder().decode(bytes.subarray(offset + 4, offset + 10));
      if (signature === 'Exif\0\0') return readTiffDate(view, offset + 10);
    }
    offset += 2 + length;
  }
  return null;
}

function readTiffDate(view, base) {
  const order = view.getUint16(base, false);
  const littleEndian = order === 0x4949;
  if (!littleEndian && order !== 0x4d4d) return null;
  const uint16 = (offset) => view.getUint16(base + offset, littleEndian);
  const uint32 = (offset) => view.getUint32(base + offset, littleEndian);

  function readAscii(entryOffset, count) {
    const valueOffset = count <= 4 ? entryOffset + 8 : uint32(entryOffset + 8);
    const bytes = new Uint8Array(view.buffer, view.byteOffset + base + valueOffset, Math.max(0, count - 1));
    return new TextDecoder().decode(bytes);
  }

  function readIfd(ifdOffset) {
    if (!ifdOffset || base + ifdOffset + 2 > view.byteLength) return {};
    const result = {};
    const count = uint16(ifdOffset);
    for (let index = 0; index < count; index += 1) {
      const entry = ifdOffset + 2 + (index * 12);
      if (base + entry + 12 > view.byteLength) break;
      const tag = uint16(entry);
      const type = uint16(entry + 2);
      const values = uint32(entry + 4);
      if ((tag === 0x0132 || tag === 0x9003 || tag === 0x9004) && type === 2) result[tag] = readAscii(entry, values);
      if (tag === 0x8769) result.exif = uint32(entry + 8);
    }
    return result;
  }

  const primary = readIfd(uint32(4));
  const exif = readIfd(primary.exif);
  const raw = exif[0x9003] || exif[0x9004] || primary[0x0132];
  const match = raw?.match(/^(\d{4}):(\d{2}):(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

async function metadataFor(source) {
  try {
    const { stdout } = await execFileAsync('curl', ['-LfsS', '--range', '0-131071', source], {
      encoding: 'buffer', maxBuffer: 1024 * 1024
    });
    const bytes = new Uint8Array(stdout);
    return [source, { date: readExifDate(bytes) || 'unknown' }];
  } catch (error) {
    console.warn(`Could not read metadata for ${source}: ${error.message}`);
    return [source, { date: previous[source]?.date || 'unknown' }];
  }
}

const entries = [];
for (let index = 0; index < sources.length; index += 4) {
  entries.push(...await Promise.all(sources.slice(index, index + 4).map(metadataFor)));
}

await writeFile(outputPath, `${JSON.stringify(Object.fromEntries(entries), null, 2)}\n`);
console.log(`Wrote metadata for ${entries.length} photographs to data/gallery-metadata.json`);
