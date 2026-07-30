const dialog = document.querySelector('#gallery-lightbox');
const dataElement = document.querySelector('#gallery-data');

if (dialog && dataElement) {
  const photos = JSON.parse(dataElement.textContent);
  const byId = new Map(photos.map((photo, index) => [photo.id, { photo, index }]));
  const triggers = [...document.querySelectorAll('[data-photo-id]')];
  const image = dialog.querySelector('.lightbox-image');
  const locationText = dialog.querySelector('.lightbox-location');
  const date = dialog.querySelector('.lightbox-date');
  const credit = dialog.querySelector('.lightbox-credit');
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
    locationText.textContent = typeof photo.location === 'string'
      ? photo.location
      : [photo.location?.city, photo.location?.country].filter(Boolean).join(', ') || 'Unknown';
    date.textContent = formatDate(photo.date);
    if (photo.date && photo.date.toLowerCase() !== 'unknown') date.dateTime = photo.date;
    else date.removeAttribute('datetime');
    credit.replaceChildren();
    if (photo.credit?.photographer) {
      credit.append('Photograph by ');
      const photographer = document.createElement(photo.credit.photographer_url ? 'a' : 'span');
      photographer.textContent = photo.credit.photographer;
      if (photo.credit.photographer_url) {
        photographer.href = photo.credit.photographer_url;
        photographer.target = '_blank';
        photographer.rel = 'noopener noreferrer';
      }
      credit.append(photographer);
      if (photo.credit.source_name) {
        credit.append(' on ');
        const source = document.createElement(photo.credit.source_url ? 'a' : 'span');
        source.textContent = photo.credit.source_name;
        if (photo.credit.source_url) {
          source.href = photo.credit.source_url;
          source.target = '_blank';
          source.rel = 'noopener noreferrer';
        }
        credit.append(source);
      }
    }
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

  function navigate(step, updateHash = true) {
    transition(() => render(activeIndex + step));
    if (updateHash) history.replaceState({ gallery: true }, '', `#photo=${encodeURIComponent(photos[activeIndex].id)}`);
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

  triggers.forEach((trigger) => trigger.addEventListener('click', () => open(byId.get(trigger.dataset.photoId).index, trigger)));
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
