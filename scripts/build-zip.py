#!/usr/bin/env python3
"""
Cloud Portal - Automated Versioned Packaging Script
Packages:
 1. Standalone PHP Host Package -> cloud-portal-php-v{VERSION}.zip (& releases/)
 2. WordPress Plugin Package    -> cloud-portal-wp-v{VERSION}.zip (& releases/)
 3. Full Project Archive        -> cloud-portal-full-v{VERSION}.zip (& releases/)
Also keeps unversioned symlinks/copies (cloud-portal-php.zip, cloud-portal-wp.zip) for persistent permalinks.
Updates /releases/manifest.json with all built releases, timestamps, and checksums.
"""

import os
import json
import zipfile
import shutil
import hashlib
import sys
from datetime import datetime, timezone

# Base directories
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PUBLIC_DIR = os.path.join(ROOT_DIR, "public")
RELEASES_DIR = os.path.join(ROOT_DIR, "releases")
DIST_DIR = os.path.join(ROOT_DIR, "dist")
PUBLIC_RELEASES_DIR = os.path.join(PUBLIC_DIR, "releases")

os.makedirs(PUBLIC_DIR, exist_ok=True)
os.makedirs(RELEASES_DIR, exist_ok=True)
os.makedirs(PUBLIC_RELEASES_DIR, exist_ok=True)
if os.path.exists(DIST_DIR):
    os.makedirs(os.path.join(DIST_DIR, "releases"), exist_ok=True)

# 1. Read or initialize version
version_file = os.path.join(ROOT_DIR, "version.json")
version_data = {"version": "2.1.0", "buildNumber": 1, "lastUpdated": datetime.now(timezone.utc).isoformat()}

if os.path.exists(version_file):
    try:
        with open(version_file, "r", encoding="utf-8") as f:
            version_data = json.load(f)
    except Exception as e:
        print(f"Warning reading version.json: {e}")

# Check if version is provided as command line argument
if len(sys.argv) > 1:
    new_version = sys.argv[1]
    version_data["version"] = new_version
    # Increment build number
    version_data["buildNumber"] = version_data.get("buildNumber", 0) + 1
    
# Add changelog if provided
if len(sys.argv) > 2:
    changelog = sys.argv[2]
    if "changelog" not in version_data:
        version_data["changelog"] = []
    version_data["changelog"].insert(0, {"version": new_version, "date": datetime.now(timezone.utc).isoformat(), "changes": [changelog]})

# Save updated version data
with open(version_file, "w", encoding="utf-8") as f:
    json.dump(version_data, f, indent=2)

version_str = version_data.get("version", "2.1.0")
now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
version_data["lastUpdated"] = now_iso

print(f"==================================================")
print(f"Building Cloud Portal Packages for Version: {version_str}")
print(f"==================================================")

# Synchronize version in WordPress Plugin file header
wp_main_php = os.path.join(ROOT_DIR, "wordpress-plugin", "cloud-portal", "cloud-portal.php")
if os.path.exists(wp_main_php):
    try:
        with open(wp_main_php, "r", encoding="utf-8") as f:
            wp_code = f.read()
        import re
        wp_code = re.sub(r"Version:\s*[0-9\.]+", f"Version: {version_str}", wp_code)
        wp_code = re.sub(r"define\('CLOUD_PORTAL_VERSION',\s*'[^']+'\);", f"define('CLOUD_PORTAL_VERSION', '{version_str}');", wp_code)
        with open(wp_main_php, "w", encoding="utf-8") as f:
            f.write(wp_code)
    except Exception as e:
        print(f"Error updating WordPress plugin version header: {e}")

# Calculate file hash
def get_sha256(file_path):
    sha = hashlib.sha256()
    with open(file_path, 'rb') as f:
        while chunk := f.read(65536):
            sha.update(chunk)
    return sha.hexdigest()

