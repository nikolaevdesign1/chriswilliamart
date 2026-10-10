"""Builds the web copies of every image the site ships.

- Full-size paintings (work page): longest side 1600 px, WebP.
- Thumbnails (field, list, mobile, ripple): longest side 960 px, WebP.
- Room photos (work page mockups): WebP at their original size.

The JPEGs in src/assets/img/art and src/assets/img/rooms stay as masters and
are never bundled. Run after adding or replacing an image:

    python3 scripts/make-thumbs.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent / "src" / "assets"


def save(src, dest, long_side, quality):
    image = Image.open(src).convert("RGB")
    if long_side:
        image.thumbnail((long_side, long_side), Image.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    image.save(dest, "WEBP", quality=quality, method=6)
    return dest.stat().st_size


total = 0
for src in sorted((ROOT / "img" / "art").glob("*.jpg")):
    total += save(src, src.with_suffix(".webp"), 1600, 70)
    total += save(src, ROOT / "thumbs" / "art" / f"{src.stem}.webp", 960, 55)
for src in sorted((ROOT / "img" / "rooms").glob("*.jpg")):
    total += save(src, src.with_suffix(".webp"), None, 84)
print(f"wrote {total / 1024 / 1024:.1f} MB of WebP")
