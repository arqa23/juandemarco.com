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
  var PREF_DEFAULTS = { colour: 'guidelines', mat: 'off', photos: 'off', wall: 'page', mode: 'light', grad: 'off' };
  // Prints wall colours (Settings > Prints wall): beige, charcoal, plus up to four
  // colours Juan picks (kept in this browser as jdm-wallcolours). "random" picks
  // one of all of these each time the Prints page opens. Dark walls switch the
  // text to a warm off-white.
  var WALLS = { beige: '#FAF9F5', charcoal: '#171716' };
  var previewWall = null;
  function myWalls() {
    try { var a = JSON.parse(localStorage.getItem('jdm-wallcolours') || '[]'); return Array.isArray(a) ? a.slice(0, 4) : []; } catch (e) { return []; }
  }
  function saveMyWalls(a) { try { localStorage.setItem('jdm-wallcolours', JSON.stringify(a)); } catch (e) {} }
  function isDark(c) {
    var n = parseInt(c.slice(1), 16), r = n >> 16, gr = (n >> 8) & 255, b = n & 255;
    return (0.2126 * r + 0.7152 * gr + 0.0722 * b) / 255 < 0.45;
  }
  function applyWall() {
    var b = document.body, st = b.style;
    ['--bg', '--ink', '--ink-dim', '--legal-ink', '--fade', '--fade-0', '--scroll-thumb'].forEach(function (v) { st.removeProperty(v); });
    root.style.removeProperty('background');
    if (!document.querySelector('.prints')) return;
    var k = root.dataset.wall || PREF_DEFAULTS.wall, c = previewWall || WALLS[k];
    if (k === 'page' && !previewWall) return;   // follow the page's light / dark mode
    if (!c) { var all = [WALLS.beige, WALLS.charcoal].concat(myWalls().filter(Boolean)); c = all[Math.floor(Math.random() * all.length)]; }
    var n = parseInt(c.slice(1), 16), rgb = [n >> 16, (n >> 8) & 255, n & 255].join(',');
    st.setProperty('--bg', c); root.style.background = c;
    st.setProperty('--fade', 'rgba(' + rgb + ',.5)'); st.setProperty('--fade-0', 'rgba(' + rgb + ',0)');
    if (isDark(c)) {
      st.setProperty('--ink', '#EDE8DE'); st.setProperty('--ink-dim', 'rgba(237,232,222,.74)');
      st.setProperty('--legal-ink', 'rgba(237,232,222,.5)'); st.setProperty('--scroll-thumb', 'rgba(237,232,222,.3)');
    }
  }
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
    if (b.dataset.photoPage) b.classList.toggle('photo', (root.dataset.photos || PREF_DEFAULTS.photos) !== 'off');
  }
  function snapshot() {
    var s = { textStyles: window.jdmType.load() };
    for (var k in PREF_DEFAULTS) s[k] = root.dataset[k] || PREF_DEFAULTS[k];
    s.wallColours = myWalls();
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
        previewWall = null;
        if (v === PREF_DEFAULTS[k]) delete root.dataset[k]; else root.dataset[k] = v;
        try { localStorage.setItem('jdm-' + k, v); } catch (err) {}
        applyPhotos(); applyWall();
        markSettings();
      });
    });
    function markPicks() {
      var a = myWalls();
      panel.querySelectorAll('.wall-pick').forEach(function (inp) {
        var c = a[+inp.dataset.i];
        inp.parentNode.classList.toggle('is-empty', !c);
        if (c) inp.value = c;
      });
    }
    panel.querySelectorAll('.wall-pick').forEach(function (inp) {
      inp.addEventListener('input', function () {
        var a = myWalls(); a[+inp.dataset.i] = inp.value; saveMyWalls(a);
        previewWall = inp.value; applyWall(); markPicks();   // show the colour on the wall right away
      });
    });
    panel.querySelectorAll('.wall-clear').forEach(function (b) {
      b.addEventListener('click', function () {
        var a = myWalls(); a[+b.dataset.i] = null; saveMyWalls(a);
        previewWall = null; applyWall(); markPicks();
      });
    });
    markPicks();
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
      try { localStorage.removeItem('jdm-type'); localStorage.removeItem('jdm-wallcolours'); } catch (err) {}
      previewWall = null;
      for (var k in PREF_DEFAULTS) { delete root.dataset[k]; try { localStorage.removeItem('jdm-' + k); } catch (err) {} }
      root.removeAttribute('style');
      window.jdmType.apply(window.jdmType.load());
      applyPhotos(); applyWall(); markSettings(); place();
    });
    markSettings();
  }

  /* ---------- Project slideshow ---------- */
  var slideStep = null;
  // Magnifier for print rooms: a round lens follows the cursor over the print.
  function initZoom(show, current) {
    var btn = show.querySelector('.room-zoom'), frame = show.querySelector('.frame');
    if (!btn || !frame) return;
    var lens = document.createElement('div');
    lens.className = 'zoom-lens';
    frame.appendChild(lens);
    btn.addEventListener('click', function () {
      var on = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      frame.classList.toggle('zooming', on);
    });
    frame.addEventListener('mousemove', function (e) {
      if (!frame.classList.contains('zooming')) return;
      var img = current(), r = frame.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top, L = lens.offsetWidth;
      var Z = Math.max(2.2, Math.min(3, (img.naturalWidth || r.width * 2.5) / r.width * 1.1));
      lens.style.left = (x - L / 2) + 'px'; lens.style.top = (y - L / 2) + 'px';
      lens.style.backgroundImage = 'url("' + img.currentSrc + '")';
      lens.style.backgroundSize = (r.width * Z) + 'px ' + (r.height * Z) + 'px';
      lens.style.backgroundPosition = (L / 2 - x * Z) + 'px ' + (L / 2 - y * Z) + 'px';
    });
  }

  function initSlideshow() {
    slideStep = null;
    var show = document.querySelector('.slideshow');
    if (!show) return;
    var slides = show.querySelectorAll('.slide'), counter = show.querySelector('.slide-i'), i = 0;
    function load(k) {
      var s = slides[(k + slides.length) % slides.length];
      if (s && s.dataset.src) { s.src = s.dataset.src; s.removeAttribute('data-src'); }
    }
    var layout = show.closest('.room-layout');
    function fit() { if (layout && slides[i].dataset.r) layout.style.setProperty('--ratio', slides[i].dataset.r); }
    function go(k) {
      slides[i].classList.remove('is-on');
      i = (k + slides.length) % slides.length;
      load(i);
      slides[i].classList.add('is-on');
      counter.textContent = i + 1;
      load(i + 1); load(i - 1);
      fit();
    }
    fit();
    initZoom(show, function () { return slides[i]; });
    load(1); load(-1);
    var start = parseInt(location.hash.slice(1), 10);
    if (start > 1 && start <= slides.length) { load(start - 1); go(start - 1); }
    show.querySelector('.prev').addEventListener('click', function () { go(i - 1); });
    show.querySelector('.next').addEventListener('click', function () { go(i + 1); });
    slideStep = function (d) { go(i + d); };
    if (slides.length < 2) show.classList.add('single');
  }

  /* ---------- Prints wall: masonry rows so gutters match across and down ---------- */
  // Prints wall: each print goes to the highest free spot (filling holes too)
  // where it sits exactly one gap from its neighbours, then stretches a little
  // to close a small leftover gap. Invisible, randomly sized "ghost" blocks along
  // the top and both sides keep those edges ragged, pulling the hang inward.
  // Many seeded hanging orders are tried and the densest kept, so the wall is
  // the same on every visit.
  function layoutWall() {
    var wall = document.querySelector('.prints');
    if (!wall) return;
    var W = wall.clientWidth, g = parseFloat(getComputedStyle(wall).columnGap) || 40;
    var narrow = W < 600, base = W * (narrow ? 0.4 : 0.185), cx = W / 2;
    var capH = 0, cap0 = wall.querySelector('.print-cap');
    if (cap0) capH = cap0.offsetHeight + parseFloat(getComputedStyle(cap0).marginTop);
    // A new hang on every visit; resizing keeps the same one (wallSeed is set
    // when the Prints page opens).
    var seed = wall.dataset.seed || (wall.dataset.seed = 1 + Math.floor(Math.random() * 2147483645));
    seed = +seed;
    var rand = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    var SIZES = [0.55, 0.75, 1, 1, 1.3, 1.6, 2.1, 2.7];
    var items = [].map.call(wall.querySelectorAll('.print'), function (a) {
      var img = a.querySelector('img'), r = img.getAttribute('width') / img.getAttribute('height');
      var size = SIZES[Math.floor(rand() * SIZES.length)];
      return { a: a, r: r, w0: Math.min(W * (narrow ? 1 : 0.5), base * Math.sqrt(size * r)) };
    });
    // ghosts: rectangles that block space but are never shown
    var ghosts = [], estH = 0;
    items.forEach(function (it) { estH += it.w0 * (it.w0 / it.r + capH); });
    estH = estH / (W * 0.6) + 600;
    if (!narrow) {
      for (var gx = 0; gx < W;) {
        var sw = W * (0.07 + rand() * 0.14), mid = Math.abs(gx + sw / 2 - cx) / (W / 2);
        var depth = rand() * base * (0.25 + 0.9 * mid);
        if (depth > 4) ghosts.push({ x: gx, y: -2000, w: Math.min(sw, W - gx), h: 2000 + depth - g, ghost: 1 });
        gx += sw;
      }
      [0, 1].forEach(function (side) {
        for (var gy = 0; gy < estH;) {
          var sh = 140 + rand() * 320, inset = rand() * W * 0.1 - g;
          if (inset > 4) ghosts.push({ x: side ? W - inset : 0, y: gy, w: inset, h: sh - g, ghost: 1 });
          gy += sh;
        }
      });
    }
    var placed;
    function free(x, y, w, h) {
      for (var k = 0; k < placed.length; k++) {
        var p = placed[k];
        if (p.x < x + w + g - 0.5 && p.x + p.w + g > x + 0.5 && p.y < y + h + g - 0.5 && p.y + p.h + g > y + 0.5) return false;
      }
      return true;
    }
    function lowestFit(x, w, h) {           // highest y >= 0 where the print fits at x
      var ys = [0];
      placed.forEach(function (p) { if (p.x < x + w + g && p.x + p.w + g > x) ys.push(p.y + p.h + g); });
      ys.sort(function (a, b) { return a - b; });
      for (var k = 0; k < ys.length; k++) if (ys[k] >= 0 && free(x, ys[k], w, h)) return ys[k];
      return Infinity;
    }
    function room(x, y, h, dir) {
      var lim = dir > 0 ? W : 0;
      placed.forEach(function (p) {
        if (p.y >= y + h + g - 0.5 || p.y + p.h + g <= y + 0.5) return;
        if (dir > 0 && p.x >= x - 0.5) lim = Math.min(lim, p.x - g);
        if (dir < 0 && p.x + p.w <= x + 0.5) lim = Math.max(lim, p.x + p.w + g);
      });
      return lim;
    }
    function pack(order) {
      placed = ghosts.slice();
      var real = [], bot = 0, top = Infinity, area = 0;
      order.forEach(function (it) {
        var r = it.r, w0 = it.w0, cands = [[0, 1], [W - w0, -1]], best = null;
        placed.forEach(function (p) { cands.push([p.x + p.w + g, 1], [p.x - g - w0, -1]); });
        cands.forEach(function (c) {
          var x = c[0], dir = c[1], w = w0, h = w / r + capH;
          if (x < -0.5 || x > W - w + 0.5) return;
          var y = lowestFit(x, w, h);
          if (y === Infinity) return;
          var edge = dir > 0 ? x : x + w, lim = room(edge, y, h * 1.35, dir);
          var slack = dir > 0 ? lim - (x + w) : x - lim;
          if (slack > 0.5 && slack < w * 0.35) {
            var w2 = w + slack, x2 = dir > 0 ? x : lim, h2 = w2 / r + capH;
            if (free(x2, y, w2, h2)) { x = x2; w = w2; h = h2; }
          }
          var score = y + Math.abs(x + w / 2 - cx) * 0.05;
          if (!best || score < best.s) best = { x: x, y: y, w: w, h: h, ih: w / r, s: score, it: it };
        });
        placed.push(best); real.push(best);
        bot = Math.max(bot, best.y + best.ih); top = Math.min(top, best.y); area += best.w * best.h;
      });
      return { placed: real, top: top, h: bot - top, d: area / (W * (bot - top)) };
    }
    var best = pack(items);
    for (var t = 0; t < 24; t++) {
      var o = items.slice();
      for (var i = o.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), tmp = o[i]; o[i] = o[j]; o[j] = tmp; }
      var res = pack(o);
      if (res.d > best.d) best = res;
    }
    best.placed.forEach(function (p) {
      var st = p.it.a.style; st.width = p.w + 'px'; st.left = p.x + 'px'; st.top = (p.y - best.top) + 'px';
    });
    // Height ends at the lowest image (captions hang below it). The page can
    // scroll only until that edge lines up with the bottom of "Contact".
    wall.style.height = best.h + 'px';
    wall.classList.add('is-hung');   // shown only once every print has its place
    // The stop sits two menu lines above the bottom line, where "Contact" was
    // when the menu had six lines. The top of the hang mirrors that distance.
    var page = wall.closest('.page'), labels = document.querySelectorAll('.nav .nav-label, .nav .settings-btn');
    var gapBelow = 60;
    if (labels.length > 1 && !narrow) {
      var last = labels[labels.length - 1].getBoundingClientRect(), pitch = last.top - labels[labels.length - 2].getBoundingClientRect().top;
      gapBelow = innerHeight - last.bottom + pitch * 2;
    }
    if (!page) return;
    page.style.paddingBottom = Math.max(0, gapBelow) + 'px';
    wall.style.marginTop = '';
    if (!narrow) {
      var sc = wall.closest('.scroller') || document.scrollingElement;
      var topNow = wall.getBoundingClientRect().top + sc.scrollTop;
      wall.style.marginTop = (gapBelow - topNow) + 'px';
    }
  }


  function init() {
    layoutWall();
    applyPhotos(); applyWall();
    place();
    initSettings();
    initSlideshow();
    initFilmstrip();
    if (document.fonts) document.fonts.ready.then(function () { place(); layoutWall(); });
  }

  /* ---------- Image protection (deterrent; screenshots can't be blocked) ---------- */
  document.addEventListener('contextmenu', function (e) {
    if (e.target.closest && e.target.closest('img, .frame, .print, .cover, .zoom-lens')) e.preventDefault();
  });
  document.addEventListener('dragstart', function (e) { if (e.target.tagName === 'IMG') e.preventDefault(); });

  /* ---------- Work filmstrip: wheel and arrow keys move it sideways ---------- */
  function strip() { return document.querySelector('.work-page .grid'); }
  document.addEventListener('wheel', function (e) {
    var g = strip();
    if (!g || e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    if (e.target.closest && e.target.closest('.settings')) return;
    e.preventDefault();
    g.scrollLeft += e.deltaY * (e.deltaMode === 1 ? 40 : 1);
  }, { passive: false });
  document.addEventListener('keydown', function (e) {
    var g = strip();
    if (!g || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
    var card = g.querySelector('.card');
    var step = card ? card.offsetWidth + parseFloat(getComputedStyle(g).columnGap || 0) : 300;
    g.scrollBy({ left: e.key === 'ArrowRight' ? step : -step, behavior: 'smooth' });
  });

  /* Endless strip: the set of tiles is repeated three times and the scroll
     position is quietly moved back by one set whenever it nears either end,
     so it never runs out. Random starting point on each visit. Click and drag
     with the mouse to pan (a drag does not open the project). */
  var drag = null, dragMoved = false;
  window.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.x;
    if (!dragMoved && Math.abs(dx) > 5) { dragMoved = true; drag.g.classList.add('is-dragging'); }
    if (dragMoved) { drag.g.scrollLeft = drag.left - dx; drag.wrap(); drag.left = drag.g.scrollLeft + dx; }
  });
  window.addEventListener('pointerup', function () {
    if (!drag) return;
    drag.g.classList.remove('is-dragging'); drag = null;
  });
  function initFilmstrip() {
    var g = strip();
    if (!g || g.dataset.loop) return;
    g.dataset.loop = '1';
    var cards = Array.prototype.slice.call(g.children);
    if (!cards.length) return;
    function copies() {
      var f = document.createDocumentFragment();
      cards.forEach(function (c) {
        var k = c.cloneNode(true);
        k.setAttribute('aria-hidden', 'true'); k.tabIndex = -1;
        f.appendChild(k);
      });
      return f;
    }
    g.insertBefore(copies(), cards[0]);
    g.appendChild(copies());
    function setW() { return cards[0].offsetLeft - g.children[0].offsetLeft; }
    function wrap() {
      var w = setW();
      if (g.scrollLeft < w * 0.5) g.scrollLeft += w;
      else if (g.scrollLeft > w * 1.5) g.scrollLeft -= w;
    }
    g.scrollLeft = setW() * (1 + Math.random());
    g.addEventListener('scroll', wrap, { passive: true });

    g.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      drag = { g: g, x: e.clientX, left: g.scrollLeft, wrap: wrap }; dragMoved = false;
    });
    g.addEventListener('click', function (e) { if (dragMoved) { e.preventDefault(); e.stopPropagation(); dragMoved = false; } }, true);
    g.addEventListener('dragstart', function (e) { e.preventDefault(); });
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
    fetch(url, { credentials: 'same-origin', cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (text) {
        var doc = new DOMParser().parseFromString(text, 'text/html');
        // If the site was updated since this page loaded (different script or
        // style version), load the page fully so old and new code never mix.
        var mine = document.querySelector('script[src*="site.js"]'), theirs = doc.querySelector('script[src*="site.js"]');
        if (!mine || !theirs || mine.getAttribute('src') !== theirs.getAttribute('src') ||
            doc.documentElement.getAttribute('data-settings') !== root.getAttribute('data-settings')) {
          location.href = url; return;
        }
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
