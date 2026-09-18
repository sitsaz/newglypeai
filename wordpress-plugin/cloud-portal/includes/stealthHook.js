/**
 * Stealth Client-Side Engine Hook
 * Injected into browsed documents for seamless dynamic request interception,
 * SPA routing, frame-buster neutralization, and cookie synchronization.
 */
(function() {
  if (window.__vault_installed__) return;
  window.__vault_installed__ = true;

  var ctx = window.__portal_ctx__ || {};
  var currentTargetUrl = ctx.u || window.location.href;
  var gatewayScript = ctx.g || 'browse.php';
  var isEncoded = !!ctx.enc;
  var encKey = ctx.k || 'cp_vault_key';

  // Bi-directional XOR URL Cipher matching PHP StealthCipher
  function cipherEncode(str, key) {
    if (!str || typeof str !== 'string') return '';
    key = key || encKey;
    var out = '';
    for (var i = 0; i < str.length; i++) {
      out += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    try {
      var b64 = btoa(unescape(encodeURIComponent(out)));
      return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch(e) {
      return btoa(out).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
  }

  function resolveStreamUrl(url) {
    if (!url || typeof url !== 'string') return url;
    var trimmed = url.trim();
    if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('javascript:') || trimmed.startsWith('#')) {
      return trimmed;
    }
    if (trimmed.indexOf(gatewayScript) !== -1 || trimmed.indexOf('?b=') !== -1 || trimmed.indexOf('&b=') !== -1) {
      return trimmed;
    }
    try {
      var absolute = new URL(trimmed, currentTargetUrl).href;
      var sep = gatewayScript.indexOf('?') !== -1 ? '&' : '?';
      var payload = isEncoded ? cipherEncode(absolute) : encodeURIComponent(absolute);
      var flags = '';
      if (ctx.rs) flags += '&rs=1';
      if (ctx.ri) flags += '&ri=1';
      if (ctx.st) flags += '&st=1';
      if (ctx.tb) flags += '&tb=1';
      if (ctx.enc) flags += '&enc=1';
      return gatewayScript + sep + 'b=' + payload + flags;
    } catch(e) {
      return trimmed;
    }
  }

  // 1. Frame-Buster Breaker (Prevents target sites from breaking out of view/iframe)
  try {
    Object.defineProperty(window, 'top', {
      get: function() { return window.self; },
      set: function() {}
    });
    Object.defineProperty(window, 'parent', {
      get: function() { return window.self; },
      set: function() {}
    });
  } catch(e) {}

  // 2. Intercept window.fetch (Crucial for modern dynamic buttons, Google Auth, AJAX)
  if (window.fetch) {
    var originalFetch = window.fetch;
    window.fetch = function(input, init) {
      if (typeof input === 'string') {
        input = resolveStreamUrl(input);
      } else if (input && typeof input.url === 'string') {
        try {
          var newUrl = resolveStreamUrl(input.url);
          input = new Request(newUrl, input);
        } catch (e) {}
      }
      return originalFetch.call(this, input, init);
    };
  }

  // 3. Intercept XMLHttpRequest
  if (window.XMLHttpRequest) {
    var originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
      var proxied = resolveStreamUrl(url);
      return originalOpen.call(this, method, proxied, async !== false, user, password);
    };
  }

  // 4. Intercept dynamic HTMLFormElement submit and capture event
  if (window.HTMLFormElement) {
    var originalSubmit = HTMLFormElement.prototype.submit;
    HTMLFormElement.prototype.submit = function() {
      if (this.action) {
        this.action = resolveStreamUrl(this.action);
      }
      return originalSubmit.call(this);
    };

    window.addEventListener('submit', function(e) {
      var form = e.target;
      if (form && form.action && !form.dataset.rewritten) {
        form.action = resolveStreamUrl(form.action);
        form.dataset.rewritten = '1';
      }
    }, true);
  }

  // 5. Intercept document.cookie setter and sync with server vault
  try {
    var cookieDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie') ||
                     Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'cookie');
    if (cookieDesc && cookieDesc.configurable) {
      var originalCookieGet = cookieDesc.get;
      var originalCookieSet = cookieDesc.set;
      Object.defineProperty(document, 'cookie', {
        get: function() {
          return originalCookieGet ? originalCookieGet.call(this) : '';
        },
        set: function(val) {
          var sep = gatewayScript.indexOf('?') !== -1 ? '&' : '?';
          var syncUrl = gatewayScript + sep + 'action=sync_cookie';
          if (navigator.sendBeacon) {
            var data = new FormData();
            data.append('url', currentTargetUrl);
            data.append('cookie', val);
            navigator.sendBeacon(syncUrl, data);
          } else {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', syncUrl, true);
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            xhr.send('url=' + encodeURIComponent(currentTargetUrl) + '&cookie=' + encodeURIComponent(val));
          }
          if (originalCookieSet) {
            originalCookieSet.call(this, val);
          }
        },
        configurable: true
      });
    }
  } catch(e) {}

  // 6. Intercept window.open
  var originalWindowOpen = window.open;
  window.open = function(url, target, features) {
    if (url) url = resolveStreamUrl(url);
    return originalWindowOpen.call(this, url, target, features);
  };

  // 7. Intercept SPA history navigation (pushState & replaceState)
  if (window.history && window.history.pushState) {
    var origPush = window.history.pushState;
    window.history.pushState = function(state, title, url) {
      if (url && typeof url === 'string') {
        url = resolveStreamUrl(url);
      }
      return origPush.call(this, state, title, url);
    };
    var origReplace = window.history.replaceState;
    window.history.replaceState = function(state, title, url) {
      if (url && typeof url === 'string') {
        url = resolveStreamUrl(url);
      }
      return origReplace.call(this, state, title, url);
    };
  }

  // 8. Toolbar UI Toggle Handler
  window.__togglePortalToolbar = function() {
    var tb = document.getElementById('__ptb_wrap');
    var badge = document.getElementById('__ptb_badge');
    if (tb && badge) {
      if (tb.style.display === 'none') {
        tb.style.display = 'block';
        badge.style.display = 'none';
        document.body.style.marginTop = '42px';
      } else {
        tb.style.display = 'none';
        badge.style.display = 'flex';
        document.body.style.marginTop = '0px';
      }
    }
  };
})();
