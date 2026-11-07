(function () {
  // Text pages (About, Contact, Login): the text block's bottom edge lines up
  // with the bottom of the last menu label (LOGIN).
  function place() {
    var labels = document.querySelectorAll('.nav .nav-label');
    if (!labels.length) return;
    var bottom = labels[labels.length - 1].getBoundingClientRect().bottom;
    document.documentElement.style.setProperty('--nav-bottom', bottom + 'px');
  }
  place();
  window.addEventListener('resize', place);
  if (document.fonts) document.fonts.ready.then(place);

  // Settings: light / dark mode and full screen
  var btn = document.querySelector('.settings-btn');
  var panel = document.getElementById('settings');
  function mark() {
    var t = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    panel.querySelectorAll('[data-theme-set]').forEach(function (b) {
      b.classList.toggle('is-on', b.dataset.themeSet === t);
    });
    var fs = panel.querySelector('[data-fullscreen]');
    if (fs) fs.textContent = document.fullscreenElement ? 'Exit full screen' : 'Full screen';
  }
  if (btn && panel) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      panel.hidden = !panel.hidden;
      btn.setAttribute('aria-expanded', String(!panel.hidden));
      btn.classList.toggle('is-open', !panel.hidden);
      mark();
    });
    panel.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', function () {
      if (!panel.hidden) { panel.hidden = true; btn.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); }
    });
    panel.querySelectorAll('[data-theme-set]').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = b.dataset.themeSet;
        if (t === 'light') document.documentElement.dataset.theme = 'light';
        else delete document.documentElement.dataset.theme;
        try { localStorage.setItem('jdm-theme', t); } catch (err) {}
        mark();
      });
    });
    var fsb = panel.querySelector('[data-fullscreen]');
    if (fsb && document.documentElement.requestFullscreen) {
      fsb.addEventListener('click', function () {
        if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen();
      });
      document.addEventListener('fullscreenchange', mark);
    } else if (fsb) { fsb.parentNode.hidden = true; }
  }

  // Project slideshow: one fixed frame, < > to step through the images.
  var show = document.querySelector('.slideshow');
  if (!show) return;
  var slides = show.querySelectorAll('.slide');
  var counter = show.querySelector('.slide-i');
  var i = 0;
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
  document.addEventListener('keydown', function (e) {
    if (e.target.closest && e.target.closest('input, textarea')) return;
    if (e.key === 'ArrowRight') go(i + 1);
    if (e.key === 'ArrowLeft') go(i - 1);
  });
  if (slides.length < 2) show.classList.add('single');
})();
