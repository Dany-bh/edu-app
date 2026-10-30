import os
from PIL import Image

image_files = [
    'assets/images/icon.png',
    'assets/images/android-icon-foreground.png',
    'assets/images/splash-icon.png',
    'assets/images/logo-edusalud.png'
]

for f in image_files:
    if os.path.exists(f):
        print(f"Converting {f} to real PNG...")
        # Open the image (Pillow auto-detects jpeg header)
        with Image.open(f) as img:
            img = img.convert('RGBA')
            img.save(f, format='PNG')
        print(f"Successfully converted {f} to real PNG.")

# Verify headers
for f in image_files:
    with open(f, 'rb') as fp:
        header = fp.read(8)
        is_png = header.startswith(b'\x89PNG\r\n\x1a\n')
        print(f"{f}: Valid PNG = {is_png}")
