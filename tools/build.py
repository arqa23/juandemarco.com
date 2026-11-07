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
# Each project's images live in images/work/<slug>/ as 01.webp, 02.webp, ...
# shown in that order on its page; the first one is the grid thumbnail.
PROJECTS = [
    {"slug": "julius-ii", "title": "Julius II"},
    {"slug": "parnell-residence", "title": "Parnell Residence"},
    {"slug": "talbot-road-residence", "title": "Talbot Road Residence"},
    {"slug": "julius", "title": "Julius"},
    {"slug": "american-promise", "title": "American Promise"},
    {"slug": "the-conflicted-icon", "title": "The Conflicted Icon"},
    {"slug": "march-of-the-silhouettes", "title": "March of the Silhouettes"},
    {"slug": "wedges", "title": "Wedges"},
    {"slug": "frankls-purposive-intention", "title": "Frankl\u2019s Purposive Intention"},
    {"slug": "soma", "title": "SOMA"},
]
# Optional text per project: add "meta" (e.g. "2024 · Pigment print") and
# "text" (a list of paragraphs) to any entry above. Placeholders show until then.
# Optional crop per image: "focus": {"03.webp": "50% 30%"} (left/right %, top/bottom %).


FIT = json.loads((ROOT / "images" / "work" / "fit.json").read_text()) if (ROOT / "images" / "work" / "fit.json").exists() else {}


def project_images(slug):
    return sorted(f.name for f in (ROOT / "images" / "work" / slug).glob("[0-9]*.webp"))


ABOUT = [
    "Juan De Marco makes images, objects and software. The work moves between drawing, "
    "color studies, digital tools and built form, guided by an interest in light, "
    "atmosphere and how space is perceived.",
    "He trained as an architect, with a Master of Architecture from Princeton University "
    "and a Bachelor of Architecture from the Illinois Institute of Technology, and has "
    "worked at Snøhetta, Reiser + Umemoto and FXCollaborative. He is a licensed architect.",
]

# Where the About / Contact / Login text sits on desktop:
#   "top"    = under the name (current)
#   "bottom" = text block's bottom edge lines up with the bottom of the menu
TEXT_POSITION = "top"

EMAIL_USER, EMAIL_DOMAIN = "juan", "juandemarco.com"

NAV = [("home", "Home", "/"), ("work", "Work", "/work/"),
       ("contact", "Contact", "/contact/"), ("about", "About", "/about/"),
       ("login", "Login", "/login/")]


def page(title, section, body, body_class="", head_extra=""):
    nav = "\n".join(
        f'      <a href="{href}"{" aria-current=\"page\"" if key == section else ""}>'
        f'<span class="nav-label">{label}</span><span class="nav-dot" aria-hidden="true"></span></a>'
        for key, label, href in NAV)
    full_title = "Juan De Marco" if section == "home" else f"{title} | Juan De Marco"
    if "inner" in body_class:
        # Inner pages scroll inside their own box, so the fixed name, menu and
        # copyright never move when a scroll bar appears.
        cover = HOME_BODY if "photo" in body_class else ""
        body = f'{cover}  <div class="scroller">\n{body}  </div>\n'
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{html.escape(full_title)}</title>
  <meta name="description" content="Juan De Marco">
  <link rel="preload" href="/fonts/jost-latin-300-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/style.css?v={ASSET_V}">
  <script>try{{if(localStorage.getItem('jdm-theme')==='light')document.documentElement.dataset.theme='light'}}catch(e){{}}</script>
  <script src="/images.js?v={ASSET_V}"></script>
  <script src="/site.js?v={ASSET_V}" defer></script>
{head_extra}</head>
<body class="{body_class}">
{body}
  <header class="site-header">
    <a class="logo" href="/">JUAN DE MARCO</a>
  </header>

  <nav class="nav" aria-label="Main">
{nav}
      <button class="settings-btn" type="button" aria-expanded="false" aria-controls="settings"><span class="nav-label">Settings</span><span class="nav-dot" aria-hidden="true"></span></button>
  </nav>

  <div class="settings" id="settings" hidden>
    <div class="settings-row">
      <span class="settings-label">Mode</span>
      <button type="button" data-theme-set="dark">Dark</button>
      <button type="button" data-theme-set="light">Light</button>
    </div>
    <div class="settings-row">
      <span class="settings-label">Screen</span>
      <button type="button" data-fullscreen>Full screen</button>
    </div>
  </div>

  <footer class="site-footer">
    <span>&copy; {YEAR} Juan De Marco</span>
    <span>All Rights Reserved</span>
  </footer>
</body>
</html>
"""


HOME_BODY = """  <img id="cover" class="cover" alt="" decoding="async" fetchpriority="high">
  <script>
    // Pick one cover image at random on every visit.
    (function () {
      var img = document.getElementById('cover'), list = window.COVER_IMAGES || [];
      if (!list.length) { img.remove(); return; }
      img.onload = function () { img.classList.add('loaded'); };
      img.src = list[Math.floor(Math.random() * list.length)];
    })();
  </script>
