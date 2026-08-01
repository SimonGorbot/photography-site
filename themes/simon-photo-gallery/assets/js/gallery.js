const dialog = document.querySelector('#gallery-lightbox');
const dataElement = document.querySelector('#gallery-data');

if (dialog && dataElement) {
  const photos = JSON.parse(dataElement.textContent);
  const byId = new Map(photos.map((photo, index) => [photo.id, { photo, index }]));
  const triggers = [...document.querySelectorAll('[data-photo-id]')];
  const gallery = document.querySelector('.gallery');
  const sortControls = [...document.querySelectorAll('[data-gallery-sort]')];
  const image = dialog.querySelector('.lightbox-image');
  const locationText = dialog.querySelector('.lightbox-location');
  const date = dialog.querySelector('.lightbox-date');
  const closeButton = dialog.querySelector('.lightbox-close');
  let activeIndex = 0;
  let returnFocus = null;
  let hashWasPushed = false;
  let touchStart = null;

  const detailURL = (photo) => photo.urls.detail;
  const formatDate = (value) => value
    && value.toLowerCase() !== 'unknown'
    ? new Intl.DateTimeFormat(document.documentElement.lang || 'en', {
      year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
    }).format(new Date(`${value}T00:00:00Z`))
    : 'Unknown';

  function render(index) {
    activeIndex = (index + photos.length) % photos.length;
    const photo = photos[activeIndex];
    image.src = detailURL(photo);
    image.alt = photo.alt;
    image.width = photo.dimensions.width;
    image.height = photo.dimensions.height;
    locationText.textContent = photo.location || 'Unknown';
    date.textContent = formatDate(photo.date);
    if (photo.date && photo.date.toLowerCase() !== 'unknown') date.dateTime = photo.date;
    else date.removeAttribute('datetime');
    [photos[(activeIndex - 1 + photos.length) % photos.length], photos[(activeIndex + 1) % photos.length]]
      .forEach((adjacent) => { const preload = new Image(); preload.src = detailURL(adjacent); });
  }

  function transition(update) {
    if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.startViewTransition(update);
    } else {
      image.classList.add('is-changing');
      update();
      requestAnimationFrame(() => image.classList.remove('is-changing'));
    }
  }

  function open(index, trigger = null, updateHash = true) {
    if (trigger) returnFocus = trigger;
    transition(() => render(index));
    if (!dialog.open) {
      dialog.showModal();
      closeButton.focus({ preventScroll: true });
    }
    if (updateHash) {
      history.pushState({ gallery: true }, '', `#photo=${encodeURIComponent(photos[activeIndex].id)}`);
      hashWasPushed = true;
    }
  }

  function close(fromHistory = false) {
    if (!dialog.open) return;
    dialog.close();
    if (!fromHistory && hashWasPushed) {
      hashWasPushed = false;
      history.back();
    } else if (!fromHistory && locationHash()) {
      history.replaceState(null, '', `${location.pathname}${location.search}`);
    }
    const target = returnFocus;
    returnFocus = null;
    target?.focus({ preventScroll: true });
  }

  function navigate(step) {
    transition(() => render(activeIndex + step));
    history.replaceState({ gallery: true }, '', `#photo=${encodeURIComponent(photos[activeIndex].id)}`);
  }

  function locationHash() {
    const match = location.hash.match(/^#photo=([^&]+)$/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  function syncHash() {
    const entry = byId.get(locationHash());
    if (entry) {
      if (dialog.open) transition(() => render(entry.index));
      else open(entry.index, document.querySelector(`[data-photo-id="${CSS.escape(entry.photo.id)}"]`), false);
    } else close(true);
  }

  function detectOrientation(trigger) {
    const thumbnail = trigger.querySelector('img');
    const item = trigger.closest('.gallery-item');
    if (!thumbnail || !item || item.dataset.orientation !== 'pending') return;
    const apply = () => {
      if (!thumbnail.naturalWidth || !thumbnail.naturalHeight) return;
      const portrait = thumbnail.naturalHeight > thumbnail.naturalWidth;
      item.dataset.orientation = portrait ? 'portrait' : 'landscape';
      item.style.setProperty('--row-span', portrait ? '2' : '1');
      const entry = byId.get(trigger.dataset.photoId);
      if (entry) entry.photo.dimensions = { width: thumbnail.naturalWidth, height: thumbnail.naturalHeight };
    };
    if (thumbnail.complete) apply();
    else thumbnail.addEventListener('load', apply, { once: true });
  }

  const recentValue = (photo) => photo.date === 'unknown' ? 0 : Date.parse(`${photo.date}T00:00:00Z`);

  function applyOrder(ordered) {
    photos.splice(0, photos.length, ...ordered);
    byId.clear();
    photos.forEach((photo, index) => {
      byId.set(photo.id, { photo, index });
      const trigger = document.querySelector(`[data-photo-id="${CSS.escape(photo.id)}"]`);
      const item = trigger?.closest('.gallery-item');
      if (item) {
        item.style.setProperty('--column-start', String(1 + ((index % 3) * 4)));
        gallery.append(item);
      }
    });
  }

  function sortGallery(mode) {
    const currentFirst = photos[0];
    const currentTop = new Set(photos.slice(0, 3));
    const ordered = [...photos];
    if (mode === 'favourites') {
      ordered.sort((a, b) => Number(b.favourite) - Number(a.favourite) || recentValue(b) - recentValue(a));
    } else if (mode === 'recent') {
      ordered.sort((a, b) => recentValue(b) - recentValue(a));
    } else {
      for (let index = ordered.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [ordered[index], ordered[randomIndex]] = [ordered[randomIndex], ordered[index]];
      }
      if (ordered.length > 1 && ordered[0] === currentFirst) {
        const swapIndex = 1 + Math.floor(Math.random() * (ordered.length - 1));
        [ordered[0], ordered[swapIndex]] = [ordered[swapIndex], ordered[0]];
      }
      if (ordered.length > 3 && ordered.slice(0, 3).every((photo) => currentTop.has(photo))) {
        const swapIndex = 3 + Math.floor(Math.random() * (ordered.length - 3));
        [ordered[0], ordered[swapIndex]] = [ordered[swapIndex], ordered[0]];
      }
    }
    applyOrder(ordered);
    sortControls.forEach((control) => control.setAttribute('aria-pressed', String(control.dataset.gallerySort === mode)));
  }

  triggers.forEach((trigger) => {
    detectOrientation(trigger);
    trigger.addEventListener('click', () => open(byId.get(trigger.dataset.photoId).index, trigger));
  });
  sortControls.forEach((control) => control.addEventListener('click', () => sortGallery(control.dataset.gallerySort)));
  dialog.querySelector('.lightbox-previous').addEventListener('click', () => navigate(-1));
  dialog.querySelector('.lightbox-next').addEventListener('click', () => navigate(1));
  closeButton.addEventListener('click', () => close());
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); close(); });
  dialog.addEventListener('keydown', (event) => {
    if (!dialog.open) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); navigate(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); navigate(-1); }
    if (event.key === 'Tab') {
      const focusable = [...dialog.querySelectorAll('a[href], button:not([disabled])')];
      const first = focusable[0]; const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  dialog.addEventListener('touchstart', (event) => {
    const touch = event.changedTouches[0]; touchStart = { x: touch.clientX, y: touch.clientY };
  }, { passive: true });
  dialog.addEventListener('touchend', (event) => {
    if (!touchStart) return;
    const touch = event.changedTouches[0]; const dx = touch.clientX - touchStart.x; const dy = touch.clientY - touchStart.y;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) navigate(dx < 0 ? 1 : -1);
    touchStart = null;
  }, { passive: true });
  addEventListener('hashchange', syncHash);
  syncHash();
}
