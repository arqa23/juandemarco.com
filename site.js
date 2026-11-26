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
    // project text never runs below the image: paragraphs that would are hidden
    var frame = document.querySelector('.project-main .frame'), ps = document.querySelectorAll('.project-desc p');
    if (frame && ps.length) {
      var fb = frame.getBoundingClientRect().bottom, wide = innerWidth > 700;
      ps.forEach(function (p) { p.classList.remove('past-image'); });
      var cut = false;
      ps.forEach(function (p) { if (wide && (cut || p.getBoundingClientRect().bottom > fb + 1)) { p.classList.add('past-image'); cut = true; } });
    }
    // settings button and back-to-top line up on the copyright's centre line
    // (measured from the layout box, so it holds while the copyright is turned)
    var foot = document.querySelector('.site-footer');
    if (!foot) {   // copyright now lives on the About page: the icon sits on the page margin
      var icon = Math.max(15, 18 * innerWidth / 1920);
      var gut = parseFloat(getComputedStyle(document.querySelector('.settings-corner') || root).bottom) || 40;
      // the page margin (--edge), measured with a probe so it holds on pages
      // that hide the name, like the print rooms
      var probe = document.createElement('div');
      probe.style.cssText = 'position:absolute;visibility:hidden;width:var(--edge)';
      document.body.appendChild(probe);
      var lx = probe.getBoundingClientRect().width || 50;
      probe.remove();
      root.style.setProperty('--legal-mid', (lx + icon / 2) + 'px');
      root.style.setProperty('--legal-w', icon + 'px');
      root.style.setProperty('--legal-top', (gut + icon) + 'px');
    }
    if (foot) {
      var cs = getComputedStyle(foot), fw = foot.offsetWidth, fh = foot.offsetHeight;
      root.style.setProperty('--legal-mid', (parseFloat(cs.left) + fw / 2) + 'px');
      root.style.setProperty('--legal-w', fw + 'px');
      root.style.setProperty('--legal-h', fh + 'px');
      root.style.setProperty('--legal-top', (parseFloat(cs.bottom) + fh) + 'px');
    }
  }

  /* ---------- Settings (temporary test panel) ---------- */
  // Each page-wide choice; the default leaves no attribute on <html>.
  var PREF_DEFAULTS = { colour: 'guidelines', mat: 'off', photos: 'off', wall: 'page', mode: 'dark', grad: 'off', hang: 'index', ptitle: 'hover', tiles: 'image' };
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
    var pick = document.getElementById('mode-pick');
    if (pick) pick.hidden = true;
    var panel = document.getElementById('settings'), btn = document.querySelector('.settings-btn');
    if (!panel || panel.hidden) return;
    panel.hidden = true;
    btn.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
  }
  // Gallery prints with or without their paper (view box: Framed / Unframed)
  function applyFrame() {
    var off = root.dataset.frame === 'off';
    document.querySelectorAll('.print img[data-bare]').forEach(function (im) {
      if (!im.dataset.framed) im.dataset.framed = im.getAttribute('src');
      var want = off ? im.dataset.bare : im.dataset.framed;
      if (im.getAttribute('src') !== want) im.setAttribute('src', want);
    });
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
    var pick = document.getElementById('mode-pick');
    var markPick = function () {
      if (!pick) return;
      // one line per setting, "Name: value"; a click switches it (Juan, 2026-11-26)
      var val = {
        mode: (root.dataset.mode || PREF_DEFAULTS.mode) === 'dark' ? 'On' : 'Off',
        frame: (root.dataset.frame || 'on') === 'on' ? 'On' : 'Off',
        fs: document.fullscreenElement ? 'On' : 'Off',
      };
      pick.querySelectorAll('button[data-wv]').forEach(function (b) { b.classList.toggle('is-on', workView() === b.dataset.wv); });
      pick.querySelectorAll('button[data-tog]').forEach(function (b) { b.querySelector('span').textContent = val[b.dataset.tog]; });
      pick.classList.toggle('on-work', !!document.querySelector('.work-page'));
      pick.classList.toggle('on-1b', workView() === '1b');
      pick.querySelectorAll('input[data-wk]').forEach(function (inp) { inp.value = workSet()[inp.dataset.wk]; inp.nextElementSibling.textContent = inp.value; });
    };
    if (pick) {
      document.addEventListener('fullscreenchange', markPick);
      // Work sliders (test): space between tiles, how far up, how far down
      pick.addEventListener('input', function (e) {
        var inp = e.target.closest('input[data-wk]'); if (!inp) return;
        var w = workSet(); w[inp.dataset.wk] = +inp.value;
        try { localStorage.setItem('jdm-strip', JSON.stringify(w)); } catch (err) {}
        inp.nextElementSibling.textContent = inp.value;
        applyWork();
      });
      pick.addEventListener('click', function (e) {
        e.stopPropagation();
        var wv = e.target.closest('button[data-wv]');   // working mode: pick a Work layout
        if (wv) {
          try { localStorage.setItem('jdm-work', wv.dataset.wv); } catch (err) {}
          if (document.querySelector('.work-page')) location.reload(); else markPick();
          return;
        }
        var t = e.target.closest('button[data-tog]');
        if (!t) return;
        var k = t.dataset.tog;
        if (k === 'frame') {
          root.dataset.frame = (root.dataset.frame || 'on') === 'on' ? 'off' : 'on';
          try { localStorage.setItem('jdm-frame', root.dataset.frame); } catch (err) {}
          applyFrame(); markPick(); return;
        }
        if (k === 'fs') {
          var de = document.documentElement;
          if (document.fullscreenElement) document.exitFullscreen && document.exitFullscreen();
          else if (de.requestFullscreen) de.requestFullscreen().catch(function () {});
          return;
        }
        // mode: set directly (not through the tabled test panel)
        var m = (root.dataset.mode || PREF_DEFAULTS.mode) === 'dark' ? 'light' : 'dark';
        root.dataset.mode = m;
        delete root.dataset.wall; previewWall = null;
        try { localStorage.setItem('jdm-mode', m); localStorage.removeItem('jdm-wall'); } catch (err) {}
        applyPhotos(); applyWall(); markSettings(); markPick();
      });
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      // The full test panel is tabled for now (Juan, 2026-11-25): visitors get
      // a simple Light / Dark choice. Shift- or Alt-click still opens the panel.
      if (pick && !e.shiftKey && !e.altKey) {
        closeSettings();
        pick.hidden = !pick.hidden;
        btn.setAttribute('aria-expanded', String(!pick.hidden));
        markPick();
        return;
      }
      if (pick) pick.hidden = true;
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
        if (v === PREF_DEFAULTS[k] && k !== 'mode') delete root.dataset[k]; else root.dataset[k] = v;   // mode always kept on <html> (the CSS keys on it)
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
      root.dataset.mode = PREF_DEFAULTS.mode;
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
    var slides = show.querySelectorAll('.slide'), counter = (show.closest('.project-layout') || show).querySelector('.slide-i'), i = 0;
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
    // Desktop: the cursor over the image shows the way (left half back, right
    // half on) and a click there turns the image.
    var frame = show.querySelector('.frame');
    if (frame && slides.length > 1) {
      frame.addEventListener('mousemove', function (e) {
        if (frame.classList.contains('zooming')) { delete frame.dataset.dir; return; }
        var r = frame.getBoundingClientRect();
        frame.dataset.dir = e.clientX - r.left < r.width / 2 ? 'prev' : 'next';
      });
      frame.addEventListener('mouseleave', function () { delete frame.dataset.dir; });
      frame.addEventListener('click', function (e) {
        if (!frame.dataset.dir || e.target.closest('.slide-btn')) return;
        go(i + (frame.dataset.dir === 'next' ? 1 : -1));
      });
    }
    show.querySelector('.prev').addEventListener('click', function () { go(i - 1); });
    show.querySelector('.next').addEventListener('click', function () { go(i + 1); });
    slideStep = function (d) { go(i + d); };
    if (slides.length < 2) (show.closest('.project-layout') || show).classList.add('single');
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
    var hang = document.documentElement.dataset.hang || PREF_DEFAULTS.hang;
    wall.classList.toggle('is-index', hang === 'index');
    if (hang === 'index') g = parseFloat(getComputedStyle(wall).columnGap) || 12;
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
    var best = hang === 'salon' ? salon() : hang === 'flow' ? rows() : hang === 'rows' ? even() : index();
    // Index (default; after sort-office.com's index): rows of three that fill
    // the wall edge to edge, tight gaps across, each print at its own shape
    // (so heights vary, tops aligned), a number and title under each, and
    // more air between rows. Widths change on every visit; order and numbers
    // stay the same.
    function index() {
      var MAX = narrow ? 2 : 3, out = [], y = 0, q = 0, bottom = 0, mod = W / 48;
      var all = [].slice.call(wall.querySelectorAll('.print'));
      var list = items.slice().sort(function (a, b) { return all.indexOf(a.a) - all.indexOf(b.a); });
      list.forEach(function (it, n) { var c = it.a.querySelector('.print-cap'); if (c) c.dataset.no = '[' + (n + 1 < 10 ? '0' : '') + (n + 1) + ']'; });
      var down = capH + g * 3.5;
      while (q < list.length) {
        var row = list.slice(q, q + MAX); q += row.length;
        var avail = W - g * (MAX - 1), wt = row.map(function (it) { return Math.pow(it.r, 0.75) * (0.8 + rand() * 0.45); });
        var sum = wt.reduce(function (a, b) { return a + b; }, 0), full = row.length === MAX;
        var ws = wt.map(function (v) { return full ? v / sum * avail : v / (sum / row.length) * avail / MAX; });
        ws = ws.map(function (w) { return Math.max(mod * 8, Math.round(w / mod) * mod); });
        if (full) { var used = ws.reduce(function (a, b) { return a + b; }, 0) - ws[ws.length - 1]; ws[ws.length - 1] = avail - used; }
        var x = 0, hMax = 0;
        row.forEach(function (it, n) {
          var h = ws[n] / it.r;
          out.push({ x: x, y: y, w: ws[n], ih: h, it: it });
          x += ws[n] + g; hMax = Math.max(hMax, h);
        });
        bottom = y + hMax + capH;
        y += hMax + down;
      }
      return { placed: out, top: 0, h: bottom };
    }
    // Even (default): every print the same height, every gap the same, across
    // and down. Rows hold up to three prints and sit centred on the wall.
    function even() {
      var order = items.slice();
      for (var i = order.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), tmp = order[i]; order[i] = order[j]; order[j] = tmp; }
      var H = W * (narrow ? 0.55 : 0.27), MAX = narrow ? 2 : 3, out = [], y = 0, q = 0;
      while (q < order.length) {
        var row = [], sum = 0;
        while (q < order.length && row.length < MAX) {
          var w = H * order[q].r, add = (row.length ? g : 0) + w;
          if (row.length && sum + add > W) break;
          row.push({ it: order[q], w: Math.min(w, W) }); sum += add; q++;
        }
        var x = Math.max(0, (W - sum) / 2);
        row.forEach(function (p) { out.push({ x: x, y: y, w: p.w, ih: p.w / p.it.r, it: p.it }); x += p.w + g; });
        y += H + gv;
      }
      return { placed: out, top: 0, h: y - gv };
    }
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
    // Rows, after 6a architects' home page: prints flow like words in centred
    // text, at most three to a row, each in one of five set widths whatever
    // its shape. A row lines its prints up along the bottom or (less often)
    // along the top. Rows lean toward the centre; neighbours in a row sit one
    // gap apart, the outer prints may float within the row, and some rows leave
    // open wall above them, so clusters never grow into one solid mass.
    // Edges that would land just off another edge are moved to meet it.
    function rows() {
      var order = items.slice();
      for (var i = order.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), tmp = order[i]; order[i] = order[j]; order[j] = tmp; }
      // 6a's widths as parts of the wall (262, 472, 678, 800, 1000 of 1513), the smallest 25% bigger
      var WS = narrow ? [0.6, 0.6, 1] : [0.216, 0.312, 0.448, 0.529, 0.661];
      var pick = function (r) {
        if (narrow) return WS[Math.floor(rand() * 3)];
        var p = rand(), t = r < 0.9 ? [0.4, 0.97, 1, 1] : r < 1.2 ? [0.3, 0.88, 0.99, 1] : [0.15, 0.68, 0.94, 0.99];
        for (var k = 0; k < 4; k++) if (p < t[k]) return WS[k];
        return WS[4];
      };
      order.forEach(function (it) { it.rw = W * pick(it.r); });
      var out = [], y = 0, q = 0, prevEdges = [], MAX = narrow ? 2 : 3, snapV = g * 2.5;
      while (q < order.length) {
        // open wall above some rows
        if (q && !narrow && rand() < 0.4) y += g * (3 + rand() * 6);
        var row = [], sum = 0, gaps = [];
        while (q < order.length && row.length < MAX) {
          var gap = row.length ? g : 0;   // neighbours in a row always one gap apart
          if (row.length && sum + gap + order[q].rw > W) break;
          if (row.length) gaps.push(gap);
          row.push(order[q]); sum += gap + order[q].rw; q++;
        }
        // lean toward the centre: a narrow row can drift further than a wide one
        var spare = W - sum, x0 = spare / 2 + (rand() - 0.5) * spare * 0.6;
        var edges = [], hMax = 0, x = 0;
        row.forEach(function (it, n) { if (n) x += gaps[n - 1]; edges.push(x, x + it.rw); x += it.rw; hMax = Math.max(hMax, it.rw / it.r); });
        var best = 0, bestD = Infinity;
        edges.forEach(function (e) {
          prevEdges.forEach(function (pe) {
            var d = pe - (x0 + e);
            if (Math.abs(d) > 0.5 && Math.abs(d) < g * 3 && Math.abs(d) < bestD && x0 + d >= 0 && x0 + d + sum <= W) { best = d; bestD = Math.abs(d); }
          });
        });
        x0 += best;
        prevEdges = edges.map(function (e) { return x0 + e; });
        var top = rand() < 0.35, x = x0, bot = 0;
        row.forEach(function (it, n) {
          var ih = it.rw / it.r, room = hMax - ih, yy = y + (top ? 0 : room);
          // an outer print may float within the row, unless that lands just off the line
          if (row.length > 1 && (n === 0 || n === row.length - 1) && rand() < 0.35) {
            var f = y + rand() * room;
            if (Math.abs(f - y) > snapV && Math.abs(f - (y + room)) > snapV) yy = f;
          }
          out.push({ x: x, y: yy, w: it.rw, ih: ih, it: it });
          bot = Math.max(bot, yy + ih);
          x += it.rw + (gaps[n] || 0);
        });
        y = bot + gv;
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
    var page = wall.closest('.page'), labels = document.querySelectorAll('.nav .nav-label');
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


  function initToTop() {
    var btn = document.querySelector('.to-top');
    if (!btn) return;
    var sc = document.querySelector('.scroller'), src = sc || window;
    var top = function () { return sc ? sc.scrollTop : (document.scrollingElement || document.documentElement).scrollTop; };
    src.addEventListener('scroll', function () { btn.classList.toggle('is-on', top() > innerHeight * 0.5); }, { passive: true });
    btn.addEventListener('click', function () { driftHold(2500); (sc || window).scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  // Copyright: vertical on the home page, horizontal beside the settings icon
  // on every other page. No movement between the two.
  function turnLegal() {
    var foot = document.querySelector('.site-footer');
    if (!foot) return;
    var flat = !document.querySelector('.home');
    foot.classList.add('no-anim');
    foot.classList.toggle('is-turned', flat);
    root.classList.toggle('legal-flat', flat);
  }

  /* Projects test page: lines from the J of the name to the end of the menu;
     tiles slide in along them from the right and settle, one after another. */
  function initPress() {
    var page = document.querySelector('.press-page');
    if (!page) return;
    var lines = page.querySelector('.press-lines'), press = page.querySelector('.press'), cards = press.querySelectorAll('.card');
    if (innerWidth <= 760 || !matchMedia('(hover: hover)').matches) { press.classList.add('is-set'); return; }
    var name = document.querySelector('.site-header a, .site-header'), labels = document.querySelectorAll('.nav .nav-label');
    var nr = name.getBoundingClientRect(), left = nr.left, right = innerWidth, top = nr.bottom, bottom = innerHeight;
    if (labels.length) {
      right = Math.max.apply(null, [].map.call(labels, function (l) { return l.getBoundingClientRect().right; }));
      bottom = labels[0].getBoundingClientRect().top - 24;
    }
    // first letter of the name: start the lines at its ink, not its box
    var rg = document.createRange(), txt = name.querySelector('.name, .logo') || name;
    var tn = (function f(n) { if (n.nodeType === 3 && n.textContent.trim()) return n; for (var i = 0; i < n.childNodes.length; i++) { var r = f(n.childNodes[i]); if (r) return r; } return null; })(txt);
    if (tn) { var k = tn.textContent.search(/\S/); rg.setStart(tn, k); rg.setEnd(tn, k + 1); left = rg.getBoundingClientRect().left; }
    var S = Math.round((innerHeight - 2 * (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gutter')) || 50)) * 0.3 * 0.62);
    S = Math.max(90, Math.min(S, (right - left) / 6));
    var gap = Math.max(6, S * 0.06), P = Math.round(S * 1.45);
    var n = Math.max(2, Math.floor((bottom - top - 24) / P)), y0 = top + (bottom - top - n * P) / 2;
    var perRow = Math.max(1, Math.floor((right - left + gap) / (S + gap)));
    lines.innerHTML = '';
    for (var i = 0; i <= n; i++) { var el = document.createElement('i'); el.style.cssText = 'left:' + left + 'px;width:' + (right - left) + 'px;top:' + Math.round(y0 + i * P) + 'px'; lines.appendChild(el); }
    press.style.setProperty('--tile', S + 'px');
    var fresh = !press.dataset.set;
    cards.forEach(function (c, j) {
      var row = Math.floor(j / perRow), col = j % perRow;
      c.style.left = (left + col * (S + gap)) + 'px';
      c.style.top = (y0 + (row + 1) * P - S - 1) + 'px';
    });
    press.classList.add('is-set');
    if (!fresh || !press.animate || matchMedia('(prefers-reduced-motion: reduce)').matches) { press.dataset.set = '1'; return; }
    press.dataset.set = '1';
    // every block travels the same way at the same pace, a beat apart, so
    // they never overlap on the way in
    cards.forEach(function (c, j) {
      var row = Math.floor(j / perRow), col = j % perRow;
      c.animate([{ transform: 'translateX(' + (innerWidth - left) + 'px)' }, { transform: 'translateX(0)' }],
        { duration: 3600, delay: row * 1100 + col * 220, easing: 'cubic-bezier(.12, .7, .2, 1)', fill: 'backwards' });
    });
  }
  addEventListener('resize', function () { var p = document.querySelector('.press'); if (p && p.dataset.set) initPress(); });

  function init() {
    initToTop();
    turnLegal();
    layoutWall();
    applyPhotos(); applyWall(); applyFrame();
    place();
    initSettings();
    initSlideshow();
    initFilmstrip();
    initSquares();
    initGrid2();
    initWallGlide();
    initPress();
    startDrift();
    document.querySelectorAll('.yr').forEach(function (e) { e.textContent = new Date().getFullYear(); });   // the year updates itself
    if (document.fonts) document.fonts.ready.then(function () { place(); layoutWall(); });
  }

  /* ---------- Image protection (deterrent; screenshots can't be blocked) ---------- */
  document.addEventListener('contextmenu', function (e) {
    if (e.target.closest && e.target.closest('img, .frame, .print, .cover, .zoom-lens')) e.preventDefault();
  });
  document.addEventListener('dragstart', function (e) { if (e.target.tagName === 'IMG') e.preventDefault(); });

  /* ---------- Work filmstrip: wheel and arrow keys move it sideways ---------- */
  // the filmstrip behaviour (wheel, drift, drag) runs only in the Filmstrip layouts
  function workView() { return root.dataset.work || 'squares'; }
  function strip() { var w = workView(); return w === '1a' || w === '1b' ? document.querySelector('.work-page .grid') : null; }
  // Work strip test sliders: gap in design px, up / down in % of tile height
  var WORK_DEFAULTS = { gap: 18, up: 20, down: 20 };
  function workSet() {
    var w = {}; try { w = JSON.parse(localStorage.getItem('jdm-strip') || '{}') || {}; } catch (e) {}
    var o = {}; for (var k in WORK_DEFAULTS) o[k] = w[k] != null ? w[k] : WORK_DEFAULTS[k];
    return o;
  }
  function applyWork() {
    var pg = document.querySelector('.work-page'); if (!pg || workView() !== '1b') return;
    var w = workSet();
    pg.style.setProperty('--tile-gap', 'max(' + (w.gap ? 2 : 0) + 'px, calc(' + w.gap + ' * var(--s)))');
    pg.style.setProperty('--up', w.up / 100);
    pg.style.setProperty('--down', w.down / 100);
  }
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
    easeBy(g, e.key === 'ArrowRight' ? step : -step);
  });

  /* Strip: runs from the first project to the last. On arrival it glides in
     slowly and settles at the start; any wheel, drag, key or touch takes over
     at once. Click and drag with the mouse to pan (a drag does not open the
     project). */
  var drag = null, dragMoved = false, glide = null;
  function stopGlide() { if (glide) { cancelAnimationFrame(glide); glide = null; } }
  ['wheel', 'keydown', 'touchstart'].forEach(function (t) {
    window.addEventListener(t, stopGlide, { passive: true, capture: true });
  });
  window.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.x;
    if (!dragMoved && Math.abs(dx) > 5) { dragMoved = true; stopGlide(); drag.g.classList.add('is-dragging'); }
    if (dragMoved) drag.g.scrollLeft = drag.left - dx;
  });
  window.addEventListener('pointerup', function () {
    if (!drag) return;
    drag.g.classList.remove('is-dragging'); drag = null;
  });
  // Desktop: over a tile that the window edge cuts off, the cursor becomes an
  // arrow and a click slides that tile fully into view. Tiles that are fully
  // in view always open their project.
  function stripDir(g) {
    if (!mouse.on) { delete g.dataset.dir; return; }
    var gr = g.getBoundingClientRect(), pad = Math.max(24, innerWidth * 50 / 1920), d = '', by = 0;
    [].some.call(g.querySelectorAll('.card'), function (c) {
      var r = c.getBoundingClientRect();
      if (mouse.x < r.left || mouse.x > r.right || mouse.y < r.top || mouse.y > r.bottom) return false;
      var cut = r.width * 0.15;   // a sliver off the edge still opens the project
      if (r.left < gr.left - cut) { d = 'prev'; by = r.left - gr.left - pad; }
      else if (r.right > gr.right + cut) { d = 'next'; by = r.right - gr.right + pad; }
      return true;
    });
    if (d) g.dataset.dir = d; else delete g.dataset.dir;
    g._cutBy = by;
  }
  /* Endless strip (Juan, 2026-11-26, after wschupfer.com/new-york): each tile
     gets a slightly different shape and sits a little higher or lower, at
     equal gaps along the strip. The set of projects is hung three times in a
     row; when the middle of the window passes into the first or last copy,
     the strip jumps by one set to the matching tile, so it never ends. */
  function endlessStrip(g) {
    var orig = [].slice.call(g.querySelectorAll('.card')), n = orig.length, prev = 0;
    if (n < 2) return;
    orig.forEach(function (c) {
      var ar = c.dataset.tall ? 0.68 + Math.random() * 0.1        // upright: 0.68 to 0.78
                              : 0.84 + Math.random() * 0.36;       // width/height 0.84 to 1.2
      // up or down by up to 20% of the tile height, mostly the other way from
      // the last one, by an uneven amount (Juan, 2026-11-26: more variation)
      var sign = Math.random() < 0.65 ? -Math.sign(prev || 1) : Math.sign(prev || 1);
      var amt = 0.075 + Math.pow(Math.random(), 0.8) * 0.925;     // share of the Up / Down slider
      prev = sign;
      c.style.setProperty('--ar', ar.toFixed(3));
      c.style.setProperty(sign < 0 ? '--u' : '--d', amt.toFixed(3));
    });
    for (var r = 0; r < 2; r++) orig.forEach(function (c) {
      var x = c.cloneNode(true);
      x.setAttribute('aria-hidden', 'true'); x.tabIndex = -1;
      g.appendChild(x);
    });
    g._n = n;
    var cards = g.querySelectorAll('.card');
    g._base = cards[n].getBoundingClientRect().left - cards[0].getBoundingClientRect().left;
    g.addEventListener('scroll', function () { wrapStrip(g); }, { passive: true });
  }
  function wrapStrip(g) {
    var n = g._n; if (!n) return;
    var c = g.querySelectorAll('.card'), gr = g.getBoundingClientRect(), mid = gr.left + gr.width / 2;
    var dir = mid < c[n].getBoundingClientRect().left ? 1 : mid > c[2 * n].getBoundingClientRect().left ? -1 : 0;
    if (!dir) return;
    // anchor: the tile nearest the middle; its twin one set along takes its place
    var a = 0, best = Infinity;
    c.forEach(function (el, i) { var r = el.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - mid); if (d < best) { best = d; a = i; } });
    var b = a + dir * n; if (b < 0 || b >= 3 * n) return;
    var leftA = c[a].getBoundingClientRect().left, ks = [];
    c.forEach(function (el) { ks.push(el._k || 1); });
    c.forEach(function (el, j) { var k = ks[j - dir * n]; k = k == null ? 1 : k; el._k = k; el.style.setProperty('--k', k.toFixed(4)); });
    var d = c[b].getBoundingClientRect().left - leftA, before = g.scrollLeft;
    g.scrollLeft = before + d; d = g.scrollLeft - before;
    g._base += d;
    if (drag && drag.g === g) drag.left += d;
    if (drift.el === g) { drift.pos += d; if (drift.ease) { drift.ease.from += d; drift.ease.to += d; } }
  }
  /* Squares (Juan, 2026-11-26, after Tyler Hobbs' index): square tiles with
     their titles under them, on four invisible horizontal lines between the
     name and the foot of the window, clear of the menu. Each row's squares are
     spaced at random (never closer than one gap); every tile drifts in from
     the left or right and fades up at the same speed, each at its own moment. */
  function initSquares() {
    var pg = document.querySelector('.work-page');
    if (!pg || workView() !== 'squares' || pg.dataset.sq) return;
    if (!matchMedia('(hover: hover) and (min-width: 761px)').matches) return;
    pg.dataset.sq = '1';
    var cards = [].slice.call(pg.querySelectorAll('.card'));
    // three rows (Juan, 2026-11-26); which squares share a row and how the
    // spare room in each row is split are drawn once per visit, so a resize
    // (or full screen) keeps the same arrangement, just re-measured
    var counts = [4, 3, 3].sort(function () { return Math.random() - .5; });
    while (counts.reduce(function (x, y) { return x + y; }) < cards.length) counts[counts.indexOf(Math.min.apply(null, counts))]++;
    var weights = counts.map(function (k) { var w = []; for (var j = 0; j <= k; j++) w.push(Math.random() + 0.15); return w; });
    pg._sq = { cards: cards, counts: counts, weights: weights };
    layoutSquares();
    pg.classList.add('is-squares');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // a short slide and a quicker fade, all in within about two seconds
    cards.forEach(function (c) {
      var from = (Math.random() < .5 ? -1 : 1) * (16 + Math.random() * 30), delay = 80 + Math.random() * 1300;
      c.animate([{ transform: 'translateX(' + from + 'px)' }, { transform: 'none' }],
        { duration: 1100, delay: delay, easing: 'cubic-bezier(.16, .7, .25, 1)', fill: 'backwards' });
      c.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 650, delay: delay, easing: 'ease-out', fill: 'backwards' });
    });
  }
  /* The squares live in one band (Juan's red box, 2026-11-26): from a little
     under the name down to about 73% of the window, edge to edge, above the
     menu. Squares are 30% larger than before, or as large as three rows allow. */
  function layoutSquares() {
    var pg = document.querySelector('.work-page.is-squares, .work-page[data-sq]');
    if (!pg || !pg._sq) return;
    var Q = pg._sq, s = innerWidth / 1920;
    var px = function (v) { var d = document.createElement('div'); d.style.cssText = 'position:absolute;visibility:hidden;width:' + v; document.body.appendChild(d); var w = d.getBoundingClientRect().width; d.remove(); return w; };
    var edge = px('var(--edge)'), gutter = px('var(--gutter)');
    var logo = document.querySelector('.site-header .logo');
    var top = (logo ? logo.getBoundingClientRect().bottom : 90) + Math.max(36, 64 * s);
    var bottom = innerHeight * 0.73;
    var left = edge, right = innerWidth - gutter;
    var gap = Math.max(18, 36 * s), cap = Math.max(16, 26 * s), rowGap = Math.max(10, 18 * s);
    var rows = Q.counts.length, rowH = (bottom - top) / rows, kmax = Math.max.apply(null, Q.counts);
    var S = Math.min(1.3 * Math.max(120, 174 * s), rowH - cap - rowGap, (right - left - (kmax - 1) * gap * 1.6) / kmax);
    pg.style.setProperty('--sq', S + 'px');
    var n = 0;
    Q.counts.forEach(function (k, r) {
      var row = Q.cards.slice(n, n + k), w = Q.weights[r], tot = w.reduce(function (x, y) { return x + y; });
      n += k;
      var free = right - left - k * S - (k - 1) * gap, x0 = left + free * w[0] / tot;
      row.forEach(function (c, j) {
        c.style.left = x0 + 'px';
        c.style.top = top + r * rowH + 'px';
        x0 += S + gap + free * w[j + 1] / tot;
      });
    });
  }
  addEventListener('resize', function () { clearTimeout(layoutSquares._t); layoutSquares._t = setTimeout(layoutSquares, 60); });
  /* Grid V2 (Juan, 2026-11-26, after 6a.co.uk): squares of a few sizes, in
     rows whose bottoms line up, each row shifted along the wall; the same gap
     as Grid V1 between squares and between rows. Sizes and shifts are drawn
     once per visit; a resize re-measures them. */
  var G2_SIZES = [0.14, 0.18, 0.22, 0.27];
  function initGrid2() {
    var g = document.querySelector('.work-page .grid');
    if (!g || workView() !== 'grid2' || g._g2) return;
    if (!matchMedia('(hover: hover) and (min-width: 761px)').matches) return;
    var cards = [].slice.call(g.querySelectorAll('.card'));
    g._g2 = { cards: cards, size: cards.map(function () { return G2_SIZES[Math.floor(Math.random() * G2_SIZES.length)]; }), shift: [] };
    layoutGrid2();
    g.classList.add('is-g2');
  }
  function layoutGrid2() {
    var g = document.querySelector('.work-page .grid'); if (!g || !g._g2) return;
    var Q = g._g2, W = g.clientWidth, gap = parseFloat(getComputedStyle(g).columnGap) || 16;
    var rows = [], row = [], w = 0;
    Q.cards.forEach(function (c, i) {
      var sz = Q.size[i] * W;
      if (row.length && (w + gap + sz > W || row.length >= 4)) { rows.push(row); row = []; w = 0; }
      row.push(i); w += (row.length > 1 ? gap : 0) + sz;
    });
    if (row.length) rows.push(row);
    var y = 0;
    rows.forEach(function (r, ri) {
      var rw = r.reduce(function (a, i) { return a + Q.size[i] * W; }, 0) + gap * (r.length - 1);
      var hmax = Math.max.apply(null, r.map(function (i) { return Q.size[i] * W; }));
      if (Q.shift[ri] == null) Q.shift[ri] = Math.random();
      var x = (W - rw) * Q.shift[ri];
      r.forEach(function (i) {
        var c = Q.cards[i], sz = Q.size[i] * W;
        c.style.width = sz + 'px'; c.style.left = x + 'px'; c.style.top = (y + hmax - sz) + 'px';
        x += sz + gap;
      });
      y += hmax + gap;
    });
    g.style.height = (y - gap) + 'px';
  }
  addEventListener('resize', function () { clearTimeout(layoutGrid2._t); layoutGrid2._t = setTimeout(layoutGrid2, 60); });
  function initFilmstrip() {
    var g = strip();
    if (!g || g.dataset.ready) return;
    g.dataset.ready = '1';
    g._base = 0;
    applyWork();
    if (workView() === '1b' && matchMedia('(hover: hover) and (min-width: 761px)').matches) endlessStrip(g);
    var card = g.querySelector('.card');
    var from = Math.min(g.scrollWidth - g.clientWidth - g._base, card ? card.offsetWidth * 0.9 : 500);
    g.scrollLeft = g._base;
    if (from > 0 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var t0 = null, dur = 4850;   // 30% slower than before (3400)
      g.scrollLeft = g._base + from;
      var step = function (t) {
        if (t0 === null) t0 = t;
        var k = Math.min(1, (t - t0) / dur), e = 0.5 - 0.5 * Math.cos(Math.PI * k);
        g.scrollLeft = g._base + from * (1 - e);
        glide = k < 1 ? requestAnimationFrame(step) : null;
      };
      stopGlide(); glide = requestAnimationFrame(step);
    }
    // Desktop: near either end of the strip the cursor becomes an arrow, and a
    // click there slides the strip one project that way instead of opening one.
    var stepW = function () { var c = g.querySelector('.card'); return c ? c.offsetWidth + parseFloat(getComputedStyle(g).columnGap || 0) : 300; };
    g.addEventListener('mousemove', function () { stripDir(g); });
    g.addEventListener('mouseleave', function () { delete g.dataset.dir; });
    g.addEventListener('click', function (e) {
      if (!g.dataset.dir || dragMoved || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      e.preventDefault(); e.stopPropagation();
      stopGlide();
      easeBy(g, g._cutBy || (g.dataset.dir === 'next' ? stepW() : -stepW()));
    }, true);
    g.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      drag = { g: g, x: e.clientX, left: g.scrollLeft }; dragMoved = false;
    });
    g.addEventListener('click', function (e) { if (dragMoved) { e.preventDefault(); e.stopPropagation(); dragMoved = false; } }, true);
    g.addEventListener('dragstart', function (e) { e.preventDefault(); });
  }

  /* Gallery: arrives with a slow glide up into place, like the Work strip, and
     the wheel moves it smoothly (a little drift after each turn of the wheel). */
  var wallTarget = null, wallRaf = null, wallSc = null, wallSet = null;
  function wallStop() { if (wallRaf) cancelAnimationFrame(wallRaf); wallRaf = null; wallTarget = null; }
  function wallScroller() {
    if (!document.querySelector('.prints') || innerWidth <= 700) return null;
    var sc = document.querySelector('.scroller');
    return sc && sc.scrollHeight > sc.clientHeight ? sc : null;
  }
  function wallRun(sc) {
    if (wallRaf) return;
    var tick = function () {
      // Stop when the page has changed, the target is reached, or the
      // scroller will not move any further (end of the wall, rounding).
      if (sc !== wallSc || !sc.isConnected) { wallStop(); return; }
      var d = wallTarget - sc.scrollTop;
      if (Math.abs(d) < 1) { sc.scrollTop = wallTarget; wallStop(); return; }
      var before = sc.scrollTop;
      sc.scrollTop += d > 0 ? Math.max(1, d * 0.12) : Math.min(-1, d * 0.12);
      wallSet = sc.scrollTop;
      if (sc.scrollTop === before) { wallStop(); return; }
      wallRaf = requestAnimationFrame(tick);
    };
    wallRaf = requestAnimationFrame(tick);
  }
  document.addEventListener('wheel', function (e) {
    var sc = wallScroller();
    if (!sc || e.ctrlKey || (e.target.closest && e.target.closest('.settings'))) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    e.preventDefault();
    if (sc !== wallSc) { wallStop(); wallSc = sc; }
    if (wallTarget === null || !wallRaf) wallTarget = sc.scrollTop;
    wallSet = sc.scrollTop;   // a scroll event still queued from before this wheel must not cancel it
    var max = sc.scrollHeight - sc.clientHeight;
    wallTarget = Math.max(0, Math.min(max, wallTarget + e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? sc.clientHeight : 1)));
    wallRun(sc);
  }, { passive: false });
  // Scrollbar, keys or a jump to the top take over from the wheel drift.
  document.addEventListener('scroll', function (e) {
    if (wallRaf && e.target === wallSc && Math.abs(wallSc.scrollTop - wallSet) > 2) wallStop();
  }, true);
  function initWallGlide() {
    var sc = wallScroller();
    if (!sc || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var from = Math.min(sc.scrollHeight - sc.clientHeight, innerHeight * 0.16), t0 = null, dur = 2600;
    if (from < 20) return;
    sc.scrollTop = from;
    var step = function (t) {
      if (t0 === null) t0 = t;
      var k = Math.min(1, (t - t0) / dur), ease = 0.5 - 0.5 * Math.cos(Math.PI * k);
      sc.scrollTop = from * (1 - ease);
      glide = k < 1 ? requestAnimationFrame(step) : null;
    };
    stopGlide(); glide = requestAnimationFrame(step);
  }

  /* ---------- Ambient motion on the Work strip and the Gallery wall ----------
     Both keep moving very slowly, all the time. Near an image the movement
     slows almost to a stop and picks up again as the cursor moves away. The
     wheel, a drag, the keys and the arrow clicks take over at once; the drift
     comes back gently a moment later. On the Work strip the tile nearest the
     cursor also grows (up to 1.3x) and pushes its neighbours aside. */
  var drift = { raf: null, el: null, pos: 0, dir: 1, hold: 0, ramp: 0, slow: 1, last: 0, down: false, ease: null };
  var mouse = { x: -1e4, y: -1e4, on: false };
  document.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; mouse.on = true; startDrift(); }, { passive: true });
  document.documentElement.addEventListener('mouseleave', function () { mouse.on = false; });
  function driftHold(ms) { drift.hold = Math.max(drift.hold, performance.now() + ms); drift.ramp = 0; }
  ['wheel', 'keydown', 'touchstart'].forEach(function (t) {
    window.addEventListener(t, function () { driftHold(1200); }, { passive: true, capture: true });
  });
  window.addEventListener('pointerdown', function () { drift.down = true; }, true);
  ['pointerup', 'pointercancel'].forEach(function (t) {
    window.addEventListener(t, function () { if (drift.down) { drift.down = false; driftHold(500); } }, true);
  });
  function easeBy(el, d) {
    var max = el.scrollWidth - el.clientWidth, from = el.scrollLeft;
    drift.ease = { el: el, from: from, to: Math.max(0, Math.min(max, from + d)), t0: performance.now(), dur: 750 };
    driftHold(900); startDrift();
  }
  function driftTarget() {
    var g = strip();
    if (g && matchMedia('(hover: hover) and (min-width: 761px)').matches) return { el: g, x: true, items: g.querySelectorAll('.card') };
    var sc = wallScroller();
    if (sc) return { el: sc, x: false, items: document.querySelectorAll('.prints .print') };
    return null;
  }
  function startDrift() {
    if (drift.raf || matchMedia('(prefers-reduced-motion: reduce)').matches || !driftTarget()) return;
    drift.last = 0; drift.raf = requestAnimationFrame(driftTick);
  }
  function magnify(T, dt) {
    var cards = T.items, el = T.el;
    if (!cards.length || (drag && dragMoved) || workView() === '1a') return 0;   // 1A: tiles keep their size
    var base = innerHeight, rects = [], change = false;
    cards.forEach(function (c, n) { c._k = c._k || 1; var r = c.getBoundingClientRect(); rects.push(r); if (!n) base = r.height / c._k; });
    var R = base * 1.1, ks = [];
    cards.forEach(function (c, n) {
      var r = rects[n], t = 1;
      if (mouse.on) {
        var dx = mouse.x - (r.left + r.width / 2), dy = Math.max(0, Math.abs(mouse.y - (r.top + r.height / 2)) - r.height / 2);
        var d = Math.sqrt(dx * dx + dy * dy * 2.25);
        if (d < R) t = 1 + 0.15 * (0.5 + 0.5 * Math.cos(Math.PI * d / R));
      }
      var k = c._k + (t - c._k) * Math.min(1, dt * 3);
      if (Math.abs(k - t) < 0.0005) k = t;
      if (k !== c._k) change = true;
      ks.push(k);
    });
    if (!change) return 0;
    // keep what is under the cursor (or the middle of the strip) where it is
    var er = el.getBoundingClientRect(), ref = mouse.on && mouse.x > er.left && mouse.x < er.right ? mouse.x : er.left + er.width / 2;
    var a = 0, best = Infinity;
    rects.forEach(function (r, n) { var d = ref < r.left ? r.left - ref : ref > r.right ? ref - r.right : 0; if (d < best) { best = d; a = n; } });
    var u = (ref - rects[a].left) / rects[a].width;
    cards.forEach(function (c, n) { c._k = ks[n]; c.style.setProperty('--k', ks[n].toFixed(4)); });
    var nr = cards[a].getBoundingClientRect(), delta = nr.left + u * nr.width - ref;
    if (glide) return 0;
    var before = el.scrollLeft; el.scrollLeft = before + delta;
    return el.scrollLeft - before;
  }
  function driftTick(t) {
    var T = driftTarget();
    if (!T) { drift.raf = null; drift.el = null; return; }
    var el = T.el, get = function () { return T.x ? el.scrollLeft : el.scrollTop; };
    var set = function (v) { if (T.x) el.scrollLeft = v; else el.scrollTop = v; };
    if (el !== drift.el) { drift.el = el; drift.pos = get(); drift.dir = 1; drift.ramp = 0; drift.ease = null; }
    var dt = drift.last ? Math.min(0.05, (t - drift.last) / 1000) : 0.016; drift.last = t;
    var max = T.x ? el.scrollWidth - el.clientWidth : el.scrollHeight - el.clientHeight;
    var prox = 0;
    if (mouse.on) T.items.forEach(function (it) {
      var r = it.getBoundingClientRect();
      var dx = Math.max(r.left - mouse.x, 0, mouse.x - r.right), dy = Math.max(r.top - mouse.y, 0, mouse.y - r.bottom);
      prox = Math.max(prox, 1 - Math.min(1, Math.sqrt(dx * dx + dy * dy) / 140));
    });
    var moved = T.x ? magnify(T, dt) : 0;
    if (T.x) stripDir(el);
    drift.pos += moved;
    var now = performance.now(), E = drift.ease;
    if (E && E.el === el) {
      E.from += moved; E.to += moved;
      var k = Math.min(1, (now - E.t0) / E.dur), e = 0.5 - 0.5 * Math.cos(Math.PI * k);
      set(E.from + (E.to - E.from) * e); drift.pos = get();
      if (k >= 1) drift.ease = null;
    } else if (glide || wallRaf || drift.down || drag || now < drift.hold) {
      drift.ease = null; drift.pos = get(); drift.ramp = 0;
    } else {
      if (Math.abs(get() - drift.pos) > 2) drift.pos = get();
      drift.ramp = Math.min(1, drift.ramp + dt / 2.5);
      drift.slow += ((1 - 0.95 * prox) - drift.slow) * Math.min(1, dt * 2.5);
      drift.pos += (T.x ? 7 : 10) * drift.slow * drift.ramp * drift.ramp * drift.dir * dt;
      if (T.x && el._n) drift.dir = 1;   // endless strip: no ends to turn at
      else if (drift.pos >= max) { drift.pos = max; drift.dir = -1; } else if (drift.pos <= 0) { drift.pos = 0; drift.dir = 1; }
      set(drift.pos);
    }
    drift.raf = requestAnimationFrame(driftTick);
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