"""


def write(rel, text):
    p = ROOT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")


def thumbs():
    from PIL import Image
    for pr in PROJECTS:
        folder = ROOT / "images" / "work" / pr["slug"]
        src, dst = folder / project_images(pr["slug"])[0], folder / "thumb.webp"
        if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
            continue
        im = Image.open(src).convert("RGB")
        im.thumbnail((1200, 1200), Image.LANCZOS)
        im.save(dst, "WEBP", quality=84, method=6)


def img_tag(path, alt, eager=False):
    from PIL import Image
    w, h = Image.open(ROOT / path.lstrip("/")).size
    load = 'fetchpriority="high"' if eager else 'loading="lazy"'
    return f'<img src="{path}" width="{w}" height="{h}" alt="{html.escape(alt)}" {load} decoding="async">'


def asset_version():
    import hashlib
    h = hashlib.md5()
    for f in ("style.css", "site.js", "images.js"):
        h.update((ROOT / f).read_bytes())
    return h.hexdigest()[:8]


def main():
    global ASSET_V
    ASSET_V = asset_version()
    thumbs()
    write("index.html", page("Home", "home", HOME_BODY, "home"))

    cards = "\n".join(
        f'      <a class="card" href="/work/{p["slug"]}/">\n'
        f'        <img src="/images/work/{p["slug"]}/thumb.webp" alt="{html.escape(p["title"])}" loading="lazy" decoding="async">\n'
        f'        <span class="card-title">{html.escape(p["title"])}</span>\n'
        f'      </a>' for p in PROJECTS)
    write("work/index.html", page("Work", "work",
        f'  <main class="page page-wide">\n    <h1>Work</h1>\n    <div class="grid">\n{cards}\n    </div>\n  </main>\n',
        "inner"))

    for i, p in enumerate(PROJECTS):
        prev_p, next_p = PROJECTS[i - 1], PROJECTS[(i + 1) % len(PROJECTS)]
        files = project_images(p["slug"])
        focus = p.get("focus", {})
        slides = "\n".join(
            f'        <img class="slide{" is-on" if k == 0 else ""}{" contain" if FIT.get(p["slug"] + "/" + f) == "contain" else ""}" '
            f'{"src" if k == 0 else "data-src"}="/images/work/{p["slug"]}/{f}" '
            f'alt="{html.escape(p["title"])}, image {k + 1}" decoding="async"'
            f'{f" style=\"object-position:{focus[f]}\"" if f in focus else ""}>'
            for k, f in enumerate(files))
        meta = html.escape(p.get("meta", "Year \u00b7 Medium"))
        text = "\n".join(f"      <p>{html.escape(t)}</p>" for t in p.get("text", ["Description coming soon."]))
        body = f"""  <main class="page page-wide project">
    <div class="project-layout">
      <div class="project-main">
        <div class="project-head">
          <h1>{html.escape(p["title"])}</h1>
          <nav class="project-nav" aria-label="Projects">
            <a href="/work/{prev_p["slug"]}/" title="{html.escape(prev_p["title"])}">&lsaquo; Prev</a>
            <a href="/work/">All</a>
            <a href="/work/{next_p["slug"]}/" title="{html.escape(next_p["title"])}">Next &rsaquo;</a>
          </nav>
        </div>
        <div class="slideshow" data-count="{len(files)}">
          <div class="frame">
{slides}
            <button class="slide-btn prev" type="button" aria-label="Previous image">&lsaquo;</button>
            <button class="slide-btn next" type="button" aria-label="Next image">&rsaquo;</button>
          </div>
          <div class="slide-count"><span class="slide-i">1</span> / {len(files)}</div>
        </div>
      </div>
      <div class="project-text">
        <p class="meta">{meta}</p>
{text}
      </div>
    </div>
  </main>
"""
        write(f"work/{p['slug']}/index.html", page(p["title"], "work", body, "inner"))

    about = "\n".join(f"      <p>{html.escape(t)}</p>" for t in ABOUT)
    about_block = f"      <h1>About</h1>\n{about}\n"

    def stacked(content):
        # Every text page sits in a box the size of the About text, so titles
        # and text land in the same place on About, Contact and Login.
        return (f'  <main class="page stacked{" at-bottom" if TEXT_POSITION == "bottom" else ""}">\n    <div class="stack">\n'
                f'    <div class="stack-sizer" aria-hidden="true">\n{about_block}    </div>\n'
                f'    <div class="stack-content">\n{content}    </div>\n    </div>\n  </main>\n')

    write("about/index.html", page("About", "about", stacked(about_block), "inner photo"))
    write("login/index.html", page("Login", "login", stacked(
        "      <h1>Login</h1>\n      <p>A private area for shared documents is coming soon.</p>\n"), "inner photo"))

    contact = f"""      <h1>Contact</h1>
      <p>For commissions, collaborations and studio inquiries:</p>
      <p class="email"><a id="email" href="/contact/">{EMAIL_USER} [at] {EMAIL_DOMAIN}</a></p>
      <script>
      // Assemble the address in the browser so simple spam bots can't read it from the page.
      (function () {{
        var a = document.getElementById('email'), e = {json.dumps(EMAIL_USER)} + '@' + {json.dumps(EMAIL_DOMAIN)};
        a.href = 'mailto:' + e; a.textContent = e;
      }})();
      </script>
"""
    write("contact/index.html", page("Contact", "contact", stacked(contact), "inner photo"))
    print("built", 5 + len(PROJECTS), "pages")


if __name__ == "__main__":
    main()
