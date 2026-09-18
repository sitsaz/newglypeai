import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import { storeCookiesFromHeaders, getCookieHeaderString } from './cookieJar';
import { generateProxyHook } from './proxyHook';
import { StealthCipher } from './cipher';

export interface ProxyOptions {
  removeScripts?: boolean;
  removeImages?: boolean;
  stripTitle?: boolean;
  showToolbar?: boolean;
  encodeURL?: boolean;
  userAgent?: string;
  stripSecurityHeaders?: boolean;
  injectHook?: boolean;
  sessionId?: string;
}

export interface NetworkLogItem {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  status: number;
  contentType: string;
  durationMs: number;
  sizeBytes: number;
}

// In-memory ring buffer for live network telemetry (last 50 requests)
export const networkLogs: NetworkLogItem[] = [];

export function addNetworkLog(log: NetworkLogItem) {
  networkLogs.unshift(log);
  if (networkLogs.length > 60) {
    networkLogs.pop();
  }
}

/**
 * SSRF & Free-Host Protection:
 * Prevents requests to internal cloud metadata, localhost, loopback, or private networks.
 * Protects free hosting accounts from getting banned due to malicious port scanning.
 */
export function isPrivateOrBlockedHost(hostname: string): { blocked: boolean; reason?: string } {
  const host = hostname.toLowerCase().trim();

  // Block localhost and standard loopbacks
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host === 'metadata.google.internal' ||
    host === '169.254.169.254' // AWS / GCP / Azure metadata endpoint
  ) {
    return { blocked: true, reason: 'دسترسی به آدرس‌های داخلی (Localhost/Cloud Metadata) جهت حفظ امنیت سرور مسدود است.' };
  }

  // Check IPv4 private ranges: 10.x.x.x, 172.16-31.x.x, 192.168.x.x, 127.x.x.x
  const ipParts = host.split('.').map(Number);
  if (ipParts.length === 4 && ipParts.every(n => !isNaN(n) && n >= 0 && n <= 255)) {
    // 127.0.0.0/8
    if (ipParts[0] === 127) return { blocked: true, reason: 'Loopback IP blocked' };
    // 10.0.0.0/8
    if (ipParts[0] === 10) return { blocked: true, reason: 'Private 10.0.0.0/8 network blocked' };
    // 172.16.0.0/12
    if (ipParts[0] === 172 && ipParts[1] >= 16 && ipParts[1] <= 31) return { blocked: true, reason: 'Private 172.16.0.0/12 network blocked' };
    // 192.168.0.0/16
    if (ipParts[0] === 192 && ipParts[1] === 168) return { blocked: true, reason: 'Private 192.168.0.0/16 network blocked' };
    // 169.254.0.0/16 Link-Local
    if (ipParts[0] === 169 && ipParts[1] === 254) return { blocked: true, reason: 'Link-local cloud metadata network blocked' };
    // 0.0.0.0/8
    if (ipParts[0] === 0) return { blocked: true, reason: 'Zero IP blocked' };
  }

  return { blocked: false };
}

/**
 * Normalizes a URL, ensuring proper protocol.
 */
export function normalizeUrl(inputUrl: string): string {
  let url = inputUrl.trim();
  if (url.startsWith('//')) {
    url = 'https:' + url;
  } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url;
}

/**
 * Generates a proxied gateway URL for an absolute or relative destination.
 * Respects options.encodeURL (Stealth Cipher) and preserves browsing flags.
 */
export function makeProxiedUrl(
  targetUrl: string,
  baseUrl?: string,
  options: ProxyOptions = {}
): string {
  if (!targetUrl || typeof targetUrl !== 'string') return targetUrl;
  const trimmed = targetUrl.trim();
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('#')
  ) {
    return trimmed;
  }
  if (trimmed.startsWith('/api/proxy/gateway') || trimmed.indexOf('?b=') !== -1 || trimmed.indexOf('&b=') !== -1) {
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
  let flagStr = '';
  if (options.removeScripts) flagStr += '&rs=1';
  if (options.removeImages) flagStr += '&ri=1';
  if (options.stripTitle) flagStr += '&st=1';
  if (options.showToolbar) flagStr += '&tb=1';
  if (isEncoded) flagStr += '&enc=1';

  if (isEncoded) {
    const encoded = StealthCipher.encode(resolved);
    return `/api/proxy/gateway?b=${encodeURIComponent(encoded)}${flagStr}`;
  }
  return `/api/proxy/gateway?url=${encodeURIComponent(resolved)}${flagStr}`;
}

/**
 * Rewrites CSS text to route url(...) and @import through the proxy.
 */
