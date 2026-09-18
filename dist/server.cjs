var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");

// server/proxyEngine.ts
var import_axios = __toESM(require("axios"), 1);
var cheerio = __toESM(require("cheerio"), 1);

// server/cookieJar.ts
var import_tough_cookie = require("tough-cookie");
var sessionJars = /* @__PURE__ */ new Map();
function getSessionJar(sessionId = "default") {
  let jar = sessionJars.get(sessionId);
  if (!jar) {
    jar = new import_tough_cookie.CookieJar();
    sessionJars.set(sessionId, jar);
  }
  return jar;
}
async function storeCookiesFromHeaders(setCookieHeaders, url, sessionId = "default") {
  if (!setCookieHeaders)
    return;
  const jar = getSessionJar(sessionId);
  const headers = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
  for (const header of headers) {
    try {
      await jar.setCookie(header, url, { ignoreError: true });
    } catch (e) {
    }
  }
}
async function getCookieHeaderString(url, sessionId = "default") {
  try {
    const jar = getSessionJar(sessionId);
    return await jar.getCookieString(url);
  } catch (e) {
    return "";
  }
}
async function getAllCookiesForSession(sessionId = "default") {
  const jar = getSessionJar(sessionId);
  const results = [];
  try {
    const serialized = await jar.serialize();
    if (serialized && serialized.cookies) {
      for (const c of serialized.cookies) {
        results.push({
          domain: c.domain || "",
          path: c.path || "/",
          key: c.key || "",
          value: c.value || "",
          expires: c.expires ? new Date(c.expires).toISOString() : void 0,
          httpOnly: Boolean(c.httpOnly),
          secure: Boolean(c.secure),
          sameSite: c.sameSite
        });
      }
    }
  } catch (e) {
    console.error("Failed to get cookies:", e);
  }
  return results;
}
async function setManualCookie(cookieStr, url, sessionId = "default") {
  try {
    const jar = getSessionJar(sessionId);
    await jar.setCookie(cookieStr, url, { ignoreError: false });
    return true;
  } catch (e) {
    return false;
  }
}
function clearSessionCookies(sessionId = "default") {
  const jar = sessionJars.get(sessionId);
  if (jar) {
    jar.removeAllCookiesSync();
  }
}

