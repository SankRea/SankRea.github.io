/*
 * @Author: SankRea 1370316409@qq.com
 * @Date: 2022-08-01 11:29:59
 * @LastEditors: SankRea 1370316409@qq.com
 * @LastEditTime: 2022-08-01 11:50:26
 * @FilePath: \undefinedd:\work\blog\themes\next\source\js\src\love.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
(() => {
  'use strict';
  if (window.siteHeartsInstalled) return;
  window.siteHeartsInstalled = true;
  const disabled = window.matchMedia('(max-width: 767px), (prefers-reduced-motion: reduce)');
  const style = document.createElement('style');
  style.textContent = '.heart{width:10px;height:10px;position:fixed;pointer-events:none;z-index:99999;transform:rotate(45deg)}.heart::before,.heart::after{content:"";width:10px;height:10px;position:absolute;background:inherit;border-radius:50%}.heart::before{left:-5px}.heart::after{top:-5px}';
  document.head.appendChild(style);
  const active = new Set();
  const clear = () => { active.forEach(animation => animation.cancel()); active.clear(); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
  disabled.addEventListener('change', () => { if (disabled.matches) clear(); });
  document.addEventListener('click', event => {
    if (disabled.matches || document.hidden || !event.detail
      || document.documentElement.classList.contains('novel-focus')) return;
    const heart = document.createElement('span');
    heart.className = 'heart';
    heart.setAttribute('aria-hidden', 'true');
    heart.style.left = `${event.clientX - 5}px`;
    heart.style.top = `${event.clientY - 5}px`;
    heart.style.background = `rgb(${[0, 0, 0].map(() => Math.floor(Math.random() * 256)).join(',')})`;
    document.body.appendChild(heart);
    // Animate only while a heart exists; no permanent requestAnimationFrame loop.
    const animation = heart.animate([
      { transform: 'translateY(0) scale(1) rotate(45deg)', opacity: 1 },
      { transform: 'translateY(-76px) scale(1.3) rotate(45deg)', opacity: 0 }
    ], { duration: 1280, easing: 'linear' });
    active.add(animation);
    const remove = () => { heart.remove(); active.delete(animation); };
    animation.onfinish = animation.oncancel = remove;
  });
})();
