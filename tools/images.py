#!/usr/bin/env python3
"""Makes the display images in images/work/ from the untouched originals in images/originals/.

The originals are never changed. Rules live in tools/image_rules.json:

  "default": how every image is treated unless it has its own entry
  "<project>/<NN>": per-image overrides, for example
      "american-promise/05": {"trim": false, "fit": "cover", "focus": "50% 30%"}

Options
  trim   "auto"  cut white margins off when they are wider than 3% of the image
         false   keep the image exactly as it is
  fit    "auto"  "contain" if margins were trimmed, otherwise "cover"
         "cover" fill the frame, cropping the edges
         "contain" show the whole image inside the frame
  focus  which part stays in view when cropped, "x% y%" (50% 50% = centre)
  skip   true   leave this image out of the project page
  scale  0.9    shrink the image to 90% and fill the freed edge with its own
                background colour, so the canvas keeps its size
  fill   "auto" (sample the image's edge colour) or a colour like "#ffffff"
  clear  "lr" / "tb" / "all"  make the solid white bands on those sides
                see-through, so the page colour shows instead (Light, Dark,
                White, Black). Size and zoom stay exactly as before.

Run:  python3 tools/images.py   then   python3 tools/build.py
"""
import json, pathlib, shutil
import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / "images" / "originals", ROOT / "images" / "work"
RULES = json.loads((ROOT / "tools" / "image_rules.json").read_text())


def white_margins(im):
    a = np.asarray(im.convert("L"))
    h, w = a.shape
    m = a < 238
    rows, cols = np.where(m.mean(1) > 0.004)[0], np.where(m.mean(0) > 0.004)[0]
    if not len(rows) or not len(cols):
        return None
    t, b, l, r = rows[0], h - 1 - rows[-1], cols[0], w - 1 - cols[-1]
    if max(t / h, b / h, l / w, r / w) <= 0.03:
        return None
    return (int(l), int(t), int(w - r), int(h - b))


def edge_colour(im):
    a = np.asarray(im.convert("RGB"))
    e = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    return tuple(int(v) for v in np.median(e, 0))


def scale_down(im, k, fill):
    w, h = im.size
    colour = edge_colour(im) if fill in (None, "auto") else fill
    small = im.resize((round(w * k), round(h * k)), Image.LANCZOS)
    out = Image.new("RGB", (w, h), colour)
    out.paste(small, ((w - small.width) // 2, (h - small.height) // 2))
    return out


def clear_bands(im, sides):
    """Solid white bands at the chosen edges become transparent."""
    a = np.asarray(im.convert("RGB"))
    white = a.min(2) >= 246
    alpha = np.full(white.shape, 255, np.uint8)

    def run(frac):
        n = 0
        while n < len(frac) and frac[n] > 0.995:
            n += 1
        return n
    if sides in ("lr", "all"):
        c = white.mean(0)
        l, r = run(c), run(c[::-1])
        alpha[:, :l] = 0
        if r:
            alpha[:, -r:] = 0
    if sides in ("tb", "all"):
        rw = white.mean(1)
        t, b = run(rw), run(rw[::-1])
        alpha[:t] = 0
        if b:
            alpha[-b:] = 0
    out = im.convert("RGBA")
    out.putalpha(Image.fromarray(alpha))
    return out


def main():
    display = {}
    made = set()
    for src in sorted(SRC.glob("*/[0-9]*.webp")):
        key = f"{src.parent.name}/{src.stem}"
        rule = {**RULES["default"], **RULES.get(key, {})}
        if rule.get("skip"):
            continue
        im = Image.open(src).convert("RGB")
        box = white_margins(im) if rule.get("trim") == "auto" else None
        if box:
            im = im.crop(box)
        changed = bool(box)
        if rule.get("scale"):
            im, changed = scale_down(im, rule["scale"], rule.get("fill")), True
        if rule.get("clear"):
            im, changed = clear_bands(im, rule["clear"]), True
        fit = rule.get("fit", "auto")
        if fit == "auto":
            fit = "contain" if box else "cover"
        dst = OUT / src.parent.name / src.name
        dst.parent.mkdir(parents=True, exist_ok=True)
        made.add(dst)
        if changed:
            im.save(dst, "WEBP", quality=90, method=6)
        else:
            shutil.copyfile(src, dst)   # untouched: an exact copy of the original
        entry = {"fit": fit}
        if rule.get("focus"):
            entry["focus"] = rule["focus"]
        display[f"{src.parent.name}/{src.name}"] = entry
    for old in OUT.glob("*/[0-9]*.webp"):   # images that were skipped or removed
        if old not in made:
            old.unlink()
    (OUT / "display.json").write_text(json.dumps(display, indent=1))
    print("processed", len(display), "images")


if __name__ == "__main__":
    main()