// server/proxyHook.ts
function generateClientHook(targetUrl, options = {}) {
  let targetOrigin = "";
  try {
    targetOrigin = new URL(targetUrl).origin;
  } catch (e) {
    targetOrigin = "";
  }
  const isEncoded = !!options.encodeURL;
  const stripTitle = !!options.stripTitle;
  const removeScripts = !!options.removeScripts;
  const removeImages = !!options.removeImages;
  const showToolbar = !!options.showToolbar;
  const advancedProxy = !!options.advancedProxy;
  const stealthMode = !!options.stealthMode;
  return `
<script id="__newglype_proxy_hook__">
(function() {
  if (window.__vault_initialized__) return;
  window.__vault_initialized__ = true;

  try {
    Object.defineProperty(window, 'top', { get: function() { return window.self; }, set: function() {} });
    Object.defineProperty(window, 'parent', { get: function() { return window.self; }, set: function() {} });
  } catch(e) {}

  var TARGET_ORIGIN = ${JSON.stringify(targetOrigin)};
  var CURRENT_TARGET_URL = ${JSON.stringify(targetUrl)};
  var PROXY_GATEWAY = "/api/proxy/gateway";
  var IS_ENCODED = ${isEncoded ? "true" : "false"};
  var STRIP_TITLE = ${stripTitle ? "true" : "false"};
  var REMOVE_IMAGES = ${removeImages ? "true" : "false"};
  var ADVANCED_PROXY = ${advancedProxy ? "true" : "false"};
  var STEALTH_MODE = ${stealthMode ? "true" : "false"};
  var CIPHER_KEY = "cp_vault_key";

  // Expose global resolver for advanced JS usage
  window.__newglype_resolve__ = function(u) {
    return resolveTargetUrl(u);
  };

  // Stealth & Anti-Fingerprint Shield
  if (STEALTH_MODE) {
    try {
      // 1. WebRTC Leak Prevention
      window.RTCPeerConnection = function() {
        return {
          createDataChannel: function() {},
          createOffer: function() { return Promise.resolve({}); },
          setLocalDescription: function() { return Promise.resolve({}); },
          setRemoteDescription: function() { return Promise.resolve({}); },
          addIceCandidate: function() { return Promise.resolve({}); },
          onicecandidate: null,
          ontrack: null,
          close: function() {}
        };
      };
      window.webkitRTCPeerConnection = window.RTCPeerConnection;

      // 2. Canvas Fingerprint Noise
      var origToDataURL = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function(type) {
        try {
          var ctx = this.getContext('2d');
          if (ctx) {
            var imgData = ctx.getImageData(0, 0, Math.max(1, this.width), Math.max(1, this.height));
            imgData.data[0] = imgData.data[0] ^ 1;
            ctx.putImageData(imgData, 0, 0);
          }
        } catch(e) {}
        return origToDataURL.apply(this, arguments);
      };

      // 3. Navigator Spoofing
      Object.defineProperty(navigator, 'webdriver', { get: function() { return false; } });
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: function() { return 8; } });
      Object.defineProperty(navigator, 'deviceMemory', { get: function() { return 8; } });
      Object.defineProperty(navigator, 'languages', { get: function() { return ['en-US', 'en']; } });

      // 4. Ping & Telemetry Shield
      if (Navigator.prototype.sendBeacon) {
        Navigator.prototype.sendBeacon = function() { return true; };
      }
    } catch(err) {}
  }

  // XOR Cipher matching backend StealthCipher
  function cipherEncode(str) {
    if (!str || typeof str !== 'string') return '';
    var out = '';
    for (var i = 0; i < str.length; i++) {
      out += String.fromCharCode(str.charCodeAt(i) ^ CIPHER_KEY.charCodeAt(i % CIPHER_KEY.length));
    }
    try {
      var b64 = btoa(unescape(encodeURIComponent(out)));
      return b64.replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');
    } catch(e) {
      return btoa(out).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');
    }
  }

  // Helper to resolve any URL (relative, absolute, origin-relative) to a proxied URL
  function resolveTargetUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;
    var trimmed = rawUrl.trim();
    if (
      trimmed.startsWith('javascript:') ||
      trimmed.startsWith('data:') ||
      trimmed.startsWith('blob:') ||
      trimmed.startsWith('#')
    ) {
      return trimmed;
    }
    if (trimmed.startsWith(PROXY_GATEWAY) || trimmed.indexOf('?b=') !== -1 || trimmed.indexOf('&b=') !== -1) {
      return trimmed; // already proxied
    }

    // Crucial for SPAs: if the URL was resolved against the proxy host (e.g. window.location.origin)
    if (trimmed.startsWith(window.location.origin)) {
      var relPath = trimmed.substring(window.location.origin.length);
      if (!relPath.startsWith(PROXY_GATEWAY)) {
        trimmed = relPath;
      } else {
        return trimmed;
      }
    }

    try {
      var absolute = new URL(trimmed, CURRENT_TARGET_URL).href;
      var flagStr = '';
      if (${removeScripts ? "true" : "false"}) flagStr += '&rs=1';
      if (REMOVE_IMAGES) flagStr += '&ri=1';
      if (STRIP_TITLE) flagStr += '&st=1';
      if (${showToolbar ? "true" : "false"}) flagStr += '&tb=1';
      if (IS_ENCODED) flagStr += '&enc=1';

      if (IS_ENCODED) {
        return PROXY_GATEWAY + "?b=" + encodeURIComponent(cipherEncode(absolute)) + flagStr;
      } else {
        return PROXY_GATEWAY + "?url=" + encodeURIComponent(absolute) + flagStr;
      }
    } catch(e) {
      return trimmed;
    }
  }

  function resolveRawAbsoluteUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;
    try {
      return new URL(rawUrl.trim(), CURRENT_TARGET_URL).href;
    } catch(e) {
      return rawUrl;
    }
  }

  // Recursive JSON URL rewriter for API / InnerTube / Player config responses
  function deepRewriteJson(obj) {
    if (!obj || typeof obj !== 'object') {
      if (typeof obj === 'string' && /^https?:///i.test(obj)) {
        return resolveTargetUrl(obj);
      }
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(deepRewriteJson);
    }
    var res = {};
    for (var k in obj) {
      if (obj.hasOwnProperty(k)) {
        var val = obj[k];
        if (typeof val === 'string' && /^https?:///i.test(val)) {
          res[k] = resolveTargetUrl(val);
        } else {
          res[k] = deepRewriteJson(val);
        }
      }
    }
    return res;
  }

  // 1. Intercept window.fetch (Handles YouTube InnerTube browse, next, search, API requests & JSON response rewriting)
  var _originalFetch = window.fetch;
  if (_originalFetch) {
    window.fetch = function(input, init) {
      try {
        if (typeof input === 'string') {
          input = resolveTargetUrl(input);
        } else if (input && typeof input.url === 'string') {
          var newUrl = resolveTargetUrl(input.url);
          try {
            input = new Request(newUrl, input);
          } catch(e) {
            input = newUrl;
          }
        }
      } catch(err) {
        console.warn('[NewGlype Proxy Hook] fetch rewrite error:', err);
      }
      return _originalFetch.call(this, input, init).then(function(response) {
        try {
          var ct = response.headers.get('content-type') || '';
          if (ct.indexOf('json') !== -1) {
            var clone = response.clone();
            return clone.json().then(function(json) {
              var rewrittenJson = deepRewriteJson(json);
              return new Response(JSON.stringify(rewrittenJson), {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
              });
            }).catch(function() {
              return response;
            });
          }
        } catch(e) {}
        return response;
      });
    };
  }

  // 2. Intercept XMLHttpRequest (AJAX & legacy background requests)
  var _originalXhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    try {
      var proxied = resolveTargetUrl(url);
      var restArgs = Array.prototype.slice.call(arguments, 2);
      return _originalXhrOpen.apply(this, [method, proxied].concat(restArgs));
    } catch(err) {
      return _originalXhrOpen.apply(this, arguments);
    }
  };

  // 3. Intercept Dynamic Image Loading (Crucial for YouTube thumbnails, avatars, lazy-loaded pictures)
  try {
    var originalImgSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    if (originalImgSrcDescriptor && originalImgSrcDescriptor.set) {
      Object.defineProperty(HTMLImageElement.prototype, 'src', {
        get: function() {
          return originalImgSrcDescriptor.get.call(this);
        },
        set: function(val) {
          if (REMOVE_IMAGES) {
            return originalImgSrcDescriptor.set.call(this, 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>');
          }
          var proxied = resolveTargetUrl(val);
          return originalImgSrcDescriptor.set.call(this, proxied);
        },
        configurable: true
      });
    }
  } catch(e) {}

  // 4. Intercept Element.setAttribute (catches src, srcset, href, poster, and various data- attributes for dynamic elements)
  try {
    var _originalSetAttribute = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function(name, val) {
      var attr = (name || '').toLowerCase();
      if (typeof val === 'string') {
        if (
          attr === 'src' ||
          attr === 'data-src' ||
          attr === 'data-thumb' ||
          attr === 'data-background' ||
          attr === 'data-poster' ||
          attr === 'data-url' ||
          attr === 'data-image' ||
          attr === 'data-preview' ||
          attr === 'data-original' ||
          attr === 'data-bg' ||
          attr === 'data-lazy-src' ||
          attr === 'poster'
        ) {
          if (REMOVE_IMAGES && (this.tagName === 'IMG' || this.tagName === 'IMAGE')) {
            val = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
          } else {
            val = resolveTargetUrl(val);
          }
        } else if (attr === 'srcset' || attr === 'data-srcset') {
          if (!REMOVE_IMAGES) {
            try {
              val = val.split(',').map(function(part) {
                var chunks = part.trim().split(/s+/);
                if (!chunks[0]) return part;
                return resolveTargetUrl(chunks[0]) + (chunks[1] ? ' ' + chunks[1] : '');
              }).join(', ');
            } catch(ex) {}
          }
        } else if (attr === 'href' && (this.tagName === 'A' || this.tagName === 'LINK')) {
          if (!val.startsWith('#') && !val.startsWith('javascript:')) {
            val = resolveTargetUrl(val);
          }
        } else if (attr === 'style' && val.indexOf('url(') !== -1) {
          var urlRegex = new RegExp("url\\\\(\\\\s*(['\\"]?)(.*?)\\\\1\\\\s*\\\\)", "gi");
          val = val.replace(urlRegex, function(match, quote, u) {
            return 'url("' + resolveTargetUrl(u) + '")';
          });
        }
      }
      return _originalSetAttribute.call(this, name, val);
    };

    // Also intercept CSSStyleDeclaration.setProperty for background-image
    var _originalSetProperty = CSSStyleDeclaration.prototype.setProperty;
    CSSStyleDeclaration.prototype.setProperty = function(property, value, priority) {
      if (typeof value === 'string' && (property === 'background-image' || property === 'background') && value.indexOf('url(') !== -1) {
        var urlRegex = new RegExp("url\\\\(\\\\s*(['\\"]?)(.*?)\\\\1\\\\s*\\\\)", "gi");
        value = value.replace(urlRegex, function(match, quote, u) {
          return 'url("' + resolveTargetUrl(u) + '")';
        });
      }
      return _originalSetProperty.call(this, property, value, priority);
    };
  } catch(e) {}

  // 5. Freeze Page Title if Strip Title (\u067E\u0646\u0647\u0627\u0646\u200C\u0633\u0627\u0632\u06CC \u0639\u0646\u0648\u0627\u0646) is requested
  if (STRIP_TITLE) {
    try {
      document.title = '\u0635\u0641\u062D\u0647 \u0648\u0628 | Web Document';
      Object.defineProperty(document, 'title', {
        get: function() {
          return '\u0635\u0641\u062D\u0647 \u0648\u0628 | Web Document';
        },
        set: function() {
          // Block any client-side JavaScript (like YouTube or Twitter) from setting the title
          return true;
        },
        configurable: true
      });
    } catch(e) {}
  }

  // 6. Stub ServiceWorker Registration (Prevents foreign origin security errors in iframes)
  if (window.navigator && window.navigator.serviceWorker) {
    window.navigator.serviceWorker.register = function() {
      return Promise.reject(new Error('[NewGlype] ServiceWorker disabled inside proxy gateway'));
    };
  }

  // 7. Intercept Form Submissions
  var _originalFormSubmit = HTMLFormElement.prototype.submit;
  HTMLFormElement.prototype.submit = function() {
    try {
      var action = this.getAttribute('action') || CURRENT_TARGET_URL;
      this.action = resolveTargetUrl(action);
    } catch(err) {}
    return _originalFormSubmit.call(this);
  };

  document.addEventListener('submit', function(e) {
    var form = e.target;
    if (form && form.tagName === 'FORM') {
      var action = form.getAttribute('action') || CURRENT_TARGET_URL;
      form.action = resolveTargetUrl(action);
    }
  }, true);

  // 8. Intercept Dynamic Link Clicks
  document.addEventListener('click', function(e) {
    var target = e.target;
    while (target && target.tagName !== 'A') {
      target = target.parentElement;
    }
    if (target && target.tagName === 'A') {
      var href = target.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        target.href = resolveTargetUrl(href);
      }
    }
  }, true);

  // 9. Virtual Cookie Bridge for document.cookie
  try {
    var _cookieStore = {};
    var rawCookies = document.cookie || '';
    if (rawCookies) {
      rawCookies.split(';').forEach(function(pair) {
        var parts = pair.split('=');
        if (parts.length >= 2) {
          _cookieStore[parts[0].trim()] = parts.slice(1).join('=').trim();
        }
      });
    }

    Object.defineProperty(document, 'cookie', {
      get: function() {
        var str = [];
        for (var k in _cookieStore) {
          if (_cookieStore.hasOwnProperty(k)) {
            str.push(k + '=' + _cookieStore[k]);
          }
        }
        return str.join('; ');
      },
      set: function(val) {
        if (!val || typeof val !== 'string') return;
        var parts = val.split(';')[0].split('=');
        if (parts.length >= 2) {
          var k = parts[0].trim();
          var v = parts.slice(1).join('=').trim();
          _cookieStore[k] = v;
          try {
            if (navigator.sendBeacon) {
              var blob = new Blob([JSON.stringify({ url: CURRENT_TARGET_URL, cookie: val })], { type: 'application/json' });
              navigator.sendBeacon('/api/proxy/cookies/sync', blob);
            } else {
              _originalFetch('/api/proxy/cookies/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: CURRENT_TARGET_URL, cookie: val })
              });
            }
          } catch(syncErr) {}
        }
      },
      configurable: true
    });
  } catch(cookieErr) {}

  // 10. Window.open override and window.location / redirect interception
  var _originalOpen = window.open;
  window.open = function(url, target, features) {
    if (url) {
      url = resolveTargetUrl(url);
    }
    return _originalOpen.call(this, url, target, features);
  };

  try {
    var _origLocation = window.location;
    var locProto = window.Location ? window.Location.prototype : null;
    if (locProto) {
      var origAssign = locProto.assign;
      if (origAssign) {
        locProto.assign = function(url) {
          return origAssign.call(this, resolveTargetUrl(url));
        };
      }
      var origReplace = locProto.replace;
      if (origReplace) {
        locProto.replace = function(url) {
          return origReplace.call(this, resolveTargetUrl(url));
        };
      }
    }

    Object.defineProperty(window, 'location', {
      get: function() { return _origLocation; },
      set: function(val) {
        if (typeof val === 'string') {
          _origLocation.href = resolveTargetUrl(val);
        } else {
          _origLocation.href = val;
        }
      },
      configurable: true
    });
  } catch(e) {}

  // 11. MutationObserver to automatically proxy newly injected DOM assets and thumbnails (xHamster, YouTube, etc.)
  try {
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node && node.nodeType === 1) {
            var tag = node.tagName;
            if (tag === 'IMG' || tag === 'VIDEO' || tag === 'AUDIO' || tag === 'SOURCE' || tag === 'IFRAME') {
              var s = node.getAttribute('src');
              if (s && !s.startsWith('#') && !s.startsWith('javascript:') && !s.startsWith(PROXY_GATEWAY)) {
                node.setAttribute('src', resolveTargetUrl(s));
              }
            } else if (tag === 'A') {
              var h = node.getAttribute('href');
              if (h && !h.startsWith('#') && !h.startsWith('javascript:') && !h.startsWith(PROXY_GATEWAY)) {
                node.setAttribute('href', resolveTargetUrl(h));
              }
            }
            // Check data attributes and background images in children or node
            var dataEls = node.querySelectorAll ? node.querySelectorAll('[data-src], [data-thumb], [data-background], [data-poster], [data-url], [data-image], [data-original], [data-bg]') : [];
            for (var i = 0; i < dataEls.length; i++) {
              var el = dataEls[i];
              ['data-src', 'data-thumb', 'data-background', 'data-poster', 'data-url', 'data-image', 'data-original', 'data-bg'].forEach(function(attr) {
                var val = el.getAttribute(attr);
                if (val && !val.startsWith(PROXY_GATEWAY)) {
                  el.setAttribute(attr, resolveTargetUrl(val));
                }
              });
            }
          }
        });
      });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  } catch(e) {}

  // 11. Notify parent shell of location changes (SPAs, pushState)
  function notifyParentNavigation(newUrl) {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'NEWGLYPE_NAVIGATED',
          url: resolveRawAbsoluteUrl(newUrl)
        }, '*');
      }
    } catch(e) {}
  }

  var _origPushState = history.pushState;
  history.pushState = function(state, title, url) {
    if (url) notifyParentNavigation(url);
    return _origPushState.apply(this, arguments);
  };

  var _origReplaceState = history.replaceState;
  history.replaceState = function(state, title, url) {
    if (url) notifyParentNavigation(url);
    return _origReplaceState.apply(this, arguments);
  };

  window.addEventListener('load', function() {
    notifyParentNavigation(window.location.href);
  });

  console.info('[NewGlype] Modern Stealth Proxy Hook active for:', CURRENT_TARGET_URL);
})();
</script>
`;
}
var generateProxyHook = generateClientHook;

