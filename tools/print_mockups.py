#!/usr/bin/env python3
"""MOCKUP prints for the Prints pages: 2:3 vertical sheets cut from sections of
existing drawings (images/originals, never changed). Placeholder art only, until
real print files are chosen. Writes images/prints/<series>/NN.webp.

Run:  python3 tools/print_mockups.py   then   python3 tools/build.py
"""
import pathlib, sys
import numpy as np
from PIL import Image
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from images import white_margins

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / "images" / "originals", ROOT / "images" / "prints"
W, H, M = 1067, 1600, 80          # 2:3 sheet, even white margin
ART = (W - 2 * M) / (H - 2 * M)   # proportion of the drawing inside the margin

# series slug: list of (source image, how many sections to cut from it)
SERIES = {
    "silhouettes": [("march-of-the-silhouettes/02", 1), ("march-of-the-silhouettes/03", 1),
                    ("march-of-the-silhouettes/04", 1), ("march-of-the-silhouettes/06", 1),
                    ("march-of-the-silhouettes/07", 1)],
    "elevations": [("american-promise/03", 2), ("american-promise/05", 2)],
    "lines": [("the-conflicted-icon/09", 1), ("frankls-purposive-intention/03", 1),
              ("frankls-purposive-intention/04", 1), ("frankls-purposive-intention/05", 1)],
    "fields": [("julius/06", 1), ("julius/07", 1), ("julius/08", 1), ("julius/09", 1)],
    "plans": [("parnell-residence/02", 1), ("parnell-residence/03", 1),
              ("parnell-residence/04", 1), ("talbot-road-residence/02", 1)],
}


def sections(im, n):
    """The n densest 2:3 windows of the drawing, not overlapping."""
    box = white_margins(im)
    if box:
        im = im.crop(box)
    h = im.height
    w = round(h * ART)
    if w > im.width:                       # tall drawing: use full width instead
        w = im.width; h = round(w / ART)
    ink = (np.asarray(im.convert("L")) < 200).astype(np.float32)
    cols = ink[:h].sum(0)
    cum = np.concatenate([[0], np.cumsum(cols)])
    xs = list(range(0, im.width - w + 1, max(1, w // 8)))
    xs.sort(key=lambda x: -(cum[x + w] - cum[x]))
    picked = []
    for x in xs:
        if all(abs(x - p) >= w for p in picked):
            picked.append(x)
        if len(picked) == n:
            break
    return [im.crop((x, 0, x + w, h)) for x in sorted(picked)]


def main():
    for slug, srcs in SERIES.items():
        folder = OUT / slug
        folder.mkdir(parents=True, exist_ok=True)
        k = 0
        for name, n in srcs:
            for part in sections(Image.open(SRC / f"{name}.webp").convert("RGB"), n):
                k += 1
                sheet = Image.new("RGB", (W, H), "white")
                sheet.paste(part.resize((W - 2 * M, H - 2 * M), Image.LANCZOS), (M, M))
                sheet.save(folder / f"{k:02d}.webp", "WEBP", quality=84, method=6)
        print(slug, k)


if __name__ == "__main__":
    main()
