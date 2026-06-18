from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "icons"
S = 4
SIZE = 1024
CANVAS = SIZE * S


def sc(value):
    return int(round(value * S))


def box(values):
    return tuple(sc(v) for v in values)


def color(values):
    if len(values) == 3:
        return (*values, 255)
    return values


def lerp(a, b, t):
    return int(a + (b - a) * t)


def gradient(size, top, bottom):
    w, h = size
    image = Image.new("RGBA", size)
    pixels = image.load()
    for y in range(h):
        t = y / max(1, h - 1)
        row = tuple(lerp(top[i], bottom[i], t) for i in range(4))
        for x in range(w):
            pixels[x, y] = row
    return image


def soft_ellipse(base, bbox, fill, blur):
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw.ellipse(box(bbox), fill=color(fill))
    base.alpha_composite(layer.filter(ImageFilter.GaussianBlur(sc(blur))))


def rounded(draw, bbox, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box(bbox), radius=sc(radius), fill=color(fill), outline=color(outline) if outline else None, width=sc(width))


def ellipse(draw, bbox, fill, outline=None, width=1):
    draw.ellipse(box(bbox), fill=color(fill), outline=color(outline) if outline else None, width=sc(width))


def line(draw, points, fill, width=1):
    draw.line([(sc(x), sc(y)) for x, y in points], fill=color(fill), width=sc(width), joint="curve")


def draw_plate(base):
    draw = ImageDraw.Draw(base)
    soft_ellipse(base, (165, 540, 875, 838), (84, 26, 18, 102), 24)
    ellipse(draw, (150, 358, 884, 738), (149, 24, 24), (61, 28, 24), 10)
    ellipse(draw, (210, 410, 824, 696), (255, 239, 205), (112, 52, 34), 7)
    ellipse(draw, (262, 452, 772, 660), (255, 249, 226), (238, 171, 100), 5)
    draw.arc(box((182, 378, 852, 722)), sc(195), sc(342), fill=(255, 181, 132, 155), width=sc(18))


def draw_nigiri(base, cx, cy, kind, angle):
    layer = Image.new("RGBA", (sc(380), sc(270)), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)

    # Ground shadow.
    ellipse(draw, (56, 164, 322, 232), (53, 24, 19, 54))

    # Rice body, side and front face.
    rice_side = [(68, 120), (268, 128), (318, 184), (110, 190)]
    draw.polygon([(sc(x), sc(y)) for x, y in rice_side], fill=(250, 247, 229, 255), outline=(52, 52, 47, 255))
    line(draw, rice_side + [rice_side[0]], (52, 52, 47), 7)
    rounded(draw, (50, 78, 294, 166), 48, (255, 254, 239), (52, 52, 47), 7)
    for x, y, r in [(95, 112, 6), (142, 143, 5), (204, 118, 5), (248, 148, 6)]:
        ellipse(draw, (x - r, y - r, x + r, y + r), (232, 227, 206, 88))

    if kind == "tuna":
        rounded(draw, (38, 44, 306, 126), 44, (239, 70, 67), (48, 48, 43), 8)
        rounded(draw, (52, 54, 294, 92), 23, (255, 103, 94, 122))
        for x in (88, 148, 210, 268):
            line(draw, [(x, 62), (x + 28, 116)], (210, 51, 52, 116), 8)
        draw.arc(box((82, 54, 252, 106)), sc(196), sc(238), fill=(255, 190, 177, 190), width=sc(7))
        draw.arc(box((162, 58, 284, 108)), sc(200), sc(246), fill=(255, 190, 177, 156), width=sc(6))
    else:
        rounded(draw, (34, 42, 310, 126), 38, (255, 220, 102), (48, 48, 43), 8)
        rounded(draw, (54, 56, 292, 91), 20, (255, 237, 153, 146))
        rounded(draw, (154, 38, 202, 166), 10, (43, 48, 45), (33, 35, 34), 4)
        line(draw, [(73, 82), (124, 60)], (255, 238, 166, 168), 6)
        line(draw, [(226, 111), (274, 94)], (212, 154, 54, 104), 5)

    rotated = layer.rotate(angle, expand=True, resample=Image.Resampling.BICUBIC)
    x = sc(cx) - rotated.width // 2
    y = sc(cy) - rotated.height // 2
    base.alpha_composite(rotated, (x, y))


def draw_gari(base):
    draw = ImageDraw.Draw(base)
    soft_ellipse(base, (636, 646, 884, 824), (80, 26, 22, 72), 14)
    for bbox, fill, outline in [
        ((650, 618, 784, 752), (255, 195, 190), (183, 80, 92)),
        ((722, 604, 872, 750), (255, 217, 204), (199, 93, 93)),
        ((680, 686, 852, 826), (255, 170, 181), (185, 67, 91)),
    ]:
        ellipse(draw, bbox, fill, outline, 6)
        draw.arc(box(bbox), sc(210), sc(334), fill=(255, 246, 236, 170), width=sc(7))
    line(draw, [(706, 682), (748, 642), (792, 660)], (255, 145, 145, 118), 7)
    line(draw, [(734, 746), (790, 720), (830, 742)], (220, 99, 113, 120), 7)


def draw_icon():
    image = gradient((CANVAS, CANVAS), (255, 240, 215, 255), (223, 104, 61, 255))
    soft_ellipse(image, (-150, -120, 520, 440), (255, 255, 255, 114), 35)
    soft_ellipse(image, (660, -70, 1160, 430), (161, 36, 28, 68), 50)

    counter = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    draw = ImageDraw.Draw(counter)
    rounded(draw, (116, 756, 908, 924), 84, (120, 54, 29, 86))
    rounded(draw, (116, 756, 908, 850), 64, (255, 225, 181, 142))
    image.alpha_composite(counter.filter(ImageFilter.GaussianBlur(sc(1.2))))

    draw_plate(image)
    draw_nigiri(image, 410, 438, "tuna", -10)
    draw_nigiri(image, 610, 486, "tamago", 9)
    draw_gari(image)

    return image.resize((SIZE, SIZE), Image.Resampling.LANCZOS)


def main():
    OUT.mkdir(exist_ok=True)
    source = draw_icon()
    master = Image.new("RGB", source.size, (230, 128, 80))
    master.paste(source, mask=source.getchannel("A"))
    master.save(OUT / "icon-1024.png")
    for size in (512, 192, 180):
        master.resize((size, size), Image.Resampling.LANCZOS).save(OUT / f"icon-{size}.png")


if __name__ == "__main__":
    main()