export function rewriteCss(cssContent: string, baseUrl: string, options: ProxyOptions = {}): string {
  return cssContent
    .replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (match, quote, url) => {
      const cleanUrl = url.trim();
      if (cleanUrl.startsWith('data:') || cleanUrl.startsWith('blob:') || cleanUrl.startsWith('#')) {
        return match;
      }
      const proxied = makeProxiedUrl(cleanUrl, baseUrl, options);
      return `url("${proxied}")`;
    })
    .replace(/@import\s+(['"])(.*?)\1/gi, (match, quote, url) => {
      const proxied = makeProxiedUrl(url, baseUrl, options);
      return `@import "${proxied}"`;
    });
}

/**
 * Rewrites HLS .m3u8 playlist files so that all segment URLs and key URIs are routed through the proxy.
 */
export function rewriteM3u8(content: string, baseUrl: string, options: ProxyOptions = {}): string {
  const lines = content.split('\n');
  const rewrittenLines = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return line;
    if (trimmed.startsWith('#')) {
      return trimmed.replace(/URI="([^"]+)"/g, (match, uri) => {
        const proxied = makeProxiedUrl(uri, baseUrl, options);
        return `URI="${proxied}"`;
      });
    } else {
      return makeProxiedUrl(trimmed, baseUrl, options);
    }
  });
  return rewrittenLines.join('\n');
}

/**
 * Rewrites JavaScript files so that hardcoded URLs, API paths, and asset requests are routed through the proxy.
 */
export function rewriteJs(jsContent: string, baseUrl: string, options: ProxyOptions = {}): string {
  if (!options.advancedProxy) return jsContent;
  return jsContent.replace(/(['"])(https?:\/\/[^'"]+|\/[^'"]+\.[a-zA-Z0-9]{2,5})\1/g, (match, quote, url) => {
    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('#') || url.startsWith('javascript:')) {
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

/**
 * Rewrites an HTML document with Cheerio to route all assets, forms, links, and styles through the proxy,
 * and injects the Universal Client-Side Interceptor Hook.
 */
export function rewriteHtml(
  htmlContent: string,
  targetUrl: string,
  options: ProxyOptions = {}
): string {
  const parsedTarget = new URL(targetUrl);
  const targetOrigin = parsedTarget.origin;
  const $ = cheerio.load(htmlContent);

  // 1. Remove strict meta CSP tags if present
  if (options.stripSecurityHeaders !== false) {
    $('meta[http-equiv="Content-Security-Policy"]').remove();
    $('meta[http-equiv="X-Frame-Options"]').remove();
    $('meta[http-equiv="origin-trial"]').remove();
  }

  // 1.5 Strip page title if requested (Glype feature)
  if (options.stripTitle) {
    if ($('title').length > 0) {
      $('title').text('صفحه وب | Web Document');
    } else {
      $('head').prepend('<title>صفحه وب | Web Document</title>');
    }
    $('meta[property="og:title"]').attr('content', 'صفحه وب | Web Document');
    $('meta[name="twitter:title"]').attr('content', 'صفحه وب | Web Document');
  }

  // 2. Remove scripts if requested
  if (options.removeScripts) {
    $('script').remove();
    $('[onclick]').removeAttr('onclick');
    $('[onload]').removeAttr('onload');
  }

  // 3. Remove images if requested
  if (options.removeImages) {
    $('img').replaceWith('<span class="newglype-img-placeholder">[Image Removed]</span>');
  } else {
    // Rewrite img src and srcset
    $('img').each((_, el) => {
      const src = $(el).attr('src');
      if (src) $(el).attr('src', makeProxiedUrl(src, targetUrl, options));
      
      const srcset = $(el).attr('srcset');
      if (srcset) {
        const newSrcset = srcset.split(',').map(part => {
          const [u, ...rest] = part.trim().split(/\s+/);
          return `${makeProxiedUrl(u, targetUrl, options)} ${rest.join(' ')}`.trim();
        }).join(', ');
        $(el).attr('srcset', newSrcset);
      }
    });
  }

  // 4. Rewrite hyperlinks <a>
  $('a').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      $(el).attr('href', makeProxiedUrl(href, targetUrl, options));
    }
  });

  // 5. Rewrite forms <form>
  $('form').each((_, el) => {
    const action = $(el).attr('action');
    if (action) {
      $(el).attr('action', makeProxiedUrl(action, targetUrl, options));
    } else {
      $(el).attr('action', makeProxiedUrl(targetUrl, targetUrl, options));
    }
  });

  // 6. Rewrite stylesheets and icons <link>
  $('link').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      $(el).attr('href', makeProxiedUrl(href, targetUrl, options));
    }
  });

  // 7. Rewrite external scripts <script src="...">
  if (!options.removeScripts) {
    $('script[src]').each((_, el) => {
      const src = $(el).attr('src');
      if (src) {
        $(el).attr('src', makeProxiedUrl(src, targetUrl, options));
      }
    });
  }

  // 8. Rewrite iframes, audio, video, sources
  $('iframe, frame').each((_, el) => {
    const src = $(el).attr('src');
    if (src) $(el).attr('src', makeProxiedUrl(src, targetUrl, options));
  });

  $('audio, video, source, embed').each((_, el) => {
    const src = $(el).attr('src');
    if (src) $(el).attr('src', makeProxiedUrl(src, targetUrl, options));
  });

  // 9. Rewrite inline <style> tags
  $('style').each((_, el) => {
    const rawCss = $(el).html();
    if (rawCss) {
      $(el).html(rewriteCss(rawCss, targetUrl, options));
    }
  });

  // 10. Inject Universal Client Hook at top of <head>
  if (options.injectHook !== false && !options.removeScripts) {
    const hook = generateProxyHook(targetUrl, options);
    if ($('head').length > 0) {
      $('head').prepend(hook);
    } else {
      $.root().prepend(hook);
    }
  }

  return $.html();
}

