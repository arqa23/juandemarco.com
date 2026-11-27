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
      pick.querySelectorAll('button[data-hv]').forEach(function (b) { b.classList.toggle('is-on', (root.dataset.hang || PREF_DEFAULTS.hang) === b.dataset.hv); });
      pick.classList.toggle('on-gal', !!document.querySelector('.prints'));
      pick.classList.toggle('on-room', document.body.classList.contains('room'));
      pick.querySelectorAll('button[data-wv]').forEach(function (b) { b.classList.toggle('is-on', workView() === b.dataset.wv); });
      pick.querySelectorAll('button[data-tog]').forEach(function (b) { b.querySelector('span').textContent = val[b.dataset.tog]; });
      pick.classList.toggle('on-work', !!document.querySelector('.work-page'));
      // Design preview: Current / Editorial test, and whether this page has a test version
      var ed = !!root.dataset.design;
      pick.querySelectorAll('button[data-dv]').forEach(function (b) {
        var on = b.dataset.dv === (root.dataset.design || 'current');
        b.classList.toggle('is-on', on); b.setAttribute('aria-checked', String(on));
      });
      pick.classList.toggle('on-ed', document.body.classList.contains('has-ed'));
      pick.classList.toggle('is-ed', ed);
    };
    if (pick) {
      document.addEventListener('fullscreenchange', markPick);
      pick.addEventListener('click', function (e) {
        e.stopPropagation();
        var wv = e.target.closest('button[data-wv]');   // working mode: pick a Work layout
        if (wv) {
          try { localStorage.setItem('jdm-work', wv.dataset.wv); } catch (err) {}
          if (document.querySelector('.work-page')) location.reload(); else markPick();
          return;
        }
        var dv = e.target.closest('button[data-dv]');   // Design preview: Current / Editorial test
        if (dv) {
          var was = root.dataset.design || '', want = dv.dataset.dv === 'current' ? '' : dv.dataset.dv;
          if (want) root.dataset.design = want; else delete root.dataset.design;
          try { if (want) localStorage.setItem('jdm-design', want); else localStorage.removeItem('jdm-design'); } catch (err) {}
          markPick();
          if (was === want || !document.body.classList.contains('has-ed')) return;
          // Work: the moving Squares / Float start (or stop) with a fresh load, as the Layout list does
          if (document.querySelector('.work-page')) { location.reload(); return; }
          place(); initE2Work(); dispatchEvent(new Event('resize'));   // About's sketch re-measures itself
          return;
        }
        var hv = e.target.closest('button[data-hv]');   // working mode: pick a Gallery layout
        if (hv) {
          root.dataset.hang = hv.dataset.hv;
          try { localStorage.setItem('jdm-hang', hv.dataset.hv); } catch (err) {}
          layoutWall(); markPick(); return;
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
        try { sessionStorage.setItem('jdm-mode', m); localStorage.removeItem('jdm-mode'); localStorage.removeItem('jdm-wall'); } catch (err) {}
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
  var zoomOff = function () { return false; };
  function initZoom(show, current) {
    var btn = show.querySelector('.room-zoom'), frame = show.querySelector('.frame');
    if (!btn || !frame) return;
    var lens = document.createElement('div');
    lens.className = 'zoom-lens';
    frame.appendChild(lens);
    var set = function (on) {
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      frame.classList.toggle('zooming', on);
    };
    btn.addEventListener('click', function () { set(btn.getAttribute('aria-pressed') !== 'true'); });
    // a click on the image puts the magnifier away (Juan, 2026-11-27), and the
    // arrow cursor is back at once, ready for the next click to turn the image
    frame.addEventListener('click', function (e) {
      if (!frame.classList.contains('zooming')) return;
      e.stopImmediatePropagation(); e.preventDefault();
      set(false);
      if (show.querySelectorAll('.slide').length > 1) {
        var r = frame.getBoundingClientRect();
        frame.dataset.dir = e.clientX - r.left < r.width / 2 ? 'prev' : 'next';
      }
    }, true);
    zoomOff = function () { if (frame.isConnected && frame.classList.contains('zooming')) { set(false); return true; } return false; };
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
      return s;
    }
    var layout = show.closest('.room-layout'), frame = show.querySelector('.frame');
    function fit() {
      if (!layout || !slides[i].dataset.r) return;
      layout.style.setProperty('--ratio', slides[i].dataset.r);
      // ArtView2: each image as wide as the shared column, unless that would
      // make it taller than the band; then it fits the band's height instead,
      // centred in the column (the tall ones that break the rule)
      if (art2() && layout._aw) layout.style.setProperty('--fw', Math.floor(Math.min(layout._aw, layout._mh * +slides[i].dataset.r)) + 'px');
      else layout.style.removeProperty('--fw');
    }
    // ArtView2 (Juan, 2026-11-27): ONE image width for every project and every
    // Gallery series, so the text to the right sits in the same place on all
    // of them: the width a 16:9 image takes in the band from 8% to 91% of the
    // window height, or less if the window is narrow. Wide images fill it
    // (heights vary); images too tall for it shrink to the band's height and
    // sit centred. Only the count and magnifier follow the image's lower edge.
    // ArtView1 was retired 2026-11-27 (VERSIONS.md says how to bring it back).
    // (2026-11-26 ArtView2 set one width per series from its tallest image.)
    var STD_R = 16 / 9;
    function art2() { return !!layout && matchMedia('(min-width: 761px)').matches; }
    function sizeArt() {
      if (!layout) return;
      if (!art2()) { layout.style.removeProperty('--aw'); layout._aw = 0; fit(); return; }
      var cs = getComputedStyle(layout), gap = parseFloat(cs.columnGap) || 40;
      var txt = layout.querySelector('.room-text'), tw = txt ? txt.getBoundingClientRect().width : 0;
      var maxW = layout.clientWidth - 2 * (tw + gap), maxH = layout.clientHeight;
      layout._aw = Math.floor(Math.min(maxW, maxH * STD_R)); layout._mh = maxH;
      layout.style.setProperty('--aw', layout._aw + 'px');
      fit();
    }
    // the image is decoded and sized before it shows, then fades in
    function ready(s) { return s.decode ? s.decode().catch(function () {}) : Promise.resolve(); }
    var seq = 0;
    function go(k) {
      var n = (k + slides.length) % slides.length, my = ++seq, s = load(n);
      counter.textContent = n + 1;
      load(n + 1); load(n - 1);
      if (!art2()) {
        slides[i].classList.remove('is-on'); i = n; slides[i].classList.add('is-on'); fit();
        return;
      }
      frame.classList.add('is-out');
      Promise.all([ready(s), new Promise(function (r) { setTimeout(r, 200); })]).then(function () {
        if (my !== seq) return;
        slides[i].classList.remove('is-on'); i = n; slides[i].classList.add('is-on'); fit();
        requestAnimationFrame(function () { if (my === seq) frame.classList.remove('is-out'); });
      });
    }
    sizeArt();
    if (layout) {
      addEventListener('resize', function () { if (document.contains(layout)) sizeArt(); });
      ready(slides[0]).then(function () { layout.classList.add('is-sized'); });
    }
    initZoom(show, function () { return slides[i]; });
    load(1); load(-1);
    var start = parseInt(location.hash.slice(1), 10);
    if (start > 1 && start <= slides.length) { load(start - 1); go(start - 1); }
    // Desktop: the cursor shows the way (left half back, right half on) and a
    // click turns the image. Not only over the image: over the whole space any
    // image of the project can take (the shared column, the band's full
    // height), so a narrower or taller next image never drops the arrow
    // under a cursor that has not moved (Juan, 2026-11-27).
    if (frame && slides.length > 1) {
      var area = layout || frame;
      var dirAt = function (e) {
        if (frame.classList.contains('zooming')) return null;
        if (e.target.closest && e.target.closest('.room-text, .room-under, a, button')) return null;
        var fr = frame.getBoundingClientRect(), cx = fr.left + fr.width / 2;
        if (layout && art2() && layout._aw) {
          var lr = layout.getBoundingClientRect(), w = layout._aw / 2;
          if (e.clientX < cx - w || e.clientX > cx + w || e.clientY < lr.top || e.clientY > lr.bottom) return null;
        } else if (e.clientX < fr.left || e.clientX > fr.right || e.clientY < fr.top || e.clientY > fr.bottom) return null;
        return e.clientX < cx ? 'prev' : 'next';
      };
      area.addEventListener('mousemove', function (e) {
        var d = dirAt(e);
        if (d) area.dataset.dir = d; else delete area.dataset.dir;
        if (area !== frame) delete frame.dataset.dir;
      });
      area.addEventListener('mouseleave', function () { delete area.dataset.dir; delete frame.dataset.dir; });
      area.addEventListener('click', function (e) {
        var d = dirAt(e);
        if (d) go(i + (d === 'next' ? 1 : -1));
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
    var idx = hang === 'index' || hang === 'cluster';   // both: number + title under each print
    // Stream is saved but off (Juan, 2026-11-27): a stored choice falls back to Cluster
    var stream = false;
    if (hang === 'stream') { hang = 'cluster'; idx = true; }
    wall.classList.toggle('is-index', idx);
    wall.classList.toggle('is-stream', stream);
    if (idx) g = parseFloat(getComputedStyle(wall).columnGap) || 12;
    // Stream: the Cluster hang with more air, so the prints have room to drift
    if (stream) g = Math.max(36, 84 * W / 1400);
    stStop();
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
    var best = hang === 'cluster' || stream ? cluster() : hang === 'salon' ? salon() : hang === 'flow' ? rows() : hang === 'rows' ? even() : index();
    function numberPrints() {
      [].forEach.call(wall.querySelectorAll('.print'), function (a, n) {
        var c = a.querySelector('.print-cap'); if (c) c.dataset.no = '[' + (n + 1 < 10 ? '0' : '') + (n + 1) + ']';
      });
    }
    // Cluster (Juan, 2026-11-26): the Grid V2 way of packing on the Work page.
    // Prints keep the Index sizes (about a third of the wall wide, varying a
    // little with shape and per visit) and true shapes; the largest go first,
    // each to the free spot nearest the top centre of the wall, one gap from its
    // neighbours (its caption counts as part of it). No rows.
    function cluster() {
      numberPrints();
      var MAX = narrow ? 2 : 3, avail = W - g * (MAX - 1), cx = W / 2, cy = 0, placed = [];
      // the hang starts at the very top of the page, level with the name, and
      // flows around it (an invisible block keeps the name clear)
      var logo = document.querySelector('.site-header .logo'), scr = wall.closest('.scroller');
      if (logo && scr && !narrow) {
        var lr = logo.getBoundingClientRect(), wr = wall.getBoundingClientRect();
        var gw = lr.right - wr.left + g * 2, gh = lr.bottom - lr.top + g * 2;
        if (gw > 0) placed.push({ x: 0, y: 0, w: gw, h: gh, ghost: 1 });
      }
      var mean = 0; items.forEach(function (it) { mean += Math.pow(it.r, 0.75); }); mean = mean / items.length * 1.025;
      var dims = items.map(function (it) {
        var w = Math.min(avail * 0.4, avail / MAX * Math.pow(Math.pow(it.r, 0.75) / mean, 0.5) * (0.78 + rand() * 0.34));
        return { it: it, w: w, ih: w / it.r, h: w / it.r + capH, j: rand() };
      });
      // a few of the largest first, then the rest in a shuffled order, so big and
      // small mix all the way down instead of the big ones making one column
      dims.sort(function (p, q) { return q.w * q.h - p.w * p.h; });
      var head = dims.slice(0, 3), rest = dims.slice(3);
      for (var i = rest.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = rest[i]; rest[i] = rest[j]; rest[j] = t; }
      dims = head.concat(rest);
      var free = function (x, y, w, h) {
        if (x < -0.5 || x + w > W + 0.5 || y < -0.5) return false;
        for (var k = 0; k < placed.length; k++) {
          var P = placed[k];
          if (x < P.x + P.w + g - 0.5 && x + w > P.x - g + 0.5 && y < P.y + P.h + g - 0.5 && y + h > P.y - g + 0.5) return false;
        }
        return true;
      };
      var clamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };
      dims.forEach(function (d) {
        var w = d.w, h = d.h, best = null, bs = Infinity, cands = [];
        cands.push([cx - w / 2, 0]);
        placed.forEach(function (P) {
          var ys = [P.y, P.y + P.h - h, 0];
          var xs = [P.x, P.x + P.w - w, clamp(cx - w / 2, P.x - w + g, P.x + P.w - g), 0, W - w];
          ys.forEach(function (y) { cands.push([P.x + P.w + g, y], [P.x - g - w, y], [0, y], [W - w, y]); });
          xs.forEach(function (x) { cands.push([x, P.y + P.h + g], [x, P.y - g - h]); });
        });
        cands.forEach(function (c) {
          if (!free(c[0], c[1], w, h)) return;
          var dx = c[0] + w / 2 - cx, dy = (c[1] + h / 2 - cy) * 3, sc = dx * dx + dy * dy;   // hangs from the top centre
          if (sc < bs) { bs = sc; best = c; }
        });
        if (!best) best = [0, placed.reduce(function (m, P) { return Math.max(m, P.y + P.h + g); }, 0)];
        placed.push({ x: best[0], y: best[1], w: w, h: h, ih: d.ih, it: d.it });
      });
      // then everything is pulled together: each print in turn moves up as far
      // as it can, then sideways toward the middle, until nothing moves, so no
      // holes are left behind (Juan, 2026-11-26)
      var freeBut = function (P, x, y) {
        if (x < -0.5 || x + P.w > W + 0.5 || y < -0.5) return false;
        for (var k = 0; k < placed.length; k++) {
          var Q = placed[k]; if (Q === P) continue;
          if (x < Q.x + Q.w + g - 0.5 && x + P.w > Q.x - g + 0.5 && y < Q.y + Q.h + g - 0.5 && y + P.h > Q.y - g + 0.5) return false;
        }
        return true;
      };
      for (var pass = 0; pass < 8; pass++) {
        var moved = false;
        placed.sort(function (p, q) { return p.y - q.y; }).forEach(function (P) {
          if (P.ghost) return;
          var ys = [0]; placed.forEach(function (Q) { if (Q !== P) ys.push(Q.y + Q.h + g); });
          ys.sort(function (a, b) { return a - b; });
          for (var k = 0; k < ys.length && ys[k] < P.y - 0.5; k++) if (freeBut(P, P.x, ys[k])) { P.y = ys[k]; moved = true; break; }
          var xs = [cx - P.w / 2]; placed.forEach(function (Q) { if (Q !== P) xs.push(Q.x + Q.w + g, Q.x - g - P.w); });
          var d0 = Math.abs(P.x + P.w / 2 - cx), bx = null, bd = d0 - 1;
          xs.forEach(function (x) { var dd = Math.abs(x + P.w / 2 - cx); if (dd < bd && freeBut(P, x, P.y)) { bd = dd; bx = x; } });
          if (bx !== null) { P.x = bx; moved = true; }
        });
        if (!moved) break;
      }
      placed = placed.filter(function (P) { return !P.ghost; });
      var bot = Math.max.apply(null, placed.map(function (P) { return P.y + P.h; }));
      return { placed: placed, top: 0, h: bot };
    }
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
      var st = p.it.a.style; st.width = p.w + 'px'; st.left = p.x + 'px'; st.top = (p.y - best.top) + 'px'; st.transform = '';
      p.it.a._st = null;
    });
    // Height ends at the lowest image (captions hang below it). The page can
    // scroll only until that edge lines up with the bottom of "Contact".
    wall.style.height = best.h + 'px';
    wall.classList.add('is-hung');   // shown only once every print has its place
    if (stream) stStart(wall, best.placed.map(function (p) { return { a: p.it.a, x: p.x, y: p.y - best.top, w: p.w, h: p.ih || p.w / p.it.r }; }), best.h, W);
    setTimeout(drawMap, 0);
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
      // Cluster: the hang starts level with the top of the name (Juan, 2026-11-26)
      var lg = document.querySelector('.site-header .logo');
      var want = (hang === 'cluster' || stream) && lg ? lg.getBoundingClientRect().top : gapBelow;
      wall.style.marginTop = (want - topNow) + 'px';
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
    initWallGlide();
    initPress();
    startDrift();
    document.querySelectorAll('.yr').forEach(function (e) { e.textContent = new Date().getFullYear(); });   // the year updates itself
    initE2Work();
    var em = document.getElementById('email');   // Editorial test About: the same address
    if (em) document.querySelectorAll('.ed-email').forEach(function (a) { a.href = em.href; a.textContent = em.textContent; });
    if (document.fonts) document.fonts.ready.then(function () { place(); layoutWall(); });
  }

  /* ---------- Editorial v2, Work: the index ----------
     The project under the cursor (or keyboard focus) shows on the right.
     Images load the first time they are needed, then all quietly after. */
  function initE2Work() {
    var pg = document.querySelector('.e2-work');
    if (!pg || pg.dataset.ready || root.dataset.design !== 'edit2') return;
    pg.dataset.ready = '1';
    var imgs = pg.querySelectorAll('.e2w-view img'), links = pg.querySelectorAll('.e2w-list a');
    var load = function (im) { if (im.dataset.src) { im.src = im.dataset.src; im.removeAttribute('data-src'); } };
    var show = function (i) {
      load(imgs[i]);
      imgs.forEach(function (im, k) { im.classList.toggle('is-on', k === i); });
      links.forEach(function (a, k) { a.classList.toggle('is-on', k === i); });
    };
    links.forEach(function (a, i) {
      a.addEventListener('pointerenter', function () { show(i); });
      a.addEventListener('focus', function () { show(i); });
    });
    show(0);
    setTimeout(function () { imgs.forEach(load); }, 1500);
  }

  /* ---------- Image protection (deterrent; screenshots can't be blocked) ---------- */
  document.addEventListener('contextmenu', function (e) {
    if (e.target.closest && e.target.closest('img, .frame, .print, .cover, .zoom-lens')) e.preventDefault();
  });
  document.addEventListener('dragstart', function (e) { if (e.target.tagName === 'IMG') e.preventDefault(); });

  /* ---------- Work filmstrip: wheel and arrow keys move it sideways ---------- */
  // the filmstrip behaviour (wheel, drift, drag) runs only in the Filmstrip layouts
  function workView() { return root.dataset.work || 'squares'; }
  function strip() { return workView() === 'strip' ? document.querySelector('.work-page .grid') : null; }
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
  /* Work order: shuffled on every visit (Juan, 2026-11-27), keeping the pairs
     that must never sit side by side apart, the wrap of the endless strip
     included (Talbot / Parnell, Julius / Julius II, American Promise /
     Conflicted Icon). */
  var APART = [['talbot-road-residence', 'parnell-residence'], ['julius', 'julius-ii'], ['american-promise', 'the-conflicted-icon']];
  function slugOf(c) { var m = (c.getAttribute('href') || '').match(/\/work\/([^\/]+)\//); return m ? m[1] : ''; }
  function shuffleCards(parent) {
    var cards = [].slice.call(parent.querySelectorAll(':scope > .card'));
    if (cards.length < 3) return cards;
    var clash = function (x, y) { var a = slugOf(x), b = slugOf(y); return APART.some(function (p) { return (p[0] === a && p[1] === b) || (p[1] === a && p[0] === b); }); };
    var order = cards;
    for (var tries = 0; tries < 400; tries++) {
      order = cards.slice();
      for (var i = order.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = order[i]; order[i] = order[j]; order[j] = t; }
      var ok = true;
      for (var k = 0; k < order.length && ok; k++) if (clash(order[k], order[(k + 1) % order.length])) ok = false;
      if (ok) break;
    }
    order.forEach(function (c) { parent.appendChild(c); });
    return order;
  }
  /* Endless strip (as Strip 1B did, now for Strip): the set of projects is
     hung three times in a row; when the middle of the window passes into the
     first or last copy, the strip jumps by one set to the matching tile, so it
     never ends. */
  function endlessStrip(g) {
    var orig = [].slice.call(g.querySelectorAll('.card')), n = orig.length;
    if (n < 2) return;
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
  /* Squares (Juan, 2026-11-27, round 2): two straight rows of squares that
     wrap around the window like a map on a globe: whatever leaves one side
     comes in on the other at once (a square crossing an edge shows on both).
     The rows flow slowly to the left; each square drifts gently along its row
     and bounces off its neighbours. Grab a square to move it (it nudges the
     others), throw it and it eases back into the nearest row, even from above
     or below the band; grab the space between to pan, or use the wheel.
     Float (same day): the same squares with no rows and no flow, meandering
     anywhere on the screen and bouncing off its hard edges; the wheel does
     nothing there. In both, squares pass behind the name, menu and settings
     button, and in dark mode the part of those lying over a square turns to
     the light-mode ink so it stays readable. */
  var SQ = null;
  function initSquares() {
    var pg = document.querySelector('.work-page'), v = workView();
    if (SQ && !SQ.pg.isConnected) sqDrop();
    if (!pg || (v !== 'squares' && v !== 'float') || pg.dataset.sq) return;
    if (root.dataset.design) return;   // Editorial / Editorial v2: the Work page stands still
    if (!matchMedia('(hover: hover) and (min-width: 761px)').matches) return;
    pg.dataset.sq = '1';
    var grid = pg.querySelector('.grid'), cards = shuffleCards(grid);
    var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    SQ = { pg: pg, cards: cards, fl: v === 'float', off: 0, offV: 0, flowK: 1, still: still, t: [], grab: null, moved: false, last: 0 };
    sqMeasure();
    var Q = SQ;
    if (!Q.fl) {
      // two rows, squares spread evenly along each with a little jitter
      var lanes = [[], []];
      cards.forEach(function (c, i) { lanes[i % 2].push(i); });
      // Round 4 (Juan, 2026-11-27): each square moves on its own as in Float,
      // mostly along its row. On arrival the top row comes in from a little
      // above and the bottom row from a little below, at an angle, and they
      // settle into their rows as if caught by a current.
      lanes.forEach(function (ids, l) {
        var k = ids.length, step = Q.L / k, free = Math.max(0, step - Q.S - Q.gap), ph = Math.random() * step;
        ids.forEach(function (i, j) {
          var sp = (11 + Math.random() * 6) * Q.s, dir = Math.random() < .5 ? -1 : 1;
          var lift = still ? 0 : (l ? 1 : -1) * (60 + Math.random() * 110) * Q.s;
          Q.t[i] = { el: cards[i], lane: l, x: ph + j * step + (Math.random() - .5) * free * .8, y: Q.laneTop[l] + lift,
            vx: dir * sp * 1.6, vy: 0, rest: still ? 0 : sp, turn: 0, enter: !still };
        });
      });
    } else {
      // anywhere on the screen, not touching
      var ok = function (x, y) { return Q.t.every(function (q) { return !q || Math.abs(q.x - x) > Q.S + Q.gap || Math.abs(q.y - y) > Q.S + Q.cap + Q.gap; }); };
      cards.forEach(function (c, i) {
        var x, y, n = 0;
        do { x = 3 + Math.random() * (innerWidth - Q.S - 6); y = 3 + Math.random() * (innerHeight - Q.S - 6); } while (!ok(x, y) && ++n < 400);
        var sp = (11 + Math.random() * 6) * Q.s, a = Math.random() * 2 * Math.PI;   // a little livelier (round 3)
        Q.t[i] = { el: c, x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, rest: still ? 0 : sp, turn: 0 };
      });
    }
    Q.t.forEach(function (t) {
      t.el._sq = t;
      if (!Q.fl) {   // its twin, shown at the other side while it crosses an edge
        t.gh = t.el.cloneNode(true); t.gh.classList.add('sq-ghost'); t.gh.setAttribute('aria-hidden', 'true'); t.gh.tabIndex = -1;
        t.gh._sq = t; t.gh.style.visibility = 'hidden'; grid.appendChild(t.gh);
      }
    });
    sqInk();
    sqRender();
    pg.classList.add('is-squares');
    var t0 = performance.now();
    if (!still) cards.forEach(function (c) {
      var a = { duration: 900, delay: 80 + Math.random() * 1300, easing: 'ease-out', fill: 'backwards' };
      c._sq.born = t0 + a.delay;   // holds still, unseen, until its fade begins
      c.animate([{ opacity: 0 }, { opacity: 1 }], a);
      if (c._sq.gh) c._sq.gh.animate([{ opacity: 0 }, { opacity: 1 }], a);
    });
    // grab a square to move it, or (Squares) the space between to pan
    pg.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      var c = e.target.closest('.card'), t = c ? c._sq || null : null;
      if (!t && SQ.fl) return;
      SQ.grab = { t: t, x0: e.clientX, y0: e.clientY, px: e.clientX, py: e.clientY, pt: performance.now(), vx: 0, vy: 0 };
      SQ.moved = false;
      e.preventDefault();
    });
    pg.addEventListener('click', function (e) { if (SQ && SQ.moved) { e.preventDefault(); e.stopPropagation(); SQ.moved = false; } }, true);
    pg.addEventListener('dragstart', function (e) { e.preventDefault(); });
    requestAnimationFrame(sqTick);
  }
  // Text over the squares (Juan, 2026-11-27, round 3): the name, menu and
  // settings button take, over each square, whichever of the two inks (light
  // mode's dark ink, dark mode's light ink) contrasts most with the part of
  // that square lying under them, in both modes. Each square's image is read
  // once as a 12 x 12 grid of brightness; where it passes under a piece of
  // text, the cells under the text are averaged. The text itself is cut away
  // out over the squares (a twin cut round them shows it; the real text stays
  // in place, unseen, so it can still be clicked) and a twin in the chosen ink
  // shows over each square, so no edge of the other colour rims the letters.
  var SQ_INKS = [[0x24, 0x23, 0x21], [0xED, 0xE8, 0xDE]], SQ_G = 12;
  function sqLin(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function sqLum(rgb) { return 0.2126 * sqLin(rgb[0]) + 0.7152 * sqLin(rgb[1]) + 0.0722 * sqLin(rgb[2]); }
  var SQ_INK_L = SQ_INKS.map(sqLum);
  function sqRead(t) {   // the square's brightness grid, once its image is in
    if (t.lum || t.lumTry > 3) return t.lum;
    var img = t.el.querySelector('img');
    if (!img || !img.complete || !img.naturalWidth) return null;
    try {
      var cv = document.createElement('canvas'); cv.width = cv.height = SQ_G;
      var cx = cv.getContext('2d', { willReadFrequently: true }), w = img.naturalWidth, h = img.naturalHeight, m = Math.min(w, h);
      cx.drawImage(img, (w - m) / 2, (h - m) / 2, m, m, 0, 0, SQ_G, SQ_G);   // as the square shows it (cover, centred)
      var d = cx.getImageData(0, 0, SQ_G, SQ_G).data, g = [];
      for (var k = 0; k < SQ_G * SQ_G; k++) g.push(sqLum([d[k * 4], d[k * 4 + 1], d[k * 4 + 2]]));
      t.lum = g;
    } catch (e) { t.lumTry = (t.lumTry || 0) + 1; }
    return t.lum;
  }
  function sqInk() {
    root.classList.add('sq-on');
    // each piece of text is judged on its own: the name, each menu item, the button
    SQ.ink = [['.site-header', '.logo'], ['.nav', '.nav-label'], ['.settings-corner']].map(function (p) {
      var o = document.querySelector(p[0]); if (!o) return null;
      var pc = p[1] ? [].slice.call(o.querySelectorAll(p[1])) : [];
      return { o: o, pieces: pc.length ? pc : [o], pool: [], cp: 'inset(100%)', hold: new Map() };
    }).filter(Boolean);
  }
  function sqTwin(k) {
    var c = k.o.cloneNode(true);
    c.classList.add('sq-ink'); c.setAttribute('aria-hidden', 'true'); c.setAttribute('inert', '');
    c.removeAttribute('id'); c.querySelectorAll('[id]').forEach(function (n) { n.removeAttribute('id'); });
    c.style.clipPath = 'inset(100%)'; c.style.opacity = '';
    document.body.appendChild(c);
    return { c: c, cp: 'inset(100%)', ink: -1 };
  }
  // average brightness of square b's cells lying under rect p
  function sqUnder(b, p, S) {
    var g = sqRead(b[2]); if (!g) return 0.2;
    var x0 = Math.max(p.left, b[0]), x1 = Math.min(p.right, b[0] + S), y0 = Math.max(p.top, b[1]), y1 = Math.min(p.bottom, b[1] + S);
    if (x1 <= x0 || y1 <= y0) return null;
    var c0 = Math.max(0, Math.floor((x0 - b[0]) / S * SQ_G)), c1 = Math.min(SQ_G - 1, Math.floor((x1 - b[0]) / S * SQ_G - 1e-6));
    var r0 = Math.max(0, Math.floor((y0 - b[1]) / S * SQ_G)), r1 = Math.min(SQ_G - 1, Math.floor((y1 - b[1]) / S * SQ_G - 1e-6));
    var sum = 0, cnt = 0;
    for (var rr = r0; rr <= r1; rr++) for (var cc = c0; cc <= c1; cc++) { sum += g[rr * SQ_G + cc]; cnt++; }
    return cnt ? sum / cnt : 0.2;
  }
  function sqRect(x, y, w, h) { return 'M' + x.toFixed(1) + ' ' + y.toFixed(1) + 'h' + w.toFixed(1) + 'v' + h.toFixed(1) + 'h' + (-w).toFixed(1) + 'z'; }
  function sqInkDraw() {
    var Q = SQ, S = Q.S;
    var boxes = [];
    Q.t.forEach(function (t) {
      var x = sqScreenX(t);
      boxes.push([x, t.y, t]);
      if (!Q.fl && x + S > Q.L) boxes.push([x - Q.L, t.y, t]);
    });
    Q.ink.forEach(function (k) {
      var r = k.o.getBoundingClientRect(), holes = '', n = 0;
      // the pieces' bands: each piece owns the height down to halfway to the next
      var pr = k.pieces.map(function (el) { return el.getBoundingClientRect(); });
      var bands = pr.map(function (p, i) {
        var top = i ? (pr[i - 1].bottom + p.top) / 2 : r.top - 2000, bot = i < pr.length - 1 ? (p.bottom + pr[i + 1].top) / 2 : r.bottom + 2000;
        return [top, bot];
      });
      boxes.forEach(function (b) {
        if (b[0] > r.right || b[0] + S < r.left || b[1] > r.bottom || b[1] + S < r.top) return;
        holes += sqRect(b[0] - r.left, b[1] - r.top, S, S);
        var paths = ['', ''];
        pr.forEach(function (p, i) {
          var y0 = Math.max(b[1], bands[i][0]), y1 = Math.min(b[1] + S, bands[i][1]);
          if (y1 <= y0) return;
          var L = sqUnder(b, p, S); if (L == null) L = sqUnder(b, r, S); if (L == null) L = 0.2;
          var con = SQ_INK_L.map(function (li) { return (Math.max(li, L) + 0.05) / (Math.min(li, L) + 0.05); });
          var key = b[2].el, prev = k.hold.get(key) || {}, pick = con[1] > con[0] ? 1 : 0;
          if (prev[i] != null && con[prev[i]] * 1.25 > con[pick]) pick = prev[i];   // no flicker at the turn
          prev[i] = pick; k.hold.set(key, prev);
          paths[pick] += sqRect(b[0] - r.left, y0 - r.top, S, y1 - y0);
        });
        paths.forEach(function (d, ink) {
          if (!d) return;
          var tw = k.pool[n] || (k.pool[n] = sqTwin(k));
          if (tw.ink !== ink) {
            var c = SQ_INKS[ink].join(', ');
            tw.c.style.setProperty('--ink', 'rgb(' + c + ')');
            tw.c.style.setProperty('--ink-dim', 'rgba(' + c + ', .8)');
            tw.c.style.setProperty('--legal-ink', 'rgba(' + c + ', .85)');
            tw.ink = ink;
          }
          var cp = 'path("' + d + '")';
          if (tw.cp !== cp) { tw.c.style.clipPath = cp; tw.cp = cp; }
          n++;
        });
      });
      for (var j = n; j < k.pool.length; j++) if (k.pool[j].cp !== 'inset(100%)') { k.pool[j].c.style.clipPath = 'inset(100%)'; k.pool[j].cp = 'inset(100%)'; }
      // the text itself stays in place (and clickable) but unseen while a
      // square is under it; a twin cut round the squares shows it instead
      var ocp = holes ? 'path(evenodd, "M-4000 -4000H4000V4000H-4000Z' + holes + '")' : 'inset(100%)';
      if (k.cp !== ocp) {
        if (!k.base) k.base = sqTwin(k);
        k.base.c.style.clipPath = ocp; k.cp = ocp;
        k.o.style.opacity = holes ? '0' : '';
      }
    });
  }
  function sqDrop() {   // leaving the Work page: take the ink twins away
    if (SQ && SQ.ink) SQ.ink.forEach(function (k) { k.pool.forEach(function (p) { p.c.remove(); }); if (k.base) k.base.c.remove(); k.o.style.opacity = ''; });
    root.classList.remove('sq-on');
    SQ = null;
  }
  addEventListener('pointermove', function (e) {
    var G = SQ && SQ.grab; if (!G) return;
    if (!SQ.moved && Math.hypot(e.clientX - G.x0, e.clientY - G.y0) > 5) { SQ.moved = true; SQ.pg.classList.add('is-dragging'); if (G.t) G.t.el.classList.add('is-held'); }
    if (!SQ.moved) return;
    var now = performance.now(), dt = Math.max(0.008, (now - G.pt) / 1000);
    var mx = e.clientX - G.px, my = e.clientY - G.py;
    G.vx += (mx / dt - G.vx) * 0.35; G.vy += (my / dt - G.vy) * 0.35;
    G.px = e.clientX; G.py = e.clientY; G.pt = now;
    if (G.t) { G.t.x += mx; G.t.y += my; }
    else SQ.off -= mx;
  });
  addEventListener('pointerup', function () {
    var G = SQ && SQ.grab; if (!G) return;
    SQ.grab = null; SQ.pg.classList.remove('is-dragging');
    if (!SQ.moved) return;
    // gentler than before (Juan, 2026-11-27): a throw leaves at about a third
    // of the hand's speed, capped, and calms down within a second or so
    var cap = 380 * SQ.s, lim = function (v) { return Math.max(-cap, Math.min(cap, v)); };
    if (G.t) {
      var t = G.t;
      t.el.classList.remove('is-held');
      t.vx = lim(G.vx) * 0.5; t.vy = lim(G.vy) * 0.5; t.enter = false;
      if (!SQ.fl) {   // settles into the nearest row that has room
        var mid = t.y + SQ.S / 2, near = Math.abs(mid - (SQ.laneTop[0] + SQ.S / 2)) <= Math.abs(mid - (SQ.laneTop[1] + SQ.S / 2)) ? 0 : 1;
        var count = SQ.t.filter(function (q) { return q !== t && q.lane === near; }).length;
        if (count < SQ.room) t.lane = near;
      }
    } else SQ.offV = -lim(G.vx) * 0.5;   // a pan keeps going a little and eases off
  });
  addEventListener('wheel', function (e) {
    if (!SQ || SQ.fl || !SQ.pg.isConnected || e.ctrlKey || (e.target.closest && e.target.closest('.settings, .mode-pick'))) return;
    var cap = 1400 * SQ.s;
    SQ.offV = Math.max(-cap, Math.min(cap, SQ.offV + (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * (e.deltaMode === 1 ? 40 : 1) * 2.2));
  }, { passive: true });
  var SQ_PREV_SIZE = false;   // true = Squares before round 5 (smaller, rows 36 design px apart)
  function sqMeasure() {
    var Q = SQ, s = innerWidth / 1920, oldL = Q.L, oldH = Q.H;
    var logo = document.querySelector('.site-header .logo');
    var top = (logo ? logo.getBoundingClientRect().bottom : 90) + Math.max(36, 64 * s);
    var bottom = innerHeight * 0.78;
    var gap = Math.max(18, 36 * s), rowGap = Math.max(10, 18 * s);
    var t0 = Q.cards[0] && Q.cards[0].querySelector('.card-title');
    var lh = t0 ? parseFloat(getComputedStyle(t0).lineHeight) || parseFloat(getComputedStyle(t0).fontSize) * 1.4 : 14;
    var cap = Math.max(16, 26 * s) + lh, rowH = (bottom - top) / 2;
    // 15% bigger than round 1 (Juan): the rows now fill the band they used to
    // bob in, so the band's top and bottom edges stay where they were
    var S = Math.max(90, (rowH - cap - rowGap) * 0.86 * 1.15);
    var n = Math.ceil(Q.cards.length / 2), L = innerWidth;
    S = Math.min(S, L / n - gap * 1.2);   // a row must fit across the window, with room to move
    // Float (Juan, 2026-11-27, round 3): no titles under the squares (they
    // show on hover, as in Grid), squares 20% bigger, 3px apart at the closest
    // and 3px off the window's edges. Squares (round 4): same size as before,
    // no titles either, the same 3px; the two rows, from the top of the upper
    // squares to the foot of the lower ones, centred in the window.
    // Squares (round 5, Juan 2026-11-27): the same size as Float, and the
    // space between the two rows the same 3px as between squares. Previous
    // size (Squares at 1/1.2 of Float, rows 36 design px apart): set
    // SQ_PREV_SIZE = true to go back.
    if (Q.fl || !SQ_PREV_SIZE) S *= 1.2;
    cap = 0; gap = 3;
    rowGap = Q.fl || SQ_PREV_SIZE ? Math.max(18, 36 * s) : gap;
    var y0 = (innerHeight - (2 * S + rowGap)) / 2;
    Q.s = s; Q.S = S; Q.gap = gap; Q.rowGap = rowGap; Q.cap = cap; Q.L = L; Q.H = innerHeight;
    Q.room = Math.floor(L / (S + gap));
    Q.laneTop = [y0, y0 + S + rowGap];
    Q.pg.style.setProperty('--sq', S + 'px');
    if (oldL && Q.t.length) Q.t.forEach(function (t) {
      t.x *= L / oldL;
      if (Q.fl) t.y *= Q.H / oldH; else { t.y = Q.laneTop[t.lane]; t.enter = false; }
    });
  }
  addEventListener('resize', function () {
    if (!SQ || !SQ.pg.isConnected) return;
    clearTimeout(sqMeasure._t);
    sqMeasure._t = setTimeout(function () { sqMeasure(); sqRender(); }, 60);
  });
  function sqMod(v, L) { return ((v % L) + L) % L; }
  function sqScreenX(t) { return SQ.fl ? t.x : sqMod(t.x - SQ.off, SQ.L); }
  function sqRender() {
    var Q = SQ;
    Q.t.forEach(function (t) {
      var x = sqScreenX(t), y = t.y.toFixed(2);
      t.el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y + 'px,0)';
      if (t.gh) {
        var across = x + Q.S > Q.L;
        if (across) t.gh.style.transform = 'translate3d(' + (x - Q.L).toFixed(2) + 'px,' + y + 'px,0)';
        if (across !== !!t.ghOn) { t.gh.style.visibility = across ? 'visible' : 'hidden'; t.ghOn = across; }
      }
    });
    sqInkDraw();
  }
  function sqTick(now) {
    var Q = SQ;
    if (!Q) return;
    if (!Q.pg.isConnected || (workView() !== 'squares' && workView() !== 'float')) { sqDrop(); return; }
    var dt = Q.last ? Math.min(0.05, (now - Q.last) / 1000) : 0.016; Q.last = now;
    var held = Q.grab && Q.moved ? Q.grab.t : null, S = Q.S, L = Q.L, W = innerWidth, H = innerHeight;
    // the cursor resting on a square stills it (and the flow), so it can be clicked
    var hover = null;
    if (mouse.on && !Q.grab) Q.t.forEach(function (t) {
      var x = sqScreenX(t), inY = mouse.y >= t.y && mouse.y <= t.y + S + Q.cap;
      if (inY && ((mouse.x >= x && mouse.x <= x + S) || (!Q.fl && mouse.x >= x - L && mouse.x <= x - L + S))) hover = t;
    });
    if (!Q.fl) {   // Squares: no common current any more, only the wheel or a pan
      Q.off += Q.offV * dt;
      Q.offV *= Math.exp(-dt / 0.7);
    }
    var hv = 260 * Q.s, wob = Q.rowGap * 0.45;   // how hard a held square can shove; how far off its row a square wanders freely
    Q.t.forEach(function (t) {
      if (t === held) return;
      if (t.born && now < t.born) return;   // not in yet
      if (t === hover) { t.vx *= Math.exp(-dt * 5); t.vy *= Math.exp(-dt * 5); }
      else if (!Q.fl) {
        // Squares: along the row as Float moves (coasting down to its own
        // pace after a throw or a knock, softly), never to a stop
        var sp = Math.abs(t.vx), dir = t.vx < 0 ? -1 : 1, want;
        if (sp > t.rest) { var ex0 = sp - t.rest; want = t.rest + ex0 * Math.exp(-dt / (1.4 + 1.6 * Math.min(1, ex0 / (220 * Q.s)))); }
        else want = sp + (t.rest - sp) * Math.min(1, dt * 0.4);
        t.vx = dir * want;
        // across: it wanders a little, and is pulled back toward its row
        // when it strays (or arrives) past the space between the rows
        var dy = t.y - Q.laneTop[t.lane];
        if (t.enter) {
          t.vy += (-1.3 * dy - 2.0 * t.vy) * dt;   // drawn in, a slight overshoot, then settled
          if (Math.abs(dy) < wob * 0.5 && Math.abs(t.vy) < 6 * Q.s) t.enter = false;
        } else {
          var out = dy - Math.max(-wob, Math.min(wob, dy));
          t.vy += ((Math.random() - .5) * 14 * Q.s - 0.35 * dy - 2.2 * out - (out ? 1.6 : 0.5) * t.vy) * dt;
        }
      } else {
        // Float: meander, turning a little now and then, at its own slow pace
        t.turn += (Math.random() - .5) * dt * 1.2; t.turn *= Math.exp(-dt * .5);
        var c = Math.cos(t.turn * dt), si = Math.sin(t.turn * dt), vx = t.vx;
        t.vx = vx * c - t.vy * si; t.vy = vx * si + t.vy * c;
        // after a throw or a knock it coasts down to its pace over a few
        // seconds, softly at first (no sudden brake, round 3)
        var sp2 = Math.hypot(t.vx, t.vy), w2;
        if (sp2 > t.rest) { var ex = sp2 - t.rest; w2 = t.rest + ex * Math.exp(-dt / (1.4 + 1.6 * Math.min(1, ex / (220 * Q.s)))); }
        else w2 = sp2 + (t.rest - sp2) * Math.min(1, dt * 0.4);
        if (sp2 < 1e-3) { var a = Math.random() * 2 * Math.PI; t.vx = Math.cos(a) * 1e-3; t.vy = Math.sin(a) * 1e-3; sp2 = 1e-3; }
        t.vx *= w2 / sp2; t.vy *= w2 / sp2;
      }
      t.x += t.vx * dt; t.y += t.vy * dt;
      var e0 = 3, my = H - S - e0;   // top and foot of the window: bounce (both layouts)
      if (t.y < e0) { t.y = e0; t.vy = Math.abs(t.vy) * 0.8; } else if (t.y > my) { t.y = my; t.vy = -Math.abs(t.vy) * 0.8; }
      if (Q.fl) {   // Float: hard sides too (Squares wraps round instead)
        var mx = W - S - e0;
        if (t.x < e0) { t.x = e0; t.vx = Math.abs(t.vx) * 0.8; } else if (t.x > mx) { t.x = mx; t.vx = -Math.abs(t.vx) * 0.8; }
      }
    });
    // squares knock each other softly, one gap apart (Squares wraps around)
    var sx = S + Q.gap, sy = S + Q.gap;
    for (var i = 0; i < Q.t.length; i++) for (var j = i + 1; j < Q.t.length; j++) {
      var A = Q.t[i], B = Q.t[j];
      if ((A.born && now < A.born) || (B.born && now < B.born)) continue;
      var dx = Q.fl ? B.x - A.x : sqMod(B.x - A.x + L / 2, L) - L / 2, dy2 = B.y - A.y;
      var ox = sx - Math.abs(dx), oy = sy - Math.abs(dy2);
      if (ox <= 0 || oy <= 0) continue;
      var ax = ox < oy, nx = ax ? (dx < 0 ? -1 : 1) : 0, ny = ax ? 0 : (dy2 < 0 ? -1 : 1), o = ax ? ox : oy;
      var wa = A === held ? 0 : B === held ? 1 : 0.5, wb = 1 - wa;
      if (A === held) wb = 1;
      A.x -= nx * o * wa; A.y -= ny * o * wa; B.x += nx * o * wb; B.y += ny * o * wb;
      var gv = function (v) { return Math.max(-hv, Math.min(hv, v)); };
      var va = A === held ? gv(ax ? Q.grab.vx : Q.grab.vy) : (ax ? A.vx : A.vy), vb = B === held ? gv(ax ? Q.grab.vx : Q.grab.vy) : (ax ? B.vx : B.vy);
      if ((vb - va) * (ax ? nx : ny) >= 0) continue;   // already moving apart
      var na, nb;
      // a held square passes on a little more than its speed; free ones a soft knock
      if (A === held) { na = va; nb = va * 1.2; }
      else if (B === held) { nb = vb; na = vb * 1.2; }
      else { var mid = (va + vb) / 2; na = mid + (vb - mid) * 0.6; nb = mid + (va - mid) * 0.6; }
      if (ax) { A.vx = na; B.vx = nb; } else { A.vy = na; B.vy = nb; }
    }
    sqRender();
    requestAnimationFrame(sqTick);
  }
  function initFilmstrip() {
    var g = strip();
    if (!g || g.dataset.ready) return;
    g.dataset.ready = '1';
    g._base = 0;
    shuffleCards(g);
    if (matchMedia('(hover: hover) and (min-width: 761px)').matches) endlessStrip(g);
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

  /* ---------- Gallery, Stream (Juan, 2026-11-27) ----------
     Squares turned upright: the prints start from the Cluster hang, then each
     drifts on its own, mostly up and down, as the squares do on Work. Sideways
     each wanders a little and is pulled back toward its place in the wall's
     middle band; the top and foot of the wall are hard edges (they bounce, no
     wrapping round). Hover stills a print; grab one to move or throw it. The
     wheel scrolls the page as usual. */
  var ST = null;
  function stStop() { if (ST) { cancelAnimationFrame(ST.raf); ST = null; } }
  function stStart(wall, list, H, W) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var s = innerWidth / 1920;
    ST = { wall: wall, H: H, W: W, s: s, gap: Math.max(6, 10 * s), wob: Math.max(24, 60 * s), grab: null, moved: false, last: 0, mapN: 0 };
    ST.t = list.map(function (p) {
      var sp = (8 + Math.random() * 5) * s, dir = Math.random() < .5 ? -1 : 1, a = p.a;
      var t = { el: a, x: p.x, y: p.y, w: p.w, h: p.h, hx: p.x, vx: (Math.random() - .5) * sp * .5, vy: dir * sp, rest: sp, hov: false };
      a._st = t;
      a.style.left = '0px'; a.style.top = '0px';
      if (!a._stBound) {
        a._stBound = 1;
        a.addEventListener('pointerenter', function () { if (a._st) a._st.hov = true; });
        a.addEventListener('pointerleave', function () { if (a._st) a._st.hov = false; });
        a.addEventListener('pointerdown', function (e) {
          if (!a._st || !ST || e.pointerType !== 'mouse' || e.button !== 0) return;
          ST.grab = { t: a._st, x0: e.clientX, y0: e.clientY, px: e.clientX, py: e.clientY, pt: performance.now(), vx: 0, vy: 0 };
          ST.moved = false; e.preventDefault();
        });
        a.addEventListener('click', function (e) { if (ST && ST.moved) { e.preventDefault(); e.stopPropagation(); ST.moved = false; } }, true);
      }
      return t;
    });
    stRender();
    ST.raf = requestAnimationFrame(stTick);
  }
  addEventListener('pointermove', function (e) {
    var G = ST && ST.grab; if (!G) return;
    if (!ST.moved && Math.hypot(e.clientX - G.x0, e.clientY - G.y0) > 5) { ST.moved = true; ST.wall.classList.add('is-dragging'); G.t.el.classList.add('is-held'); }
    if (!ST.moved) return;
    var now = performance.now(), dt = Math.max(0.008, (now - G.pt) / 1000), mx = e.clientX - G.px, my = e.clientY - G.py;
    G.vx += (mx / dt - G.vx) * 0.35; G.vy += (my / dt - G.vy) * 0.35;
    G.px = e.clientX; G.py = e.clientY; G.pt = now;
    G.t.x += mx; G.t.y += my;
  });
  addEventListener('pointerup', function () {
    var G = ST && ST.grab; if (!G) return;
    ST.grab = null; ST.wall.classList.remove('is-dragging'); G.t.el.classList.remove('is-held');
    if (!ST.moved) return;
    var cap = 380 * ST.s, lim = function (v) { return Math.max(-cap, Math.min(cap, v)); };
    G.t.vx = lim(G.vx) * 0.5; G.t.vy = lim(G.vy) * 0.5;
  });
  function stRender() {
    ST.t.forEach(function (t) { t.el.style.transform = 'translate3d(' + t.x.toFixed(2) + 'px,' + t.y.toFixed(2) + 'px,0)'; });
    // the mini map follows, a few times a second
    if (++ST.mapN % 6) return;
    var map = document.querySelector('.wall-map'), k = map && map._k;
    if (!k) return;
    var is = map.querySelectorAll('.wall-map-in i');
    [].forEach.call(ST.wall.querySelectorAll('.print'), function (a, n) {
      if (!a._st || !is[n]) return;
      is[n].style.left = Math.round(a._st.x * k) + 'px'; is[n].style.top = Math.round(a._st.y * k) + 'px';
    });
  }
  function stTick(now) {
    var Q = ST;
    if (!Q) return;
    if (!Q.wall.isConnected) { ST = null; return; }
    var dt = Q.last ? Math.min(0.05, (now - Q.last) / 1000) : 0.016; Q.last = now;
    var held = Q.grab && Q.moved ? Q.grab.t : null, W = Q.W, H = Q.H, hv = 260 * Q.s;
    Q.t.forEach(function (t) {
      if (t === held) return;
      if (t.hov && !Q.grab) { t.vx *= Math.exp(-dt * 5); t.vy *= Math.exp(-dt * 5); }
      else {
        // up or down at its own slow pace, coasting down softly after a throw
        var sp = Math.abs(t.vy), dir = t.vy < 0 ? -1 : 1, want;
        if (sp > t.rest) { var ex = sp - t.rest; want = t.rest + ex * Math.exp(-dt / (1.4 + 1.6 * Math.min(1, ex / (220 * Q.s)))); }
        else want = sp + (t.rest - sp) * Math.min(1, dt * 0.4);
        t.vy = dir * want;
        // sideways: a little wandering, pulled back toward its place when it strays
        var dx = t.x - t.hx, out = dx - Math.max(-Q.wob, Math.min(Q.wob, dx));
        if (t.sx == null || Math.random() < dt * 0.25) t.sx = (Math.random() - .5) * 1.4 * t.rest;   // now and then a new sideways lean
        t.vx += ((t.sx - t.vx) * 0.6 - 0.12 * dx - 2.2 * out - (out ? 1.6 : 0) * t.vx) * dt;
      }
      t.x += t.vx * dt; t.y += t.vy * dt;
      // the top and foot of the wall: bounce; the sides keep it on the wall
      if (t.y < 0) { t.y = 0; t.vy = Math.abs(t.vy) * 0.8; } else if (t.y > H - t.h) { t.y = H - t.h; t.vy = -Math.abs(t.vy) * 0.8; }
      if (t.x < 0) { t.x = 0; t.vx = Math.abs(t.vx) * 0.8; } else if (t.x > W - t.w) { t.x = W - t.w; t.vx = -Math.abs(t.vx) * 0.8; }
    });
    var g = Q.gap;
    for (var i = 0; i < Q.t.length; i++) for (var j = i + 1; j < Q.t.length; j++) {
      var A = Q.t[i], B = Q.t[j];
      var dx = (B.x + B.w / 2) - (A.x + A.w / 2), dy = (B.y + B.h / 2) - (A.y + A.h / 2);
      var ox = (A.w + B.w) / 2 + g - Math.abs(dx), oy = (A.h + B.h) / 2 + g - Math.abs(dy);
      if (ox <= 0 || oy <= 0) continue;
      var ax = ox < oy, nx = ax ? (dx < 0 ? -1 : 1) : 0, ny = ax ? 0 : (dy < 0 ? -1 : 1), o = ax ? ox : oy;
      var wa = A === held ? 0 : B === held ? 1 : 0.5, wb = A === held ? 1 : 1 - wa;
      A.x -= nx * o * wa; A.y -= ny * o * wa; B.x += nx * o * wb; B.y += ny * o * wb;
      var gv = function (v) { return Math.max(-hv, Math.min(hv, v)); };
      var va = A === held ? gv(ax ? Q.grab.vx : Q.grab.vy) : (ax ? A.vx : A.vy), vb = B === held ? gv(ax ? Q.grab.vx : Q.grab.vy) : (ax ? B.vx : B.vy);
      if ((vb - va) * (ax ? nx : ny) >= 0) continue;
      var na, nb;
      if (A === held) { na = va; nb = va * 1.2; }
      else if (B === held) { nb = vb; na = vb * 1.2; }
      else { var mid = (va + vb) / 2; na = mid + (vb - mid) * 0.6; nb = mid + (va - mid) * 0.6; }
      if (ax) { A.vx = na; B.vx = nb; } else { A.vy = na; B.vy = nb; }
    }
    stRender();
    Q.raf = requestAnimationFrame(stTick);
  }

  /* Gallery: arrives with a slow glide up into place, like the Work strip, and
     the wheel moves it smoothly (a little drift after each turn of the wheel). */
  var wallTarget = null, wallRaf = null, wallSc = null, wallSet = null;
  function wallStop() { if (wallRaf) cancelAnimationFrame(wallRaf); wallRaf = null; wallTarget = null; }
  /* ---------- Gallery mini map (Juan, 2026-11-26) ----------
     A small diagram left of the menu: a tiny rectangle for every print on the
     wall and an empty box for the part of the wall on screen. Click or drag on
     it to go there. */
  // the map's look, chosen in working settings (Juan, 2026-11-27): rectangles
  // filled or outlined, in the text colour (default) or a colour of his choice
  function drawMap() {
    var wall = document.querySelector('.prints'), sc = document.querySelector('.scroller');
    var map = document.querySelector('.wall-map');
    if (!wall || !sc || !wall.classList.contains('is-hung') || !matchMedia('(hover: hover) and (min-width: 761px)').matches) { if (map) map.remove(); return; }
    if (!map) {
      map = document.createElement('div'); map.className = 'wall-map'; map.setAttribute('aria-hidden', 'true');
      map.innerHTML = '<div class="wall-map-in"></div><div class="wall-map-view"></div>';
      document.body.appendChild(map);
      var go = function (e) {
        var r = map.querySelector('.wall-map-in').getBoundingClientRect(), k = map._k || 1;
        sc.scrollTop = map._top + (e.clientY - r.top) / k - sc.clientHeight / 2;
      };
      var down = false;
      map.addEventListener('mousedown', function (e) { down = true; stopGlide && stopGlide(); go(e); e.preventDefault(); });
      addEventListener('mousemove', function (e) { if (down) go(e); });
      addEventListener('mouseup', function () { down = false; });
    }
    if (!sc._mapped) { sc._mapped = 1; sc.addEventListener('scroll', viewMap, { passive: true }); }
    // the box sits left of the menu, its foot on the menu's last line
    var labels = document.querySelectorAll('.nav .nav-label'), last = labels[labels.length - 1];
    // between the right edge of the wall and the menu
    var s = innerWidth / 1920, mh = Math.max(200, 300 * s);
    var navL = last ? Math.min.apply(null, [].map.call(labels, function (l) { return l.getBoundingClientRect().left; })) : innerWidth - 120;
    var ml = wall.getBoundingClientRect().right + Math.max(20, 40 * s), mw = Math.min(115 * s, navL - Math.max(16, 24 * s) - ml);
    if (mw < 40) { map.remove(); return; }
    var foot = last ? last.getBoundingClientRect().bottom : innerHeight - 40;
    var W = wall.offsetWidth, H = wall.offsetHeight, k = Math.min(mw / W, mh / H);
    // 30% smaller (Juan, 2026-11-27), shrunk toward the lower left corner of
    // where the map sat before
    var ox = (mw - W * k) / 2, oy = H * k;
    k *= 0.7;
    map.style.width = Math.round(W * k) + 'px'; map.style.height = Math.round(H * k) + 'px';
    map.style.left = Math.round(ml + ox) + 'px';
    map.style.top = Math.round(foot - mh + oy - H * k) + 'px';
    var inner = map.querySelector('.wall-map-in');
    inner.style.width = Math.round(W * k) + 'px'; inner.style.height = Math.round(H * k) + 'px';
    inner.innerHTML = [].map.call(wall.querySelectorAll('.print img'), function (img) {
      var a = img.closest('.print');
      var x = a._st ? a._st.x : a.offsetLeft, y = a._st ? a._st.y : a.offsetTop;
      return '<i style="left:' + Math.round(x * k) + 'px;top:' + Math.round(y * k) + 'px;width:' + Math.max(1, Math.round(img.offsetWidth * k)) + 'px;height:' + Math.max(1, Math.round(img.offsetHeight * k)) + 'px"></i>';
    }).join('');
    map._k = k;
    map._top = wall.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop;
    viewMap();
  }
  function viewMap() {
    var map = document.querySelector('.wall-map'), sc = document.querySelector('.scroller');
    if (!map || !sc) return;
    var inner = map.querySelector('.wall-map-in'), v = map.querySelector('.wall-map-view'), k = map._k;
    var y = (sc.scrollTop - map._top) * k, h = sc.clientHeight * k, ih = inner.offsetHeight;
    var top = Math.max(0, y), bot = Math.min(ih, y + h);
    // more room either side of the prints (Juan, 2026-11-27)
    var px = Math.round(Math.max(6, 10 * innerWidth / 1920)), py = 3;
    v.style.left = inner.offsetLeft - px + 'px'; v.style.width = inner.offsetWidth + 2 * px + 'px';
    v.style.top = Math.round(top - py) + 'px'; v.style.height = Math.round(Math.max(4, bot - top) + 2 * py) + 'px';
  }
  addEventListener('resize', function () { clearTimeout(drawMap._t); drawMap._t = setTimeout(drawMap, 120); });
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
    if (STILL_WALL) return;   // plain browser scrolling on the Gallery (Juan, 2026-11-27)
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
  // Gallery holds still (Juan, 2026-11-27): no arrival glide, no eased wheel,
  // no drift. Set to false to bring that motion back.
  var STILL_WALL = true;
  function initWallGlide() {
    if (STILL_WALL) return;
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
    // no ambient drift on the Gallery wall (Juan, 2026-11-27: no movement for now)
    return null;
  }
  function startDrift() {
    if (drift.raf || matchMedia('(prefers-reduced-motion: reduce)').matches || !driftTarget()) return;
    drift.last = 0; drift.raf = requestAnimationFrame(driftTick);
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
    var moved = 0;
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
    if (e.key === 'Escape' && document.body.classList.contains('room') && !zoomOff()) { var x = document.querySelector('.room-close'); if (x) x.click(); }
  });

  init();
})();
