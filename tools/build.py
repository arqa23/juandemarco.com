#!/usr/bin/env python3
"""Builds every page of juandemarco.com from one shared layout.

Edit the text and the PROJECTS list here, then run:  python3 tools/build.py
It writes index.html, about/ (with contact), work/, work/project-N/, prints/ and a /contact/ redirect.
Thumbnails for the Work grid are made from images/ into images/thumbs/.
"""
import re
import hashlib, html, json, os, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
YEAR = "2026"

# Projects, in the order they appear on the Work page.
# Each project's images live in images/work/<slug>/ as 01.webp, 02.webp, ...
# shown in that order on its page; the first one is the grid thumbnail.
PROJECTS = [
    # Order: Talbot/Parnell, Julius/Julius II and American Promise/Conflicted Icon
    # never side by side, the strip's wrap included (Juan, 2026-11-26)
    {"slug": "soma", "title": "SOMA",
     "desc": "",
     "subtitle": "",
     "meta": "2026 · Pigment print",
     "text": [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus, posuere velit aliquet. Donec ullamcorper nulla non metus auctor fringilla, vitae elementum lacus vehicula. Praesent commodo cursus magna, vel scelerisque nisl consectetur et, donec sed odio dui.",
      "Maecenas faucibus mollis interdum. Cras mattis consectetur purus sit amet fermentum. Nullam quis risus eget urna mollis ornare vel eu leo. Aenean lacinia bibendum nulla sed consectetur, et lucem in umbra quaerit. Etiam porta sem malesuada magna mollis euismod, cras justo odio, dapibus ac facilisis in, egestas eget quam.",
      "Vestibulum id ligula porta felis euismod semper. Curabitur blandit tempus porttitor, sed posuere consectetur est at lobortis. Morbi leo risus, porta ac consectetur ac, vestibulum at eros, integer posuere erat a ante."
     ]},
    {"slug": "julius-ii", "title": "Julius II",
     "desc": "",
     "subtitle": "",
     "meta": "2026 · Digital rendering",
     "text": [
      "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nulla vitae elit libero, a pharetra augue, duis mollis est non commodo luctus nisi erat porttitor ligula. Aenean eu leo quam, pellentesque ornare sem lacinia quam venenatis vestibulum, sed posuere consectetur.",
      "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet. Fusce dapibus tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus, donec id elit non mi porta."
     ]},
    {"slug": "parnell-residence", "title": "Parnell Residence",
     "desc": "A two-story residence composed of two intersecting bars, connected by a double-height living room. As in the Talbot Road Residence, the rooms are staggered to balance interior privacy with expansive views of the surrounding landscape.",
     "subtitle": "One-Directional Corridors",
     "meta": "2021 · Graphite on paper, model",
     "text": [
      "Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur. Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor, sed diam eget risus varius blandit.",
      "Quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur. At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti. Praesent commodo cursus magna, vel scelerisque nisl consectetur et, donec sed odio dui.",
      "Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Etiam porta sem malesuada magna mollis euismod, cras justo odio, dapibus ac facilisis in, egestas eget quam."
     ]},
    {"slug": "american-promise", "title": "American Promise",
     "desc": "A proposal for the Peace Corps National Monument Competition in Washington, D.C. In keeping with the spirit of service of the Peace Corps, the monument is designed to draw attention away from itself and toward the National Mall.",
     "subtitle": "Peace Corps Monument Competition",
     "meta": "2013 · Photomontage and elevation drawings",
     "text": [
      "Fusce vulputate eleifend sapien. Vestibulum purus quam, scelerisque ut, mollis sed, nonummy id, metus. Nullam accumsan lorem in dui. Cras ultricies mi eu turpis hendrerit fringilla, in ac dui quis mi consectetuer lacinia. Etiam porta sem malesuada magna mollis euismod, cras justo odio, dapibus ac facilisis in, egestas eget quam. Morbi leo risus, porta ac consectetur ac, vestibulum at eros, integer posuere erat a ante.",
      "Nam pretium turpis et arcu. Duis arcu tortor, suscipit eget, imperdiet nec, imperdiet iaculis, ipsum. Sed aliquam ultrices mauris. Integer ante arcu, accumsan a, consectetuer eget, posuere ut, mauris. Praesent adipiscing, phasellus ullamcorper ipsum rutrum nunc. Nulla vitae elit libero, a pharetra augue, duis mollis est non commodo luctus nisi erat porttitor ligula. Aenean eu leo quam, pellentesque ornare sem lacinia quam venenatis vestibulum, sed posuere consectetur."
     ]},
    {"slug": "march-of-the-silhouettes", "title": "March of the Silhouettes",
     "desc": "A series of abstract drawings inspired by Egyptian hieroglyphs and the movement of figures in procession.",
     "subtitle": "Hieroglyphs & Silhouettes",
     "meta": "2012 · Charcoal and ink on paper",
     "text": [
      "Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Praesent commodo cursus magna, vel scelerisque nisl consectetur et, donec sed odio dui. Etiam porta sem malesuada magna mollis euismod, cras justo odio, dapibus ac facilisis in, egestas eget quam.",
      "Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Figurae in ordine ambulant, nec umquam consistunt. Morbi leo risus, porta ac consectetur ac, vestibulum at eros, integer posuere erat a ante. Nulla vitae elit libero, a pharetra augue, duis mollis est non commodo luctus nisi erat porttitor ligula."
     ]},
    {"slug": "talbot-road-residence", "title": "Talbot Road Residence",
     "desc": "A single-story residence with a series of staggered rooms, designed to balance interior privacy with expansive views of the surrounding landscape.",
     "subtitle": "One-Directional Corridors",
     "meta": "2020 · Ink and digital collage",
     "text": [
      "Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Morbi leo risus, porta ac consectetur ac, vestibulum at eros, integer posuere erat a ante. Nulla vitae elit libero, a pharetra augue, duis mollis est non commodo luctus nisi erat porttitor ligula.",
      "Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur. Aenean eu leo quam, pellentesque ornare sem lacinia quam venenatis vestibulum, sed posuere consectetur. Fusce dapibus tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus."
     ]},
    {"slug": "julius", "title": "Julius",
     "desc": "An architectural silhouette that wanders the countryside. Its patterned surfaces alter the perception of its form as it is viewed from different angles.",
     "subtitle": "The Ever Moving Adornment",
     "meta": "2014 · Digital rendering",
     "text": [
      "Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum, aenean imperdiet. Etiam ultricies nisi vel augue, curabitur ullamcorper ultricies nisi. Nam eget dui, etiam rhoncus maecenas tempus tellus eget condimentum. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus, donec id elit non mi porta.",
      "Donec vitae sapien ut libero venenatis faucibus. Nullam quis ante, etiam sit amet orci eget eros faucibus tincidunt. Duis leo, sed fringilla mauris sit amet nibh. Forma sequitur lumen, et lumen formam reddit. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor, sed diam eget risus varius blandit.",
      "Donec sodales sagittis magna. Sed consequat, leo eget bibendum sodales, augue velit cursus nunc, quis gravida magna mi a libero. Praesent commodo cursus magna, vel scelerisque nisl consectetur et, donec sed odio dui."
     ]},
    {"slug": "wedges", "title": "Wedges",
     "desc": "",
     "subtitle": "",
     "meta": "2022 · Study models, photography",
     "text": [
      "Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus, aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Aenean eu leo quam, pellentesque ornare sem lacinia quam venenatis vestibulum, sed posuere consectetur.",
      "Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi, nam eget dui. Etiam rhoncus, maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero. Fusce dapibus tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus.",
      "Sit amet adipiscing sem neque sed ipsum. Nam quam nunc, blandit vel, luctus pulvinar, hendrerit id, lorem. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus, donec id elit non mi porta."
     ]},
    {"slug": "the-conflicted-icon", "title": "The Conflicted Icon",
     "desc": "A reinterpretation of the traditional skyscraper, in which the architectural crown is relocated from the top of the tower to its base. The project shifts the emphasis from the skyline to the point where the tower meets the ground.",
     "subtitle": "Inverted Monumentality",
     "meta": "2014 · Digital rendering, line drawing",
     "text": [
      "Curabitur at lacus ac velit ornare lobortis. Curabitur a felis in nunc fringilla tristique. Morbi mattis ullamcorper velit, phasellus gravida semper nisi. Nullam vel sem, pellentesque libero tortor, tincidunt et tincidunt eget. Fusce dapibus tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus.",
      "Pellentesque ut neque. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. In ac felis quis tortor malesuada pretium, umbra turris super urbem cadit. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus, donec id elit non mi porta.",
      "Vivamus quis mi. Phasellus a est, phasellus magna in hac habitasse platea dictumst. Curabitur nisi, quisque malesuada placerat nisl. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor, sed diam eget risus varius blandit."
     ]},
    {"slug": "frankls-purposive-intention", "title": "Frankl\u2019s Purposive Intention",
     "desc": "An experimental art gallery inspired by Paul Frankl\u2019s writings on purposive intention and the relationship between architectural spaces and the objects within them. Patterns of varying direction and density allow the architecture itself to become an active participant in the exhibition.",
     "subtitle": "Site-less Art Gallery",
     "meta": "2011 · Axonometric drawings, model",
     "text": [
      "Maecenas nec odio et ante tincidunt tempus. Donec vitae sapien ut libero venenatis faucibus. Nullam quis ante. Etiam sit amet orci eget eros faucibus tincidunt. Duis leo. Sed fringilla mauris sit amet nibh. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor, sed diam eget risus varius blandit.",
      "Donec sodales sagittis magna. Sed consequat, leo eget bibendum sodales, augue velit cursus nunc, quis gravida magna mi a libero. Fusce vulputate eleifend sapien, intentio quaerit spatium et spatium respondet. Praesent commodo cursus magna, vel scelerisque nisl consectetur et, donec sed odio dui.",
      "Vestibulum purus quam, scelerisque ut, mollis sed, nonummy id, metus. Nullam accumsan lorem in dui. Etiam porta sem malesuada magna mollis euismod, cras justo odio, dapibus ac facilisis in, egestas eget quam."
     ]},
    # Added 2026-11-27 (Juan); images from the old juandemarco.us page
    {"slug": "family-of-curves", "title": "Family of Curves No. 1",
     "desc": "A collection of related curves grown from a single line. Through different rates of expansion, each curve develops its own distinctive character.",
     "subtitle": "The Wiggle Effect",
     "meta": "2006 · Line drawings",
     "text": ["Description coming soon."]},
]
# Years are Juan's (2026-11-27), kept in "meta" but hidden on the site; rooms show "subtitle". PLACEHOLDER Latin text and mediums (2026-11-07) until Juan sends the real ones.
# Optional text per project: add "meta" (e.g. "2024 · Pigment print") and
# "text" (a list of paragraphs) to any entry above. Placeholders show until then.
# How each image is trimmed, fitted and cropped: tools/image_rules.json, applied by tools/images.py.


