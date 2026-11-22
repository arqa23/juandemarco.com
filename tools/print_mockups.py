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
LONG, MARGIN = 1600, 0.05         # sheet's long side in px; even white margin (x long side)
# Standard print formats, width:height
RATIOS = {"2:3": (2, 3), "3:2": (3, 2), "3:4": (3, 4), "4:3": (4, 3), "1:1": (1, 1)}

# series slug: (format, list of (source image, how many sections to cut from it))
SERIES = {
    "silhouettes": ("2:3", [("march-of-the-silhouettes/02", 2), ("march-of-the-silhouettes/03", 2),
                    ("march-of-the-silhouettes/04", 2), ("march-of-the-silhouettes/06", 1),
                    ("march-of-the-silhouettes/07", 2)]),
    "elevations": ("3:2", [("american-promise/03", 2, 0.5), ("american-promise/05", 2, 0.5)]),
    "lines": ("3:4", [("the-conflicted-icon/09", 1), ("frankls-purposive-intention/03", 1),
              ("frankls-purposive-intention/04", 1), ("frankls-purposive-intention/05", 1), ("frankls-purposive-intention/06", 1),
              ("the-conflicted-icon/09", 1, 0.6)]),
    "fields": ("4:3", [("julius/06", 1), ("julius/07", 1), ("julius/08", 1), ("julius/09", 1), ("julius/07", 1, 0.55), ("julius/08", 1, 0.55)]),
    "plans": ("1:1", [("parnell-residence/02", 1), ("parnell-residence/03", 1),
              ("parnell-residence/04", 1), ("talbot-road-residence/02", 1), ("talbot-road-residence/03", 1),
              ("parnell-residence/03", 1, 0.5), ("parnell-residence/04", 1, 0.5)]),
}


def sections(im, n, ART, zoom=1.0):
    """The n densest windows of proportion ART (scaled by zoom) in the drawing."""
    box = white_margins(im)
    if box:
        im = im.crop(box)
    h = im.height
    w = round(h * ART)
    if w > im.width:                       # window wider than the drawing: use full width
        w = im.width; h = round(w / ART)
    w, h = round(w * zoom), round(h * zoom)
    ink = (np.asarray(im.convert("L")) < 200).astype(np.float64)
    S = np.pad(ink.cumsum(0).cumsum(1), ((1, 0), (1, 0)))
    step = max(1, min(w, h) // 12)
    cands = [(S[y + h, x + w] - S[y, x + w] - S[y + h, x] + S[y, x], x, y)
             for y in range(0, im.height - h + 1, step) for x in range(0, im.width - w + 1, step)]
    cands.sort(reverse=True)
    picked = []
    for _, x, y in cands:
        if all(abs(x - px) >= w * 0.6 or abs(y - py) >= h * 0.6 for px, py in picked):
            picked.append((x, y))
        if len(picked) == n:
            break
    return [im.crop((x, y, x + w, y + h)) for x, y in sorted(picked)]


def main():
    import shutil
    for slug, (fmt, srcs) in SERIES.items():
        rw, rh = RATIOS[fmt]
        W, H = (LONG * rw // max(rw, rh), LONG * rh // max(rw, rh))
        M = round(LONG * MARGIN)
        art = (W - 2 * M) / (H - 2 * M)
        folder = OUT / slug
        shutil.rmtree(folder, ignore_errors=True)
        folder.mkdir(parents=True)
        k = 0
        for name, n, *zoom in srcs:
            for part in sections(Image.open(SRC / f"{name}.webp").convert("RGB"), n, art, *zoom):
                k += 1
                sheet = Image.new("RGB", (W, H), "white")
                sheet.paste(part.resize((W - 2 * M, H - 2 * M), Image.LANCZOS), (M, M))
                sheet.save(folder / f"{k:02d}.webp", "WEBP", quality=84, method=6)
        print(slug, fmt, k, (W, H))


if __name__ == "__main__":
    main()
