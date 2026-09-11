(() => {
  'use strict';
  if (window.arkPetInstalled) return;
  window.arkPetInstalled = true;

  const storageKey = 'ark-pet:surtr-summer:v1';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(storageKey)) || {}; } catch {}
  let enabled = saved.enabled !== false;
  let voiceMuted = saved.voiceMuted === true;
  let voiceContext;
  let voiceLoad;
  let voiceClips;
  let voiceController;
  let voiceDelay;
  let voiceIdle;
  let voiceFailed = false;
  let voiceSource;
  let voiceGain;
  let voiceTicket = 0;
  let lastVoice = -1;
  let voiceNoticeTimer;
  let attempted = false;
  let loading = false;
  let app;
  let pet;
  let texture;
  let controller;
  let idle;
  let touch;
  let drag;
  let actions = {};
  let durations = new Map();
  let behavior = 'idle';
  let remaining = 4;
  let velocityY = 0;
  let direction = 1;
  let modelScale = 1;
  let modelCenterX = 0;
  let landAction = 'idle';
  let arena = { maxX: 0, floor: 0 };
  let position = Number.isFinite(saved.x) && Number.isFinite(saved.y) ? { x: saved.x, y: saved.y } : null;
  const libraries = new Map();

  const host = document.createElement('section');
  host.className = 'ark-pet';
  host.hidden = true;
  host.setAttribute('aria-label', '泳装史尔特尔小人');
  host.innerHTML = '<div class="ark-pet-header"><span>史尔特尔 · 夏日</span><button type="button" data-pet-mute aria-label="静音角色语音" aria-pressed="false">语音开</button><button type="button" data-pet-close aria-label="收起史尔特尔">×</button></div><p class="ark-pet-voice-notice" role="status" hidden></p><p class="ark-pet-status" role="status" data-pet-status></p><div class="ark-pet-stage" role="button" tabindex="0" aria-label="戳一戳史尔特尔并播放日文语音；拖动后松手可自由下落" hidden></div><div class="ark-pet-actions" aria-label="小人动作" hidden><button type="button" data-pet-action="walk">走一走</button><button type="button" data-pet-action="sit">坐下</button><button type="button" data-pet-action="sleep">躺下</button></div><button type="button" data-pet-retry hidden>重新加载</button>';
  const launcher = document.createElement('button');
  launcher.type = 'button';
  launcher.className = 'ark-pet-launcher';
  launcher.textContent = '召唤史尔特尔';
  launcher.hidden = true;
  document.body.append(host, launcher);
  const stage = host.querySelector('.ark-pet-stage');
  const status = host.querySelector('[data-pet-status]');
  const retry = host.querySelector('[data-pet-retry]');
  const actionBar = host.querySelector('.ark-pet-actions');
  const muteButton = host.querySelector('[data-pet-mute]');
  const voiceNotice = host.querySelector('.ark-pet-voice-notice');
  muteButton.hidden = true;

  const isHome = () => Boolean(document.querySelector('.main-inner.index [data-welcome-copy]'))
    && !document.documentElement.classList.contains('novel-focus');
  function remember() {
    try { localStorage.setItem(storageKey, JSON.stringify({ enabled, voiceMuted, ...position })); } catch {}
  }
  function place() {
    if (host.hidden) return;
    const playerHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--site-player-height')) || 66;
    arena.maxX = Math.max(0, innerWidth - host.offsetWidth - 8);
    arena.floor = Math.max(0, innerHeight - host.offsetHeight - playerHeight - 28);
    if (!position) {
      const rect = host.getBoundingClientRect();
      position = { x: rect.left, y: rect.top };
    }
    position.x = Math.max(0, Math.min(arena.maxX, position.x));
    position.y = Math.max(0, Math.min(arena.floor, position.y));
    paintPosition();
  }
  function paintPosition() {
    Object.assign(host.style, { left: `${position.x}px`, top: `${position.y}px`, right: 'auto', bottom: 'auto' });
  }
  function sync() {
    const home = isHome();
    host.hidden = !home || !enabled || !attempted;
    launcher.hidden = !home || (enabled && attempted);
    if (host.hidden) host.classList.remove('ark-pet-actions-open');
    if (host.hidden || document.hidden) {
      stopVoice();
      if (voiceContext?.state === 'running') voiceContext.suspend().catch(() => {});
    }
    muteButton.textContent = voiceMuted ? '已静音' : '语音开';
    muteButton.setAttribute('aria-pressed', String(voiceMuted));
    muteButton.setAttribute('aria-label', voiceMuted ? '开启角色语音' : '静音角色语音');
    muteButton.hidden = !voiceClips;
    stage.setAttribute('aria-label', voiceClips && !voiceMuted
      ? '戳一戳史尔特尔并播放日文语音；拖动后松手可自由下落'
      : '戳一戳史尔特尔；拖动后松手可自由下落');
    if (app) {
      if (host.hidden || document.hidden) { releaseDrag(); app.stop(); }
      else app.start();
    }
    actionBar.querySelectorAll('[data-pet-action]').forEach(button => {
      button.disabled = !pet || !actions[button.dataset.petAction];
    });
    place();
    if (!pet || host.hidden || document.hidden) cancelVoicePreparation();
    else scheduleVoices();
  }

  function cancelVoicePreparation() {
    clearTimeout(voiceDelay);
    voiceDelay = undefined;
    if (voiceIdle !== undefined) window.cancelIdleCallback(voiceIdle);
    voiceIdle = undefined;
    voiceController?.abort();
  }
  function scheduleVoices() {
    if (!pet || loading || host.hidden || document.hidden || voiceClips || voiceLoad || voiceFailed
      || voiceDelay !== undefined || voiceIdle !== undefined) return;
    // Give the visible model time to render and animate before requesting any audio.
    voiceDelay = setTimeout(() => {
      voiceDelay = undefined;
      const prepare = () => {
        voiceIdle = undefined;
        if (pet && !host.hidden && !document.hidden && isHome()) loadVoices();
      };
      if ('requestIdleCallback' in window) voiceIdle = window.requestIdleCallback(prepare, { timeout: 1500 });
      else prepare();
    }, 3000);
  }

  function showVoiceNotice(message, duration = 4000) {
    clearTimeout(voiceNoticeTimer);
    voiceNotice.textContent = message;
    voiceNotice.hidden = false;
    voiceNoticeTimer = setTimeout(() => { voiceNotice.hidden = true; }, duration);
  }
  function stopVoice() {
    voiceTicket++;
    if (voiceSource) {
      voiceSource.onended = null;
      try { voiceSource.stop(); } catch {}
      voiceSource.disconnect();
      voiceSource = null;
    }
    clearTimeout(voiceNoticeTimer);
    voiceNotice.hidden = true;
  }
  function loadVoices() {
    if (voiceLoad) return voiceLoad;
    voiceLoad = (async () => {
      const abort = new AbortController();
      voiceController = abort;
      const timeout = setTimeout(() => abort.abort(new DOMException('语音加载超时', 'TimeoutError')), 20000);
      try {
        const read = async (path, format) => {
          const response = await fetch(`/models/surtr-summer/${path}`, { signal: abort.signal });
          if (!response.ok) throw new Error('语音加载失败。');
          return response[format]();
        };
        const [manifest, bytes] = await Promise.all([
          read('voice-jp.json', 'json'), read('voice-jp.ogg', 'arrayBuffer')
        ]);
        // Decode without opening a live audio output or needing a user gesture.
        const Decoder = window.OfflineAudioContext || window.webkitOfflineAudioContext;
        if (!Decoder) throw new Error('当前浏览器不支持角色语音解码。');
        const decoder = new Decoder(1, 1, 44100);
        let recording;
        try { recording = await decoder.decodeAudioData(bytes); }
        catch { throw new Error('无法解码日文语音，请尝试更新浏览器。'); }
        if (abort.signal.aborted) throw abort.signal.reason;
        if (!Array.isArray(manifest.clips) || !manifest.clips.length) throw new Error('语音索引不可用。');
        // Keep only the selected phrases in memory after decoding the combined recording.
        return manifest.clips.map(clip => {
          if (!Number.isFinite(clip.start) || !Number.isFinite(clip.duration)
            || clip.start < 0 || clip.duration <= 0 || clip.start + clip.duration > recording.duration + .05) {
            throw new Error('语音时间索引不匹配。');
          }
          const from = Math.round(clip.start * recording.sampleRate);
          const to = Math.min(recording.length, Math.round((clip.start + clip.duration) * recording.sampleRate));
          const buffer = decoder.createBuffer(recording.numberOfChannels, to - from, recording.sampleRate);
          for (let channel = 0; channel < recording.numberOfChannels; channel++) {
            buffer.copyToChannel(recording.getChannelData(channel).subarray(from, to), channel);
          }
          return buffer;
        });
      } finally {
        clearTimeout(timeout);
        abort.abort();
      }
    })().then(clips => { voiceClips = clips; voiceFailed = false; }).catch(error => {
      // Cancellation can resume on return; actual errors wait for another poke.
      voiceFailed = error.name !== 'AbortError';
      if (voiceFailed) console.warn('[ArkPet voice]', error);
    }).finally(() => {
      voiceLoad = null;
      voiceController = null;
      sync();
    });
    return voiceLoad;
  }
  async function playVoice() {
    if (!voiceClips) {
      // A poke before preparation finishes only animates; never play it later.
      voiceFailed = false;
      scheduleVoices();
      return;
    }
    if (voiceMuted || host.hidden || document.hidden || !isHome()) return;
    stopVoice();
    const ticket = voiceTicket;
    try {
      if (!voiceContext) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) throw new Error('当前浏览器不支持角色语音。');
        voiceContext = new AudioContext();
        voiceGain = voiceContext.createGain();
        voiceGain.gain.value = .8;
        voiceGain.connect(voiceContext.destination);
      }
      // Resume synchronously in the click/key handler, before any fetch or decode await.
      await voiceContext.resume();
      const clips = voiceClips;
      if (ticket !== voiceTicket || voiceMuted || host.hidden || document.hidden || !isHome()) return;
      if (voiceContext.state !== 'running') throw new Error('浏览器暂停了语音，再戳一下试试。');
      const candidates = clips.map((_, index) => index).filter(index => index !== lastVoice);
      const next = candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : 0;
      const source = voiceContext.createBufferSource();
      source.buffer = clips[next];
      source.connect(voiceGain);
      source.onended = () => { source.disconnect(); if (voiceSource === source) voiceSource = null; };
      voiceSource = source;
      source.start();
      lastVoice = next;
      clearTimeout(voiceNoticeTimer);
      voiceNotice.hidden = true;
    } catch (error) {
      if (ticket !== voiceTicket) return;
      stopVoice();
      showVoiceNotice(error.name === 'AbortError' ? '语音加载超时，再戳一下重试。' : error.message || '语音暂不可用，再戳一下重试。');
    }
  }
  muteButton.addEventListener('click', () => {
    voiceMuted = !voiceMuted;
    if (voiceMuted) stopVoice();
    remember();
    sync();
  });

  const randomTime = (min, max) => min + Math.random() * (max - min);
  function face(nextDirection) {
    direction = nextDirection;
    pet.scale.x = modelScale * direction;
    pet.position.x = 110 - modelCenterX * pet.scale.x;
  }
  function act(next, seconds) {
    if (!pet) return;
    behavior = next;
    const animation = actions[next] || idle;
    remaining = seconds ?? (next === 'touch' ? Math.max(.4, durations.get(animation) || 1)
      : next === 'sleep' ? randomTime(10, 16) : next === 'sit' ? randomTime(7, 12) : randomTime(4, 7));
    pet.state.setAnimation(0, animation, next !== 'touch');
    host.dataset.behavior = next;
  }
  function chooseActivity() {
    const roll = Math.random();
    const next = roll < .4 ? 'idle' : roll < .75 ? 'walk' : roll < .9 ? 'sit' : 'sleep';
    if (next === 'walk') face(Math.random() < .5 ? -1 : 1);
    act(actions[next] ? next : 'idle');
    remember();
  }
  function requestActivity(next) {
    if (!pet || drag) return;
    if (position.y < arena.floor - .5) { landAction = next; return; }
    if (next === 'walk') face(position.x > arena.maxX / 2 ? -1 : 1);
    act(next);
  }
  function step(seconds) {
    if (!pet || !position) return;
    if (!drag) {
      if (position.y < arena.floor - .5 || behavior === 'fall') {
        if (behavior !== 'fall') act('fall');
        // Pixel-based gravity, integrated only while the existing render ticker runs.
        velocityY = Math.min(800, velocityY + 1000 * seconds);
        position.y = Math.min(arena.floor, position.y + velocityY * seconds);
        if (position.y >= arena.floor) {
          velocityY = 0;
          act(landAction);
          landAction = 'idle';
          remember();
        }
        paintPosition();
      } else {
        velocityY = 0;
        if (behavior === 'walk') {
          position.x += direction * 32 * seconds;
          if (position.x <= 0) { position.x = 0; face(1); }
          else if (position.x >= arena.maxX) { position.x = arena.maxX; face(-1); }
          paintPosition();
        }
        remaining -= seconds;
        if (remaining <= 0) {
          if (behavior === 'touch') act('idle');
          else chooseActivity();
        }
      }
    }
    pet.update(seconds);
  }
  function releaseDrag() {
    if (!drag) return;
    const previous = drag;
    drag = null;
    if (stage.hasPointerCapture(previous.id)) stage.releasePointerCapture(previous.id);
    if (previous.moved) {
      velocityY = 0;
      landAction = 'idle';
      act(position.y < arena.floor ? 'fall' : 'idle');
      remember();
    }
  }

  function loadLibrary(url, ready) {
    if (ready()) return Promise.resolve();
    if (libraries.has(url)) return libraries.get(url);
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const fail = () => {
        clearTimeout(timer);
        script.onload = script.onerror = null;
        script.remove();
        libraries.delete(url);
        reject(new Error('小人播放器加载失败，请重试。'));
      };
      const timer = setTimeout(fail, 15000);
      script.src = url;
      script.async = true;
      script.onload = () => { if (!ready()) { fail(); return; } clearTimeout(timer); resolve(); };
      script.onerror = fail;
      document.head.appendChild(script);
    });
    libraries.set(url, promise);
    return promise;
  }
  async function fetchAsset(name, type, signal) {
    const response = await fetch(`/models/surtr-summer/model.${name}`, { signal });
    if (!response.ok) throw new Error('小人模型加载失败，请重试。');
    return response[type]();
  }
  function dispose() {
    cancelVoicePreparation();
    stopVoice();
    releaseDrag();
    if (app) app.destroy(true, { children: true, texture: false, baseTexture: false });
    app = pet = null;
    texture?.destroy();
    texture = null;
    stage.replaceChildren();
    stage.hidden = true;
    actionBar.hidden = true;
  }
  async function summon() {
    if (loading || !isHome()) return;
    enabled = true;
    attempted = true;
    remember();
    if (app) { sync(); return; }
    loading = true;
    controller = new AbortController();
    const signal = controller.signal;
    status.hidden = false;
    status.textContent = '史尔特尔正在赶来…';
    retry.hidden = true;
    host.setAttribute('aria-busy', 'true');
    sync();
    const timer = setTimeout(() => controller?.abort(), 45000);
    let imageUrl;
    try {
      await loadLibrary('/lib/ark-pet/pixi-6.5.10.min.js', () => Boolean(window.PIXI?.Application));
      if (signal.aborted) throw new Error('cancelled');
      await loadLibrary('/lib/ark-pet/pixi-spine-3.8-3.1.2.js', () => Boolean(window.PIXI?.spine?.SkeletonBinary));
      const [atlasText, binary, blob] = await Promise.all([
        fetchAsset('atlas', 'text', signal), fetchAsset('skel', 'arrayBuffer', signal), fetchAsset('png', 'blob', signal)
      ]);
      const image = new Image();
      imageUrl = URL.createObjectURL(blob);
      image.src = imageUrl;
      await image.decode();
      if (signal.aborted) throw new Error('cancelled');
      const PIXI = window.PIXI;
      // Ark-Models textures already use premultiplied alpha. Avoid multiplying twice.
      texture = PIXI.BaseTexture.from(image, { alphaMode: PIXI.ALPHA_MODES.PMA });
      const atlas = new PIXI.spine.TextureAtlas(atlasText, (_page, done) => done(texture));
      const parser = new PIXI.spine.SkeletonBinary(new PIXI.spine.AtlasAttachmentLoader(atlas));
      const data = parser.readSkeletonData(new Uint8Array(binary));
      const names = data.animations.map(animation => animation.name);
      const find = (...choices) => choices.map(choice => names.find(name => name.toLowerCase() === choice)).find(Boolean);
      idle = find('relax', 'idle', 'default') || names[0];
      touch = find('interact', 'touch', 'special');
      actions = { idle, touch, walk: find('move', 'walk'), sit: find('sit'), sleep: find('sleep', 'lying', 'lie') };
      durations = new Map(data.animations.map(animation => [animation.name, animation.duration]));
      if (!idle) throw new Error('模型没有可播放的动作。');
      app = new PIXI.Application({ width: 220, height: 220, backgroundAlpha: 0, antialias: true,
        autoStart: false, autoDensity: true, resolution: Math.min(devicePixelRatio || 1, 1.5) });
      app.ticker.maxFPS = 30;
      app.view.setAttribute('aria-hidden', 'true');
      stage.appendChild(app.view);
      pet = new PIXI.spine.Spine(data);
      pet.autoUpdate = false;
      pet.state.data.defaultMix = .15;
      app.stage.addChild(pet);
      pet.state.setAnimation(0, idle, true);
      pet.update(0);
      const bounds = pet.getLocalBounds();
      const scale = Math.min(180 / Math.max(1, bounds.width), 185 / Math.max(1, bounds.height));
      pet.scale.set(scale);
      modelScale = scale;
      modelCenterX = bounds.x + bounds.width / 2;
      pet.position.set(110 - (bounds.x + bounds.width / 2) * scale, 212 - (bounds.y + bounds.height) * scale);
      face(1);
      velocityY = 0;
      landAction = 'idle';
      act('idle', 4);
      app.ticker.add(() => step(Math.min(app.ticker.deltaMS / 1000, .05)));
      app.render();
      stage.hidden = false;
      status.hidden = true;
      actionBar.hidden = false;
      app.view.addEventListener('webglcontextlost', event => {
        event.preventDefault();
        dispose();
        status.textContent = '小人暂时休息了，点击重新加载。';
        status.hidden = false;
        retry.hidden = false;
      });
    } catch (error) {
      dispose();
      status.textContent = signal.aborted ? '加载已中断，点击重新加载。' : '暂时没能加载小人，点击重试。';
      status.hidden = false;
      retry.hidden = false;
      if (!signal.aborted) console.warn('[ArkPet]', error);
    } finally {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      clearTimeout(timer);
      controller = null;
      loading = false;
      host.removeAttribute('aria-busy');
      sync();
    }
  }
  function interact() {
    if (!pet || !touch) return;
    requestActivity('touch');
    playVoice();
  }
  actionBar.addEventListener('click', event => {
    const button = event.target.closest('[data-pet-action]');
    if (button && !button.disabled) requestActivity(button.dataset.petAction);
  });
  launcher.addEventListener('click', summon);
  retry.addEventListener('click', summon);
  host.querySelector('[data-pet-close]').addEventListener('click', () => {
    enabled = false;
    controller?.abort();
    remember();
    sync();
    launcher.focus();
  });
  stage.addEventListener('pointerdown', event => {
    if (event.button !== 0 || drag || !pet) return;
    const rect = host.getBoundingClientRect();
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, moved: false };
    stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) > 5) {
      drag.moved = true;
      velocityY = 0;
      act('held');
    }
    if (!drag.moved) return;
    position = { x: drag.left + dx, y: drag.top + dy };
    place();
  });
  stage.addEventListener('pointerup', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const clicked = !drag.moved;
    releaseDrag();
    if (clicked) {
      if (event.pointerType !== 'mouse') host.classList.toggle('ark-pet-actions-open');
      interact();
    }
  });
  stage.addEventListener('pointercancel', releaseDrag);
  stage.addEventListener('lostpointercapture', releaseDrag);
  document.addEventListener('pointerdown', event => {
    if (!host.contains(event.target)) host.classList.remove('ark-pet-actions-open');
  });
  stage.addEventListener('keydown', event => {
    if (!['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    if (event.repeat) return;
    interact();
  });
  host.addEventListener('keydown', event => {
    if (event.key === 'Escape') host.querySelector('[data-pet-close]').click();
  });
  function refresh() {
    if (!isHome()) controller?.abort();
    sync();
    const connection = navigator.connection;
    if (!attempted && enabled && isHome() && !document.hidden && !reducedMotion.matches
      && !matchMedia('(max-width: 767px)').matches && !connection?.saveData
      && !/^(slow-)?2g$/.test(connection?.effectiveType || '')) {
      summon();
    }
  }
  document.addEventListener('pjax:success', refresh);
  document.addEventListener('visibilitychange', refresh);
  window.addEventListener('pagehide', () => { stopVoice(); cancelVoicePreparation(); });
  window.addEventListener('pageshow', event => { if (event.persisted) refresh(); });
  window.addEventListener('resize', place, { passive: true });
  // The music bar can change height without a window resize.
  new MutationObserver(place).observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  sync();
  if ('requestIdleCallback' in window) requestIdleCallback(refresh, { timeout: 2500 });
  else setTimeout(refresh, 800);
})();