# Editorial test (design brief V2, Juan 2026-11-27): an opt-in alternate Home,
# Work and About, switched in the settings box ("Design preview"). Current
# stays the default. Everything the test uses is set here, in one place.
# Work: three groups of two on a 3-column grid, "lead" spans two columns;
# "img" is which of the project's images stands as its cover. PROVISIONAL
# choice made by Claude (architecture, drawings, objects), not Juan's ranking.
# Every other project follows below in a quieter grid, in PROJECTS order.
# Round 2 (Juan, 2026-11-27): Julius II, American Promise and Talbot Road
# large; Wedges, Conflicted Icon and Julius to the smaller projects below;
# March of the Silhouettes shows its usual first image.
# Round 3 (Juan): only SOMA, Julius II, American Promise and Talbot Road large;
# every other project a small tile like the others, no line and no lower grid;
# March of the Silhouettes shows image 02.
ED_FEATURED = [
    [("soma", "lead", "02.webp"), ("march-of-the-silhouettes", "small", "02.webp")],
    [("parnell-residence", "small", "01.webp"), ("julius-ii", "lead", "01.webp")],
    [("american-promise", "lead", "01.webp"), ("family-of-curves", "small", "01.webp")],
    [("frankls-purposive-intention", "small", "01.webp"), ("talbot-road-residence", "lead", "01.webp")],
    [("julius", "small", "03.webp"), ("the-conflicted-icon", "small", "01.webp"), ("wedges", "small", "01.webp")],   # Wedges always last (Juan, 2026-11-28)
]
ED_BELOW = []   # the smaller grid under a line (round 2), now empty
# About: the drawing beside the text, on its own paper (Gallery sketch 02)
ED_ABOUT_DRAWING = "/images/prints/sketches/02.webp"


# Written by tools/images.py: how each image sits in the frame (fit, focus).
DISPLAY = json.loads((ROOT / "images" / "work" / "display.json").read_text())


def project_images(slug):
    return sorted(f.name for f in (ROOT / "images" / "work" / slug).glob("[0-9]*.webp"))


