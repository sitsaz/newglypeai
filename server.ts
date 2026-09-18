import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { 
  executeProxyRequest, 
  networkLogs, 
  ProxyOptions 
} from './server/proxyEngine';
import { 
  getAllCookiesForSession, 
  clearSessionCookies, 
  setManualCookie 
} from './server/cookieJar';

const app = express();
const PORT = 3000;

// CORS middleware for iframe, subresources, and beacon requests
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Body parsers
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Aggregated live statistics
const stats = {
  totalRequests: 0,
  rewrittenLinks: 0,
  blockedSecurityHeaders: 0,
  activeCookies: 0,
};

const plugins = [
  { 
    name: 'Google Accounts & Search', 
    domain: 'google.com', 
    status: 'modernized', 
    desc: 'Bypasses X-Frame-Options & strict CSP, translates Google Identity endpoints, and manages multi-domain cookies.' 
  },
  { 
    name: 'YouTube HTML5 & Embeds', 
    domain: 'youtube.com', 
    status: 'active', 
    desc: 'Proxies video streams, strips iframe blocking policies, and enables touch controls for web video.' 
  },
  { 
    name: 'Twitter / X SPA Engine', 
    domain: 'twitter.com', 
    status: 'active', 
    desc: 'Handles modern client-side route hydration, fetch-based GraphQL APIs, and bearer authentication cookies.' 
  },
  { 
    name: 'Facebook & Meta Graph', 
    domain: 'facebook.com', 
    status: 'active', 
    desc: 'Rewrites touch feed assets, strips cross-origin opener locks, and persists login session hashes.' 
  },
  { 
    name: 'Modern Single-Page Apps (SPA)', 
    domain: '*', 
    status: 'universal', 
    desc: 'Universal interceptor for window.fetch, XMLHttpRequest, history.pushState, and dynamic script tags.' 
  },
];

// --- Telemetry & Information APIs ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', engine: 'NewGlype Modernized Node/TypeScript Core', time: new Date() });
});

app.get('/api/host-audit', (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    status: 'healthy',
    runtime: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptimeSeconds: Math.floor(process.uptime()),
    },
    memory: {
      heapUsedMb: (mem.heapUsed / 1024 / 1024).toFixed(1),
      heapTotalMb: (mem.heapTotal / 1024 / 1024).toFixed(1),
      rssMb: (mem.rss / 1024 / 1024).toFixed(1),
      externalMb: (mem.external / 1024 / 1024).toFixed(1),
    },
    guards: {
      ssrfProtection: true,
      maxBufferLimitMb: 15,
      requestTimeoutSeconds: 12,
      cookieJarType: 'RFC 6265 In-Memory Tough-Cookie',
    },
    freeHostingAdvice: {
      nodePlatforms: ['Render (Free Web Service)', 'Koyeb (Free Micro Instance)', 'Railway (Trial/Hobby)', 'Glitch', 'Fly.io'],
      cpanelWarning: 'هاست‌های اشتراکی cPanel و PHP رایگان (مثل InfinityFree, 000webhost) امکان اجرای پروکسی Node.js را ندارند و طبق قوانین استفاده (ToS) حساب‌های پروکسی را مسدود می‌کنند. برای هاست رایگان حتماً از پلتفرم‌های ابری پشتیبان Node.js نظیر Render یا Koyeb استفاده کنید.',
    }
  });
});

app.get('/api/stats', async (req, res) => {
  const cookies = await getAllCookiesForSession('default');
  res.json({
    ...stats,
    activeCookies: cookies.length,
  });
});

app.get('/api/plugins', (req, res) => {
  res.json(plugins);
});

app.get('/api/network-logs', (req, res) => {
  res.json(networkLogs);
});

// Download pre-packaged PHP Standalone ZIP for direct cPanel / free host deployment
app.get('/api/download-bundle', (req, res) => {
  const preferredPath = path.join(process.cwd(), 'public', 'cloud-portal-php.zip');
  const legacyPath = path.join(process.cwd(), 'public', 'newglype-php-host.zip');
  const zipPath = fs.existsSync(preferredPath) ? preferredPath : legacyPath;
  if (fs.existsSync(zipPath)) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="cloud-portal-php.zip"');
    res.sendFile(zipPath);
  } else {
    res.status(404).json({ error: 'فایل zip هنوز ایجاد نشده است.' });
  }
});

