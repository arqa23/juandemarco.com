// Text-style test (Settings). Loaded in <head> so saved choices apply before
// the page paints. Six styles: name, title, text, label, caption, menu. Temporary, for
// choosing the type with Juan; delete with the Settings panel when done.
(function () {
  var FONTS = {
    jost: '"Jost"', inter: '"inter"', instrument: '"instrument-sans"', geist: '"geist-sans"',
    host: '"host-grotesk"', franklin: '"libre-franklin"', albert: '"albert-sans"'
  };
  // Defaults: Juan's chosen settings (2026-11-25).
  var DEFAULTS = {
    name:  { font: 'jost', w: 500, size: 100, track: 0.42, 'case': 'uppercase' },
    title: { font: 'jost', w: 300, size: 100, track: 0.2,  'case': 'uppercase' },
    text:  { font: 'jost', w: 300, size: 100, track: 0,    'case': 'none' },
    label: { font: 'jost', w: 400, size: 100, track: 0.2,  'case': 'uppercase' },
    // Print captions on the Prints wall: own size, 30% smaller than the labels
    caption: { font: 'jost', w: 400, size: 70, track: 0.2,  'case': 'uppercase' },
    // The menu (bottom right): 100% = the size of the email on the About page
    menu:    { font: 'jost', w: 300, size: 60,  track: 0.2,  'case': 'uppercase' }
  };
  function load() {
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem('jdm-type') || '{}') || {}; } catch (e) {}
    var out = {};
    for (var s in DEFAULTS) {
      out[s] = {};
      for (var k in DEFAULTS[s]) out[s][k] = (saved[s] && saved[s][k] != null) ? saved[s][k] : DEFAULTS[s][k];
    }
    return out;
  }
  function apply(T) {
    var st = document.documentElement.style;
    for (var s in T) {
      var o = T[s];
      st.setProperty('--' + s + '-font', (FONTS[o.font] || FONTS.jost) + ', "Helvetica Neue", Arial, sans-serif');
      st.setProperty('--' + s + '-w', o.w);
      st.setProperty('--' + s + '-scale', o.size / 100);
      st.setProperty('--' + s + '-track', o.track + 'em');
      st.setProperty('--' + s + '-case', o['case']);
    }
  }
  function save(T) { try { localStorage.setItem('jdm-type', JSON.stringify(T)); } catch (e) {} }
  // Views per page. '' = the page's original layout ("Current").
  var VIEWS = {
    // Work = Editorial, About = Editorial v2, for good (Juan, 2026-11-27); their
    // other views are saved (VERSIONS.md): put them back in "ok" to choose again
    work:    { def: 'edit',  ok: [] },
    about:   { def: 'edit2', ok: [] },
    gallery: { def: 'exh',   ok: [] }      // Current (Index / Cluster) stays the Gallery default
  };
  window.jdmPageOf = function (path) {
    return { '/work/': 'work', '/about/': 'about', '/prints/': 'gallery' }[String(path).replace(/index\.html$/, '')] || '';
  };
  window.jdmDesign = function (pg) {
    if (!VIEWS[pg]) return '';
    var v = null;
    try { v = localStorage.getItem('jdm-view-' + pg); } catch (e) {}
    if (v === 'current') return '';
    return VIEWS[pg].ok.indexOf(v) >= 0 ? v : VIEWS[pg].def;
  };
  window.jdmType = { FONTS: FONTS, DEFAULTS: DEFAULTS, load: load, apply: apply, save: save };
  // Settings switched off (data-settings="off" on <html>): defaults only.
  var off = document.documentElement.getAttribute('data-settings') === 'off';
  apply(off ? DEFAULTS : load());
  try {
    var d = document.documentElement.dataset;
    d.theme = 'light';
    d.mode = 'dark';   // the site's default mode (Juan, 2026-11-25)
    d.ptext = 'off';
    // Work page layout (Juan, 2026-11-27): squares | float | grid | strip
    d.work = 'squares';   // Grid and Strip switched off (Juan, 2026-11-27)
    d.art = '2';          // project / print pages: ArtView2 only (Juan, 2026-11-27); ArtView1 retired, see VERSIONS.md
    // Page views (Juan, 2026-11-27): each of Work, About and Gallery has its own
    // "View" choice in the settings box, kept in this browser (jdm-view-<page>).
    // Set here, before the page paints, so the wrong view never flashes.
    var dz = window.jdmDesign(window.jdmPageOf(location.pathname)); if (dz) d.design = dz;
    if (off) return;
    // project text: off for good (Juan, 2026-11-26); the Text option is gone
    // dark mode on every new visit (Juan, 2026-11-26): a switch to light lasts
    // only for this visit (sessionStorage)
    if (localStorage.getItem('jdm-aframe') === 'on') d.aframe = 'on';   // About drawing on its paper
    var sm = sessionStorage.getItem('jdm-mode'); if (sm === 'light' || sm === 'dark') d.mode = sm;
    // public settings (build.py SETTINGS_MODE): frames always on, no Framed option
    var keys = document.documentElement.getAttribute('data-public') ? ['work', 'hang'] : ['frame', 'work', 'hang'];
    keys.forEach(function (k) {
      var v = localStorage.getItem('jdm-' + k);
      // old names (2026-11-26): Squares 2 rows, Strip 1A; retired layouts fall back
      if (k === 'work') v = { squares2: 'squares', '1a': 'strip', squares: 'squares', float: 'float' }[v] || null;   // grid / strip: saved, switched off (2026-11-27)
      if (k === 'hang') v = { index: 'index', cluster: 'cluster', stream: 'cluster' }[v] || null;   // stream: saved, switched off (2026-11-27)
      if (v) d[k] = v;
    });
  } catch (e) { document.documentElement.dataset.theme = 'light'; }
})();