# About text (Juan's draft, lightly edited, 2026-11-26); earlier drafts are
# kept in project-files juandemarco-site/VERSIONS.md ("About v1", "About v2").
ABOUT = [
    "Juan De Marco is a licensed architect and artist who makes architecture, "
    "objects and drawings.",
    "His work is guided by history, nature, cultures and the people who inhabit the "
    "world we live in, with a deep appreciation and curiosity for the ways "
    "artists and designers have engaged with the built environment in the past.",
    "He holds a Master of Architecture from Princeton University and a Bachelor of "
    "Architecture from the Illinois Institute of Technology, and has worked at the "
    "offices of Snøhetta, Reiser + Umemoto and FXCollaborative on a range of cultural "
    "and institutional projects.",
]

# Where the About / Contact / Login text sits on desktop:
#   "top"    = under the name (current)
#   "bottom" = text block's bottom edge lines up with the bottom of the menu
TEXT_POSITION = "top"

# Settings box mode (Juan, 2026-11-26). ONE LINE TO SWITCH:
#   "public"  = what visitors see (Juan, 2026-11-27): Dark mode, plus the
#               Layout list on Work and on the Gallery. No Framed option:
#               frames are always on (a saved "unframed" is ignored).
#   "working" = the same, plus the Framed option on the Gallery, for designing together
SETTINGS_MODE = "public"
# Settings button removed from every page (Juan, 2026-11-27): the site shows
# its defaults only (light mode, About framed). True brings the button back.
SETTINGS_BUTTON = False   # removed for good (Juan, 2026-11-28: "commit to everything"); True brings it back (round 15 test = PR #101)
GALLERY_LAYOUTS = [("index", "Index"), ("cluster", "Cluster")]
# Page views in the settings box (Juan, 2026-11-27). "current" = the page's
# original layout; defaults live in type.js (VIEWS).
# Work = Editorial and About = Editorial v2 for good (Juan, 2026-11-27); their
# other views are saved (VERSIONS.md) and their code stays, add them back here
# (and in type.js VIEWS) to choose again:
#   "work": [("current", "Squares / Float"), ("edit", "Editorial"), ("edit2", "Editorial v2")],
#   "about": [("current", "Current"), ("edit", "Editorial"), ("edit2", "Editorial v2")],
# Round 5 (Juan, 2026-11-27): About gets Editorial (v1) back beside v2; Gallery
# Wall saved but off (VERSIONS.md), add ("wall", "Wall") back to bring it back.
VIEWS = {
    # About = Editorial v2 only again (Juan, round 6); Editorial (v1) saved.
    # Gallery = Exhibition for good (Juan, round 6); Current (Index / Cluster)
    # and Wall are saved (VERSIONS.md), their code stays.
}
# Stream saved but switched off (Juan, 2026-11-27, VERSIONS.md); its code stays,
# add ("stream", "Stream") back here to bring it back.
# Stream (2026-11-27) = Squares turned upright: the Cluster hang, every print
# drifting on its own, held to the wall's middle, bouncing off its top and foot.
# Retired 2026-11-27 (kept in VERSIONS.md, commit c3a070c): Squares (3 rows),
# Cluster (grid2), Strip 1B. Squares = the old "Squares 2 rows", Grid = Grid V1,
# Strip = Strip 1A.
# Float (2026-11-27) = Squares without rows: free roaming, hard window edges, no wheel.
# Grid and Strip saved but switched off (Juan, 2026-11-27, VERSIONS.md); their
# code stays, add them back here to bring them back.
WORK_LAYOUTS = [("squares", "Squares"), ("float", "Float")]

EMAIL_USER, EMAIL_DOMAIN = "juan", "juandemarco.com"

NAV = [("home", "Home", "/"), ("work", "Work", "/work/"), ("prints", "Gallery", "/prints/"),
       ("about", "About", "/about/")]


# Print series (MOCKUP names and text). slug, name, source, short text.
PRINT_SERIES = [
    ("sketches", "Sketches", "Gallery sketches, 2026",
     "Line studies drawn for print, 2:3 sheets at 8 \u00d7 12 in. Series text to come."),
    ("silhouettes", "Silhouettes", "From March of the Silhouettes, 2014",
     "Ink figures cut from the March of the Silhouettes drawings. Series text to come."),
    ("elevations", "Elevations", "From American Promise, 2016",
     "Street elevations of the American Promise monument, with sky and trees in line. Series text to come."),
    ("lines", "Lines", "From The Conflicted Icon and Frankl\u2019s Purposive Intention",
     "Line drawings of towers and rooms, drawn in axonometric. Series text to come."),
    ("fields", "Fields", "From Julius, 2017",
     "The Julius figure in a landscape of drawn trees and ground. Series text to come."),
    ("renderings", "Renderings", "From American Promise, 2016",
     "Photomontages of the American Promise monument on its Washington site. Series text to come."),
    ("soma", "SOMA", "From SOMA",
     "Colour fields from the SOMA series. Series text to come."),
    ("plans", "Plans", "From the Parnell and Talbot Road Residences",
     "Plans of two houses, read as drawings in their own right. Series text to come."),
]


# The Settings test panel. False hides it and the site shows its defaults only
# (saved test choices in a browser are ignored). True brings it back.
SETTINGS_ON = True


def page(title, section, body, body_class="", head_extra=""):
    out = _page(title, section, body, body_class, head_extra)
    if not SETTINGS_ON:
        out = re.sub(r'\n      <button class="settings-btn".*?</button>', '', out)
        out = re.sub(r'\n  <div class="settings" id="settings" hidden>.*?\n  </div>\n', '\n', out, flags=re.S)
        out = out.replace('<html lang="en"', '<html lang="en" data-settings="off"', 1)
    return out


