"""Gallery sketches (Juan, 2026-11-25): the six FOC preview files from
JUANDEMARCO-COM/SKs/20261125_GallerySKs on Juan's PC.

For each preview: crop off the grey backdrop to the white sheet (framed print,
images/prints/sketches/NN.webp) and make a "bare" copy with the paper removed,
only the drawn lines left on a transparent ground (images/prints/sketches/bare/NN.webp).
Both copies have the same size, so the Gallery layout does not change between them.

Usage: python3 tools/gallery_sketches.py <folder with the preview .jpg files>
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "images" / "prints" / "sketches"
LONG = 1500   # long side of the web copies


def main(src):
    files = sorted(Path(src).glob("*.jpg"))
    (OUT / "bare").mkdir(parents=True, exist_ok=True)
    for n, f in enumerate(files, 1):
        im = Image.open(f).convert("RGB")
        g = np.asarray(im.convert("L"))
        paper = g >= 250
        rows = np.where(paper.mean(1) > 0.5)[0]
        cols = np.where(paper.mean(0) > 0.5)[0]
        sheet = im.crop((cols.min(), rows.min(), cols.max() + 1, rows.max() + 1))
        k = LONG / max(sheet.size)
        sheet = sheet.resize((round(sheet.width * k), round(sheet.height * k)), Image.LANCZOS)
        sheet.save(OUT / f"{n:02d}.webp", quality=86, method=6)
        L = np.asarray(sheet.convert("L")).astype(float)
        a = np.clip((242 - L) / 200, 0, 1) ** 0.85 * 255   # white paper -> clear, ink -> solid
        rgba = np.zeros((sheet.height, sheet.width, 4), np.uint8)
        rgba[..., 3] = a.astype(np.uint8)
        Image.fromarray(rgba, "RGBA").save(OUT / "bare" / f"{n:02d}.webp", quality=88, method=6)
        print(f.name, "->", f"{n:02d}.webp", sheet.size)


if __name__ == "__main__":
    main(sys.argv[1])
