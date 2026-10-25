"""Paint the Pocketplate mark and write Windows + favicon sizes."""

from __future__ import annotations

from pathlib import Path

try:
    from PIL import Image, ImageDraw
except ImportError as err:
    raise SystemExit("Pillow is required: python3 -m pip install pillow") from err

ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / "build"
PUBLIC = ROOT / "public"
ICO_SIZES = (16, 24, 32, 48, 64, 128, 256)


def paint(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (246, 239, 228, 255))
    draw = ImageDraw.Draw(img)
    pad = size * 0.12
    plate = [pad, pad * 1.15, size - pad, size - pad * 0.85]
    draw.rounded_rectangle(plate, radius=size * 0.12, fill=(28, 20, 16, 255))
    inner = [pad + size * 0.07, pad * 1.15 + size * 0.07, size - pad - size * 0.07, size - pad * 0.85 - size * 0.07]
    draw.rounded_rectangle(inner, radius=size * 0.08, fill=(243, 230, 216, 255))

    def pocket(box: tuple[float, float, float, float], color: tuple[int, int, int, int]) -> None:
        draw.rounded_rectangle(box, radius=size * 0.04, fill=color)

    s = size
    pocket((s * 0.26, s * 0.30, s * 0.48, s * 0.46), (196, 101, 45, 255))
    pocket((s * 0.52, s * 0.28, s * 0.78, s * 0.42), (107, 122, 90, 255))
    pocket((s * 0.28, s * 0.52, s * 0.72, s * 0.70), (196, 164, 106, 255))
    # nut
    cx, cy, r = s * 0.78, s * 0.62, s * 0.07
    pts = []
    import math

    for i in range(6):
        a = math.radians(60 * i - 30)
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    draw.polygon(pts, fill=(196, 101, 45, 255))
    return img


def main() -> None:
    BUILD.mkdir(exist_ok=True)
    PUBLIC.mkdir(exist_ok=True)
    source = paint(512)
    source.save(BUILD / "icon-source.png")
    source.resize((256, 256), Image.Resampling.LANCZOS).save(BUILD / "icon.png")
    source.resize((32, 32), Image.Resampling.LANCZOS).save(BUILD / "icon-32.png")
    source.resize((192, 192), Image.Resampling.LANCZOS).save(PUBLIC / "icon-192.png")
    source.resize((512, 512), Image.Resampling.LANCZOS).save(PUBLIC / "icon-512.png")
    source.resize((256, 256), Image.Resampling.LANCZOS).save(PUBLIC / "icon.png")

    ico_images = [paint(size) for size in ICO_SIZES]
    ico_images[-1].save(
        BUILD / "icon.ico",
        format="ICO",
        sizes=[(size, size) for size in ICO_SIZES],
        append_images=ico_images[:-1],
    )
    print("wrote", BUILD / "icon.ico")


if __name__ == "__main__":
    main()
