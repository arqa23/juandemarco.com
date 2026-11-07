// Text pages (About, Contact, Login): place the text block so its bottom edge
// lines up with the top of the first menu label (HOME).
(function () {
  function place() {
    var first = document.querySelector('.nav .nav-label');
    if (!first) return;
    var top = first.getBoundingClientRect().top;
    document.documentElement.style.setProperty('--nav-top', top + 'px');
  }
  place();
  window.addEventListener('resize', place);
  if (document.fonts) document.fonts.ready.then(place);
})();
