import { ProxyOptions } from './proxyEngine.js';

/**
 * Modern Client-Side Proxy Interceptor Hook
 * Intercepts fetch, XMLHttpRequest, DOM element creation (images, scripts, links, iframes),
 * form submits, link navigation, title mutations, and document.cookie.
 */
export function generateClientHook(targetUrl: string, options: ProxyOptions = {}): string {
  let targetOrigin = '';
  try {
    targetOrigin = new URL(targetUrl).origin;
  } catch (e) {
    targetOrigin = '';
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
  var IS_ENCODED = ${isEncoded ? 'true' : 'false'};
  var STRIP_TITLE = ${stripTitle ? 'true' : 'false'};
  var REMOVE_IMAGES = ${removeImages ? 'true' : 'false'};
  var ADVANCED_PROXY = ${advancedProxy ? 'true' : 'false'};
  var STEALTH_MODE = ${stealthMode ? 'true' : 'false'};
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
      if (${removeScripts ? 'true' : 'false'}) flagStr += '&rs=1';
      if (REMOVE_IMAGES) flagStr += '&ri=1';
      if (STRIP_TITLE) flagStr += '&st=1';
      if (${showToolbar ? 'true' : 'false'}) flagStr += '&tb=1';
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
      if (typeof obj === 'string' && /^https?:\/\//i.test(obj)) {
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
        if (typeof val === 'string' && /^https?:\/\//i.test(val)) {
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
                var chunks = part.trim().split(/\s+/);
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
          var urlRegex = new RegExp("url\\\\(\\\\s*(['\\\"]?)(.*?)\\\\1\\\\s*\\\\)", "gi");
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
        var urlRegex = new RegExp("url\\\\(\\\\s*(['\\\"]?)(.*?)\\\\1\\\\s*\\\\)", "gi");
        value = value.replace(urlRegex, function(match, quote, u) {
          return 'url("' + resolveTargetUrl(u) + '")';
        });
      }
      return _originalSetProperty.call(this, property, value, priority);
    };
  } catch(e) {}

  // 5. Freeze Page Title if Strip Title (پنهان‌سازی عنوان) is requested
  if (STRIP_TITLE) {
    try {
      document.title = 'صفحه وب | Web Document';
      Object.defineProperty(document, 'title', {
        get: function() {
          return 'صفحه وب | Web Document';
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

export const generateProxyHook = generateClientHook;