// server/cipher.ts
var DEFAULT_KEY = "cp_vault_key";
var StealthCipher = class {
  static encode(url, key = DEFAULT_KEY) {
    if (!url)
      return "";
    const k = key || DEFAULT_KEY;
    const buf = Buffer.from(url, "utf-8");
    const out = Buffer.alloc(buf.length);
    for (let i = 0; i < buf.length; i++) {
      out[i] = buf[i] ^ k.charCodeAt(i % k.length);
    }
    const b64 = out.toString("base64");
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  static decode(encoded, key = DEFAULT_KEY) {
    if (!encoded)
      return "";
    if (/^https?:\/\//i.test(encoded)) {
      return encoded;
    }
    const k = key || DEFAULT_KEY;
    let b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4;
    if (pad) {
      b64 += "=".repeat(4 - pad);
    }
    try {
      const raw = Buffer.from(b64, "base64");
      const out = Buffer.alloc(raw.length);
      for (let i = 0; i < raw.length; i++) {
        out[i] = raw[i] ^ k.charCodeAt(i % k.length);
      }
      const decoded = out.toString("utf-8");
      if (/^https?:\/\//i.test(decoded)) {
        return decoded;
      }
      const plain = raw.toString("utf-8");
      if (/^https?:\/\//i.test(plain)) {
        return plain;
      }
      return decoded;
    } catch (e) {
      return encoded;
    }
  }
};

// server/proxyEngine.ts
var networkLogs = [];
function addNetworkLog(log) {
  networkLogs.unshift(log);
  if (networkLogs.length > 60) {
    networkLogs.pop();
  }
}
function isPrivateOrBlockedHost(hostname) {
  const host = hostname.toLowerCase().trim();
  if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host === "::1" || host === "metadata.google.internal" || host === "169.254.169.254") {
    return { blocked: true, reason: "\u062F\u0633\u062A\u0631\u0633\u06CC \u0628\u0647 \u0622\u062F\u0631\u0633\u200C\u0647\u0627\u06CC \u062F\u0627\u062E\u0644\u06CC (Localhost/Cloud Metadata) \u062C\u0647\u062A \u062D\u0641\u0638 \u0627\u0645\u0646\u06CC\u062A \u0633\u0631\u0648\u0631 \u0645\u0633\u062F\u0648\u062F \u0627\u0633\u062A." };
  }
  const ipParts = host.split(".").map(Number);
  if (ipParts.length === 4 && ipParts.every((n) => !isNaN(n) && n >= 0 && n <= 255)) {
    if (ipParts[0] === 127)
      return { blocked: true, reason: "Loopback IP blocked" };
    if (ipParts[0] === 10)
      return { blocked: true, reason: "Private 10.0.0.0/8 network blocked" };
    if (ipParts[0] === 172 && ipParts[1] >= 16 && ipParts[1] <= 31)
      return { blocked: true, reason: "Private 172.16.0.0/12 network blocked" };
    if (ipParts[0] === 192 && ipParts[1] === 168)
      return { blocked: true, reason: "Private 192.168.0.0/16 network blocked" };
    if (ipParts[0] === 169 && ipParts[1] === 254)
      return { blocked: true, reason: "Link-local cloud metadata network blocked" };
    if (ipParts[0] === 0)
      return { blocked: true, reason: "Zero IP blocked" };
  }
  return { blocked: false };
}
function normalizeUrl(inputUrl) {
  let url = inputUrl.trim();
  if (url.startsWith("//")) {
    url = "https:" + url;
  } else if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  return url;
}
function makeProxiedUrl(targetUrl, baseUrl, options = {}) {
  if (!targetUrl || typeof targetUrl !== "string")
    return targetUrl;
  const trimmed = targetUrl.trim();
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:") || trimmed.startsWith("javascript:") || trimmed.startsWith("#")) {
    return trimmed;
  }
  if (trimmed.startsWith("/api/proxy/gateway") || trimmed.indexOf("?b=") !== -1 || trimmed.indexOf("&b=") !== -1) {
    return trimmed;
  }
  let resolved = trimmed;
  if (baseUrl) {
    try {
      resolved = new URL(trimmed, baseUrl).href;
    } catch (e) {
      resolved = trimmed;
    }
  }
  const isEncoded = !!options.encodeURL;
  let flagStr = "";
  if (options.removeScripts)
    flagStr += "&rs=1";
  if (options.removeImages)
    flagStr += "&ri=1";
  if (options.stripTitle)
    flagStr += "&st=1";
  if (options.showToolbar)
    flagStr += "&tb=1";
  if (isEncoded)
    flagStr += "&enc=1";
  if (isEncoded) {
    const encoded = StealthCipher.encode(resolved);
    return `/api/proxy/gateway?b=${encodeURIComponent(encoded)}${flagStr}`;
  }
  return `/api/proxy/gateway?url=${encodeURIComponent(resolved)}${flagStr}`;
}
function rewriteCss(cssContent, baseUrl, options = {}) {
  return cssContent.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (match, quote, url) => {
    const cleanUrl = url.trim();
    if (cleanUrl.startsWith("data:") || cleanUrl.startsWith("blob:") || cleanUrl.startsWith("#")) {
      return match;
    }
    const proxied = makeProxiedUrl(cleanUrl, baseUrl, options);
    return `url("${proxied}")`;
  }).replace(/@import\s+(['"])(.*?)\1/gi, (match, quote, url) => {
    const proxied = makeProxiedUrl(url, baseUrl, options);
    return `@import "${proxied}"`;
  });
}
function rewriteM3u8(content, baseUrl, options = {}) {
  const lines = content.split("\n");
  const rewrittenLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed)
      return line;
    if (trimmed.startsWith("#")) {
      return trimmed.replace(/URI="([^"]+)"/g, (match, uri) => {
        const proxied = makeProxiedUrl(uri, baseUrl, options);
        return `URI="${proxied}"`;
      });
    } else {
      return makeProxiedUrl(trimmed, baseUrl, options);
    }
  });
  return rewrittenLines.join("\n");
}
function rewriteJs(jsContent, baseUrl, options = {}) {
  if (!options.advancedProxy)
    return jsContent;
  return jsContent.replace(/(['"])(https?:\/\/[^'"]+|\/[^'"]+\.[a-zA-Z0-9]{2,5})\1/g, (match, quote, url) => {
    if (url.startsWith("data:") || url.startsWith("blob:") || url.startsWith("#") || url.startsWith("javascript:")) {
      return match;
    }
    try {
      const proxied = makeProxiedUrl(url, baseUrl, options);
      return `${quote}${proxied}${quote}`;
    } catch (e) {
      return match;
    }
  });
}
function rewriteHtml(htmlContent, targetUrl, options = {}) {
  const parsedTarget = new URL(targetUrl);
  const targetOrigin = parsedTarget.origin;
  const $ = cheerio.load(htmlContent);
  if (options.stripSecurityHeaders !== false) {
    $('meta[http-equiv="Content-Security-Policy"]').remove();
    $('meta[http-equiv="X-Frame-Options"]').remove();
    $('meta[http-equiv="origin-trial"]').remove();
  }
  if (options.stripTitle) {
    if ($("title").length > 0) {
      $("title").text("\u0635\u0641\u062D\u0647 \u0648\u0628 | Web Document");
    } else {
      $("head").prepend("<title>\u0635\u0641\u062D\u0647 \u0648\u0628 | Web Document</title>");
    }
    $('meta[property="og:title"]').attr("content", "\u0635\u0641\u062D\u0647 \u0648\u0628 | Web Document");
    $('meta[name="twitter:title"]').attr("content", "\u0635\u0641\u062D\u0647 \u0648\u0628 | Web Document");
  }
  if (options.removeScripts) {
    $("script").remove();
    $("[onclick]").removeAttr("onclick");
    $("[onload]").removeAttr("onload");
  }
  if (options.removeImages) {
    $("img").replaceWith('<span class="newglype-img-placeholder">[Image Removed]</span>');
  } else {
    $("img").each((_, el) => {
      const src = $(el).attr("src");
      if (src)
        $(el).attr("src", makeProxiedUrl(src, targetUrl, options));
      const srcset = $(el).attr("srcset");
      if (srcset) {
        const newSrcset = srcset.split(",").map((part) => {
          const [u, ...rest] = part.trim().split(/\s+/);
          return `${makeProxiedUrl(u, targetUrl, options)} ${rest.join(" ")}`.trim();
        }).join(", ");
        $(el).attr("srcset", newSrcset);
      }
    });
  }
  $("a").each((_, el) => {
    const href = $(el).attr("href");
    if (href) {
      $(el).attr("href", makeProxiedUrl(href, targetUrl, options));
    }
  });
  $("form").each((_, el) => {
    const action = $(el).attr("action");
    if (action) {
      $(el).attr("action", makeProxiedUrl(action, targetUrl, options));
    } else {
      $(el).attr("action", makeProxiedUrl(targetUrl, targetUrl, options));
    }
  });
  $("link").each((_, el) => {
    const href = $(el).attr("href");
    if (href) {
      $(el).attr("href", makeProxiedUrl(href, targetUrl, options));
    }
  });
  if (!options.removeScripts) {
    $("script[src]").each((_, el) => {
      const src = $(el).attr("src");
      if (src) {
        $(el).attr("src", makeProxiedUrl(src, targetUrl, options));
      }
    });
  }
  $("iframe, frame").each((_, el) => {
    const src = $(el).attr("src");
    if (src)
      $(el).attr("src", makeProxiedUrl(src, targetUrl, options));
  });
  $("audio, video, source, embed").each((_, el) => {
    const src = $(el).attr("src");
    if (src)
      $(el).attr("src", makeProxiedUrl(src, targetUrl, options));
  });
  $("style").each((_, el) => {
    const rawCss = $(el).html();
    if (rawCss) {
      $(el).html(rewriteCss(rawCss, targetUrl, options));
    }
  });
  if (options.injectHook !== false && !options.removeScripts) {
    const hook = generateProxyHook(targetUrl, options);
    if ($("head").length > 0) {
      $("head").prepend(hook);
    } else {
      $.root().prepend(hook);
    }
  }
  return $.html();
}
async function executeProxyRequest(method, targetUrl, reqHeaders, reqBody, options = {}) {
  const startTime = Date.now();
  const sessionId = options.sessionId || "default";
  const normalizedTarget = normalizeUrl(targetUrl);
  const parsedTarget = new URL(normalizedTarget);
  const ssrfCheck = isPrivateOrBlockedHost(parsedTarget.hostname);
  if (ssrfCheck.blocked) {
    throw new Error(`SSRF Block: ${ssrfCheck.reason || "Restricted host"}`);
  }
  const cookieHeader = await getCookieHeaderString(normalizedTarget, sessionId);
  const outgoingHeaders = {
    "User-Agent": options.userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": reqHeaders["accept"] || "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": reqHeaders["accept-language"] || "fa,en-US;q=0.9,en;q=0.8",
    "Referer": parsedTarget.origin + "/",
    "Origin": parsedTarget.origin,
    "Sec-Fetch-Dest": reqHeaders["sec-fetch-dest"] || "document",
    "Sec-Fetch-Mode": reqHeaders["sec-fetch-mode"] || "navigate",
    "Sec-Fetch-Site": reqHeaders["sec-fetch-site"] || "same-origin",
    "Sec-Ch-Ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"'
  };
  for (const [key, val] of Object.entries(reqHeaders)) {
    const lk = key.toLowerCase();
    if (lk === "host" || lk === "connection" || lk === "content-length" || lk === "cookie" || lk === "origin" || lk === "referer" || lk.startsWith("sec-fetch-")) {
      continue;
    }
    if (typeof val === "string") {
      outgoingHeaders[key] = val;
    }
  }
  if (parsedTarget.hostname.includes("youtube.com")) {
    if (!outgoingHeaders["X-YouTube-Client-Name"] && !outgoingHeaders["x-youtube-client-name"]) {
      outgoingHeaders["X-YouTube-Client-Name"] = "1";
    }
    if (!outgoingHeaders["X-YouTube-Client-Version"] && !outgoingHeaders["x-youtube-client-version"]) {
      outgoingHeaders["X-YouTube-Client-Version"] = "2.20241108.01.00";
    }
  }
  if (cookieHeader) {
    outgoingHeaders["Cookie"] = cookieHeader;
  }
  if (reqHeaders["content-type"]) {
    outgoingHeaders["Content-Type"] = reqHeaders["content-type"];
  }
  const axiosConfig = {
    method,
    url: normalizedTarget,
    headers: outgoingHeaders,
    data: reqBody && ["POST", "PUT", "PATCH"].includes(method.toUpperCase()) ? reqBody : void 0,
    responseType: "arraybuffer",
    maxRedirects: 0,
    // Disable auto-follow to handle ALL redirects manually through proxy
    timeout: 12e3,
    // 12-second safe timeout for free hosting workers
    maxContentLength: 15 * 1024 * 1024,
    // 15MB limit prevents heap out of memory
    validateStatus: () => true
    // capture all status codes
  };
  const response = await (0, import_axios.default)(axiosConfig);
  const durationMs = Date.now() - startTime;
  const contentType = response.headers["content-type"] || "";
  const setCookie = response.headers["set-cookie"];
  if (setCookie) {
    await storeCookiesFromHeaders(setCookie, normalizedTarget, sessionId);
  }
  const filteredHeaders = {};
  for (const [key, val] of Object.entries(response.headers)) {
    const lower = key.toLowerCase();
    if (lower === "content-security-policy" || lower === "content-security-policy-report-only" || lower === "x-frame-options" || lower === "cross-origin-opener-policy" || lower === "cross-origin-embedder-policy" || lower === "cross-origin-resource-policy" || lower === "strict-transport-security" || lower === "transfer-encoding" || lower === "connection" || lower === "content-length" || // will be computed when sending
    lower === "content-encoding") {
      continue;
    }
    filteredHeaders[key] = val;
  }
  filteredHeaders["Access-Control-Allow-Origin"] = "*";
  filteredHeaders["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH";
  filteredHeaders["Access-Control-Allow-Headers"] = "*";
  if ([301, 302, 303, 307, 308].includes(response.status) && response.headers["location"]) {
    const rawLocation = response.headers["location"];
    const targetRedirect = new URL(rawLocation, normalizedTarget).href;
    filteredHeaders["location"] = makeProxiedUrl(targetRedirect, void 0, { ...options, encodeURL: true });
    filteredHeaders["refresh"] = `0; url=${makeProxiedUrl(targetRedirect, void 0, { ...options, encodeURL: true })}`;
  }
  let finalData = response.data;
  const isHtml = contentType.includes("text/html");
  const isCss = contentType.includes("text/css");
  const isJs = contentType.includes("javascript") || contentType.includes("ecmascript") || normalizedTarget.endsWith(".js");
  const isM3u8 = contentType.includes("mpegurl") || contentType.includes("mpegURL") || normalizedTarget.includes(".m3u8");
  if (isHtml) {
    const rawHtml = Buffer.from(response.data).toString("utf-8");
    const rewritten = rewriteHtml(rawHtml, normalizedTarget, options);
    finalData = Buffer.from(rewritten, "utf-8");
  } else if (isCss) {
    const rawCss = Buffer.from(response.data).toString("utf-8");
    const rewritten = rewriteCss(rawCss, normalizedTarget);
    finalData = Buffer.from(rewritten, "utf-8");
  } else if (isJs && options.advancedProxy) {
    const rawJs = Buffer.from(response.data).toString("utf-8");
    const rewritten = rewriteJs(rawJs, normalizedTarget, options);
    finalData = Buffer.from(rewritten, "utf-8");
  } else if (isM3u8) {
    const rawM3u8 = Buffer.from(response.data).toString("utf-8");
    const rewritten = rewriteM3u8(rawM3u8, normalizedTarget, options);
    finalData = Buffer.from(rewritten, "utf-8");
  }
  addNetworkLog({
    id: Math.random().toString(36).substring(2, 9),
    timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
    method: method.toUpperCase(),
    url: normalizedTarget,
    status: response.status,
    contentType: contentType.split(";")[0] || "unknown",
    durationMs,
    sizeBytes: finalData ? finalData.length || 0 : 0
  });
  return {
    status: response.status,
    headers: filteredHeaders,
    data: finalData,
    contentType,
    finalUrl: normalizedTarget
  };
}

// server.ts
var app = (0, import_express.default)();
var PORT = 3e3;
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});
app.use(import_express.default.json({ limit: "20mb" }));
app.use(import_express.default.urlencoded({ extended: true, limit: "20mb" }));
var stats = {
  totalRequests: 0,
  rewrittenLinks: 0,
  blockedSecurityHeaders: 0,
  activeCookies: 0
};
var plugins = [
  {
    name: "Google Accounts & Search",
    domain: "google.com",
    status: "modernized",
    desc: "Bypasses X-Frame-Options & strict CSP, translates Google Identity endpoints, and manages multi-domain cookies."
  },
  {
    name: "YouTube HTML5 & Embeds",
    domain: "youtube.com",
    status: "active",
    desc: "Proxies video streams, strips iframe blocking policies, and enables touch controls for web video."
  },
  {
    name: "Twitter / X SPA Engine",
    domain: "twitter.com",
    status: "active",
    desc: "Handles modern client-side route hydration, fetch-based GraphQL APIs, and bearer authentication cookies."
  },
  {
    name: "Facebook & Meta Graph",
    domain: "facebook.com",
    status: "active",
    desc: "Rewrites touch feed assets, strips cross-origin opener locks, and persists login session hashes."
  },
  {
    name: "Modern Single-Page Apps (SPA)",
    domain: "*",
    status: "universal",
    desc: "Universal interceptor for window.fetch, XMLHttpRequest, history.pushState, and dynamic script tags."
  }
];
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", engine: "NewGlype Modernized Node/TypeScript Core", time: /* @__PURE__ */ new Date() });
});
app.get("/api/host-audit", (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    status: "healthy",
    runtime: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptimeSeconds: Math.floor(process.uptime())
    },
    memory: {
      heapUsedMb: (mem.heapUsed / 1024 / 1024).toFixed(1),
      heapTotalMb: (mem.heapTotal / 1024 / 1024).toFixed(1),
      rssMb: (mem.rss / 1024 / 1024).toFixed(1),
      externalMb: (mem.external / 1024 / 1024).toFixed(1)
    },
    guards: {
      ssrfProtection: true,
      maxBufferLimitMb: 15,
      requestTimeoutSeconds: 12,
      cookieJarType: "RFC 6265 In-Memory Tough-Cookie"
    },
    freeHostingAdvice: {
      nodePlatforms: ["Render (Free Web Service)", "Koyeb (Free Micro Instance)", "Railway (Trial/Hobby)", "Glitch", "Fly.io"],
      cpanelWarning: "\u0647\u0627\u0633\u062A\u200C\u0647\u0627\u06CC \u0627\u0634\u062A\u0631\u0627\u06A9\u06CC cPanel \u0648 PHP \u0631\u0627\u06CC\u06AF\u0627\u0646 (\u0645\u062B\u0644 InfinityFree, 000webhost) \u0627\u0645\u06A9\u0627\u0646 \u0627\u062C\u0631\u0627\u06CC \u067E\u0631\u0648\u06A9\u0633\u06CC Node.js \u0631\u0627 \u0646\u062F\u0627\u0631\u0646\u062F \u0648 \u0637\u0628\u0642 \u0642\u0648\u0627\u0646\u06CC\u0646 \u0627\u0633\u062A\u0641\u0627\u062F\u0647 (ToS) \u062D\u0633\u0627\u0628\u200C\u0647\u0627\u06CC \u067E\u0631\u0648\u06A9\u0633\u06CC \u0631\u0627 \u0645\u0633\u062F\u0648\u062F \u0645\u06CC\u200C\u06A9\u0646\u0646\u062F. \u0628\u0631\u0627\u06CC \u0647\u0627\u0633\u062A \u0631\u0627\u06CC\u06AF\u0627\u0646 \u062D\u062A\u0645\u0627\u064B \u0627\u0632 \u067E\u0644\u062A\u0641\u0631\u0645\u200C\u0647\u0627\u06CC \u0627\u0628\u0631\u06CC \u067E\u0634\u062A\u06CC\u0628\u0627\u0646 Node.js \u0646\u0638\u06CC\u0631 Render \u06CC\u0627 Koyeb \u0627\u0633\u062A\u0641\u0627\u062F\u0647 \u06A9\u0646\u06CC\u062F."
    }
  });
});
app.get("/api/stats", async (req, res) => {
  const cookies = await getAllCookiesForSession("default");
  res.json({
    ...stats,
    activeCookies: cookies.length
  });
});
app.get("/api/plugins", (req, res) => {
  res.json(plugins);
});
app.get("/api/network-logs", (req, res) => {
  res.json(networkLogs);
});
app.get("/api/download-bundle", (req, res) => {
  const version = req.query.version;
  let zipPath = "";
  let filename = "cloud-portal-php.zip";
  if (version) {
    zipPath = import_path.default.join(process.cwd(), "releases", `cloud-portal-php-v${version}.zip`);
    filename = `cloud-portal-php-v${version}.zip`;
  }
  if (!zipPath || !import_fs.default.existsSync(zipPath)) {
    const preferredPath = import_path.default.join(process.cwd(), "public", "cloud-portal-php.zip");
    const legacyPath = import_path.default.join(process.cwd(), "public", "newglype-php-host.zip");
    zipPath = import_fs.default.existsSync(preferredPath) ? preferredPath : legacyPath;
  }
  if (import_fs.default.existsSync(zipPath)) {
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.sendFile(zipPath);
  } else {
    res.status(404).json({ error: "\u0641\u0627\u06CC\u0644 zip \u06CC\u0627\u0641\u062A \u0646\u0634\u062F." });
  }
});
app.get("/api/download-wp-plugin", (req, res) => {
  const version = req.query.version;
  let zipPath = "";
  let filename = "cloud-portal-wp.zip";
  if (version) {
    zipPath = import_path.default.join(process.cwd(), "releases", `cloud-portal-wp-v${version}.zip`);
    filename = `cloud-portal-wp-v${version}.zip`;
  }
  if (!zipPath || !import_fs.default.existsSync(zipPath)) {
    const preferredPath = import_path.default.join(process.cwd(), "public", "cloud-portal-wp.zip");
    const legacyPath = import_path.default.join(process.cwd(), "public", "newglype-proxy.zip");
    zipPath = import_fs.default.existsSync(preferredPath) ? preferredPath : legacyPath;
  }
  if (import_fs.default.existsSync(zipPath)) {
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.sendFile(zipPath);
  } else {
    res.status(404).json({ error: "\u0641\u0627\u06CC\u0644 \u0627\u0641\u0632\u0648\u0646\u0647 \u0648\u0631\u062F\u067E\u0631\u0633 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F." });
  }
});
app.get("/api/releases", (req, res) => {
  const manifestPath = import_path.default.join(process.cwd(), "releases", "manifest.json");
  if (import_fs.default.existsSync(manifestPath)) {
    try {
      const data = JSON.parse(import_fs.default.readFileSync(manifestPath, "utf8"));
      return res.json(data);
    } catch (e) {
    }
  }
  res.json({ latest: "2.1.0", releases: [] });
});
app.use("/releases", import_express.default.static(import_path.default.join(process.cwd(), "releases")));
app.get("/api/cookies", async (req, res) => {
  try {
    const sessionId = req.query.sessionId || "default";
    const cookies = await getAllCookiesForSession(sessionId);
    res.json(cookies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/cookies/clear", (req, res) => {
  try {
    const sessionId = req.body.sessionId || "default";
    clearSessionCookies(sessionId);
    res.json({ success: true, message: "Cookie jar cleared for session" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/cookies/add", async (req, res) => {
  try {
    const { cookieStr, url, sessionId = "default" } = req.body;
    if (!cookieStr || !url) {
      return res.status(400).json({ error: "Missing cookieStr or url" });
    }
    const success = await setManualCookie(cookieStr, url, sessionId);
    res.json({ success });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/proxy/cookies/sync", async (req, res) => {
  try {
    const { url, cookie } = req.body;
    if (url && cookie) {
      await setManualCookie(cookie, url, "default");
    }
    res.status(204).end();
  } catch (err) {
    res.status(204).end();
  }
});
app.all("/api/proxy/gateway", async (req, res) => {
  let rawUrl = req.query.b || req.query.url || req.query.cp_url || req.body?.b || req.body?.url;
  let targetUrl = "";
  if (rawUrl) {
    targetUrl = StealthCipher.decode(rawUrl);
    if (!targetUrl.match(/^https?:\/\//i)) {
      targetUrl = "https://" + targetUrl;
    }
  }
  if (!targetUrl) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <body style="font-family: system-ui, sans-serif; padding: 40px; text-align: center; color: #334155;">
        <h2>No Target URL Specified</h2>
        <p>Please provide a destination URL via <code>?b=https://example.com</code> or <code>?url=...</code></p>
      </body>
      </html>
    `);
  }
  const options = {
    removeScripts: req.query.removeScripts === "true" || req.query.rs === "1" || req.query.cp_rs === "1" || req.body?.removeScripts === true,
    removeImages: req.query.removeImages === "true" || req.query.ri === "1" || req.query.cp_ri === "1" || req.body?.removeImages === true,
    stripTitle: req.query.stripTitle === "true" || req.query.st === "1" || req.query.cp_st === "1" || req.body?.stripTitle === true,
    showToolbar: req.query.showToolbar === "true" || req.query.tb === "1" || req.query.cp_tb === "1" || req.body?.showToolbar === true,
    encodeURL: req.query.encodeURL === "true" || req.query.enc === "1" || req.query.cp_enc === "1" || req.body?.encodeURL === true,
    userAgent: req.query.userAgent || req.body?.userAgent,
    stripSecurityHeaders: req.query.stripSecurityHeaders !== "false",
    injectHook: req.query.injectHook !== "false",
    sessionId: req.query.sessionId || "default"
  };
  stats.totalRequests++;
  try {
    const result = await executeProxyRequest(
      req.method,
      targetUrl,
      req.headers,
      req.body,
      options
    );
    for (const [key, val] of Object.entries(result.headers)) {
      if (val !== void 0) {
        res.setHeader(key, val);
      }
    }
    res.status(result.status).send(result.data);
  } catch (error) {
    console.error("[NewGlype Proxy Error]", error.message);
    res.status(502).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>NewGlype Proxy Gateway Error</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px 20px; display: flex; justify-content: center; align-items: center; min-height: 80vh; }
          .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; max-width: 600px; width: 100%; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.5); }
          .badge { background: #e11d48; color: white; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
          h2 { margin-top: 16px; font-size: 20px; color: #f1f5f9; }
          p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
          pre { background: #090d16; padding: 12px; border-radius: 8px; font-size: 12px; color: #f43f5e; overflow-x: auto; }
          a { color: #38bdf8; text-decoration: none; font-size: 13px; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="card">
          <span class="badge">Gateway 502</span>
          <h2>Failed to Proxy Target Destination</h2>
          <p>The destination server could not be reached or refused the request:</p>
          <pre>${error.message || "Unknown network error"}</pre>
          <p style="margin-top: 16px;">Target URL: <strong>${targetUrl}</strong></p>
          <p>Common modern web causes:</p>
          <ul style="color: #94a3b8; font-size: 13px; padding-left: 20px; line-height: 1.6;">
            <li>DNS resolution failure or target site is blocking data center IP ranges.</li>
            <li>Cloudflare / Akamai bot challenge requiring human verification.</li>
            <li>Self-signed SSL certificates or connection timeout.</li>
          </ul>
        </div>
      </body>
      </html>
    `);
  }
});
app.all("/api/proxy", (req, res) => {
  const target = req.query.url || req.body?.url;
  res.redirect(`/api/proxy/gateway?url=${encodeURIComponent(target || "")}`);
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[NewGlype] Modern proxy server online on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
