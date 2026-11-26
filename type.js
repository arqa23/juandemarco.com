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
  window.jdmType = { FONTS: FONTS, DEFAULTS: DEFAULTS, load: load, apply: apply, save: save };
  // Settings switched off (data-settings="off" on <html>): defaults only.
  var off = document.documentElement.getAttribute('data-settings') === 'off';
  apply(off ? DEFAULTS : load());
  try {
    var d = document.documentElement.dataset;
    d.theme = 'light';
    d.mode = 'dark';   // the site's default mode (Juan, 2026-11-25)
    if (off) return;
    ['colour', 'mat', 'photos', 'wall', 'mode', 'grad', 'ptitle', 'tiles', 'frame'].forEach(function (k) {
      var v = localStorage.getItem('jdm-' + k);
      if (v) d[k] = v;
    });
  } catch (e) { document.documentElement.dataset.theme = 'light'; }
})();
