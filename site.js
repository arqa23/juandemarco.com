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

  /* ---------- Settings (temporary test panel) ---------- */
  // Each page-wide choice; the default leaves no attribute on <html>.
  var PREF_DEFAULTS = { colour: 'guidelines', mat: 'off', photos: 'on', layout: 'slides' };
  var current = 'name';
  function markSettings() {
    var panel = document.getElementById('settings');
    if (!panel) return;
    panel.querySelectorAll('[data-pref]').forEach(function (b) {
      b.classList.toggle('is-on', (root.dataset[b.dataset.pref] || PREF_DEFAULTS[b.dataset.pref]) === b.dataset.val);
    });
    var T = window.jdmType.load(), o = T[current];
    panel.querySelector('#ts-style').value = current;
    panel.querySelectorAll('[data-k]').forEach(function (el) { el.value = String(o[el.dataset.k]); });
    panel.querySelector('#ts-size-out').textContent = o.size + '%';
  }
  function closeSettings() {
    var panel = document.getElementById('settings'), btn = document.querySelector('.settings-btn');
    if (!panel || panel.hidden) return;
    panel.hidden = true;
    btn.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
  }
  function applyPhotos() {
    var b = document.body;
    if (b.classList.contains('photo')) b.dataset.photoPage = '1';
    if (b.dataset.photoPage) b.classList.toggle('photo', root.dataset.photos !== 'off');
  }
  function snapshot() {
    var s = { textStyles: window.jdmType.load() };
    for (var k in PREF_DEFAULTS) s[k] = root.dataset[k] || PREF_DEFAULTS[k];
    return JSON.stringify(s, null, 1);
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
    panel.querySelector('#ts-style').addEventListener('change', function (e) { current = e.target.value; markSettings(); });
    panel.querySelectorAll('[data-k]').forEach(function (el) {
      el.addEventListener('input', function () {
        var T = window.jdmType.load(), k = el.dataset.k, v = el.value;
        T[current][k] = (k === 'font' || k === 'case') ? v : Number(v);
        window.jdmType.apply(T); window.jdmType.save(T);
        if (k === 'size') panel.querySelector('#ts-size-out').textContent = v + '%';
        place();
      });
    });
    panel.querySelectorAll('[data-pref]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.dataset.pref, v = b.dataset.val;
        if (v === PREF_DEFAULTS[k]) delete root.dataset[k]; else root.dataset[k] = v;
        try { localStorage.setItem('jdm-' + k, v); } catch (err) {}
        applyPhotos();
        markSettings();
      });
    });
    var out = panel.querySelector('#ts-out');
    panel.querySelector('#ts-copy').addEventListener('click', function () {
      var text = snapshot();
      out.value = text; out.hidden = false; out.select();
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () {
        panel.querySelector('#ts-copy').textContent = 'Copied. Paste it in our chat';
      }, function () {});
    });
    panel.querySelector('#ts-download').addEventListener('click', function () {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([snapshot()], { type: 'application/json' }));
      a.download = 'juandemarco-settings.json';
      a.setAttribute('download', a.download);
      document.body.appendChild(a); a.click(); a.remove();
    });
    panel.querySelector('#ts-reset').addEventListener('click', function () {
      try { localStorage.removeItem('jdm-type'); } catch (err) {}
      for (var k in PREF_DEFAULTS) { delete root.dataset[k]; try { localStorage.removeItem('jdm-' + k); } catch (err) {} }
      root.removeAttribute('style');
      window.jdmType.apply(window.jdmType.load());
      applyPhotos(); markSettings(); place();
    });
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
    var start = parseInt(location.hash.slice(1), 10);
    if (start > 1 && start <= slides.length) { load(start - 1); go(start - 1); }
    show.querySelector('.prev').addEventListener('click', function () { go(i - 1); });
    show.querySelector('.next').addEventListener('click', function () { go(i + 1); });
    slideStep = function (d) { go(i + d); };
    if (slides.length < 2) show.classList.add('single');
  }

  function init() {
    applyPhotos();
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
  document.addEventListener('keydown', function (e) {
    if (!slideStep || (e.target.closest && e.target.closest('input, textarea, select'))) return;
    if (e.key === 'ArrowRight') slideStep(1);
    if (e.key === 'ArrowLeft') slideStep(-1);
    if (e.key === 'Escape' && document.body.classList.contains('room')) { var x = document.querySelector('.room-close'); if (x) x.click(); }
  });

  init();
})();