// Download ready-to-install WordPress Plugin ZIP (cloud-portal-wp.zip or newglype-proxy.zip)
app.get('/api/download-wp-plugin', (req, res) => {
  const preferredPath = path.join(process.cwd(), 'public', 'cloud-portal-wp.zip');
  const legacyPath = path.join(process.cwd(), 'public', 'newglype-proxy.zip');
  const zipPath = fs.existsSync(preferredPath) ? preferredPath : legacyPath;
  if (fs.existsSync(zipPath)) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="cloud-portal-wp.zip"');
    res.sendFile(zipPath);
  } else {
    res.status(404).json({ error: 'فایل افزونه وردپرس یافت نشد.' });
  }
});

// --- Cookie Jar APIs ---
app.get('/api/cookies', async (req, res) => {
  try {
    const sessionId = (req.query.sessionId as string) || 'default';
    const cookies = await getAllCookiesForSession(sessionId);
    res.json(cookies);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cookies/clear', (req, res) => {
  try {
    const sessionId = req.body.sessionId || 'default';
    clearSessionCookies(sessionId);
    res.json({ success: true, message: 'Cookie jar cleared for session' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cookies/add', async (req, res) => {
  try {
    const { cookieStr, url, sessionId = 'default' } = req.body;
    if (!cookieStr || !url) {
      return res.status(400).json({ error: 'Missing cookieStr or url' });
    }
    const success = await setManualCookie(cookieStr, url, sessionId);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Sync from client-side hook (navigator.sendBeacon or fetch)
app.post('/api/proxy/cookies/sync', async (req, res) => {
  try {
    const { url, cookie } = req.body;
    if (url && cookie) {
      await setManualCookie(cookie, url, 'default');
    }
    res.status(204).end();
  } catch (err) {
    res.status(204).end();
  }
});

import { StealthCipher } from './server/cipher';

// --- Universal Modern Proxy Gateway ---
app.all('/api/proxy/gateway', async (req, res) => {
  let rawUrl = (req.query.b || req.query.url || req.query.cp_url || req.body?.b || req.body?.url) as string;
  let targetUrl = '';
  if (rawUrl) {
    targetUrl = StealthCipher.decode(rawUrl);
    if (!targetUrl.match(/^https?:\/\//i)) {
      targetUrl = 'https://' + targetUrl;
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

  const options: ProxyOptions = {
    removeScripts: req.query.removeScripts === 'true' || req.query.rs === '1' || req.query.cp_rs === '1' || req.body?.removeScripts === true,
    removeImages: req.query.removeImages === 'true' || req.query.ri === '1' || req.query.cp_ri === '1' || req.body?.removeImages === true,
    stripTitle: req.query.stripTitle === 'true' || req.query.st === '1' || req.query.cp_st === '1' || req.body?.stripTitle === true,
    showToolbar: req.query.showToolbar === 'true' || req.query.tb === '1' || req.query.cp_tb === '1' || req.body?.showToolbar === true,
    encodeURL: req.query.encodeURL === 'true' || req.query.enc === '1' || req.query.cp_enc === '1' || req.body?.encodeURL === true,
    userAgent: (req.query.userAgent || req.body?.userAgent) as string,
    stripSecurityHeaders: req.query.stripSecurityHeaders !== 'false',
    injectHook: req.query.injectHook !== 'false',
    sessionId: (req.query.sessionId as string) || 'default',
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

    // Apply sanitized headers
    for (const [key, val] of Object.entries(result.headers)) {
      if (val !== undefined) {
        res.setHeader(key, val);
      }
    }

    res.status(result.status).send(result.data);
  } catch (error: any) {
    console.error('[NewGlype Proxy Error]', error.message);
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
          <pre>${error.message || 'Unknown network error'}</pre>
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

// Legacy backward-compatibility endpoint
app.all('/api/proxy', (req, res) => {
  const target = req.query.url || req.body?.url;
  res.redirect(`/api/proxy/gateway?url=${encodeURIComponent(target as string || '')}`);
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NewGlype] Modern proxy server online on http://0.0.0.0:${PORT}`);
  });
}

startServer();
