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
        bare = Image.fromarray(rgba, "RGBA")
        bare.save(OUT / "bare" / f"{n:02d}.webp", quality=88, method=6)
        # the same print turned a quarter clockwise (a few hang this way on the wall)
        (OUT / "rot" / "bare").mkdir(parents=True, exist_ok=True)
        sheet.transpose(Image.ROTATE_270).save(OUT / "rot" / f"{n:02d}.webp", quality=86, method=6)
        bare.transpose(Image.ROTATE_270).save(OUT / "rot" / "bare" / f"{n:02d}.webp", quality=88, method=6)
        print(f.name, "->", f"{n:02d}.webp", sheet.size)
    soma_bare()


def soma_bare():
    """SOMA prints without their white sheet: the margin becomes clear, the
    colour field stays, same size as the framed copy."""
    src = ROOT / "images" / "prints" / "soma"
    (src / "bare").mkdir(exist_ok=True)
    for f in sorted(src.glob("[0-9]*.webp")):
        im = Image.open(f).convert("RGB")
        a = np.asarray(im).astype(int)
        ink = (a < 246).any(2)
        rows, cols = np.where(ink.mean(1) > 0.5)[0], np.where(ink.mean(0) > 0.5)[0]
        alpha = np.zeros(ink.shape, np.uint8)
        alpha[rows.min():rows.max() + 1, cols.min():cols.max() + 1] = 255
        rgba = np.dstack([a.astype(np.uint8), alpha])
        Image.fromarray(rgba, "RGBA").save(src / "bare" / f.name, quality=88, method=6)
        print("soma", f.name)


if __name__ == "__main__":
    main(sys.argv[1])
