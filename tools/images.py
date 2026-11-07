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

Run:  python3 tools/images.py   then   python3 tools/build.py
"""
import json, pathlib
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


def main():
    display = {}
    for src in sorted(SRC.glob("*/[0-9]*.webp")):
        key = f"{src.parent.name}/{src.stem}"
        rule = {**RULES["default"], **RULES.get(key, {})}
        im = Image.open(src).convert("RGB")
        box = white_margins(im) if rule.get("trim") == "auto" else None
        if box:
            im = im.crop(box)
        fit = rule.get("fit", "auto")
        if fit == "auto":
            fit = "contain" if box else "cover"
        dst = OUT / src.parent.name / src.name
        dst.parent.mkdir(parents=True, exist_ok=True)
        im.save(dst, "WEBP", quality=88, method=6)
        entry = {"fit": fit}
        if rule.get("focus"):
            entry["focus"] = rule["focus"]
        display[f"{src.parent.name}/{src.name}"] = entry
    (OUT / "display.json").write_text(json.dumps(display, indent=1))
    print("processed", len(display), "images")


if __name__ == "__main__":
    main()
