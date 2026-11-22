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
    {"slug": "soma", "title": "SOMA",
     "meta": "2024 · Pigment print",
     "text": [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus, posuere velit aliquet. Donec ullamcorper nulla non metus auctor fringilla, vitae elementum lacus vehicula. Praesent commodo cursus magna, vel scelerisque nisl consectetur et, donec sed odio dui.",
      "Maecenas faucibus mollis interdum. Cras mattis consectetur purus sit amet fermentum. Nullam quis risus eget urna mollis ornare vel eu leo. Aenean lacinia bibendum nulla sed consectetur, et lucem in umbra quaerit. Etiam porta sem malesuada magna mollis euismod, cras justo odio, dapibus ac facilisis in, egestas eget quam.",
      "Vestibulum id ligula porta felis euismod semper. Curabitur blandit tempus porttitor, sed posuere consectetur est at lobortis. Morbi leo risus, porta ac consectetur ac, vestibulum at eros, integer posuere erat a ante."
     ]},
    {"slug": "julius-ii", "title": "Julius II",
     "meta": "2023 · Digital rendering",
     "text": [
      "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nulla vitae elit libero, a pharetra augue, duis mollis est non commodo luctus nisi erat porttitor ligula. Aenean eu leo quam, pellentesque ornare sem lacinia quam venenatis vestibulum, sed posuere consectetur.",
      "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet. Fusce dapibus tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus, donec id elit non mi porta."
     ]},
    {"slug": "parnell-residence", "title": "Parnell Residence",
     "meta": "2019 · Graphite on paper, model",
     "text": [
      "Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur. Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor, sed diam eget risus varius blandit.",
      "Quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur. At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti. Praesent commodo cursus magna, vel scelerisque nisl consectetur et, donec sed odio dui.",
      "Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Etiam porta sem malesuada magna mollis euismod, cras justo odio, dapibus ac facilisis in, egestas eget quam."
     ]},
    {"slug": "talbot-road-residence", "title": "Talbot Road Residence",
     "meta": "2018 · Ink and digital collage",
     "text": [
      "Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Morbi leo risus, porta ac consectetur ac, vestibulum at eros, integer posuere erat a ante. Nulla vitae elit libero, a pharetra augue, duis mollis est non commodo luctus nisi erat porttitor ligula.",
      "Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur. Aenean eu leo quam, pellentesque ornare sem lacinia quam venenatis vestibulum, sed posuere consectetur. Fusce dapibus tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus."
     ]},
    {"slug": "julius", "title": "Julius",
     "meta": "2017 · Digital rendering",
     "text": [
      "Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum, aenean imperdiet. Etiam ultricies nisi vel augue, curabitur ullamcorper ultricies nisi. Nam eget dui, etiam rhoncus maecenas tempus tellus eget condimentum. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus, donec id elit non mi porta.",
      "Donec vitae sapien ut libero venenatis faucibus. Nullam quis ante, etiam sit amet orci eget eros faucibus tincidunt. Duis leo, sed fringilla mauris sit amet nibh. Forma sequitur lumen, et lumen formam reddit. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor, sed diam eget risus varius blandit.",
      "Donec sodales sagittis magna. Sed consequat, leo eget bibendum sodales, augue velit cursus nunc, quis gravida magna mi a libero. Praesent commodo cursus magna, vel scelerisque nisl consectetur et, donec sed odio dui."
     ]},
    {"slug": "american-promise", "title": "American Promise",
     "meta": "2016 · Photomontage and elevation drawings",
     "text": [
      "Fusce vulputate eleifend sapien. Vestibulum purus quam, scelerisque ut, mollis sed, nonummy id, metus. Nullam accumsan lorem in dui. Cras ultricies mi eu turpis hendrerit fringilla, in ac dui quis mi consectetuer lacinia. Etiam porta sem malesuada magna mollis euismod, cras justo odio, dapibus ac facilisis in, egestas eget quam. Morbi leo risus, porta ac consectetur ac, vestibulum at eros, integer posuere erat a ante.",
      "Nam pretium turpis et arcu. Duis arcu tortor, suscipit eget, imperdiet nec, imperdiet iaculis, ipsum. Sed aliquam ultrices mauris. Integer ante arcu, accumsan a, consectetuer eget, posuere ut, mauris. Praesent adipiscing, phasellus ullamcorper ipsum rutrum nunc. Nulla vitae elit libero, a pharetra augue, duis mollis est non commodo luctus nisi erat porttitor ligula. Aenean eu leo quam, pellentesque ornare sem lacinia quam venenatis vestibulum, sed posuere consectetur."
     ]},
    {"slug": "the-conflicted-icon", "title": "The Conflicted Icon",
     "meta": "2015 · Digital rendering, line drawing",
     "text": [
      "Curabitur at lacus ac velit ornare lobortis. Curabitur a felis in nunc fringilla tristique. Morbi mattis ullamcorper velit, phasellus gravida semper nisi. Nullam vel sem, pellentesque libero tortor, tincidunt et tincidunt eget. Fusce dapibus tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus.",
      "Pellentesque ut neque. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. In ac felis quis tortor malesuada pretium, umbra turris super urbem cadit. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus, donec id elit non mi porta.",
      "Vivamus quis mi. Phasellus a est, phasellus magna in hac habitasse platea dictumst. Curabitur nisi, quisque malesuada placerat nisl. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor, sed diam eget risus varius blandit."
     ]},
    {"slug": "march-of-the-silhouettes", "title": "March of the Silhouettes",
     "meta": "2014 · Charcoal and ink on paper",
     "text": [
      "Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Praesent commodo cursus magna, vel scelerisque nisl consectetur et, donec sed odio dui. Etiam porta sem malesuada magna mollis euismod, cras justo odio, dapibus ac facilisis in, egestas eget quam.",
      "Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Figurae in ordine ambulant, nec umquam consistunt. Morbi leo risus, porta ac consectetur ac, vestibulum at eros, integer posuere erat a ante. Nulla vitae elit libero, a pharetra augue, duis mollis est non commodo luctus nisi erat porttitor ligula."
     ]},
    {"slug": "wedges", "title": "Wedges",
     "meta": "2013 · Study models, photography",
     "text": [
      "Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus, aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Aenean eu leo quam, pellentesque ornare sem lacinia quam venenatis vestibulum, sed posuere consectetur.",
      "Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi, nam eget dui. Etiam rhoncus, maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero. Fusce dapibus tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus.",
      "Sit amet adipiscing sem neque sed ipsum. Nam quam nunc, blandit vel, luctus pulvinar, hendrerit id, lorem. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus, donec id elit non mi porta."
     ]},
    {"slug": "frankls-purposive-intention", "title": "Frankl\u2019s Purposive Intention",
     "meta": "2012 · Axonometric drawings, model",
     "text": [
      "Maecenas nec odio et ante tincidunt tempus. Donec vitae sapien ut libero venenatis faucibus. Nullam quis ante. Etiam sit amet orci eget eros faucibus tincidunt. Duis leo. Sed fringilla mauris sit amet nibh. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor, sed diam eget risus varius blandit.",
      "Donec sodales sagittis magna. Sed consequat, leo eget bibendum sodales, augue velit cursus nunc, quis gravida magna mi a libero. Fusce vulputate eleifend sapien, intentio quaerit spatium et spatium respondet. Praesent commodo cursus magna, vel scelerisque nisl consectetur et, donec sed odio dui.",
      "Vestibulum purus quam, scelerisque ut, mollis sed, nonummy id, metus. Nullam accumsan lorem in dui. Etiam porta sem malesuada magna mollis euismod, cras justo odio, dapibus ac facilisis in, egestas eget quam."
     ]},
]
# PLACEHOLDER Latin text, years and mediums (2026-11-07) until Juan sends the real ones.
# Optional text per project: add "meta" (e.g. "2024 · Pigment print") and
# "text" (a list of paragraphs) to any entry above. Placeholders show until then.
# How each image is trimmed, fitted and cropped: tools/image_rules.json, applied by tools/images.py.


