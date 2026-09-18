/**
 * Universal Client-Side Proxy Interceptor Hook
 * Injected into every proxied HTML page's <head>.
 * Intercepts fetch, XMLHttpRequest, forms, cookies, and dynamic links.
 */
export function generateProxyHook(targetUrl: string, options: {
  interceptFetch?: boolean;
  interceptXhr?: boolean;
  interceptCookies?: boolean;
  interceptLinks?: boolean;
} = {}): string {
  const parsedTarget = new URL(targetUrl);
  const targetOrigin = parsedTarget.origin;
  const targetBasePath = parsedTarget.pathname.substring(0, parsedTarget.pathname.lastIndexOf('/') + 1) || '/';

  return `
<script id="__newglype_injected_hook__">
(function() {
  if (window.__NEWGLYPE_INITIALIZED__) return;
  window.__NEWGLYPE_INITIALIZED__ = true;

  var TARGET_ORIGIN = ${JSON.stringify(targetOrigin)};
  var CURRENT_TARGET_URL = ${JSON.stringify(targetUrl)};
  var PROXY_GATEWAY = "/api/proxy/gateway";

  // Helper to resolve any URL (relative, absolute, protocol-relative) to an absolute target URL
  function resolveTargetUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;
    var trimmed = rawUrl.trim();
    if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('#')) {
      return trimmed;
    }
    if (trimmed.startsWith(PROXY_GATEWAY)) {
      return trimmed; // already proxied
    }
    try {
      var absolute = new URL(trimmed, CURRENT_TARGET_URL).href;
      return PROXY_GATEWAY + "?url=" + encodeURIComponent(absolute);
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

  // 1. Intercept window.fetch (Crucial for modern SPAs, React, Google Auth buttons, etc.)
  var _originalFetch = window.fetch;
  if (_originalFetch) {
    window.fetch = function(input, init) {
      try {
        if (typeof input === 'string') {
          input = resolveTargetUrl(input);
        } else if (input && typeof input.url === 'string') {
          var newUrl = resolveTargetUrl(input.url);
          input = new Request(newUrl, input);
        }
      } catch(err) {
        console.warn('[NewGlype Proxy Hook] fetch rewrite error:', err);
      }
      return _originalFetch.call(this, input, init);
    };
  }

  // 2. Intercept XMLHttpRequest (AJAX calls)
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

  // 3. Intercept Form Submissions
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

  // 4. Intercept Dynamic Link Clicks
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

  // 5. Virtual Cookie Bridge for document.cookie
  try {
    var _cookieStore = {};
    // Seed initial document.cookie string
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
          // Synchronize back to the backend session cookie jar
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
  } catch(cookieErr) {
    console.warn('[NewGlype Proxy Hook] Cookie interception note:', cookieErr);
  }

  // 6. Window.open override
  var _originalOpen = window.open;
  window.open = function(url, target, features) {
    if (url) {
      url = resolveTargetUrl(url);
    }
    return _originalOpen.call(this, url, target, features);
  };

  // 7. Notify parent shell of location changes (SPAs, pushState)
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

  // Report initial load to parent
  window.addEventListener('load', function() {
    notifyParentNavigation(window.location.href);
  });

  console.info('[NewGlype] Modern Proxy Interceptor active for:', CURRENT_TARGET_URL);
})();
</script>
`;
}
