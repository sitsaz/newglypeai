#!/usr/bin/env python3
import os
import zipfile
import shutil

source_dir = os.path.abspath("php-package")
output_public = os.path.abspath("public/newglype-php-host.zip")
output_dist = os.path.abspath("dist/newglype-php-host.zip")

os.makedirs("public", exist_ok=True)

def create_zip(target_path):
    print(f"Packaging {source_dir} -> {target_path} ...")
    with zipfile.ZipFile(target_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            for file in files:
                file_path = os.path.join(root, file)
                # Archive name relative to php-package root
                arcname = os.path.relpath(file_path, source_dir)
                zipf.write(file_path, arcname)
                print(f"  + {arcname}")
    print(f"Zip created successfully: {os.path.getsize(target_path)} bytes")

create_zip(output_public)

if os.path.exists("dist"):
    shutil.copy2(output_public, output_dist)
    print(f"Copied to {output_dist}")
