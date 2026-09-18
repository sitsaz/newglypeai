# Cloud Portal - Project Documentation & AI Context

## 🌟 Project Overview
Cloud Portal is a sophisticated stealth web proxy system designed to allow users to browse the internet seamlessly and securely, bypassing restrictions while keeping their original identity and IP address completely hidden. 

The project is distributed in two main formats:
1. **Standalone PHP Host** (`/php-package`)
2. **WordPress Plugin** (`/wordpress-plugin/cloud-portal`)

## ⚠️ Core Directives for AI Agents (CRITICAL)
Any AI agent working on this project **MUST** adhere to the following rules based on the project owner's explicit instructions:

1. **Dual Maintenance (Sync Rule):** **ANY** modification, bug fix, or feature addition made to the proxy engine (`ProxyEngine.php`), stealth hooks (`stealthHook.js`), or any core logic **MUST** be applied simultaneously to BOTH the Standalone PHP package and the WordPress plugin. One version must never fall behind the other.
2. **Strict Anonymity (No IP Leaks):** The proxy must absolutely hide the user's real IP address. Headers such as `X-Forwarded-For`, `X-Real-IP`, `CF-Connecting-IP`, `Client-IP`, etc., MUST be filtered out and never forwarded to the target destination.
3. **Complex SPA Support:** The proxy must handle modern Javascript-heavy applications (like Gmail, YouTube, xHamster). This means full support for intercepting `fetch` (including `Request` objects), `XMLHttpRequest`, dynamic DOM mutations (Forms, Thumbnails), and `window.location` redirects.
4. **Build Process:** After making core changes, version numbers must be bumped in `version.json`, and the release packages must be built using the provided Python script: `python3 scripts/build-zip.py`.

## 🏗️ Architecture & Key Files
* **`includes/ProxyEngine.php`**: The backend brain. Handles HTTP requests (cURL/stream fallback), HTML/CSS parsing, inline JS rewriting, and header management.
* **`includes/stealthHook.js`**: The client-side stealth script. Injected into proxied pages to override native browser APIs (`fetch`, `XHR`, `window.open`, `MutationObserver`) to ensure all subsequent requests loop back through the proxy.
* **`browse.php` / `cloud-portal.php`**: The entry points for processing requests in the Standalone and WP versions, respectively.
* **`scripts/build-zip.py`**: Automates the packaging of both versions into the `/releases` directory.

## 📅 Recent Milestones & Changelog History

### v3.3.0 - Deep JS & DOM Interception
* **Feature:** Implemented deep JSON rewriting, `window.location` redirect interception, and inline script rewriting.
* **Feature:** Added `MutationObserver` to `stealthHook.js` to catch dynamically injected elements (e.g., thumbnails on YouTube and xHamster) and rewrite their URLs.
* **Rule Established:** The owner mandated that ALL these advanced features must be present in both the PHP standalone and WP plugin simultaneously.

### v3.3.1 - Toolbar Navigation Fix
* **Bug Fix:** The top navigation bar (Toolbar) search form was sending raw URLs instead of the expected encoded format. 
* **Action:** Added Javascript to the Toolbar's `onsubmit` event to automatically prepend `https://` (if missing), Base64-encode the URL, and append the `&enc=1` parameter to match the behavior of the main index form.

### v3.3.2 - Gmail / Google Login Fix
* **Bug Fix:** Users could not log into Gmail/Google because Google's complex authentication flows were breaking.
* **Action:** 
  1. Updated header logic to forward essential safe client headers (like `Accept`, `X-Requested-With`, `Accept-Language`) so Google accepts the request.
  2. Fixed `window.fetch` override in `stealthHook.js` to properly support `Request` objects (Google passes `Request` objects rather than strings).
  3. Expanded `MutationObserver` to rewrite dynamically generated `FORM action` attributes.
  4. Added rewriting for inline `<script>` tags in `ProxyEngine.php`.

### v3.3.3 - Anti IP-Leak (Privacy Patch)
* **Bug Fix:** The header forwarding introduced in v3.3.2 accidentally forwarded proxy headers (`X-Forwarded-For`), exposing the user's real IP on sites like `ipinfo.io`.
* **Action:** Implemented a strict blacklist array in both `browse.php` and `cloud-portal.php` to actively filter out any header that could reveal the client's original IP (`x-forwarded-for`, `x-real-ip`, `via`, `cf-connecting-ip`, etc.).

## 🚀 How to Build & Deploy
When changes are made, run the following to generate the distributable zip files:
```bash
python3 scripts/build-zip.py
```
This updates `/releases/manifest.json` and creates new `.zip` files for:
- Standalone PHP host (`cloud-portal-php-v{VERSION}.zip`)
- WordPress plugin (`cloud-portal-wp-v{VERSION}.zip`)
- Full project archive (`cloud-portal-full-v{VERSION}.zip`)

All files are automatically copied to `/public/releases/` for download via Caddy server.

### 📡 Download Server (Caddy)
After building, start the Caddy server to serve downloads:
```bash
caddy run --config Caddyfile
```
Then access:
- `http://localhost:8080/releases/` - Browse all releases
- `http://localhost:8080/releases/manifest.json` - Release manifest API
- `http://localhost:8080/cloud-portal-php.zip` - Latest PHP standalone (permalink)
- `http://localhost:8080/cloud-portal-wp.zip` - Latest WordPress plugin (permalink)
- `http://localhost:8080/cloud-portal-full.zip` - Latest full project archive (permalink)