# Helper to check if path should be excluded from full archive
def should_exclude(path, root_dir):
    """Exclude build artifacts, node_modules, dist, and hidden files from full archive"""
    rel_path = os.path.relpath(path, root_dir)
    exclude_patterns = [
        'node_modules',
        'dist',
        '.git',
        '.vscode',
        '__pycache__',
        '.env',
        '*.log',
        'releases',  # We don't want to include old releases in the full archive
        'public/releases',
        'cloud-portal-php.zip',  # Exclude generated zip files
        'cloud-portal-wp.zip',
        'cloud-portal-full.zip',
        'newglype-php-host.zip',
        'newglype-proxy.zip'
    ]
    for pattern in exclude_patterns:
        if pattern in rel_path:
            return True
    # Exclude hidden files/directories
    parts = rel_path.split(os.sep)
    for part in parts:
        if part.startswith('.') and part not in ['.gitkeep']:
            return True
    # Exclude any .zip files to prevent nesting
    if rel_path.endswith('.zip'):
        return True
    return False

# 2. Package Standalone PHP Host Bundle
source_php = os.path.join(ROOT_DIR, "php-package")
php_versioned_name = f"cloud-portal-php-v{version_str}.zip"
php_release_path = os.path.join(RELEASES_DIR, php_versioned_name)
php_public_versioned = os.path.join(PUBLIC_RELEASES_DIR, php_versioned_name)

print(f"Packaging Standalone PHP Host: {source_php} -> {php_versioned_name} ...")
with zipfile.ZipFile(php_release_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(source_php):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, source_php)
            zipf.write(file_path, arcname)

php_size = os.path.getsize(php_release_path)
php_hash = get_sha256(php_release_path)

# Copy to public/releases/ and create standard permalink files
shutil.copy2(php_release_path, php_public_versioned)
shutil.copy2(php_release_path, os.path.join(PUBLIC_DIR, "cloud-portal-php.zip"))
shutil.copy2(php_release_path, os.path.join(ROOT_DIR, "cloud-portal-php.zip"))
shutil.copy2(php_release_path, os.path.join(PUBLIC_DIR, "newglype-php-host.zip"))
shutil.copy2(php_release_path, os.path.join(ROOT_DIR, "newglype-php-host.zip"))

if os.path.exists(DIST_DIR):
    shutil.copy2(php_release_path, os.path.join(DIST_DIR, "cloud-portal-php.zip"))
    shutil.copy2(php_release_path, os.path.join(DIST_DIR, "newglype-php-host.zip"))
    shutil.copy2(php_release_path, os.path.join(DIST_DIR, "releases", php_versioned_name))

print(f"  [OK] Standalone PHP ZIP: {php_versioned_name} ({php_size} bytes)")

# 3. Package WordPress Plugin Bundle
# Must contain a root folder 'cloud-portal/'
source_wp_dir = os.path.join(ROOT_DIR, "wordpress-plugin", "cloud-portal")
wp_versioned_name = f"cloud-portal-wp-v{version_str}.zip"
wp_release_path = os.path.join(RELEASES_DIR, wp_versioned_name)
wp_public_versioned = os.path.join(PUBLIC_RELEASES_DIR, wp_versioned_name)

