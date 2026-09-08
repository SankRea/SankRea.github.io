(() => {
  'use strict';
  if (window.novelReaderInstalled) return;
  window.novelReaderInstalled = true;

  const settingsKey = 'novel-reader:settings:v1';
  const progressKey = id => `novel-reader:progress:v1:${id}`;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  let storageAvailable = true;
  let catalogue = new Map();
  let active = null;
  let saveTimer;
  let scrollFrame;

  function read(key) {
    let value;
    try { value = localStorage.getItem(key); } catch { storageAvailable = false; return null; }
    try { return JSON.parse(value); } catch { return null; }
  }

  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {
      storageAvailable = false;
      showStorageStatus();
    }
  }

  const storedSettings = read(settingsKey);
  const settings = {
    fontSize: Number.isFinite(storedSettings?.fontSize) ? clamp(storedSettings.fontSize, 16, 28) : 20,
    theme: ['paper', 'light', 'night'].includes(storedSettings?.theme) ? storedSettings.theme : 'paper',
    focus: storedSettings?.focus === true
  };

  function savedProgress(book) {
    const saved = read(progressKey(book.id));
    if (!saved || !book.chapters.some(chapter => chapter.path === saved.chapterPath) || !Number.isFinite(saved.ratio)) return null;
    return { ...saved, ratio: clamp(saved.ratio, 0, 1) };
  }

  function showStorageStatus() {
    const note = active?.root.querySelector('[data-reader-storage-note]');
    if (!note) return;
    note.hidden = false;
    note.textContent = storageAvailable ? '阅读位置自动保存在当前浏览器。' : '当前浏览器无法保存阅读位置，仍可正常阅读。';
  }

  function refreshShelf() {
    document.querySelectorAll('[data-novel-book]').forEach(element => {
      const book = catalogue.get(element.dataset.novelBook);
      if (!book) return;
      const saved = savedProgress(book);
      if (!saved) return;
      const chapter = book.chapters.find(item => item.path === saved.chapterPath);
      const link = element.querySelector('[data-novel-resume]');
      const note = element.querySelector('[data-novel-progress]');
      if (link) {
        // The destination comes from the generated catalogue, never from localStorage.
        const url = new URL(chapter.url, location.href);
        if (url.origin !== location.origin) return;
        url.hash = 'resume-reading';
        link.href = url.href;
        link.textContent = '继续阅读 →';
      }
      if (note) {
        note.hidden = false;
        note.textContent = `上次读到《${chapter.title}》 · 本章 ${Math.round(saved.ratio * 100)}%`;
      }
    });
  }

  function metrics(reader) {
    const rect = reader.prose.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    const toolbar = reader.root.querySelector('.novel-reader-toolbar');
    const offset = Math.ceil(toolbar.getBoundingClientRect().height + (parseFloat(getComputedStyle(toolbar).top) || 0) + 16);
    const toolbarHeight = `${offset}px`;
    if (reader.root.style.getPropertyValue('--reader-toolbar-height') !== toolbarHeight) {
      reader.root.style.setProperty('--reader-toolbar-height', toolbarHeight);
    }
    const bottomSpace = parseFloat(getComputedStyle(document.body).paddingBottom) || 0;
    const viewport = Math.max(1, window.innerHeight - offset - bottomSpace);
    const range = Math.max(1, rect.height - viewport * .55);
    return { top, offset, range, ratio: clamp((window.scrollY - top + offset) / range, 0, 1) };
  }

  function displayProgress() {
    if (!active) return;
    const ratio = metrics(active).ratio;
    const bar = active.root.querySelector('[data-reader-progress]');
    bar.setAttribute('aria-valuenow', Math.round(ratio * 100));
    bar.querySelector('span').style.transform = `scaleX(${ratio})`;
  }

  function saveProgress() {
    clearTimeout(saveTimer);
    if (!active || !active.engaged || active.suspended) return;
    write(progressKey(active.book.id), {
      chapterPath: active.chapter.path,
      ratio: metrics(active).ratio,
      updatedAt: Date.now()
    });
  }

  function applySettings() {
    document.documentElement.classList.toggle('novel-focus', Boolean(active && settings.focus));
    if (!active) {
      delete document.documentElement.dataset.novelTheme;
      return;
    }
    document.documentElement.dataset.novelTheme = settings.theme;
    active.root.dataset.theme = settings.theme;
    active.root.style.setProperty('--reader-font-size', `${settings.fontSize}px`);
    active.root.querySelector('[data-font-size]').textContent = settings.fontSize;
    active.root.querySelector('[data-font-change="-1"]').disabled = settings.fontSize <= 16;
    active.root.querySelector('[data-font-change="1"]').disabled = settings.fontSize >= 28;
    active.root.querySelectorAll('[data-reader-theme]').forEach(button => {
      button.setAttribute('aria-pressed', button.dataset.readerTheme === settings.theme);
    });
    const focus = active.root.querySelector('[data-reader-focus]');
    focus.setAttribute('aria-pressed', settings.focus);
    focus.textContent = settings.focus ? '退出专注' : '专注阅读';
  }

  function moveToRatio(reader, ratio, afterMove) {
    reader.suspended = true;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (active !== reader) return;
      const { top, offset, range } = metrics(reader);
      window.scrollTo({ top: Math.max(0, top - offset + range * ratio), behavior: 'instant' });
      reader.suspended = false;
      displayProgress();
      if (afterMove) afterMove();
    }));
  }

  function restorePosition() {
    if (!active?.saved) return;
    const reader = active;
    reader.root.querySelector('[data-reader-resume-notice]').hidden = true;
    reader.engaged = true;
    moveToRatio(reader, reader.saved.ratio, saveProgress);
  }

  function initialize() {
    clearTimeout(saveTimer);
    active = null;
    catalogue = new Map();
    const data = document.querySelector('[data-novel-catalogue]');
    if (data) {
      try {
        const books = JSON.parse(data.dataset.novelCatalogue);
        catalogue = new Map(books.map(book => [book.id, book]));
      } catch { /* Ordinary links and the chapter directory still work without JavaScript. */ }
    }
    refreshShelf();
    const root = document.querySelector('[data-novel-reader]');
    const book = root && catalogue.get(root.dataset.bookId);
    const chapter = book?.chapters.find(item => item.path === root.dataset.chapterPath);
    if (!chapter) { applySettings(); return; }

    const saved = savedProgress(book);
    active = {
      root, book, chapter, prose: root.querySelector('[data-reader-prose]'),
      saved: saved?.chapterPath === chapter.path ? saved : null,
      engaged: false, suspended: false
    };
    applySettings();
    root.querySelector('[data-reader-controls]').hidden = false;
    showStorageStatus();

    // Opening a different chapter starts that chapter; reopening the same one keeps its bookmark.
    if (!active.saved) write(progressKey(book.id), { chapterPath: chapter.path, ratio: 0, updatedAt: Date.now() });
    if (active.saved?.ratio > .01) {
      root.querySelector('[data-reader-resume-notice]').hidden = false;
      root.querySelector('[data-reader-resume-label]').textContent = `上次读到本章 ${Math.round(active.saved.ratio * 100)}%`;
    }
    if (location.hash === '#resume-reading' && active.saved) {
      restorePosition();
      history.replaceState(history.state, '', location.pathname + location.search);
    }
    displayProgress();
  }

  // Only deliberate scrolling can replace an existing bookmark. Initial layout and PJAX
  // scroll resets must not turn a saved position into the top of the chapter.
  function engage(event) {
    if (!active || active.suspended || event.target.closest?.('.novel-reader-toc nav')) return;
    active.engaged = true;
    active.root.querySelector('[data-reader-resume-notice]').hidden = true;
  }

  window.addEventListener('wheel', engage, { passive: true });
  window.addEventListener('touchmove', engage, { passive: true });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') document.querySelectorAll('.novel-reader-toc[open]').forEach(toc => { toc.open = false; });
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)
      && !event.target.closest?.('input, textarea, select, button, summary, [contenteditable]')) engage(event);
  });
  document.addEventListener('pointerdown', event => {
    if (event.clientX >= document.documentElement.clientWidth) engage(event);
  });
  window.addEventListener('scroll', () => {
    if (!active) return;
    if (!scrollFrame) scrollFrame = requestAnimationFrame(() => { scrollFrame = null; displayProgress(); });
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveProgress, 250);
  }, { passive: true });

  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!active || !button || !active.root.contains(button)) return;
    if (button.hasAttribute('data-reader-restore')) { restorePosition(); return; }
    const reader = active;
    const before = metrics(reader);
    const wasInsideProse = window.scrollY >= before.top - before.offset;
    if (button.hasAttribute('data-font-change')) {
      settings.fontSize = clamp(settings.fontSize + Number(button.dataset.fontChange), 16, 28);
    } else if (button.hasAttribute('data-reader-theme')) {
      settings.theme = button.dataset.readerTheme;
    } else if (button.hasAttribute('data-reader-focus')) {
      settings.focus = !settings.focus;
    } else { return; }
    applySettings();
    write(settingsKey, settings);
    if (wasInsideProse) moveToRatio(reader, before.ratio, saveProgress);
  });

  document.addEventListener('click', event => {
    if (!event.target.closest('a[href]')) return;
    saveProgress();
    document.querySelectorAll('.novel-reader-toc[open]').forEach(toc => { toc.open = false; });
  }, true);
  window.addEventListener('pagehide', saveProgress);
  window.addEventListener('resize', displayProgress, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveProgress(); });
  document.addEventListener('pjax:send', () => { saveProgress(); active = null; });
  document.addEventListener('pjax:success', initialize);
  window.addEventListener('pageshow', event => { if (event.persisted) initialize(); });
  window.addEventListener('storage', event => { if (event.key?.startsWith('novel-reader:progress:')) refreshShelf(); });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