# Written by tools/images.py: how each image sits in the frame (fit, focus).
DISPLAY = json.loads((ROOT / "images" / "work" / "display.json").read_text())


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

NAV = [("home", "Home", "/"), ("work", "Work", "/work/"), ("prints", "Prints", "/prints/"),
       ("contact", "Contact", "/contact/"), ("about", "About", "/about/")]


# Print series (MOCKUP names and text). slug, name, source, short text.
PRINT_SERIES = [
    ("silhouettes", "Silhouettes", "From March of the Silhouettes, 2014",
     "Ink figures cut from the March of the Silhouettes drawings. Series text to come."),
    ("elevations", "Elevations", "From American Promise, 2016",
     "Street elevations of the American Promise monument, with sky and trees in line. Series text to come."),
    ("lines", "Lines", "From The Conflicted Icon and Frankl\u2019s Purposive Intention",
     "Line drawings of towers and rooms, drawn in axonometric. Series text to come."),
    ("fields", "Fields", "From Julius, 2017",
     "The Julius figure in a landscape of drawn trees and ground. Series text to come."),
    ("plans", "Plans", "From the Parnell and Talbot Road Residences",
     "Plans of two houses, read as drawings in their own right. Series text to come."),
]


def page(title, section, body, body_class="", head_extra=""):
    nav = "\n".join(
        f'      <a href="{href}"{" aria-current=\"page\"" if key == section else ""}>'
        f'<span class="nav-label">{label}</span></a>'
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
  <script src="/type.js?v={ASSET_V}"></script>
  <script src="/images.js?v={ASSET_V}"></script>
  <script src="/site.js?v={ASSET_V}" defer></script>
{head_extra}</head>
<body class="{body_class}">
{body}
  <header class="site-header">
    <a class="logo" href="/">Juan De Marco</a>
  </header>

  <nav class="nav" aria-label="Main">
{nav}
      <button class="settings-btn" type="button" aria-expanded="false" aria-controls="settings"><span class="nav-label">Settings</span></button>
  </nav>

  <div class="settings" id="settings" hidden>
    <p class="settings-note">Test panel. Choices are kept in this browser only.</p>
    <div class="settings-row"><label class="settings-label" for="ts-style">Text style</label>
      <select id="ts-style"><option value="name">Name</option><option value="title">Title</option><option value="text">Text</option><option value="label">Label</option></select></div>
    <div class="settings-row"><label class="settings-label" for="ts-font">Font</label>
      <select id="ts-font" data-k="font"><option value="jost">Jost (old)</option><option value="inter">Inter</option><option value="instrument">Instrument Sans</option><option value="geist">Geist</option><option value="host">Host Grotesk</option><option value="franklin">Libre Franklin</option><option value="albert">Albert Sans</option></select></div>
    <div class="settings-row"><label class="settings-label" for="ts-w">Weight</label>
      <select id="ts-w" data-k="w"><option value="300">Light</option><option value="400">Regular</option><option value="500">Medium</option><option value="600">Semibold</option></select></div>
    <div class="settings-row"><label class="settings-label" for="ts-size">Size</label>
      <input id="ts-size" data-k="size" type="range" min="50" max="250" step="5"><output id="ts-size-out" for="ts-size"></output></div>
    <div class="settings-row"><label class="settings-label" for="ts-track">Spacing</label>
      <select id="ts-track" data-k="track"><option value="0">None</option><option value="0.02">Very tight</option><option value="0.05">Tight</option><option value="0.1">Medium</option><option value="0.2">Wide</option><option value="0.3">Wider</option><option value="0.42">Widest</option></select></div>
    <div class="settings-row"><label class="settings-label" for="ts-case">Case</label>
      <select id="ts-case" data-k="case"><option value="uppercase">Capitals</option><option value="none">As written</option></select></div>
    <div class="settings-rule"></div>
    <div class="settings-row">
      <span class="settings-label">Project layout</span>
      <button type="button" data-pref="layout" data-val="slides">Slideshow (now)</button>
      <button type="button" data-pref="layout" data-val="scroll">Scroll</button>
    </div>
    <div class="settings-row">
      <span class="settings-label">Colour</span>
      <button type="button" data-pref="colour" data-val="guidelines">Warm (guidelines)</button>
      <button type="button" data-pref="colour" data-val="original">Black &amp; white</button>
    </div>
    <div class="settings-row">
      <span class="settings-label">Image margin</span>
      <button type="button" data-pref="mat" data-val="on">On</button>
      <button type="button" data-pref="mat" data-val="off">Off</button>
    </div>
    <div class="settings-row">
      <span class="settings-label">About / Contact image</span>
      <button type="button" data-pref="photos" data-val="on">On</button>
      <button type="button" data-pref="photos" data-val="off">Off</button>
    </div>
    <div class="settings-rule"></div>
    <div class="settings-row">
      <button type="button" id="ts-copy">Copy my settings</button>
      <button type="button" id="ts-download">Download</button>
      <button type="button" id="ts-reset">Reset all</button>
    </div>
    <textarea id="ts-out" class="settings-out" rows="4" readonly hidden aria-label="Settings to copy"></textarea>
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
    for f in ("style.css", "site.js", "images.js", "type.js"):
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
        focus = {f: DISPLAY[p["slug"] + "/" + f]["focus"] for f in files if DISPLAY.get(p["slug"] + "/" + f, {}).get("focus")}
        slides = "\n".join(
            f'        <img class="slide{" is-on" if k == 0 else ""}{" contain" if DISPLAY.get(p["slug"] + "/" + f, {}).get("fit") == "contain" else ""}" '
            f'{"src" if k == 0 else "data-src"}="/images/work/{p["slug"]}/{f}" '
            f'alt="{html.escape(p["title"])}, image {k + 1}" decoding="async"'
            f'{f" style=\"object-position:{focus[f]}\"" if f in focus else ""}>'
            for k, f in enumerate(files))
        meta = html.escape(p.get("meta", "Year \u00b7 Medium"))
        text = "\n".join(f"      <p>{html.escape(t)}</p>" for t in p.get("text", ["Description coming soon."]))
        # Alternative layout (Settings > Project layout > Scroll): one image after
        # another at a paced rhythm. Documents sit as sheets with paper around them;
        # images alternate full width and inset, left and right.
        figs, photo_n = [], 0
        from PIL import Image
        for k, f in enumerate(files):
            mode = DISPLAY.get(p["slug"] + "/" + f, {}).get("mode", "image")
            w, h = Image.open(ROOT / "images" / "work" / p["slug"] / f).size
            if mode == "document":
                cls = "doc portrait" if h > w else "doc"
            else:
                cls = ["full", "inset right", "inset left"][photo_n % 3]
                photo_n += 1
            figs.append(
                f'      <figure class="ps-fig {cls}">\n'
                f'        <img src="/images/work/{p["slug"]}/{f}" width="{w}" height="{h}" alt="{html.escape(p["title"])}, image {k + 1}" loading="lazy" decoding="async">\n'
                f'        <figcaption>{k + 1:02d} / {len(files):02d}</figcaption>\n      </figure>')
        scroll = f"""    <section class="pscroll" aria-label="{html.escape(p["title"])}, all images">
      <div class="ps-head">
        <div class="ps-title">
          <h1>{html.escape(p["title"])}</h1>
          <p class="meta">{meta}</p>
        </div>
        <div class="ps-text">
{text}
        </div>
      </div>
{chr(10).join(figs)}
      <nav class="ps-next project-nav" aria-label="Projects">
        <a href="/work/{prev_p["slug"]}/">&lsaquo; {html.escape(prev_p["title"])}</a>
        <a href="/work/">All</a>
        <a href="/work/{next_p["slug"]}/">{html.escape(next_p["title"])} &rsaquo;</a>
      </nav>
    </section>
"""
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
{scroll}  </main>
"""
        write(f"work/{p['slug']}/index.html", page(p["title"], "work", body, "inner"))

    # Prints. MOCKUP: 2:3 sheets cut from existing drawings by tools/print_mockups.py.
    # Each series opens as its own "room": one print at a time, text to the side.
    # Free placement: prints are shuffled, then packed row by row on a 12-column
    # grid with random widths, gaps and drops (fixed seed, so it's stable between builds).
    import random
    from PIL import Image
    rnd = random.Random(23)
    allp = []
    for slug, name, source, blurb in PRINT_SERIES:
        files = sorted(f.name for f in (ROOT / "images" / "prints" / slug).glob("[0-9]*.webp"))
        for k, f in enumerate(files):
            w, h = Image.open(ROOT / "images" / "prints" / slug / f).size
            allp.append((slug, name, k, f, w, h))
    rnd.shuffle(allp)
    items, col = [], 13
    for slug, name, k, f, w, h in allp:
        span = rnd.choice([2, 3, 3]) if h > w * 1.1 else (rnd.choice([3, 4]) if abs(w - h) < 40 else rnd.choice([4, 4, 5]))
        gap = rnd.choice([0, 0, 1])
        if col + gap + span > 13:
            room = 13 - col - gap                     # squeeze in a narrower print if it still reads
            if room >= (2 if h > w * 1.1 else 3):
                span = room
            else:
                col, gap = 1, rnd.choice([0, 0, 1, 2])
        c = col + gap
        col = c + span
        top = rnd.choice([0, 2, 4, 6, 9, 12])
        items.append(
            f'      <a class="print" href="/prints/{slug}/#{k + 1}" style="grid-column:{c} / span {span};margin-top:calc({top} * var(--s) * 10)">\n'
            f'        <img src="/images/prints/{slug}/{f}" width="{w}" height="{h}" alt="{name}, print {k + 1}" loading="lazy" decoding="async">\n'
            f'        <span class="print-cap"><em>{name}</em>, No. {k + 1}</span>\n      </a>')
    for slug, name, source, blurb in PRINT_SERIES:
        files = sorted(f.name for f in (ROOT / "images" / "prints" / slug).glob("[0-9]*.webp"))
        pw, ph = Image.open(ROOT / "images" / "prints" / slug / files[0]).size
        fmt = min(["2:3", "3:2", "3:4", "4:3", "1:1"], key=lambda r: abs(int(r[0]) / int(r[2]) - pw / ph))
        slides = "\n".join(
            f'        <img class="slide contain{" is-on" if k == 0 else ""}" {"src" if k == 0 else "data-src"}="/images/prints/{slug}/{f}" '
            f'alt="{name}, print {k + 1} of {len(files)}" decoding="async">' for k, f in enumerate(files))
        room = f"""  <main class="room-page">
    <div class="room-top">
      <span class="room-where"><a href="/prints/">Prints</a> / {name}</span>
      <a class="room-close" href="/prints/" aria-label="Close and go back to Prints">&times;</a>
    </div>
    <div class="room-layout" style="--ratio:{pw / ph:.4f}">
      <div class="slideshow room-show" data-count="{len(files)}">
        <div class="frame">
{slides}
          <button class="slide-btn prev" type="button" aria-label="Previous print">&lsaquo;</button>
          <button class="slide-btn next" type="button" aria-label="Next print">&rsaquo;</button>
        </div>
        <div class="slide-count"><span class="slide-i">1</span> / {len(files)}</div>
      </div>
      <div class="room-text">
        <h1>{name}</h1>
        <p class="meta">Series of {len(files)} &middot; {fmt} format &middot; {source}</p>
        <p>{blurb}</p>
        <p class="room-buy">Print options coming soon</p>
        <p class="room-mock">Mockup: sections of existing drawings stand in for the final prints.</p>
      </div>
    </div>
  </main>
"""
        write(f"prints/{slug}/index.html", page(f"{name} \u00b7 Prints", "prints", room, "inner room"))
    write("prints/index.html", page("Prints", "prints",
        '  <main class="page page-wide prints-page">\n    <h1>Prints</h1>\n'
        '    <p class="prints-intro">Drawings in series, as archival prints. Select one to enter its series.</p>\n'
        '    <div class="prints">\n' + "\n".join(items) + '\n    </div>\n  </main>\n', "inner"))

    about = "\n".join(f"      <p>{html.escape(t)}</p>" for t in ABOUT)
    about_block = f"      <h1>About</h1>\n{about}\n"

    def stacked(content):
        # Every text page sits in a box the size of the About text, so titles
        # and text land in the same place on About, Contact and Login.
        return (f'  <main class="page stacked{" at-bottom" if TEXT_POSITION == "bottom" else ""}">\n    <div class="stack">\n'
                f'    <div class="stack-sizer" aria-hidden="true">\n{about_block}    </div>\n'
                f'    <div class="stack-content">\n{content}    </div>\n    </div>\n  </main>\n')

    write("about/index.html", page("About", "about", stacked(about_block), "inner photo"))

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
