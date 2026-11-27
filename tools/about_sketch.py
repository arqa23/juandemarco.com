"""About page sketch (Juan, 2026-11-27): the browser shrinks a CSS mask with a
rough filter, so the fine lines of the 1000 x 1500 sketch broke up into dashes
at some angles. This writes the drawing (cropped to its lines) ready-shrunk to a
few widths with a proper filter and lossless alpha; the About page picks the
one nearest the size it is shown at, so the browser barely rescales it.
Line weight is unchanged: the shrink keeps each line's coverage.

Run: python3 tools/about_sketch.py   (then tools/build.py)
"""
import pathlib
import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "images" / "prints" / "sketches" / "bare" / "02.webp"
OUT = ROOT / "images" / "about"
BOX = (121, 171, 828, 1258)          # the drawing's own bounds in the sheet
WIDTHS = [300, 360, 440, 540, 707]   # 707 = full size


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    a = Image.open(SRC).convert("RGBA").crop(BOX).getchannel("A")
    W, H = a.size
    af = a.convert("F")
    for w in WIDTHS:
        h = round(H * w / W)
        r = af if w == W else af.resize((w, h), Image.LANCZOS)
        al = Image.fromarray(np.clip(np.asarray(r), 0, 255).round().astype("uint8"), "L")
        im = Image.new("RGBA", al.size, (0, 0, 0, 0))
        im.putalpha(al)
        im.save(OUT / f"sketch-02-{w}.webp", lossless=True, quality=100, method=6)
        print(w, h)


if __name__ == "__main__":
    main()
