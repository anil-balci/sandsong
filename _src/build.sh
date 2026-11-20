#!/bin/sh
# Rebuilds every generated file of the site, from this repo alone: the plate is drawn by _src/vendor/plate.js (a copy
# of the design kit) and the font is subset from _src/vendor/Jost[wght].ttf (OFL, _src/vendor/OFL.txt). Needs Google
# Chrome, python3 with Pillow and numpy; fonts need fontTools.
#   sh _src/build.sh            images and icons
#   sh _src/build.sh fonts      also re-subset Jost from _src/vendor/Jost[wght].ttf
set -eu
cd "$(dirname "$0")/.."
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
TMP=$(mktemp -d)
shot() { "$CHROME" --headless --disable-gpu --hide-scrollbars --allow-file-access-from-files --virtual-time-budget=4000 "$@" 2>/dev/null; }
shot --force-device-scale-factor=1 --window-size=1200,630 --screenshot="$TMP/og.png" "file://$PWD/_src/og.html"
shot --force-device-scale-factor=2 --window-size=1080,480 --screenshot="$TMP/plate.png" "file://$PWD/_src/plate.html?w=1080&h=480&dpr=2&hour=9&grains=16000"
python3 -P - "$TMP" <<'PY'
import sys
from PIL import Image
t = sys.argv[1]
og = Image.open(t + '/og.png').convert('RGB'); assert og.size == (1200, 630), og.size
og.save('og.jpg', quality=82, optimize=True, progressive=True)
p = Image.open(t + '/plate.png').convert('RGB'); assert p.size == (2160, 960), p.size
p.save('img/plate-2160.webp', quality=72, method=6)
p.resize((1080, 480), Image.LANCZOS).save('img/plate-1080.webp', quality=80, method=6)
print('og.jpg img/plate-2160.webp img/plate-1080.webp')
PY
python3 -P _src/ground.py
python3 -P _src/icons.py
if [ "${1:-}" = fonts ]; then python3 -P _src/mkfont.py "_src/vendor/Jost[wght].ttf" fonts/jost-latin-300-500.woff; fi
rm -rf "$TMP"