def _page(title, section, body, body_class="", head_extra=""):
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
    # The view box shows only what belongs to the page you are on (Juan,
    # 2026-11-27): Framed on the Gallery only; in working mode a "Layout:" list
    # on Work and on the Gallery, the mini map look on the Gallery, Art view in
    # the rooms. No box on Home.
    frame_row = "" if SETTINGS_MODE == "public" else (
        '    <button type="button" class="pick-row pick-gal" data-tog="frame">Framed: <span></span></button>\n')
    working_rows = (
        '    <div class="pick-layouts pick-work">\n      <span class="pick-head">Layout:</span>\n'
        + "".join(f'      <button type="button" class="pick-row pick-opt" data-wv="{k}">{v}</button>\n' for k, v in WORK_LAYOUTS)
        + '    </div>\n'
        '    <div class="pick-layouts pick-gal">\n      <span class="pick-head">Layout:</span>\n'
        + "".join(f'      <button type="button" class="pick-row pick-opt" data-hv="{k}">{v}</button>\n' for k, v in GALLERY_LAYOUTS)
        + '    </div>\n'
        )
    # Each of Work, About and Gallery has its own "View" choice (Juan,
    # 2026-11-27); type.js holds the defaults (Work: Editorial, About:
    # Editorial v2, Gallery: Current). Home has one view and no settings button.
    views = VIEWS.get(section) if "has-ed" in body_class else None
    # About: the drawing framed (on its paper) or not (Juan, 2026-11-27)
    if section == "about":
        frame_row += '    <button type="button" class="pick-row" data-tog="aframe">Framed: <span></span></button>\n'
        # About test sliders/align (rounds 6-7) removed: Juan picked image +11vw, text -13vw (style.css)
    design_rows = "" if not views else (
        '    <div class="pick-layouts pick-design" role="radiogroup" aria-label="View">\n'
        '      <span class="pick-head">View:</span>\n'
        + "".join(f'      <button type="button" class="pick-row pick-opt" role="radio" aria-checked="false" data-dv="{k}">{v}</button>\n' for k, v in views)
        + '    </div>\n')
    return f"""<!doctype html>
<html lang="en"{' data-public="1"' if SETTINGS_MODE == "public" else ""}{"" if SETTINGS_BUTTON else ' data-nosettings="1"'}>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{html.escape(full_title)}</title>
  <meta name="description" content="Juan De Marco">
  <meta name="robots" content="noai, noimageai">
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
  </nav>
  <button class="settings-btn settings-corner" type="button" aria-expanded="false" aria-controls="settings" aria-label="View mode" title="View mode"><svg class="settings-icon" viewBox="2.4 2.4 15.2 15.2" aria-hidden="true"><path d="M3 5.5h7.6M14.4 5.5H17M3 10h1.6M8.4 10H17M3 14.5h6.1M12.9 14.5H17" stroke="currentColor" stroke-width=".75" fill="none"/><circle cx="12.5" cy="5.5" r="1.9"/><circle cx="6.5" cy="10" r="1.9"/><circle cx="11" cy="14.5" r="1.9"/></svg></button>
  <div class="mode-pick" id="mode-pick" role="group" aria-label="View mode" hidden>
    <button type="button" class="pick-row" data-tog="mode">Dark mode: <span></span></button>
    <button type="button" class="pick-row" data-tog="text">Text options</button>
{frame_row}{design_rows}{working_rows}  </div>

  <div class="settings" id="settings" hidden>
    <p class="settings-note">Test panel. Choices are kept in this browser only.</p>
    <div class="settings-row"><label class="settings-label" for="ts-style">Text style</label>
      <select id="ts-style"><option value="name">Name</option><option value="title">Title</option><option value="text">Text</option><option value="label">Label</option><option value="caption">Print caption</option><option value="menu">Menu</option></select></div>
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
      <span class="settings-label">Mode</span>
      <button type="button" data-pref="mode" data-val="light">Light</button>
      <button type="button" data-pref="mode" data-val="dark">Dark</button>
    </div>
    <div class="settings-row">
      <span class="settings-label">Background gradient</span>
      <button type="button" data-pref="grad" data-val="on">On</button>
      <button type="button" data-pref="grad" data-val="off">Off</button>
    </div>
    <div class="settings-row">
      <span class="settings-label">Gallery layout</span>
      <button type="button" data-pref="hang" data-val="index">Index</button>
      <button type="button" data-pref="hang" data-val="rows">Even</button>
      <button type="button" data-pref="hang" data-val="flow">Flow</button>
      <button type="button" data-pref="hang" data-val="salon">Salon</button>
    </div>
    <div class="settings-row">
      <span class="settings-label">Print titles</span>
      <button type="button" data-pref="ptitle" data-val="hover">On hover</button>
      <button type="button" data-pref="ptitle" data-val="below">Below</button>
    </div>
    <div class="settings-row">
      <span class="settings-label">Project tiles</span>
      <button type="button" data-pref="tiles" data-val="image">Image</button>
      <button type="button" data-pref="tiles" data-val="silhouette">Silhouette</button>
    </div>
    <div class="settings-row settings-swatches">
      <span class="settings-label">Gallery wall</span>
      <button type="button" data-pref="wall" data-val="page">Page colour</button>
      <button type="button" data-pref="wall" data-val="random">Random</button>
      <button type="button" class="swatch" data-pref="wall" data-val="beige" title="Beige" aria-label="Beige" style="--sw:#FAF9F5"></button>
      <button type="button" class="swatch" data-pref="wall" data-val="charcoal" title="Charcoal" aria-label="Charcoal" style="--sw:#171716"></button>
    </div>
    <div class="settings-row settings-swatches">
      <span class="settings-label">Your wall colours</span>
      <span class="wall-slot"><input type="color" class="wall-pick" data-i="0" aria-label="Wall colour 1"><button type="button" class="wall-clear" data-i="0" aria-label="Remove colour 1">&times;</button></span>
      <span class="wall-slot"><input type="color" class="wall-pick" data-i="1" aria-label="Wall colour 2"><button type="button" class="wall-clear" data-i="1" aria-label="Remove colour 2">&times;</button></span>
      <span class="wall-slot"><input type="color" class="wall-pick" data-i="2" aria-label="Wall colour 3"><button type="button" class="wall-clear" data-i="2" aria-label="Remove colour 3">&times;</button></span>
      <span class="wall-slot"><input type="color" class="wall-pick" data-i="3" aria-label="Wall colour 4"><button type="button" class="wall-clear" data-i="3" aria-label="Remove colour 4">&times;</button></span>
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
      <span class="settings-label">About image</span>
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


_IMG_V = {}


def img_v(m):
    """/images/work/x.webp -> /images/work/x.webp?v=<content hash>, so a re-made
    image (e.g. a trimmed edge) is never served from an old browser cache."""
    path = m.group(0)
    if path not in _IMG_V:
        f = ROOT / path.lstrip("/")
        _IMG_V[path] = hashlib.md5(f.read_bytes()).hexdigest()[:8] if f.exists() else ""
    return path + ("?v=" + _IMG_V[path] if _IMG_V[path] else "")


def write(rel, text):
    if rel.endswith(".html"):
        text = re.sub(r"/images/work/[\w./-]+?\.webp(?!\?)", img_v, text)
    p = ROOT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")


def thumbs():
    from PIL import Image
    for pr in PROJECTS:
        folder = ROOT / "images" / "work" / pr["slug"]
        # Square tile, cut from the centre of the full-size first image and kept
        # as sharp as the source allows (up to 1400px, for high-density screens).
        src, dst = folder / project_images(pr["slug"])[0], folder / "tile.webp"
        if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
            continue
        orig = ROOT / "images" / "originals" / pr["slug"] / src.name
        if orig.exists() and min(Image.open(orig).size) > min(Image.open(src).size):
            src = orig      # a taller original makes a sharper square
        im = Image.open(src).convert("RGB")
        side = min(im.size)
        left, top = (im.width - side) // 2, (im.height - side) // 2
        im = im.crop((left, top, left + side, top + side))
        if side > 1400:
            im = im.resize((1400, 1400), Image.LANCZOS)
        im.save(dst, "WEBP", quality=88, method=6)
        old = folder / "thumb.webp"
        if old.exists():
            old.unlink()


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


# Work strip: these tiles hang as upright rectangles (Juan, 2026-11-26)
TALL_TILES = {"american-promise", "the-conflicted-icon"}


# Back to top (Work and Gallery): shows once the page has scrolled half a
# window; sits where the settings button was, or above it when that is on
TO_TOP = ('  <button class="to-top" type="button" aria-label="Back to top" title="Back to top">'
          '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 15.5V4.5M5 9.5 10 4.5l5 5" fill="none" stroke="currentColor" stroke-width="1.3"/></svg></button>\n')


def ed_work():
    """Editorial test, Work: featured groups, then the rest, every project once."""
    from PIL import Image
    by = {p["slug"]: p for p in PROJECTS}

    def item(slug, role, img, g=None):
        p = by[slug]
        w, h = Image.open(ROOT / "images" / "work" / slug / img).size
        sub = f'<span class="edw-s">{html.escape(p["subtitle"])}</span>' if p.get("subtitle") else ""
        return (f'      <a class="edw-item edw-{role}" href="/work/{slug}/"{f' data-g="{g}"' if g is not None else ""}>'
                f'<span class="edw-img"><img src="/images/work/{slug}/{img}" width="{w}" height="{h}" '
                f'alt="{html.escape(p["title"])}" loading="lazy" decoding="async" draggable="false"></span>'
                f'<span class="edw-t">{html.escape(p["title"])}</span>{sub}</a>')
    feat = [it for g in ED_FEATURED for it in g]
    shown = {slug for slug, _, _ in feat}
    assert len(shown) == len(feat) and shown <= set(by), "ED_FEATURED: each project once"
    rest = ED_BELOW + [(p["slug"], "01.webp") for p in PROJECTS if p["slug"] not in shown and p["slug"] not in dict(ED_BELOW)]
    assert len(feat) + len(rest) == len(PROJECTS), "every project exactly once"
    return ('  <main class="ed ed-work">\n    <h1 class="visually-hidden">Work</h1>\n'
            # data-g = the row each project belongs to; site.js shuffles the rows and
            # the places within each row on every visit (Juan, 2026-11-27)
            '    <div class="edw-feat">\n' + "\n".join(item(*it, g=i) for i, grp in enumerate(ED_FEATURED) for it in grp) + '\n    </div>\n'
            + ('    <div class="edw-more">\n' + "\n".join(item(s, "sm", f) for s, f in rest) + '\n    </div>\n' if rest else '')
            + '  </main>\n')


# Gallery views (Juan, 2026-11-27). The real artworks so far: the six
# Gallery sketches, each a complete 2:3 portrait sheet (paper included in
# the image) at 8 x 12 in (Juan's file names: FOC_*_2x3_8x12). Each work
# once, in this fixed order. The older print series are mockups and stay off.
# Fields: series slug, number in its room, sheet family, orientation, sheet
# width, height, unit. Unknown values stay None (e.g. a work's own title).
# Sketches 4-6 are the same sheet turned: 3:2 landscape, 12 x 8 in.
GALLERY_WORKS = [("sketches", k, "2:3", "portrait", 8, 12, "in") for k in (1, 2, 3)] + \
                [("sketches", k, "3:2", "landscape", 12, 8, "in") for k in (4, 5, 6)]
# TEST HANG (Juan, 2026-11-27): until there are more series, the six sketches
# hang five times each (30), each turned upright or on its side at random (the
# turned copies in rot/), shuffled so neither a sketch nor an orientation runs
# on. Fixed seed, so the order holds between visits; change it to reshuffle.
GALLERY_TEST_SEED = 7


def gallery_test_hang():
    import random
    rnd = random.Random(GALLERY_TEST_SEED)
    out = []
    while len(out) < 30:
        cand = [(w, rnd.random() < .5) for w in GALLERY_WORKS for _ in range(5)]
        out = []
        for _ in range(2000):
            if not cand:
                break
            c = cand[rnd.randrange(len(cand))]
            (slug, k, fam, ori, w, h, u), turned = c
            o = ("landscape" if ori == "portrait" else "portrait") if turned else ori
            if out and out[-1][0][1] == k:
                continue
            if len(out) >= 2 and out[-1][1] == out[-2][1] == o:
                continue
            cand.remove(c)
            if turned:
                w, h, fam = h, w, ("3:2" if fam == "2:3" else "2:3")
            out.append(((slug, k, fam, o, w, h, u), o, turned))
    return out


def gallery_views():
    """Exhibition (design brief V3) and Wall (Claude's own) Gallery views."""
    from PIL import Image
    names = {slug: name for slug, name, *_ in PRINT_SERIES}
    years = {"sketches": "2026"}
    cells, wall = [], []
    hang = gallery_test_hang()
    sumw = sum(it[0][4] for it in hang)
    maxh = max(it[0][5] for it in hang)
    for (slug, k, fam, orient, w, h, unit), _, turned in gallery_test_hang():
        f = f"/images/prints/{slug}/{'rot/' if turned else ''}{k:02d}.webp"
        pw, ph = Image.open(ROOT / f.lstrip("/")).size
        title = f"{names[slug]}, No. {k}"
        meta = " \u00b7 ".join(x for x in [years.get(slug), f"{fam} {orient}", f"{w} \u00d7 {h} {unit}" if w else None] if x)
        img = (f'<img src="{f}" width="{pw}" height="{ph}" alt="{html.escape(title)}" '
               f'loading="lazy" decoding="async" draggable="false">')
        # captions as on the Current Index (Juan, round 6): [01] left, title right,
        # a fixed gap under each sheet, as wide as the sheet
        no = f"[{len(cells) + 1:02d}]"
        cells.append(f'      <li><a class="gx-cell" href="/prints/{slug}/#{k}"><span class="gx-stage">'
                     f'<span class="gx-sheet" style="--r:{w / h:.4f}">{img}'
                     f'<span class="gx-cap" data-no="{no}"><em>{html.escape(names[slug])}</em>, No. {k}</span></span></span></a></li>')
        wall.append(f'      <li><a class="gw-item" href="/prints/{slug}/#{k}" style="--w:{w};--h:{h}">'
                    f'<span class="gw-sheet">{img}</span>'
                    f'<span class="gw-label"><span class="gw-t">{html.escape(title)}</span>'
                    f'<span class="gw-m">{html.escape(meta)}</span></span></a></li>')
    return ('  <main class="gx gx-page">\n    <h1 class="visually-hidden">Gallery</h1>\n    <ol class="gx-grid">\n'
            + "\n".join(cells) + '\n    </ol>\n  </main>\n'
            f'  <main class="gw gw-page" style="--sumw:{sumw};--maxh:{maxh};--n:{len(hang)}">\n'
            '    <h1 class="visually-hidden">Gallery</h1>\n    <ol class="gw-row">\n'
            + "\n".join(wall) + '\n    </ol>\n  </main>\n')


def e2_work():
    """Editorial v2, Work: an index. Every project listed as a line of type on
    the left; the one under the cursor (or keyboard focus) shows large on the
    right, in its own proportions. The page stands still; nothing to scroll."""
    from PIL import Image
    cover = {s: f for g in ED_FEATURED for s, _, f in g}
    cover.update(dict(ED_BELOW))
    rows, imgs = [], []
    for i, p in enumerate(PROJECTS):
        f = cover.get(p["slug"], "01.webp")
        w, h = Image.open(ROOT / "images" / "work" / p["slug"] / f).size
        sub = f'<span class="e2w-s">{html.escape(p["subtitle"])}</span>' if p.get("subtitle") else ""
        rows.append(f'      <li><a href="/work/{p["slug"]}/" data-i="{i}"><span class="e2w-n">{i + 1:02d}</span>'
                    f'<span class="e2w-t">{html.escape(p["title"])}</span>{sub}</a></li>')
        src = f"/images/work/{p['slug']}/{f}"
        imgs.append(f'      <img {"src" if i == 0 else "data-src"}="{src}" width="{w}" height="{h}" alt="" decoding="async" draggable="false"{" class=\"is-on\"" if i == 0 else ""}>')
    return ('  <main class="ed2 e2-work">\n    <h1 class="visually-hidden">Work</h1>\n'
            '    <ol class="e2w-list">\n' + "\n".join(rows) + '\n    </ol>\n'
            '    <div class="e2w-view" aria-hidden="true">\n' + "\n".join(imgs) + '\n    </div>\n  </main>\n')


def e2_about(contact, legal):
    """Editorial v2, About: the drawing first, tall, in the ink colour as on the
    current page; the text beside it with the same hierarchy as Editorial."""
    contact = contact.replace(' id="email"', ' class="ed-email"').split("      <script>")[0]
    return ('  <main class="ed2 e2-about">\n    <h1 class="visually-hidden">About</h1>\n'
            '    <div class="e2a-fig" aria-hidden="true"><i></i><img class="e2a-sheet" src="/images/prints/sketches/02.webp" width="1000" height="1500" alt="" loading="lazy" decoding="async" draggable="false"></div>\n'
            '    <div class="e2a-text">\n'
            f'      <p class="eda-lead">{html.escape(ABOUT[0])}</p>\n'
            f'      <p class="eda-body">{html.escape(ABOUT[1])}</p>\n'
            '      <div class="eda-cred">\n' + "".join(f'        <p>{html.escape(t)}</p>\n' for t in ABOUT[2:]) + '      </div>\n'
            '      <div class="eda-contact">\n' + contact.replace('<h2 class="about-contact">', '<h2 class="eda-h">')
            + legal.replace('about-legal', 'eda-legal') + '      </div>\n    </div>\n  </main>\n')


def ed_about(contact, legal):
    """Editorial test, About: opening statement large, approach at body size,
    background quieter below, the drawing on its paper to the right, contact
    under the text. Same words as the current page."""
    from PIL import Image
    w, h = Image.open(ROOT / ED_ABOUT_DRAWING.lstrip("/")).size
    contact = contact.replace(' id="email"', ' class="ed-email"').replace("<script>", "<!--").replace("</script>", "-->")
    contact = contact.split("      <!--")[0]
    # one column on phones, in this order: opening, approach, drawing, background, contact
    return ('  <main class="ed ed-about">\n    <h1 class="visually-hidden">About</h1>\n'
            f'    <p class="eda-lead">{html.escape(ABOUT[0])}</p>\n'
            f'    <p class="eda-body">{html.escape(ABOUT[1])}</p>\n'
            f'    <figure class="eda-fig"><img src="{ED_ABOUT_DRAWING}" width="{w}" height="{h}" alt="Drawing by Juan De Marco" loading="lazy" decoding="async" draggable="false"></figure>\n'
            '    <div class="eda-cred">\n' + "".join(f'      <p>{html.escape(t)}</p>\n' for t in ABOUT[2:]) + '    </div>\n'
            '    <div class="eda-contact">\n' + contact.replace('<h2 class="about-contact">', '<h2 class="eda-h">') + legal.replace('about-legal', 'eda-legal') +
            '    </div>\n  </main>\n')


def main():
    global ASSET_V
    from PIL import Image
    ASSET_V = asset_version()
    thumbs()
    soma = next(p for p in PROJECTS if p["slug"] == "soma")
    ed_home = ('  <div class="ed ed-home-cap">\n'
               f'    <p class="edh-cap">{html.escape(soma["title"])}, {soma["meta"].split(" ")[0]}</p>\n'
               '    <a class="edh-go" href="/work/">Explore selected work <span aria-hidden="true">&rarr;</span></a>\n'
               '  </div>\n')
    e2_home = f'  <p class="e2-label">{html.escape(soma["title"])}, {soma["meta"].split(" ")[0]}</p>\n'
    # Home = the Editorial v2 home (Juan, 2026-11-27): full-screen work in a thin
    # mat with its wall label. The earlier full-bleed home and the Editorial
    # (framed) home are saved in VERSIONS.md; ed_home stays here, unused.
    write("index.html", page("Home", "home", HOME_BODY + e2_home, "home"))

    cards = "\n".join(
        f'      <a class="card" href="/work/{p["slug"]}/"{" data-tall=\"1\"" if p["slug"] in TALL_TILES else ""}>\n'
        f'        <img src="/images/work/{p["slug"]}/tile.webp" alt="{html.escape(p["title"])}" loading="lazy" decoding="async">\n'
        f'        <span class="card-title">{html.escape(p["title"])}</span>\n'
        f'      </a>' for p in PROJECTS)
    write("work/index.html", page("Work", "work",
        f'  <main class="page page-wide work-page">\n    <h1 class="work-h">Work</h1>\n    <div class="grid">\n{cards}\n    </div>\n  </main>\n'
        + ed_work() + e2_work() + TO_TOP, "inner has-ed pg-work"))

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
        # The room shows the secondary title, not year/medium (Juan, 2026-11-27);
        # "meta" (year · medium) stays in PROJECTS for later use (e.g. the Gallery).
        sub = f'        <p class="meta">{html.escape(p["subtitle"])}</p>\n' if p.get("subtitle") else ""
        text = "\n".join(f"      <p>{html.escape(t)}</p>" for t in p.get("text", ["Description coming soon."]))
        # Project pages use the Gallery print-room format (Juan, 2026-11-26):
        # name and menu step away, one image at a time centred, its frame in the
        # image's own proportions, arrows either side, count + magnifier under
        # it, the label to the right, x back to Work.
        dims = [Image.open(ROOT / "images" / "work" / p["slug"] / f).size for f in files]
        rslides = "\n".join(
            f'        <img class="slide contain{" is-on" if k == 0 else ""}" {"src" if k == 0 else "data-src"}="/images/work/{p["slug"]}/{f}" '
            f'data-r="{dims[k][0] / dims[k][1]:.4f}" alt="{html.escape(p["title"])}, image {k + 1} of {len(files)}" decoding="async" draggable="false">'
            for k, f in enumerate(files))
        title = html.escape(p["title"])
        # one short description, in the print rooms' series-line style (Juan, 2026-11-27)
        desc = f'        <p class="room-desc">{html.escape(p["desc"])}</p>\n' if p.get("desc") else ""
        body = f"""  <main class="room-page project-room">
    <div class="room-top">
      <span class="room-where"><a href="/work/">Work</a> / {title}</span>
      <a class="room-close" href="/work/" aria-label="Close and go back to Work">&times;</a>
    </div>
    <div class="room-layout" style="--ratio:{dims[0][0] / dims[0][1]:.4f}">
      <div class="slideshow room-show" data-count="{len(files)}">
        <div class="frame">
{rslides}
          <button class="slide-btn prev" type="button" aria-label="Previous image">&lsaquo;</button>
          <button class="slide-btn next" type="button" aria-label="Next image">&rsaquo;</button>
        </div>
        <div class="room-under"><div class="slide-count"><span class="slide-i">1</span> / {len(files)}</div>
          <button class="room-zoom" type="button" aria-pressed="false" aria-label="Magnify" title="Magnify"><svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M13 13l5 5" stroke="currentColor" stroke-width="1.3"/></svg></button></div>
      </div>
      <div class="room-text">
        <h1>{title}</h1>
{sub}{desc}        <nav class="project-nav room-pnav" aria-label="Projects">
          <a href="/work/{prev_p["slug"]}/" title="{html.escape(prev_p["title"])}">&lsaquo; Prev</a>
          <a href="/work/{next_p["slug"]}/" title="{html.escape(next_p["title"])}">Next &rsaquo;</a>
        </nav>
      </div>
    </div>
  </main>
"""
        write(f"work/{p['slug']}/index.html", page(p["title"], "work", body, "inner room"))

    # Prints. MOCKUP: 2:3 sheets cut from existing drawings by tools/print_mockups.py.
    # Each series opens as its own "room": one print at a time, text to the side.
    # Free placement: prints are shuffled, then packed row by row on a 12-column
    # grid with random widths, gaps and drops (fixed seed, so it's stable between builds).
    import random
    rnd = random.Random(23)

    def bare_attr(slug, f):   # the same print without its paper, when there is one
        d, _, name = f.rpartition("/")
        b = (d + "/" if d else "") + "bare/" + name
        if not (ROOT / "images" / "prints" / slug / b).exists():
            return ""
        return f' data-bare="/images/prints/{slug}/{b}"' + (' data-ink="1"' if slug == "sketches" else "")
    allp = []
    for slug, name, source, blurb in PRINT_SERIES:
        files = sorted(f.name for f in (ROOT / "images" / "prints" / slug).glob("[0-9]*.webp"))
        for k, f in enumerate(files):
            w, h = Image.open(ROOT / "images" / "prints" / slug / f).size
            allp.append((slug, name, k, f, w, h))
    # Gallery test (Juan, 2026-11-25): only the six Gallery sketches, each hung
    # five times, so the wall shows 30 prints. The older mockup series keep their
    # rooms but are off the wall for now.
    allp_all = allp
    six = [p for p in allp if p[0] == "sketches"]
    allp = []
    for _ in range(5):   # five rounds of all six, so a row never repeats a print
        r = six[:]
        rnd.shuffle(r)
        while allp and r[0] == allp[-1]:
            rnd.shuffle(r)
        allp += r
    # a few of the line drawings hang turned a quarter (Juan, 2026-11-25)
    allp = [(sl, nm, k, "rot/" + f, h, w) if rnd.random() < 0.27 else (sl, nm, k, f, w, h)
            for sl, nm, k, f, w, h in allp]
    # SOMA prints were on the wall in PR #48; off for now (Juan, 2026-11-26)
    # Gallery wall: shuffled prints of random sizes on a 12-column grid with one
    # gutter size both ways; site.js sets each print's height in 4px rows (masonry).
    items = []
    for slug, name, k, f, w, h in allp:
        size = rnd.choice([0.55, 0.75, 1, 1, 1.3, 1.6, 2.1, 2.7])
        items.append(
            f'      <a class="print" href="/prints/{slug}/#{k + 1}" data-size="{size}">\n'
            f'        <img src="/images/prints/{slug}/{f}"{bare_attr(slug, f)} width="{w}" height="{h}" alt="{name}, print {k + 1}" loading="lazy" decoding="async" draggable="false">\n'
            f'        <span class="print-cap"><em>{name}</em>, No. {k + 1}</span>\n      </a>')
    for slug, name, source, blurb in PRINT_SERIES:
        files = sorted(f.name for f in (ROOT / "images" / "prints" / slug).glob("[0-9]*.webp"))
        pw, ph = Image.open(ROOT / "images" / "prints" / slug / files[0]).size
        fmt = min(["2:3", "3:2", "3:4", "4:3", "1:1"], key=lambda r: abs(int(r[0]) / int(r[2]) - pw / ph)) + " format"
        if slug in ("renderings", "soma"):
            fmt = "Original proportions"
        dims = [Image.open(ROOT / "images" / "prints" / slug / f).size for f in files]
        slides = "\n".join(
            f'        <img class="slide contain{" is-on" if k == 0 else ""}" {"src" if k == 0 else "data-src"}="/images/prints/{slug}/{f}" '
            f'data-r="{dims[k][0] / dims[k][1]:.4f}" alt="{name}, print {k + 1} of {len(files)}" decoding="async" draggable="false">' for k, f in enumerate(files))
        mock = "" if slug == "sketches" else '        <p class="room-mock">Mockup: sections of existing drawings stand in for the final prints.</p>'
        room = f"""  <main class="room-page">
    <div class="room-top">
      <span class="room-where"><a href="/prints/">Gallery</a> / {name}</span>
      <a class="room-close" href="/prints/" aria-label="Close and go back to the Gallery">&times;</a>
    </div>
    <div class="room-layout" style="--ratio:{pw / ph:.4f}">
      <div class="slideshow room-show" data-count="{len(files)}">
        <div class="frame">
{slides}
          <button class="slide-btn prev" type="button" aria-label="Previous print">&lsaquo;</button>
          <button class="slide-btn next" type="button" aria-label="Next print">&rsaquo;</button>
        </div>
        <div class="room-under"><div class="slide-count"><span class="slide-i">1</span> / {len(files)}</div>
          <button class="room-zoom" type="button" aria-pressed="false" aria-label="Magnify" title="Magnify"><svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M13 13l5 5" stroke="currentColor" stroke-width="1.3"/></svg></button></div>
      </div>
      <div class="room-text">
        <h1>{name}</h1>
        <p class="meta">Series of {len(files)} &middot; {fmt} &middot; {source}</p>
        <p>{blurb}</p>
        <p class="room-buy">Print options coming soon</p>
{mock}
      </div>
    </div>
  </main>
"""
        write(f"prints/{slug}/index.html", page(f"{name} \u00b7 Gallery", "prints", room, "inner room"))
    write("prints/index.html", page("Gallery", "prints",
        '  <main class="page page-wide prints-page">\n    <h1 class="visually-hidden">Gallery</h1>\n'
        '    <div class="prints">\n' + "\n".join(items) + '\n    </div>\n  </main>\n' + gallery_views()
        + TO_TOP, "inner has-ed pg-gal"))

    about = "\n".join(f"      <p>{html.escape(t)}</p>" for t in ABOUT)
    about_block = f"      <h1>About</h1>\n{about}\n"

    def stacked(content):
        # Every text page sits in a box the size of the About text, so titles
        # and text land in the same place on About, Contact and Login.
        return (f'  <main class="page stacked{" at-bottom" if TEXT_POSITION == "bottom" else ""}">\n    <div class="stack">\n'
                f'    <div class="stack-sizer" aria-hidden="true">\n{about_block}    </div>\n'
                f'    <div class="stack-content">\n{content}    </div>\n    </div>\n  </main>\n')

    contact = f"""      <h2 class="about-contact">Contact</h2>
      <p class="about-ask">For commissions, collaborations and studio inquiries:</p>
      <p class="email"><a id="email" href="/about/">{EMAIL_USER} [at] {EMAIL_DOMAIN}</a></p>
      <script>
      // Assemble the address in the browser so simple spam bots can't read it from the page.
      (function () {{
        var a = document.getElementById('email'), e = {json.dumps(EMAIL_USER)} + '@' + {json.dumps(EMAIL_DOMAIN)};
        a.href = 'mailto:' + e; a.textContent = e;
      }})();
      </script>
"""
    # About and Contact are one page now: About text, then the contact text below.
    legal = f'      <p class="about-legal">&copy; Juan De Marco | <span class="yr">{YEAR}</span></p>\n'
    # About (Juan, 2026-11-27, round 3): Gallery sketch 02 only, frameless,
    # its drawing (not the sheet) fitted to the box Juan marked right of the
    # text, in the text's own colour (style.css .about-sketch). It is drawn as
    # a mask, so it fades in once the image has loaded. The mask is a ready-
    # shrunk copy near the shown size (tools/about_sketch.py, Juan 2026-11-27:
    # the browser's own shrink of a mask broke the fine lines up).
    sketch = ('  <div class="about-sketch" aria-hidden="true"><i></i></div>\n'
              '  <script>\n    (function () {\n'
              '      var el = document.querySelector(".about-sketch i");\n'
              '      if (!el) return;\n'
              '      // the ready-shrunk copy nearest the size shown (tools/about_sketch.py)\n'
              '      var W = [300, 360, 440, 540, 707], cur = 0;\n'
              '      function pick() {\n'
              '        var need = el.getBoundingClientRect().width * (window.devicePixelRatio || 1), w = W[W.length - 1];\n'
              '        for (var i = 0; i < W.length; i++) if (W[i] >= need * 0.97) { w = W[i]; break; }\n'
              '        if (w === cur) return; cur = w;\n'
              '        var src = "/images/about/sketch-02-" + w + ".webp", im = new Image();\n'
              '        im.onload = function () { el.style.setProperty("--sk", \'url("\' + src + \'")\'); el.classList.add("loaded"); };\n'
              '        im.src = src;\n'
              '      }\n'
              '      pick();\n'
              '      addEventListener("resize", function () { clearTimeout(pick.t); pick.t = setTimeout(pick, 200); });\n'
              '    })();\n  </script>\n')
    write("about/index.html", page("About", "about", stacked(about_block + contact + legal) + sketch + ed_about(contact, legal) + e2_about(contact, legal), "inner photo has-ed"))
    # Old /contact/ links land on About.
    write("contact/index.html", '<!doctype html>\n<meta charset="utf-8">\n<title>About</title>\n'
          '<meta http-equiv="refresh" content="0; url=/about/">\n<link rel="canonical" href="/about/">\n'
          '<a href="/about/">About</a>\n')
    print("built", 5 + len(PROJECTS), "pages")


if __name__ == "__main__":
    main()