print(f"Packaging WordPress Plugin: {source_wp_dir} -> {wp_versioned_name} ...")
with zipfile.ZipFile(wp_release_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(source_wp_dir):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.join("cloud-portal", os.path.relpath(file_path, source_wp_dir))
            zipf.write(file_path, arcname)

wp_size = os.path.getsize(wp_release_path)
wp_hash = get_sha256(wp_release_path)

# Copy to public/releases/ and create standard permalink files
shutil.copy2(wp_release_path, wp_public_versioned)
shutil.copy2(wp_release_path, os.path.join(PUBLIC_DIR, "cloud-portal-wp.zip"))
shutil.copy2(wp_release_path, os.path.join(ROOT_DIR, "cloud-portal-wp.zip"))
shutil.copy2(wp_release_path, os.path.join(PUBLIC_DIR, "newglype-proxy.zip"))
shutil.copy2(wp_release_path, os.path.join(ROOT_DIR, "newglype-proxy.zip"))

if os.path.exists(DIST_DIR):
    shutil.copy2(wp_release_path, os.path.join(DIST_DIR, "cloud-portal-wp.zip"))
    shutil.copy2(wp_release_path, os.path.join(DIST_DIR, "newglype-proxy.zip"))
    shutil.copy2(wp_release_path, os.path.join(DIST_DIR, "releases", wp_versioned_name))

print(f"  [OK] WordPress Plugin ZIP: {wp_versioned_name} ({wp_size} bytes)")

# 4. Package Full Project Archive (all source files)
full_versioned_name = f"cloud-portal-full-v{version_str}.zip"
full_release_path = os.path.join(RELEASES_DIR, full_versioned_name)
full_public_versioned = os.path.join(PUBLIC_RELEASES_DIR, full_versioned_name)

print(f"Packaging Full Project Archive: {ROOT_DIR} -> {full_versioned_name} ...")
with zipfile.ZipFile(full_release_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(ROOT_DIR):
        # Filter out excluded directories
        dirs[:] = [d for d in dirs if not should_exclude(os.path.join(root, d), ROOT_DIR)]
        for file in files:
            file_path = os.path.join(root, file)
            if should_exclude(file_path, ROOT_DIR):
                continue
            arcname = os.path.relpath(file_path, ROOT_DIR)
            zipf.write(file_path, arcname)

full_size = os.path.getsize(full_release_path)
full_hash = get_sha256(full_release_path)

# Copy to public/releases/
shutil.copy2(full_release_path, full_public_versioned)
shutil.copy2(full_release_path, os.path.join(PUBLIC_DIR, "cloud-portal-full.zip"))
shutil.copy2(full_release_path, os.path.join(ROOT_DIR, "cloud-portal-full.zip"))

if os.path.exists(DIST_DIR):
    shutil.copy2(full_release_path, os.path.join(DIST_DIR, "cloud-portal-full.zip"))
    shutil.copy2(full_release_path, os.path.join(DIST_DIR, "releases", full_versioned_name))

print(f"  [OK] Full Project ZIP: {full_versioned_name} ({full_size} bytes)")

# 5. Generate and update manifest.json (keep only last 3 versions)
manifest_file = os.path.join(RELEASES_DIR, "manifest.json")
manifest = {"latest": version_str, "releases": []}
if os.path.exists(manifest_file):
    try:
        with open(manifest_file, "r", encoding="utf-8") as f:
            manifest = json.load(f)
    except Exception:
        pass

# Filter out duplicate entry for same version if re-running
manifest["releases"] = [r for r in manifest.get("releases", []) if r.get("version") != version_str]

manifest["latest"] = version_str
manifest["lastUpdated"] = now_iso
manifest["releases"].insert(0, {
    "version": version_str,
    "date": now_iso,
    "changelog": version_data.get("changelog", []),
    "files": {
        "phpStandalone": {
            "fileName": php_versioned_name,
            "url": f"/releases/{php_versioned_name}",
            "size": php_size,
            "sha256": php_hash
        },
        "wordPressPlugin": {
            "fileName": wp_versioned_name,
            "url": f"/releases/{wp_versioned_name}",
            "size": wp_size,
            "sha256": wp_hash
        },
        "fullProject": {
            "fileName": full_versioned_name,
            "url": f"/releases/{full_versioned_name}",
            "size": full_size,
            "sha256": full_hash
        }
    }
})

# Keep only the last 3 versions to prevent uncontrolled growth
if len(manifest["releases"]) > 3:
    old_versions = manifest["releases"][3:]
    manifest["releases"] = manifest["releases"][:3]
    
    # Remove old zip files from releases/ and public/releases/
    for old_rel in old_versions:
        old_ver = old_rel.get("version")
        if old_ver:
            old_files = [
                f"cloud-portal-php-v{old_ver}.zip",
                f"cloud-portal-wp-v{old_ver}.zip",
                f"cloud-portal-full-v{old_ver}.zip"
            ]
            for old_file in old_files:
                old_path = os.path.join(RELEASES_DIR, old_file)
                old_public_path = os.path.join(PUBLIC_RELEASES_DIR, old_file)
                if os.path.exists(old_path):
                    os.remove(old_path)
                    print(f"  [Removed old version] {old_file}")
                if os.path.exists(old_public_path):
                    os.remove(old_public_path)

with open(manifest_file, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)

# Copy manifest to public/releases/manifest.json and public/releases.json
shutil.copy2(manifest_file, os.path.join(PUBLIC_RELEASES_DIR, "manifest.json"))
shutil.copy2(manifest_file, os.path.join(PUBLIC_DIR, "releases.json"))
if os.path.exists(DIST_DIR):
    shutil.copy2(manifest_file, os.path.join(DIST_DIR, "releases", "manifest.json"))
    shutil.copy2(manifest_file, os.path.join(DIST_DIR, "releases.json"))

print(f"Manifest successfully updated at: {manifest_file}")
print("All versioned packages built successfully!")
