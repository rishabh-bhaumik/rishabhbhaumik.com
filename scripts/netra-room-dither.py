"""
The room behind /netra's whiteboard photo (NetraWhiteboard), in black and white: Figma's 2x
render of the layer (its lens distortion and fine dither baked in) taken to grey, darkened
(gamma 2.5, so the pale walls sit mid-grey), then ordered-dithered in pure black and white
(Bayer 8×8) on 3px cells, about 1.5 CSS px at the frame's full size.

Usage: python3 scripts/netra-room-dither.py <bg.png> <out.webp>
  bg.png: <IGNORE>/media-sources/netra-whiteboard/bg.png (2400 × 1350)
"""

import sys

import numpy as np
from PIL import Image

CELL = 3
GAMMA = 2.5


def bayer(n: int) -> np.ndarray:
    if n == 1:
        return np.zeros((1, 1))
    s = bayer(n // 2)
    return np.block([[4 * s, 4 * s + 2], [4 * s + 3, 4 * s + 1]])


def main() -> None:
    src, out = sys.argv[1], sys.argv[2]
    rgb = np.asarray(Image.open(src).convert("RGB"), dtype=np.float32) / 255
    lum = 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]
    h, w = lum.shape
    small = Image.fromarray((lum * 255).astype(np.uint8)).resize((w // CELL, h // CELL), Image.Resampling.BOX)
    s = (np.asarray(small, dtype=np.float32) / 255) ** GAMMA
    sh, sw = s.shape
    threshold = np.tile((bayer(8) + 0.5) / 64, (sh // 8 + 1, sw // 8 + 1))[:sh, :sw]
    bw = (s > threshold).astype(np.uint8) * 255
    Image.fromarray(bw).resize((w, h), Image.Resampling.NEAREST).save(out, lossless=True, method=6)


if __name__ == "__main__":
    main()
