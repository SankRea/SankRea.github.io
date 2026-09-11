(() => {
  'use strict';
  if (window.siteMediaInstalled) return;
  window.siteMediaInstalled = true;

  const assets = new Map();
  // Actual audio checked on 2026-09-11: 149 short resources (30 or 45 seconds).
  // Snapshot from reports/music-duration/2026-09-11T07-17-04.104Z/results.json.
  // Match platform + song ID so refreshed URLs still skip these resources.
  // Recheck manually to restore any songs that later return full-length audio.
  const excludedTrackIds = new Set([
    "netease:642723", "netease:642776", "netease:22441762", "netease:2048604695", "netease:29041788",
    "netease:18127316", "netease:1981056341", "netease:21273749", "netease:27979411", "netease:16431880",
    "netease:420478436", "netease:473817398", "netease:594187", "netease:1450926258", "netease:1361336636",
    "netease:1299557936", "netease:405998870", "netease:479938484", "netease:536622483", "netease:1350128684",
    "netease:1877583723", "netease:1447590892", "netease:1372726244", "netease:2005300921", "netease:3956911",
    "netease:1416243081", "netease:2158979382", "netease:1349964388", "netease:769950", "netease:825343",
    "netease:2734602338", "netease:2707202386", "netease:1859556322", "netease:1944543800", "netease:1970535364",
    "netease:407889615", "netease:3947467", "netease:557583473", "netease:28713537", "netease:498168",
    "netease:1856812413", "netease:2617906979", "netease:2036445129", "netease:1918331422", "netease:1483521390",
    "netease:1972395036", "netease:26524198", "netease:2129117330", "netease:1496292715", "netease:1969158110",
    "netease:2142857204", "netease:2003496504", "netease:2061225325", "netease:1440693335", "netease:1854474192",
    "netease:1347630432", "netease:30870173", "netease:2107565588", "netease:2653641752", "netease:1356248072",
    "netease:1870469768", "netease:825646", "netease:1957440334", "netease:530986958", "netease:1996323644",
    "netease:1368227453", "netease:1991012773", "netease:1956534872", "netease:1888864514", "netease:1840502945",
    "netease:666443", "netease:1356048706", "netease:1842206111", "netease:1500152660", "netease:1357953768",
    "netease:530986060", "netease:1384280139", "netease:668472", "netease:40915152", "netease:412327036",
    "netease:1856813041", "netease:2033848662", "netease:28613731", "netease:2009678546", "netease:455502615",
    "netease:28151022", "netease:1904211789", "netease:1972395003", "netease:1824020871", "netease:499027",
    "netease:507114416", "netease:2095882368", "netease:1867150097", "netease:1350129438", "netease:402306346",
    "netease:2065281614", "netease:186513", "netease:28190728", "netease:32803125", "netease:29794281",
    "netease:33418857", "netease:2096553555", "netease:35040360", "netease:1331885158", "netease:1907751320",
    "netease:17753288", "netease:423227295", "netease:1907751319", "netease:1496089152", "netease:421423808",
    "netease:22770026", "netease:41654827", "netease:1359818052", "netease:29803676", "netease:498286570",
    "netease:28593339", "netease:1440570723", "netease:29561077", "netease:1890494798", "netease:3157058",
    "netease:400876320", "netease:1450735391", "netease:1824708580", "netease:484056480", "netease:1328183119",
    "netease:554241223", "netease:487003518", "netease:482999012", "netease:29307195", "netease:406072193",
    "netease:609890", "netease:36587201", "netease:28828076", "netease:1421990254", "netease:1383736734",
    "netease:555142", "netease:514774419", "netease:522647397", "netease:1366904129", "netease:1296410418",
    "netease:28828074", "netease:1380123398", "netease:431259256", "netease:32317208", "netease:618325",
    "netease:423228325", "netease:28692687", "netease:409916250", "netease:26092806"
  ]);
  function isExcludedTrack(value) {
    try {
      const url = new URL(value);
      return excludedTrackIds.has(`${url.searchParams.get('server')}:${url.searchParams.get('id')}`);
    } catch { return false; }
  }
  const shortTrackKey = 'site-music:short-tracks:v1';
  const shortTrackLifetime = 24 * 60 * 60 * 1000;
  let shortTracks = new Map();
  try {
    const entries = JSON.parse(localStorage.getItem(shortTrackKey));
    if (Array.isArray(entries)) {
      shortTracks = new Map(entries.filter(entry => Array.isArray(entry) && typeof entry[0] === 'string'
        && Number.isFinite(entry[1]) && entry[1] > Date.now()).slice(-500));
    }
  } catch {}
  function rememberShortTrack(url) {
    shortTracks.set(url, Date.now() + shortTrackLifetime);
    shortTracks = new Map([...shortTracks].filter(([, expires]) => expires > Date.now()).slice(-500));
    try { localStorage.setItem(shortTrackKey, JSON.stringify([...shortTracks])); } catch {}
  }
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
    const tracks = data.filter(track => track && safeUrl(track.url)
      && !isExcludedTrack(track.url)
      && !(shortTracks.get(safeUrl(track.url)) > Date.now())).map(track => ({
      name: escapeText(track.name || '未命名歌曲'),
      artist: escapeText(track.artist || '未知歌手'),
      url: safeUrl(track.url),
      cover: safeUrl(track.cover || track.pic),
      lrc: safeUrl(track.lrc)
    }));
    if (!tracks.length) throw new Error('暂无可播放歌曲（已过滤已知不足 60 秒的资源），可在网易云打开。');
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
      player.lrc.hide();
      const skipShortTrack = () => {
        const duration = player.audio.duration;
        // Duration can be NaN/Infinity before metadata, and some Android browsers
        // temporarily report 1 second. Wait for metadata and a meaningful value.
        if (player.audio.readyState < 1 || !Number.isFinite(duration) || duration <= 0
          || (duration === 1 && player.audio.readyState < 2) || duration >= 60) return;
        const index = player.list.index;
        const track = player.list.audios[index];
        if (!track || player.audio.src !== track.url) return;
        const resume = !player.paused;
        rememberShortTrack(track.url);
        player.pause();
        // Clear the current source to cancel its remaining download before switching.
        player.audio.removeAttribute('src');
        player.audio.load();
        player.list.remove(index);
        if (player.list.audios.length) {
          player.notice('已跳过不足 60 秒的音频');
          if (resume) player.play();
        } else {
          player.audio.removeAttribute('src');
          player.audio.load();
          player.notice('当前歌单暂无满足 60 秒要求的可播放资源');
        }
      };
      player.on('loadedmetadata', skipShortTrack);
      player.on('loadeddata', skipShortTrack);
      player.on('durationchange', skipShortTrack);
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
