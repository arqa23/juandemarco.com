// Shared behaviour for every page of juandemarco.com.
// Pages are swapped in place (no full reload) when you click a link inside the
// site, so full screen, the open/closed state of things and the theme carry over.
(function () {
  var root = document.documentElement;

  /* ---------- Text pages: optional bottom alignment with the menu ---------- */
  function place() {
    var labels = document.querySelectorAll('.nav .nav-label');
    if (!labels.length) return;
    var bottom = labels[labels.length - 1].getBoundingClientRect().bottom;
    root.style.setProperty('--nav-bottom', bottom + 'px');
  }

  /* ---------- Settings: light / dark and full screen ---------- */
  function markSettings() {
    var panel = document.getElementById('settings');
    if (!panel) return;
    var t = root.dataset.theme || 'dark';
    panel.querySelectorAll('[data-theme-set]').forEach(function (b) {
      b.classList.toggle('is-on', b.dataset.themeSet === t);
    });
    var defaults = { dots: 'on', dotsize: 'normal' };
    panel.querySelectorAll('[data-pref]').forEach(function (b) {
      b.classList.toggle('is-on', (root.dataset[b.dataset.pref] || defaults[b.dataset.pref]) === b.dataset.val);
    });
    var fs = panel.querySelector('[data-fullscreen]');
    if (fs) fs.textContent = document.fullscreenElement ? 'Exit full screen' : 'Full screen';
  }
  function closeSettings() {
    var panel = document.getElementById('settings'), btn = document.querySelector('.settings-btn');
    if (!panel || panel.hidden) return;
    panel.hidden = true;
    btn.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
  }
  function initSettings() {
    var btn = document.querySelector('.settings-btn'), panel = document.getElementById('settings');
    if (!btn || !panel) return;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      panel.hidden = !panel.hidden;
      btn.setAttribute('aria-expanded', String(!panel.hidden));
      btn.classList.toggle('is-open', !panel.hidden);
      markSettings();
    });
    panel.addEventListener('click', function (e) { e.stopPropagation(); });
    panel.querySelectorAll('[data-theme-set]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.themeSet === 'dark') delete root.dataset.theme; else root.dataset.theme = b.dataset.themeSet;
        try { localStorage.setItem('jdm-theme', b.dataset.themeSet); } catch (err) {}
        markSettings();
      });
    });
    panel.querySelectorAll('[data-pref]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.dataset.pref, v = b.dataset.val;
        if (v === 'on' || v === 'normal') delete root.dataset[k]; else root.dataset[k] = v;
        try { localStorage.setItem('jdm-' + k, v); } catch (err) {}
        markSettings();
      });
    });
    var fsb = panel.querySelector('[data-fullscreen]');
    if (fsb && root.requestFullscreen) {
      fsb.addEventListener('click', function () {
        if (document.fullscreenElement) document.exitFullscreen(); else root.requestFullscreen();
      });
    } else if (fsb) { fsb.parentNode.hidden = true; }
    markSettings();
  }

  /* ---------- Project slideshow ---------- */
  var slideStep = null;
  function initSlideshow() {
    slideStep = null;
    var show = document.querySelector('.slideshow');
    if (!show) return;
    var slides = show.querySelectorAll('.slide'), counter = show.querySelector('.slide-i'), i = 0;
    function load(k) {
      var s = slides[(k + slides.length) % slides.length];
      if (s && s.dataset.src) { s.src = s.dataset.src; s.removeAttribute('data-src'); }
    }
    function go(k) {
      slides[i].classList.remove('is-on');
      i = (k + slides.length) % slides.length;
      load(i);
      slides[i].classList.add('is-on');
      counter.textContent = i + 1;
      load(i + 1); load(i - 1);
    }
    load(1); load(-1);
    show.querySelector('.prev').addEventListener('click', function () { go(i - 1); });
    show.querySelector('.next').addEventListener('click', function () { go(i + 1); });
    slideStep = function (d) { go(i + d); };
    if (slides.length < 2) show.classList.add('single');
  }

  function init() {
    place();
    initSettings();
    initSlideshow();
    if (document.fonts) document.fonts.ready.then(place);
  }

  /* ---------- In-place page changes ---------- */
  function runScripts(container) {
    container.querySelectorAll('script').forEach(function (old) {
      var s = document.createElement('script');
      if (old.src) s.src = old.src; else s.textContent = old.textContent;
      old.replaceWith(s);
    });
  }
  var busy = false;
  function swapTo(url, push) {
    if (busy) return;
    busy = true;
    fetch(url, { credentials: 'same-origin' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (text) {
        var doc = new DOMParser().parseFromString(text, 'text/html');
        document.title = doc.title;
        document.body.className = doc.body.className;
        document.body.innerHTML = doc.body.innerHTML;
        runScripts(document.body);
        if (push) history.pushState({}, '', url);
        init();
        busy = false;
      })
      .catch(function () { busy = false; location.href = url; });
  }
  document.addEventListener('click', function (e) {
    closeSettings();
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target || a.hasAttribute('download')) return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.protocol.indexOf('http') !== 0) return;
    if (url.pathname === location.pathname && url.search === location.search) { e.preventDefault(); return; }
    if (/\.(webp|jpe?g|png|pdf|zip)$/i.test(url.pathname)) return;
    e.preventDefault();
    swapTo(url.href, true);
  });
  window.addEventListener('popstate', function () { swapTo(location.href, false); });
  window.addEventListener('resize', place);
  document.addEventListener('fullscreenchange', markSettings);
  document.addEventListener('keydown', function (e) {
    if (!slideStep || (e.target.closest && e.target.closest('input, textarea'))) return;
    if (e.key === 'ArrowRight') slideStep(1);
    if (e.key === 'ArrowLeft') slideStep(-1);
  });

  init();
})();
