(() => {
  'use strict';
  if (window.siteMediaInstalled) return;
  window.siteMediaInstalled = true;

  const assets = new Map();
  function loadAsset(url, stylesheet = false) {
    if (assets.has(url)) return assets.get(url);
    const promise = new Promise((resolve, reject) => {
      const element = document.createElement(stylesheet ? 'link' : 'script');
      if (stylesheet) { element.rel = 'stylesheet'; element.href = url; }
      else { element.src = url; element.async = true; }
      const fail = () => {
        clearTimeout(timer);
        element.onload = element.onerror = null;
        element.remove();
        assets.delete(url);
        reject(new Error('播放器资源加载失败，请检查网络后重试。'));
      };
      const timer = setTimeout(fail, 12000);
      element.onload = () => { clearTimeout(timer); resolve(); };
      element.onerror = fail;
      document.head.appendChild(element);
    });
    assets.set(url, promise);
    return promise;
  }

  // APlayer expects cover, while some Meting providers return pic.
  function normalizeTracks(data) {
    if (!Array.isArray(data)) throw new Error('歌单服务返回异常，请稍后重试。');
    const safeUrl = value => {
      if (typeof value !== 'string') return '';
      try {
        const url = new URL(value);
        return url.protocol === 'https:' ? url.href : '';
      } catch { return ''; }
    };
    const escapeText = value => String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
    const tracks = data.filter(track => track && safeUrl(track.url)).map(track => ({
      name: escapeText(track.name || '未命名歌曲'),
      artist: escapeText(track.artist || '未知歌手'),
      url: safeUrl(track.url),
      cover: safeUrl(track.cover || track.pic),
      lrc: safeUrl(track.lrc)
    }));
    if (!tracks.length) throw new Error('暂未获取到歌曲，可重试或在网易云打开。');
    return tracks;
  }

  async function fetchPlaylist(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(url, { signal: controller.signal, credentials: 'omit' });
      if (!response.ok) throw new Error(`歌单服务暂不可用（${response.status}），请稍后重试。`);
      return normalizeTracks(await response.json());
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('歌单加载超时，请重试或在网易云打开。');
      if (error instanceof TypeError) throw new Error('暂时无法连接歌单服务，请检查网络后重试。');
      if (error instanceof SyntaxError) throw new Error('歌单服务返回异常，请稍后重试。');
      throw error;
    } finally { clearTimeout(timer); }
  }

  const host = document.querySelector('[data-site-music]');
  const button = host?.querySelector('[data-music-load]');
  let loading = false;
  let attempted = false;
  let player;
  async function loadMusic() {
    if (!host || loading || player) return;
    loading = true;
    attempted = true;
    button.disabled = true;
    host.setAttribute('aria-busy', 'true');
    const status = host.querySelector('[data-music-status]');
    status.textContent = '正在加载歌单…';
    try {
      // These independent requests run after the first paint, with finite waits.
      const [tracks] = await Promise.all([
        fetchPlaylist(host.dataset.api),
        window.APlayer ? Promise.resolve() : loadAsset('https://cdn.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.js'),
        loadAsset('https://cdn.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.css', true)
      ]);
      if (!window.APlayer) throw new Error('播放器未能加载，请重试。');
      player = new window.APlayer({
        container: host.querySelector('[data-music-player]'),
        audio: tracks,
        fixed: true,
        autoplay: false,
        preload: 'none',
        order: 'list',
        loop: 'all',
        theme: '#2980b9',
        listFolded: true,
        mutex: true,
        lrcType: 3,
        storageName: 'metingjs'
      });
      host.querySelector('.site-music-notice').hidden = true;
    } catch (error) {
      status.textContent = error.message;
      button.textContent = '重试';
    } finally {
      loading = false;
      button.disabled = false;
      host.removeAttribute('aria-busy');
    }
  }
  button?.addEventListener('click', loadMusic);

  function loadEffects() {
    const connection = navigator.connection;
    if (window.matchMedia('(max-width: 767px), (prefers-reduced-motion: reduce)').matches
      || connection?.saveData || /^(slow-)?2g$/.test(connection?.effectiveType || '')
      || document.documentElement.classList.contains('novel-focus')) return;
    loadAsset('/js/love.js').catch(() => {});
    // The existing Canvas Nest defaults match the site's black, 99-point effect.
    loadAsset('https://cdn.jsdelivr.net/npm/canvas-nest.js@1.0.1/dist/canvas-nest.js').catch(() => {});
  }

  function schedule() {
    const start = () => {
      if (document.hidden) {
        document.addEventListener('visibilitychange', startWhenVisible, { once: true });
        return;
      }
      const connection = navigator.connection;
      if (!attempted && !connection?.saveData && !/^(slow-)?2g$/.test(connection?.effectiveType || '')) loadMusic();
      loadEffects();
    };
    const startWhenVisible = () => { if (!document.hidden) start(); };
    // Do not wait for window.load: an unavailable font/image host must not hold
    // the music loader indefinitely. Yield two frames for the initial page.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if ('requestIdleCallback' in window) window.requestIdleCallback(start, { timeout: 2000 });
      else setTimeout(start, 500);
    }));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once: true });
  else schedule();
})();
