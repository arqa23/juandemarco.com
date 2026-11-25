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
  var PREF_DEFAULTS = { colour: 'guidelines', mat: 'off', photos: 'off', wall: 'page', mode: 'light', grad: 'off', hang: 'rows', ptitle: 'hover' };
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
    } else {   // light wall: dark text, even when the site is in dark mode
      st.setProperty('--ink', '#242321'); st.setProperty('--ink-dim', '#6A6761');
      st.setProperty('--legal-ink', 'rgba(36,35,33,.45)'); st.setProperty('--scroll-thumb', '#c9c4b8');
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
        if (k === 'mode') {   // a new mode brings the Prints wall back to the page colour
          delete root.dataset.wall;
          try { localStorage.removeItem('jdm-wall'); } catch (err) {}
        }
        applyPhotos(); applyWall();
        if (k === 'hang' || k === 'ptitle') layoutWall();
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
      applyPhotos(); applyWall(); markSettings(); place(); layoutWall();
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

  /* ---------- Prints wall: salon hang, even gaps between print edges ---------- */
  // Every print goes to the highest free spot where its EDGES sit one gap from
  // its neighbours, across and down (captions hang inside the gap below each
  // print and only need to stay clear of other prints). A few prints ahead are
  // tried for each spot, prints may stretch or shrink a little to close a
  // leftover gap or to line up with a neighbour's top or bottom, and afterwards
  // prints float up into any space left above them. Invisible, randomly sized
  // "ghost" blocks along the top and both sides keep those edges ragged. Several
  // hanging orders are tried and the one with the fewest large holes is kept.
  function layoutWall() {
    var wall = document.querySelector('.prints');
    if (!wall) return;
    var W = wall.clientWidth, g = parseFloat(getComputedStyle(wall).columnGap) || 60;
    var narrow = W < 600, base = W * (narrow ? 0.4 : 0.185), cx = W / 2;
    var capH = 0, cap0 = wall.querySelector('.print-cap');
    var overlay = cap0 && getComputedStyle(cap0).position === 'absolute';   // titles on hover take no room
    if (cap0 && !overlay) capH = cap0.offsetHeight + parseFloat(getComputedStyle(cap0).marginTop);
    var c = Math.max(8, g * 0.25);              // clearance around a caption
    var gv = Math.max(g, capH + c);             // gap down: the same as across unless a caption needs more
    var snapT = g * 0.6;                        // edges closer than this get lined up
    // A new hang on every visit; resizing keeps the same one (wallSeed is set
    // when the Prints page opens).
    var seed = wall.dataset.seed || (wall.dataset.seed = 1 + Math.floor(Math.random() * 2147483645));
    seed = +seed;
    var rand = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    var SIZES = [0.55, 0.75, 1, 1, 1.3, 1.6, 2.1, 2.7];
    function capWidth(cap) { var rg = document.createRange(); rg.selectNodeContents(cap); return rg.getBoundingClientRect().width; }
    var items = [].map.call(wall.querySelectorAll('.print'), function (a) {
      var img = a.querySelector('img'), cap = a.querySelector('.print-cap'), r = img.getAttribute('width') / img.getAttribute('height');
      var size = SIZES[Math.floor(rand() * SIZES.length)];
      return { a: a, r: r, cw: cap && !overlay ? capWidth(cap) : 0, w0: Math.min(W * (narrow ? 1 : 0.5), base * Math.sqrt(size * r)) };
    });
    var best = (document.documentElement.dataset.hang || PREF_DEFAULTS.hang) === 'salon' ? salon() : rows();
    function salon() {
    // ghosts: rectangles that block space but are never shown
      var ghosts = [], estH = 0;
      items.forEach(function (it) { estH += it.w0 * (it.w0 / it.r + gv); });
      estH = estH / (W * 0.6) + 600;
      if (!narrow) {
        for (var gx = 0; gx < W;) {
          var sw = W * (0.07 + rand() * 0.14), mid = Math.abs(gx + sw / 2 - cx) / (W / 2);
          var depth = rand() * base * (0.25 + 0.9 * mid);
          if (depth > 4) ghosts.push({ x: gx, y: -2000, w: Math.min(sw, W - gx), ih: 2000 + depth - gv, cw: 0, ghost: 1 });
          gx += sw;
        }
        [0, 1].forEach(function (side) {
          for (var gy = 0; gy < estH;) {
            var sh = 140 + rand() * 320, inset = rand() * W * 0.1 - g;
            if (inset > 4) ghosts.push({ x: side ? W - inset : 0, y: gy, w: inset, ih: sh - gv, cw: 0, ghost: 1 });
            gy += sh;
          }
        });
      }
      var placed;
      // Does a print at (x, y, w, ih) with a caption cw wide clash with p?
      function clash(x, y, w, ih, cw, p) {
        // print against print: one gap across, one gap down
        if (p.x < x + w + g - 0.5 && p.x + p.w + g > x + 0.5 && p.y < y + ih + gv - 0.5 && p.y + p.ih + gv > y + 0.5) return true;
        if (!capH) return false;
        var cy = y + ih, py = p.y + p.ih;
        // this caption against p's print
        if (cw > w && p.x < x + cw + c && p.x + p.w + c > x && p.y < cy + capH + c && p.y + p.ih + c > cy) return true;
        // p's caption against this print
        if (p.cw > p.w && x < p.x + p.cw + c && x + w + c > p.x && y < py + capH + c && y + ih + c > py) return true;
        return false;
      }
      function free(x, y, w, ih, cw, skip) {
        if (x < -0.5 || x + w > W + 0.5 || y < -0.5) return false;
        for (var k = 0; k < placed.length; k++) if (placed[k] !== skip && clash(x, y, w, ih, cw, placed[k])) return false;
        return true;
      }
      function lowestFit(x, w, ih, cw, skip) {   // highest y >= 0 where the print fits at x
        var near = [], ys = [0], span = Math.max(w, cw) + g;
        placed.forEach(function (p) {
          if (p !== skip && p.x < x + span && p.x + Math.max(p.w, p.cw) + g > x) { near.push(p); ys.push(p.y + p.ih + gv); }
        });
        ys.sort(function (a, b) { return a - b; });
        for (var k = 0; k < ys.length; k++) {
          var y = ys[k], ok = y >= 0;
          for (var q = 0; ok && q < near.length; q++) if (clash(x, y, w, ih, cw, near[q])) ok = false;
          if (ok) return y;
        }
        return Infinity;
      }
      function room(x, y, ih, dir, skip) {        // how far a print's free side can grow
        var lim = dir > 0 ? W : 0;
        placed.forEach(function (p) {
          if (p === skip || p.y >= y + ih + gv - 0.5 || p.y + p.ih + gv <= y + 0.5) return;
          if (dir > 0 && p.x >= x - 0.5) lim = Math.min(lim, p.x - g);
          if (dir < 0 && p.x + p.w <= x + 0.5) lim = Math.max(lim, p.x + p.w + g);
        });
        return lim;
      }
      // Try to resize a print anchored on one side so it fills the gap beside it
      // or meets a neighbour's top or bottom edge. Returns the best variant.
      function settle(b, it) {
        var r = it.r, lo = it.w0 * 0.7, hi = it.w0 * 1.4;
        function at(w, y) {
          var x = b.dir > 0 ? b.x : b.x + b.w - w;
          return free(x, y, w, w / r, it.cw, b.self) ? { x: x, y: y, w: w, ih: w / r } : null;
        }
        // 1. close a small gap on the open side
        var edge = b.dir > 0 ? b.x + b.w : b.x, lim = room(edge, b.y, b.ih * 1.3, b.dir, b.self);
        var slack = b.dir > 0 ? lim - edge : edge - lim;
        if (slack > 0.5 && slack < b.w * 0.4 && b.w + slack <= hi) { var v = at(b.w + slack, b.y); if (v) { b.x = v.x; b.w = v.w; b.ih = v.ih; } }
        // 2. line up the top with a neighbour's top just below it
        placed.forEach(function (p) {
          if (p.ghost || p === b.self) return;
          var d = p.y - b.y;
          if (d > 0.5 && d < snapT && p.x < b.x + b.w + g * 3 && p.x + p.w + g * 3 > b.x && free(b.x, p.y, b.w, b.ih, it.cw, b.self)) b.y = p.y;
        });
        // 3. line up the bottom with a neighbour's bottom (stretch or shrink a little)
        var bot = b.y + b.ih, bestD = snapT;
        placed.forEach(function (p) {
          if (p.ghost || p === b.self || p.x > b.x + b.w + g * 3 || p.x + p.w + g * 3 < b.x) return;
          var pb = p.y + p.ih, d = Math.abs(pb - bot);
          if (d > 0.5 && d < bestD) {
            var w = (pb - b.y) * r;
            if (w >= lo && w <= hi) { var v = at(w, b.y); if (v) { b.x = v.x; b.w = v.w; b.ih = v.ih; bestD = d; } }
          }
        });
        return b;
      }
      function pack(order) {
        placed = ghosts.slice();
        var real = [], left = order.slice(), LOOK = 3;
        while (left.length) {
          var best = null;
          for (var li = 0; li < Math.min(LOOK, left.length); li++) {
            var it = left[li], w0 = it.w0, ih0 = w0 / it.r;
            var cands = [[0, 1], [W - w0, -1]];
            placed.forEach(function (p) {
              cands.push([p.x + p.w + g, 1], [p.x - g - w0, -1]);
              if (!p.ghost) cands.push([p.x, 1], [p.x + p.w - w0, -1]);   // edges lined up with a print above
            });
            // each print may also hang a little smaller to fit a narrower spot
            [1, 0.8].forEach(function (k) {
              var w = w0 * k, ih = w / it.r;
              cands.forEach(function (cd) {
                var x = cd[1] > 0 ? cd[0] : cd[0] + w0 - w;
                if (x < -0.5 || x > W - w + 0.5) return;
                var y = lowestFit(x, w, ih, it.cw);
                if (y === Infinity) return;
                var score = y + Math.abs(x + w / 2 - cx) * 0.05 + li * g * 0.75 + (1 - k) * g * 2;
                if (!best || score < best.s) best = { x: x, y: y, w: w, ih: ih, dir: cd[1], s: score, it: it, li: li };
              });
            });
          }
          settle(best, best.it);
          var p = { x: best.x, y: best.y, w: best.w, ih: best.ih, cw: best.it.cw, it: best.it };
          placed.push(p); real.push(p);
          left.splice(best.li, 1);
        }
        // prints float up into free space above them, then re-settle
        for (var round = 0; round < 2; round++) {
          real.slice().sort(function (a, b) { return a.y - b.y; }).forEach(function (p) {
            var y = lowestFit(p.x, p.w, p.ih, p.cw, p);
            if (y < p.y - 0.5) p.y = y;
            var b = settle({ x: p.x, y: p.y, w: p.w, ih: p.ih, dir: p.x + p.w / 2 < cx ? -1 : 1, self: p }, { r: p.it.r, w0: p.it.w0, cw: p.cw });
            p.x = b.x; p.y = b.y; p.w = b.w; p.ih = b.ih;
          });
        }
        var top = Infinity, bot = 0;
        real.forEach(function (p) { top = Math.min(top, p.y); bot = Math.max(bot, p.y + p.ih); });
        return { placed: real, top: top, h: bot - top, holes: holes(real, top, bot) };
      }
      // Large empty patches inside the hang (not the ragged edges): a coarse grid
      // of the wall, prints grown by half a gap; empty cells between the
      // left- and rightmost prints nearby, grouped into patches.
      function holes(real, top, bot) {
        var cell = Math.max(10, g / 3), cols = Math.ceil(W / cell), rows = Math.ceil((bot - top) / cell) + 1;
        var grid = new Uint8Array(cols * rows), lo = new Array(rows), hi = new Array(rows);
        real.forEach(function (p) {
          var c0 = Math.max(0, Math.floor((p.x - g / 2) / cell)), c1 = Math.min(cols - 1, Math.floor((p.x + Math.max(p.w, p.cw) + g / 2) / cell));
          var r0 = Math.max(0, Math.floor((p.y - top - g / 2) / cell)), r1 = Math.min(rows - 1, Math.floor((p.y + p.ih + gv / 2 - top) / cell));
          for (var rr = r0; rr <= r1; rr++) for (var cc = c0; cc <= c1; cc++) grid[rr * cols + cc] = 1;
        });
        for (var rr = 0; rr < rows; rr++) {
          lo[rr] = cols; hi[rr] = -1;
          for (var cc = 0; cc < cols; cc++) if (grid[rr * cols + cc]) { lo[rr] = Math.min(lo[rr], cc); hi[rr] = cc; }
        }
        // the edge of the hang near each row: the most outward print within a band
        var band = Math.round(base / cell), L = [], R = [];
        for (rr = 0; rr < rows; rr++) {
          var a = cols, b = -1;
          for (var k = Math.max(0, rr - band); k <= Math.min(rows - 1, rr + band); k++) { a = Math.min(a, lo[k]); b = Math.max(b, hi[k]); }
          L[rr] = a; R[rr] = b;
        }
        var seen = new Uint8Array(cols * rows), score = 0, stack = [];
        for (rr = 0; rr < rows; rr++) for (cc = L[rr]; cc <= R[rr]; cc++) {
          var i0 = rr * cols + cc;
          if (grid[i0] || seen[i0]) continue;
          var n = 0, open = false; stack.push(i0); seen[i0] = 1;
          while (stack.length) {
            var i = stack.pop(), y0 = Math.floor(i / cols), x0 = i % cols; n++;
            [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
              var x1 = x0 + d[0], y1 = y0 + d[1];
              if (y1 < 0 || y1 >= rows) return;
              if (x1 < L[y1] || x1 > R[y1]) { open = true; return; }
              var j = y1 * cols + x1;
              if (!grid[j] && !seen[j]) { seen[j] = 1; stack.push(j); }
            });
          }
          score += n * n * (open ? 0.3 : 1);
        }
        return Math.sqrt(score) * cell * cell;
      }
      var best = pack(items), rate = function (res) { return res.h * W + res.holes * 20; };
      for (var t = 0; t < 10; t++) {
        var o = items.slice();
        for (var i = o.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), tmp = o[i]; o[i] = o[j]; o[j] = tmp; }
        var res = pack(o);
        if (rate(res) < rate(best)) best = res;
      }
      return best;
    }
    // Rows (after 6a's project collage): prints in a few widths on a
    // five-column grid, hung in rows of three to five columns with every
    // bottom on one line; rows shift left and right so the edges stay loose.
    // Each row sits one gap below the tallest print of the row above.
    function rows() {
      var cols = narrow ? 2 : 5, u = (W - (cols - 1) * g) / cols;
      var span = function (k) { return k * u + (k - 1) * g; };
      var order = items.slice();
      for (var i = order.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), tmp = order[i]; order[i] = order[j]; order[j] = tmp; }
      // portraits one column, landscapes mostly two, so the heights in a row stay close
      order.forEach(function (it) {
        var opts = narrow ? [1, 1, 2] : it.r < 0.9 ? [1] : it.r < 1.2 ? [1, 2] : it.r < 1.55 ? [2, 2, 2, 3] : [2, 2, 3];
        it.k = Math.min(cols, opts[Math.floor(rand() * opts.length)]);
      });
      var out = [], y = 0, left = order.slice(), prevOff = -1;
      while (left.length) {
        // each row fills three to five columns, so the left and right edges stay loose
        var target = narrow ? cols : 3 + Math.floor(rand() * 3), row = [], used = 0;
        for (var q = 0; q < left.length && used < target; q++) {
          var k = left[q].k;
          if (used + k <= target) { row.push(left[q]); used += k; left.splice(q, 1); q--; }
        }
        var spare = cols - used, off = Math.floor(rand() * (spare + 1));
        if (spare && off === prevOff) off = (off + 1) % (spare + 1);
        prevOff = off;
        var x = off * (u + g), hMax = 0;
        row.forEach(function (it) { it.rw = span(it.k); hMax = Math.max(hMax, it.rw / it.r); });
        row.forEach(function (it) {
          var ih = it.rw / it.r;
          out.push({ x: x, y: y + hMax - ih, w: it.rw, ih: ih, it: it });
          x += it.rw + g;
        });
        y += hMax + gv;
      }
      return { placed: out, top: 0, h: y - gv };
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

  /* Strip: runs from the first project to the last. On arrival it glides in
     slowly and settles at the start; any wheel, drag, key or touch takes over
     at once. Click and drag with the mouse to pan (a drag does not open the
     project). */
  var drag = null, dragMoved = false, glide = null;
  function stopGlide() { if (glide) { cancelAnimationFrame(glide); glide = null; } }
  ['wheel', 'pointerdown', 'keydown', 'touchstart'].forEach(function (t) {
    window.addEventListener(t, stopGlide, { passive: true, capture: true });
  });
  window.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.x;
    if (!dragMoved && Math.abs(dx) > 5) { dragMoved = true; drag.g.classList.add('is-dragging'); }
    if (dragMoved) drag.g.scrollLeft = drag.left - dx;
  });
  window.addEventListener('pointerup', function () {
    if (!drag) return;
    drag.g.classList.remove('is-dragging'); drag = null;
  });
  function initFilmstrip() {
    var g = strip();
    if (!g || g.dataset.ready) return;
    g.dataset.ready = '1';
    var card = g.querySelector('.card');
    var from = Math.min(g.scrollWidth - g.clientWidth, card ? card.offsetWidth * 0.9 : 500);
    if (from > 0 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var t0 = null, dur = 3400;
      g.scrollLeft = from;
      var step = function (t) {
        if (t0 === null) t0 = t;
        var k = Math.min(1, (t - t0) / dur), e = 0.5 - 0.5 * Math.cos(Math.PI * k);
        g.scrollLeft = from * (1 - e);
        glide = k < 1 ? requestAnimationFrame(step) : null;
      };
      stopGlide(); glide = requestAnimationFrame(step);
    }
    g.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      drag = { g: g, x: e.clientX, left: g.scrollLeft }; dragMoved = false;
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
  var wallTimer;
  window.addEventListener('resize', function () { place(); clearTimeout(wallTimer); wallTimer = setTimeout(layoutWall, 120); });
  document.addEventListener('keydown', function (e) {
    if (!slideStep || (e.target.closest && e.target.closest('input, textarea, select'))) return;
    if (e.key === 'ArrowRight') slideStep(1);
    if (e.key === 'ArrowLeft') slideStep(-1);
    if (e.key === 'Escape' && document.body.classList.contains('room')) { var x = document.querySelector('.room-close'); if (x) x.click(); }
  });

  init();
})();
