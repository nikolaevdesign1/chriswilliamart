#!/bin/sh
# Builds the lightweight copies the field, list and ripple use. The originals
# stay for the work page, where a picture is shown large.
# Tiles are at most ~460 CSS px wide (690 tall), so 960px on the long side
# covers a 2x screen without shipping the full file. sips only takes named
# quality levels here; "low" is invisible once a tile is scaled down.
set -e
cd "$(dirname "$0")/../src/assets/img"
for src in art/*.jpg; do
  out="../thumbs/$src"
  mkdir -p "$(dirname "$out")"
  sips -Z 960 -s format jpeg -s formatOptions low "$src" --out "$out" >/dev/null
done
