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
  var PREF_DEFAULTS = { colour: 'guidelines', mat: 'off', photos: 'on' };
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

  /* ---------- Prints wall: masonry rows so gutters match across and down ---------- */
  // Prints wall: greedy "highest free spot" packing over the whole band at once.
  // Each print tries every x where it sits exactly one gap from a neighbour or
  // against an edge, takes the highest free y there, and then stretches a little
  // (up to 35%) to close a leftover gap, so neighbours stay one gap apart.
  function layoutWall() {
    var wall = document.querySelector('.prints');
    if (!wall) return;
    var W = wall.clientWidth, g = parseFloat(getComputedStyle(wall).columnGap) || 40;
    var base = W * (W < 600 ? 0.42 : 0.185), placed = [], bottom = 0;
    var capH = 0, cap0 = wall.querySelector('.print-cap');
    if (cap0) capH = cap0.offsetHeight + parseFloat(getComputedStyle(cap0).marginTop);
    function topAt(x, w) {
      var y = 0;
      placed.forEach(function (p) { if (p.x < x + w + g - 0.5 && p.x + p.w + g > x + 0.5) y = Math.max(y, p.y + p.h + g); });
      return y;
    }
    function room(x, y, h, dir) {           // free edge to the right (dir 1) or left (-1) over [y, y+h]
      var lim = dir > 0 ? W : 0;
      placed.forEach(function (p) {
        if (p.y >= y + h + g - 0.5 || p.y + p.h + g <= y + 0.5) return;
        if (dir > 0 && p.x >= x - 0.5) lim = Math.min(lim, p.x - g);
        if (dir < 0 && p.x + p.w <= x + 0.5) lim = Math.max(lim, p.x + p.w + g);
      });
      return lim;
    }
    var items = [].map.call(wall.querySelectorAll('.print'), function (a) {
      var img = a.querySelector('img'), r = img.getAttribute('width') / img.getAttribute('height');
      return { a: a, r: r, w0: Math.min(W, base * Math.sqrt(parseFloat(a.dataset.size || 1) * r)) };
    });
    function pack(order) {
      placed = [];
      var bot = 0, area = 0;
      order.forEach(function (it) {
        var r = it.r, w0 = it.w0, cands = [[0, 1], [W - w0, -1]], best = null;
        placed.forEach(function (p) { cands.push([p.x + p.w + g, 1], [p.x - g - w0, -1]); });
        cands.forEach(function (c) {
          var x = c[0], dir = c[1], w = w0;
          if (x < -0.5 || x > W - w + 0.5) return;
          var y = topAt(x, w), h = w / r + capH;
          var edge = dir > 0 ? x : x + w, lim = room(edge, y, h * 1.35, dir);
          var slack = dir > 0 ? lim - (x + w) : x - lim;
          if (slack > 0.5 && slack < w * 0.35) {
            var w2 = w + slack, x2 = dir > 0 ? x : lim;
            if (topAt(x2, w2) <= y + 0.5) { x = x2; w = w2; h = w / r + capH; }
          }
          var score = y + Math.abs(x + w / 2 - W / 2) * 0.03;
          if (!best || score < best.s) best = { x: x, y: y, w: w, h: h, s: score, it: it };
        });
        placed.push(best);
        bot = Math.max(bot, best.y + best.h); area += best.w * best.h;
      });
      return { placed: placed, d: area / (W * bot), h: bot };
    }
    // Try many hanging orders (seeded, so the wall is the same on every visit)
    // and keep the densest one.
    var seed = 23, rand = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    var bestPack = pack(items);
    for (var t = 0; t < 160; t++) {
      var o = items.slice();
      for (var i = o.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), tmp = o[i]; o[i] = o[j]; o[j] = tmp; }
      var res = pack(o);
      if (res.d > bestPack.d) bestPack = res;
    }
    bestPack.placed.forEach(function (p) {
      var st = p.it.a.style; st.width = p.w + 'px'; st.left = p.x + 'px'; st.top = p.y + 'px';
    });
    bottom = bestPack.h;
    wall.style.height = bottom + 'px';
  }


  function init() {
    layoutWall();
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
  window.addEventListener('resize', function () { place(); layoutWall(); });
  document.addEventListener('keydown', function (e) {
    if (!slideStep || (e.target.closest && e.target.closest('input, textarea, select'))) return;
    if (e.key === 'ArrowRight') slideStep(1);
    if (e.key === 'ArrowLeft') slideStep(-1);
    if (e.key === 'Escape' && document.body.classList.contains('room')) { var x = document.querySelector('.room-close'); if (x) x.click(); }
  });

  init();
})();
