"""_src/ground.py: the page's brushed-metal ground, one seamless tile (img/ground.webp).
Horizontal streaks around #0a0c0f, a few levels either way, wrapped so the tile repeats without a seam.
usage (from site/): python3 -P _src/ground.py"""
import numpy as np
from PIL import Image
W, H = 640, 320
rng = np.random.default_rng(7)
base = np.array([10, 12, 15], float)
field = np.zeros((H, W))
for scale, amp in ((240, 0.7), (64, 0.8), (14, 0.8)):
    rows = rng.normal(0, 1, (H, W))
    k = np.ones(scale) / scale
    # circular box blur along x: long streaks that wrap around the tile edge
    f = np.fft.irfft(np.fft.rfft(rows, axis=1) * np.fft.rfft(np.pad(k, (0, W - scale)), axis=0)[None, :], n=W, axis=1)
    field += amp * f / f.std()
img = np.clip(base[None, None, :] + field[:, :, None] * np.array([0.9, 1.0, 1.15]) * 0.75, 0, 255)
Image.fromarray(img.round().astype(np.uint8), 'RGB').save('img/ground.webp', quality=90, method=6)
print('img/ground.webp', img.mean(axis=(0, 1)).round(1), img.min(), img.max())