/**
 * Executes a full proxy fetch with cookie jar persistence, redirect resolution, and header rewriting.
 * Includes heap-safety limits and SSRF verification for Free Hosting tiers.
 */
export async function executeProxyRequest(
  method: string,
  targetUrl: string,
  reqHeaders: Record<string, any>,
  reqBody: any,
  options: ProxyOptions = {}
): Promise<{
  status: number;
  headers: Record<string, any>;
  data: any;
  contentType: string;
  finalUrl: string;
}> {
  const startTime = Date.now();
  const sessionId = options.sessionId || 'default';
  const normalizedTarget = normalizeUrl(targetUrl);
  const parsedTarget = new URL(normalizedTarget);

  // Free Host Protection: Validate host is not private/SSRF
  const ssrfCheck = isPrivateOrBlockedHost(parsedTarget.hostname);
  if (ssrfCheck.blocked) {
    throw new Error(`SSRF Block: ${ssrfCheck.reason || 'Restricted host'}`);
  }

  // 1. Retrieve session cookies for this target domain
  const cookieHeader = await getCookieHeaderString(normalizedTarget, sessionId);

  // 2. Prepare headers
  const outgoingHeaders: Record<string, string> = {
    'User-Agent': options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Accept': reqHeaders['accept'] || 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': reqHeaders['accept-language'] || 'fa,en-US;q=0.9,en;q=0.8',
    'Referer': parsedTarget.origin + '/',
    'Origin': parsedTarget.origin,
    'Sec-Fetch-Dest': (reqHeaders['sec-fetch-dest'] as string) || 'document',
    'Sec-Fetch-Mode': (reqHeaders['sec-fetch-mode'] as string) || 'navigate',
    'Sec-Fetch-Site': (reqHeaders['sec-fetch-site'] as string) || 'same-origin',
    'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
  };

  // Forward client request headers (essential for YouTube InnerTube API, Google, modern web apps)
  for (const [key, val] of Object.entries(reqHeaders)) {
    const lk = key.toLowerCase();
    if (
      lk === 'host' ||
      lk === 'connection' ||
      lk === 'content-length' ||
      lk === 'cookie' ||
      lk === 'origin' ||
      lk === 'referer' ||
      lk.startsWith('sec-fetch-')
    ) {
      continue;
    }
    if (typeof val === 'string') {
      outgoingHeaders[key] = val;
    }
  }

  // Ensure YouTube InnerTube API requests receive required client identity
  if (parsedTarget.hostname.includes('youtube.com')) {
    if (!outgoingHeaders['X-YouTube-Client-Name'] && !outgoingHeaders['x-youtube-client-name']) {
      outgoingHeaders['X-YouTube-Client-Name'] = '1';
    }
    if (!outgoingHeaders['X-YouTube-Client-Version'] && !outgoingHeaders['x-youtube-client-version']) {
      outgoingHeaders['X-YouTube-Client-Version'] = '2.20241108.01.00';
    }
  }

  if (cookieHeader) {
    outgoingHeaders['Cookie'] = cookieHeader;
  }

  // Forward content-type for POST/PUT
  if (reqHeaders['content-type']) {
    outgoingHeaders['Content-Type'] = reqHeaders['content-type'];
  }

  // Free-Host safe memory limits: capped at 12MB buffer
  const axiosConfig: AxiosRequestConfig = {
    method: method as any,
    url: normalizedTarget,
    headers: outgoingHeaders,
    data: reqBody && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) ? reqBody : undefined,
    responseType: 'arraybuffer',
    maxRedirects: 0, // Disable auto-follow to handle ALL redirects manually through proxy
    timeout: 12000, // 12-second safe timeout for free hosting workers
    maxContentLength: 15 * 1024 * 1024, // 15MB limit prevents heap out of memory
    validateStatus: () => true, // capture all status codes
  };

  const response: AxiosResponse = await axios(axiosConfig);
  const durationMs = Date.now() - startTime;
  const contentType = (response.headers['content-type'] as string) || '';

  // 3. Store returned cookies in the Session Cookie Jar
  const setCookie = response.headers['set-cookie'];
  if (setCookie) {
    await storeCookiesFromHeaders(setCookie, normalizedTarget, sessionId);
  }

  // 4. Sanitize and prepare response headers
  const filteredHeaders: Record<string, any> = {};
  for (const [key, val] of Object.entries(response.headers)) {
    const lower = key.toLowerCase();
    // Strip hop-by-hop and restrictive security headers
    if (
      lower === 'content-security-policy' ||
      lower === 'content-security-policy-report-only' ||
      lower === 'x-frame-options' ||
      lower === 'cross-origin-opener-policy' ||
      lower === 'cross-origin-embedder-policy' ||
      lower === 'cross-origin-resource-policy' ||
      lower === 'strict-transport-security' ||
      lower === 'transfer-encoding' ||
      lower === 'connection' ||
      lower === 'content-length' || // will be computed when sending
      lower === 'content-encoding' // axios already decompresses
    ) {
      continue;
    }
    filteredHeaders[key] = val;
  }

  // Allow framing and cross-origin access
  filteredHeaders['Access-Control-Allow-Origin'] = '*';
  filteredHeaders['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH';
  filteredHeaders['Access-Control-Allow-Headers'] = '*';

  // 5. Handle redirects (301, 302, 303, 307, 308)
  // Prevent automatic follow and ensure ALL redirects go through proxy
  if ([301, 302, 303, 307, 308].includes(response.status) && response.headers['location']) {
    const rawLocation = response.headers['location'] as string;
    const targetRedirect = new URL(rawLocation, normalizedTarget).href;
    // Force encode the redirect URL to maintain session state
    filteredHeaders['location'] = makeProxiedUrl(targetRedirect, undefined, { ...options, encodeURL: true });
    // Also add Refresh header as backup for browsers that don't follow Location properly
    filteredHeaders['refresh'] = `0; url=${makeProxiedUrl(targetRedirect, undefined, { ...options, encodeURL: true })}`;
  }

  // 6. Rewrite HTML, CSS, JS, or M3U8 if appropriate
  let finalData: any = response.data;
  const isHtml = contentType.includes('text/html');
  const isCss = contentType.includes('text/css');
  const isJs = contentType.includes('javascript') || contentType.includes('ecmascript') || normalizedTarget.endsWith('.js');
  const isM3u8 = contentType.includes('mpegurl') || contentType.includes('mpegURL') || normalizedTarget.includes('.m3u8');

  if (isHtml) {
    const rawHtml = Buffer.from(response.data).toString('utf-8');
    const rewritten = rewriteHtml(rawHtml, normalizedTarget, options);
    finalData = Buffer.from(rewritten, 'utf-8');
  } else if (isCss) {
    const rawCss = Buffer.from(response.data).toString('utf-8');
    const rewritten = rewriteCss(rawCss, normalizedTarget);
    finalData = Buffer.from(rewritten, 'utf-8');
  } else if (isJs && options.advancedProxy) {
    const rawJs = Buffer.from(response.data).toString('utf-8');
    const rewritten = rewriteJs(rawJs, normalizedTarget, options);
    finalData = Buffer.from(rewritten, 'utf-8');
  } else if (isM3u8) {
    const rawM3u8 = Buffer.from(response.data).toString('utf-8');
    const rewritten = rewriteM3u8(rawM3u8, normalizedTarget, options);
    finalData = Buffer.from(rewritten, 'utf-8');
  }

  // Record telemetry
  addNetworkLog({
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toLocaleTimeString(),
    method: method.toUpperCase(),
    url: normalizedTarget,
    status: response.status,
    contentType: contentType.split(';')[0] || 'unknown',
    durationMs,
    sizeBytes: finalData ? finalData.length || 0 : 0,
  });

  return {
    status: response.status,
    headers: filteredHeaders,
    data: finalData,
    contentType,
    finalUrl: normalizedTarget,
  };
}
