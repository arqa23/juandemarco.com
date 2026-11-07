#!/usr/bin/env python3
"""Builds every page of juandemarco.com from one shared layout.

Edit the text and the PROJECTS list here, then run:  python3 tools/build.py
It writes index.html, about/, work/, work/project-N/ and contact/.
Thumbnails for the Work grid are made from images/ into images/thumbs/.
"""
import html, json, os, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
YEAR = "2026"

# Projects, in the order they appear on the Work page.
# image = the full-size picture in images/, shown on the project page and as the grid thumbnail.
PROJECTS = [
    {"slug": "project-1", "title": "Project 1", "image": "cover-01.webp"},
    {"slug": "project-2", "title": "Project 2", "image": "cover-02.webp"},
    {"slug": "project-3", "title": "Project 3", "image": "cover-03.webp"},
    {"slug": "project-4", "title": "Project 4", "image": "cover-04.webp"},
    {"slug": "project-5", "title": "Project 5", "image": "cover-05.webp"},
]

ABOUT = [
    "Juan De Marco makes images, objects and software. The work moves between drawing, "
    "color studies, digital tools and built form, guided by an interest in light, "
    "atmosphere and how space is perceived.",
    "He trained as an architect, with a Master of Architecture from Princeton University "
    "and a Bachelor of Architecture from the Illinois Institute of Technology, and has "
    "worked at Snøhetta, Reiser + Umemoto and FXCollaborative. He is a licensed architect.",
]

EMAIL_USER, EMAIL_DOMAIN = "juan", "juandemarco.com"

NAV = [("home", "Home", "/"), ("work", "Work", "/work/"),
       ("contact", "Contact", "/contact/"), ("about", "About", "/about/")]


def page(title, section, body, body_class="", head_extra=""):
    nav = "\n".join(
        f'      <a href="{href}"{" aria-current=\"page\"" if key == section else ""}>'
        f'<span class="nav-label">{label}</span><span class="nav-dot" aria-hidden="true"></span></a>'
        for key, label, href in NAV)
    full_title = "Juan De Marco" if section == "home" else f"{title} | Juan De Marco"
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{html.escape(full_title)}</title>
  <meta name="description" content="Juan De Marco">
  <link rel="preload" href="/fonts/jost-latin-300-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/style.css">
{head_extra}</head>
<body class="{body_class}">
{body}
  <header class="site-header">
    <a class="logo" href="/">JUAN DE MARCO</a>
  </header>

  <nav class="nav" aria-label="Main">
{nav}
  </nav>

  <footer class="site-footer">
    <span>&copy; {YEAR} Juan De Marco</span>
    <span>All Rights Reserved</span>
  </footer>
</body>
</html>
"""


HOME_HEAD = """  <script src="/images.js"></script>
  <script>
    // Pick one image at random before the page draws, so there is no flash.
    (function () {
      var list = window.COVER_IMAGES || [];
      if (!list.length) return;
      var pick = list[Math.floor(Math.random() * list.length)];
      window.COVER_PICK = pick;
      var l = document.createElement('link');
      l.rel = 'preload'; l.as = 'image'; l.href = pick;
      document.head.appendChild(l);
    })();
  </script>
"""

HOME_BODY = """  <img id="cover" class="cover" alt="" decoding="async" fetchpriority="high">
  <script>
    (function () {
      var img = document.getElementById('cover');
      if (!window.COVER_PICK) { img.remove(); return; }
      img.onload = function () { img.classList.add('loaded'); };
      img.src = window.COVER_PICK;
    })();
  </script>
"""


def write(rel, text):
    p = ROOT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")


def thumbs():
    from PIL import Image
    out = ROOT / "images" / "thumbs"
    out.mkdir(exist_ok=True)
    for pr in PROJECTS:
        src, dst = ROOT / "images" / pr["image"], out / pr["image"]
        if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
            continue
        im = Image.open(src).convert("RGB")
        im.thumbnail((1200, 1200), Image.LANCZOS)
        im.save(dst, "WEBP", quality=84, method=6)


def main():
    thumbs()
    write("index.html", page("Home", "home", HOME_BODY, "home", HOME_HEAD))

    cards = "\n".join(
        f'      <a class="card" href="/work/{p["slug"]}/">\n'
        f'        <img src="/images/thumbs/{p["image"]}" alt="{html.escape(p["title"])}" loading="lazy" decoding="async">\n'
        f'        <span class="card-title">{html.escape(p["title"])}</span>\n'
        f'      </a>' for p in PROJECTS)
    write("work/index.html", page("Work", "work",
        f'  <main class="page page-wide">\n    <h1>Work</h1>\n    <div class="grid">\n{cards}\n    </div>\n  </main>\n',
        "inner"))

    for i, p in enumerate(PROJECTS):
        prev_p, next_p = PROJECTS[i - 1], PROJECTS[(i + 1) % len(PROJECTS)]
        body = f"""  <main class="page page-wide project">
    <h1>{html.escape(p["title"])}</h1>
    <figure class="project-figure">
      <img src="/images/{p["image"]}" alt="{html.escape(p["title"])}" decoding="async">
    </figure>
    <div class="project-text">
      <p class="meta">Year &middot; Medium</p>
      <p>Description coming soon.</p>
    </div>
    <div class="pager">
      <a href="/work/{prev_p["slug"]}/">&larr; {html.escape(prev_p["title"])}</a>
      <a href="/work/">All work</a>
      <a href="/work/{next_p["slug"]}/">{html.escape(next_p["title"])} &rarr;</a>
    </div>
  </main>
"""
        write(f"work/{p['slug']}/index.html", page(p["title"], "work", body, "inner"))

    about = "\n".join(f"    <p>{html.escape(t)}</p>" for t in ABOUT)
    write("about/index.html", page("About", "about",
        f'  <main class="page">\n    <h1>About</h1>\n{about}\n  </main>\n', "inner"))

    contact = f"""  <main class="page">
    <h1>Contact</h1>
    <p>For commissions, collaborations and studio inquiries:</p>
    <p class="email"><a id="email" href="/contact/">{EMAIL_USER} [at] {EMAIL_DOMAIN}</a></p>
    <script>
      // Assemble the address in the browser so simple spam bots can't read it from the page.
      (function () {{
        var a = document.getElementById('email'), e = {json.dumps(EMAIL_USER)} + '@' + {json.dumps(EMAIL_DOMAIN)};
        a.href = 'mailto:' + e; a.textContent = e;
      }})();
    </script>
  </main>
"""
    write("contact/index.html", page("Contact", "contact", contact, "inner"))
    print("built", 4 + len(PROJECTS), "pages")


if __name__ == "__main__":
    main()
