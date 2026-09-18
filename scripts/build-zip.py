#!/usr/bin/env python3
import os
import zipfile
import shutil

os.makedirs("public", exist_ok=True)
if os.path.exists("dist"):
    os.makedirs("dist", exist_ok=True)

# 1. Package Standalone PHP Host Bundle
source_php = os.path.abspath("php-package")
output_php_public = os.path.abspath("public/newglype-php-host.zip")
output_php_root = os.path.abspath("newglype-php-host.zip")

print(f"Packaging PHP Host Bundle {source_php} -> {output_php_public} ...")
with zipfile.ZipFile(output_php_public, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(source_php):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, source_php)
            zipf.write(file_path, arcname)
shutil.copy2(output_php_public, output_php_root)
if os.path.exists("dist"):
    shutil.copy2(output_php_public, os.path.abspath("dist/newglype-php-host.zip"))
print(f"PHP Host ZIP created: {os.path.getsize(output_php_public)} bytes (also saved to root)")

# 2. Package WordPress Plugin Bundle
# WordPress requires the zip to contain a root folder 'newglype-proxy/'
source_wp = os.path.abspath("wordpress-plugin")
output_wp_public = os.path.abspath("public/newglype-proxy.zip")
output_wp_root = os.path.abspath("newglype-proxy.zip")

print(f"Packaging WordPress Plugin Bundle {source_wp} -> {output_wp_public} ...")
with zipfile.ZipFile(output_wp_public, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(source_wp):
        for file in files:
            file_path = os.path.join(root, file)
            # Make sure it's stored inside newglype-proxy/...
            arcname = os.path.relpath(file_path, source_wp)
            zipf.write(file_path, arcname)
shutil.copy2(output_wp_public, output_wp_root)
if os.path.exists("dist"):
    shutil.copy2(output_wp_public, os.path.abspath("dist/newglype-proxy.zip"))
print(f"WordPress Plugin ZIP created: {os.path.getsize(output_wp_public)} bytes (also saved to root)")
