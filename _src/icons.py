"""_src/icons.py: favicons from the app icon (icon.png, 256 px): favicon.ico (16, 32, 48), favicon-32.png,
apple-touch-icon.png (180, opaque; iOS rounds the corners), img/icon-96.png (the header mark at 48 pt, 2x).
usage (from site/): python3 -P _src/icons.py"""
from PIL import Image
src = Image.open('icon.png').convert('RGB')
src.save('favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
src.resize((32, 32), Image.LANCZOS).save('favicon-32.png', optimize=True)
src.resize((180, 180), Image.LANCZOS).save('apple-touch-icon.png', optimize=True)
src.resize((96, 96), Image.LANCZOS).save('img/icon-96.png', optimize=True)
print('favicon.ico favicon-32.png apple-touch-icon.png img/icon-96.png')
