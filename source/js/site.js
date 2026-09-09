(() => {
  'use strict';
  if (window.siteEnhancementsInstalled) return;
  window.siteEnhancementsInstalled = true;

  const mobile = window.matchMedia('(max-width: 767px)');
  const keyboardControls = '.site-nav-toggle .toggle, .site-nav-right .toggle, .sidebar-toggle, .back-to-top, .popup-trigger[role="button"]';

  function chooseLanguage(messages, fallback) {
    const preferences = navigator.languages?.length ? navigator.languages : [navigator.language || ''];
    for (const preference of preferences) {
      const tag = preference.toLowerCase().replace(/_/g, '-');
      let language;
      if (/^zh(?:-|$)/.test(tag)) {
        language = /-hans(?:-|$)/.test(tag) ? 'zh-Hans'
          : /-(?:hant|tw|hk|mo)(?:-|$)/.test(tag) ? 'zh-Hant' : 'zh-Hans';
      } else if (/^en(?:-|$)/.test(tag)) language = 'en';
      if (language && messages[language]) return language;
    }
    return messages[fallback] ? fallback : 'en';
  }

  function localizeWelcome() {
    document.querySelectorAll('[data-welcome-copy]').forEach(root => {
      let config;
      try { config = JSON.parse(root.dataset.welcomeCopy); } catch { return; }
      if (!config?.messages) return;
      const language = chooseLanguage(config.messages, config.fallback);
      const copy = config.messages[language];
      if (!copy || typeof copy.title !== 'string' || !Array.isArray(copy.paragraphs)
        || !copy.paragraphs.every(paragraph => typeof paragraph === 'string')) return;
      const title = root.querySelector('.post-title-link') || root.querySelector('.post-title');
      const body = root.querySelector('.post-body');
      if (!title || !body) return;
      const editLink = title.querySelector('.post-edit-link');
      title.textContent = copy.title;
      if (editLink) title.append(' ', editLink);
      title.lang = language;
      body.lang = language;
      body.replaceChildren(...copy.paragraphs.map(text => {
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        return paragraph;
      }));
    });
  }

  function syncNavigation() {
    const toggle = document.querySelector('.site-nav-toggle .toggle');
    const navigation = document.querySelector('.site-nav');
    if (!toggle || !navigation) return;
    if (!navigation.id) navigation.id = 'site-navigation';
    toggle.setAttribute('aria-controls', navigation.id);
    toggle.setAttribute('aria-expanded', String(document.body.classList.contains('site-nav-on')));
    document.querySelectorAll(keyboardControls).forEach(control => {
      if (!control.hasAttribute('tabindex')) control.tabIndex = 0;
    });
  }

  function closeNavigation() {
    if (!mobile.matches) return;
    document.body.classList.remove('site-nav-on');
    document.querySelector('.site-nav-toggle .toggle')?.classList.remove('toggle-close');
    syncNavigation();
  }

  // Reserve space for the loading/retry notice as well as the eventual player.
  function observePlayer() {
    const host = document.querySelector('[data-site-music]');
    if (!host) return;
    let bar;
    const measure = () => {
      const height = Math.ceil(bar?.getBoundingClientRect().height || 0);
      // Preserve the last visible height while focus mode hides the player.
      if (height > 0) document.documentElement.style.setProperty('--site-player-height', `${height}px`);
    };
    const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(measure) : null;
    const connect = () => {
      const nextBar = host.querySelector('.aplayer-fixed .aplayer-body')
        || host.querySelector('.site-music-notice:not([hidden])');
      if (bar === nextBar) return;
      if (bar) resizeObserver?.unobserve(bar);
      bar = nextBar;
      document.documentElement.classList.toggle('site-player-ready', Boolean(bar));
      if (bar) resizeObserver?.observe(bar);
      measure();
    };
    new MutationObserver(connect).observe(host, {
      childList: true, subtree: true, attributes: true, attributeFilter: ['hidden']
    });
    if (!resizeObserver) window.addEventListener('resize', measure, { passive: true });
    connect();
  }

  document.addEventListener('click', event => {
    if (event.target.closest('.site-nav-toggle .toggle')) syncNavigation();
    if (event.target.closest('.site-nav a[href]') && !event.ctrlKey && !event.metaKey && !event.shiftKey) closeNavigation();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mobile.matches && document.body.classList.contains('site-nav-on')) {
      closeNavigation();
      document.querySelector('.site-nav-toggle .toggle')?.focus();
    }
    if (!['Enter', ' '].includes(event.key)) return;
    const control = event.target.closest(keyboardControls);
    if (!control || control.matches('button, a[href], input')) return;
    event.preventDefault();
    control.click();
  });
  function refresh() {
    localizeWelcome();
    syncNavigation();
  }
  document.addEventListener('pjax:success', () => { closeNavigation(); refresh(); });
  window.addEventListener('languagechange', localizeWelcome);
  window.addEventListener('pageshow', event => { if (event.persisted) refresh(); });
  const start = () => { refresh(); observePlayer(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
