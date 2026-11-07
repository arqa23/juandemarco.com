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
    if (e.key === 'ArrowRight') go(i + 1);
    if (e.key === 'ArrowLeft') go(i - 1);
  });
  if (slides.length < 2) show.classList.add('single');
})();
