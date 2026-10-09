#!/usr/bin/env python3
"""Build lossless, multiresolution local tiles from a legitimate board photograph.

No enhanced/generated detail, no network or uploads. Destination must not exist.
"""
import argparse
import hashlib
import json
import math
import shutil
import tempfile
from pathlib import Path
from PIL import Image, ImageOps

Image.MAX_IMAGE_PIXELS = 80_000_000

def build(source, destination, model, revision, title, license_text, reference, tile_size=256):
    source, destination = Path(source), Path(destination)
    if destination.exists():
        raise ValueError("La carpeta de destino ya existe; utiliza una nueva.")
    if tile_size not in (256, 512):
        raise ValueError("Tile size must be 256 or 512.")
    if any(not str(v).strip() for v in (model, revision, title, license_text, reference)):
        raise ValueError("Modelo, revisión y procedencia son obligatorios.")
    if any(len(str(v)) > 500 for v in (title, license_text, reference)) or len(model)>80 or len(revision)>80:
        raise ValueError("Metadatos demasiado largos.")
    digest = hashlib.sha256()
    with source.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024*1024), b''):
            digest.update(chunk)
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = Path(tempfile.mkdtemp(prefix='ai-board-tiles-', dir=destination.parent))
    try:
        with Image.open(source) as input_image:
            if input_image.width*input_image.height > Image.MAX_IMAGE_PIXELS:
                raise ValueError("La fotografía supera 80 megapíxeles.")
            image = ImageOps.exif_transpose(input_image).convert('RGB')
            width, height = image.size
            max_level = math.ceil(math.log2(max(width, height)))
            for level in range(max_level + 1):
                factor = 2 ** (max_level-level)
                size = (math.ceil(width/factor), math.ceil(height/factor))
                scaled = image if level == max_level else image.resize(size, Image.Resampling.LANCZOS)
                folder = temporary / 'tiles' / str(level)
                folder.mkdir(parents=True)
                for row in range(math.ceil(size[1]/tile_size)):
                    for column in range(math.ceil(size[0]/tile_size)):
                        box = (column*tile_size, row*tile_size,
                               min((column+1)*tile_size,size[0]), min((row+1)*tile_size,size[1]))
                        scaled.crop(box).save(folder / f'{column}_{row}.png', 'PNG')
            manifest = dict(schema='bayol-photo-pyramid/1', model=model, revision=revision,
                            width=width, height=height, tileSize=tile_size, maxLevel=max_level,
                            format='png', originalSHA256=digest.hexdigest(),
                            source=dict(title=title, license=license_text, reference=reference))
            (temporary / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
        temporary.rename(destination)
        return manifest
    except BaseException:
        shutil.rmtree(temporary, ignore_errors=True)
        raise

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('photo'); p.add_argument('destination')
    for flag in ('model', 'revision', 'title', 'license', 'reference'):
        p.add_argument('--'+flag, required=True)
    p.add_argument('--tile-size', type=int, choices=(256,512), default=256)
    a = p.parse_args()
    manifest=build(a.photo,a.destination,a.model,a.revision,a.title,a.license,a.reference,a.tile_size)
    print(f"Creado: {a.destination} · {manifest['width']}×{manifest['height']} · sin subir archivos")

if __name__ == '__main__':
    main()
