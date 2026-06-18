from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ICONS = ROOT / "icons"
SOURCE = ICONS / "icon-source.png"


def center_square(image):
    width, height = image.size
    size = min(width, height)
    left = (width - size) // 2
    top = (height - size) // 2
    return image.crop((left, top, left + size, top + size))


def main():
    if not SOURCE.exists():
        raise FileNotFoundError(f"Missing source icon: {SOURCE}")

    source = Image.open(SOURCE).convert("RGB")
    source = center_square(source)

    for size in (1024, 512, 192, 180):
        icon = source.resize((size, size), Image.Resampling.LANCZOS)
        icon.save(ICONS / f"icon-{size}.png", optimize=True)


if __name__ == "__main__":
    main()
