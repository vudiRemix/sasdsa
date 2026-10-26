#!/usr/bin/env python3
"""
Готовит фото товаров для шаблона: из одной фотографии делает четыре файла,
которые ждёт сайт.

    <id>.webp         — основное фото 4:5, 1000×1250 (карточка, страница товара)
    <id>-sm.webp      — то же, 520×650 (сетка каталога, корзина)
    <id>-detail.webp  — крупный план из центра кадра, 800×1000 (второе фото при наведении)
    <id>-full.webp    — весь кадр без обрезки, до 1400 px по длинной стороне (галерея)

Как пользоваться:
    pip install pillow
    python3 tools/prepare_images.py папка_с_фото assets/img/products

Имя исходного файла = id товара из data.js: p01.jpg, p02.png, sofa-red.jpg …
Необязательно: --zoom 2.0 — насколько приблизить крупный план (по умолчанию 1.8),
               --focus 0.5,0.6 — где центр кадра (доли ширины и высоты, по умолчанию центр).
"""
import argparse
import pathlib
import sys

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit('Нужна библиотека Pillow: pip install pillow')

RATIO = 4 / 5


def crop_at(im, cx, cy, w, h):
    W, H = im.size
    x = min(max(cx * W - w / 2, 0), W - w)
    y = min(max(cy * H - h / 2, 0), H - h)
    return im.crop((int(x), int(y), int(x + w), int(y + h)))


def save(im, path, size=None, quality=78):
    if size:
        im = im.resize(size, Image.LANCZOS)
    im.save(path, 'WEBP', quality=quality, method=6)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('src', help='папка с исходными фото')
    ap.add_argument('out', help='куда сложить результат, обычно assets/img/products')
    ap.add_argument('--zoom', type=float, default=1.8)
    ap.add_argument('--focus', default='0.5,0.5')
    a = ap.parse_args()
    fx, fy = (float(v) for v in a.focus.split(','))
    out = pathlib.Path(a.out)
    out.mkdir(parents=True, exist_ok=True)

    files = [p for p in sorted(pathlib.Path(a.src).iterdir()) if p.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp')]
    if not files:
        sys.exit('В папке нет фото (.jpg, .png, .webp)')
    for f in files:
        im = ImageOps.exif_transpose(Image.open(f)).convert('RGB')
        W, H = im.size
        w, h = (H * RATIO, H) if W / H > RATIO else (W, W / RATIO)
        main_crop = crop_at(im, fx, fy, w, h)
        save(main_crop, out / f'{f.stem}.webp', (1000, 1250))
        save(main_crop, out / f'{f.stem}-sm.webp', (520, 650))
        save(crop_at(im, fx, fy, w / a.zoom, h / a.zoom), out / f'{f.stem}-detail.webp', (800, 1000))
        s = min(1, 1400 / max(W, H))
        save(im.resize((round(W * s), round(H * s)), Image.LANCZOS), out / f'{f.stem}-full.webp')
        print(f'готово: {f.stem}')


if __name__ == '__main__':
    main()
