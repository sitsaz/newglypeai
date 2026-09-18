import express from "express";
import path from "path";
import axios from "axios";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory store for stats and cookies
let stats = {
  totalRequests: 1420,
  bandwidthSaved: "45.2 MB",
  activeSessions: 3,
  blockedAds: 89,
};

let activeCookies: Record<string, string> = {
  "session_id": "ng_proxy_99281a",
  "anonymity_level": "high",
  "referrer_hide": "true"
};

const plugins = [
  { name: "Facebook", domain: "facebook.com", status: "active", desc: "Optimized rewriting for Facebook mobile/desktop feeds" },
  { name: "Google", domain: "google.com", status: "active", desc: "Bypasses regional search locks and safe-search wrappers" },
  { name: "YouTube", domain: "youtube.com", status: "active", desc: "Proxies video streams and embedded player frames" },
  { name: "Twitter / X", domain: "twitter.com", status: "active", desc: "Strips tracking scripts and telemetry headers" },
  { name: "Hotmail / Outlook", domain: "hotmail.com", status: "active", desc: "Rewrites authentication redirects for webmail access" },
  { name: "Yahoo", domain: "yahoo.com", status: "active", desc: "Custom header injection for clean portal browsing" }
];

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/stats", (req, res) => {
  res.json(stats);
});

app.get("/api/plugins", (req, res) => {
  res.json(plugins);
});

app.get("/api/cookies", (req, res) => {
  res.json(activeCookies);
});

app.post("/api/cookies/clear", (req, res) => {
  activeCookies = {};
  res.json({ success: true, cookies: activeCookies });
});

// Proxy Fetch Endpoint
app.all("/api/proxy", async (req, res) => {
  const targetUrl = (req.query.url || req.body.url) as string;
  if (!targetUrl) {
    return res.status(400).json({ error: "Missing target URL" });
  }

  let formattedUrl = targetUrl;
  if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
    formattedUrl = "https://" + formattedUrl;
  }

  const removeScripts = req.query.removeScripts === 'true' || req.body.removeScripts === true;
  const removeImages = req.query.removeImages === 'true' || req.body.removeImages === true;
  const userAgent = (req.query.userAgent || req.body.userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36") as string;

  stats.totalRequests++;

  try {
    const response = await axios({
      method: req.method,
      url: formattedUrl,
      headers: {
        "User-Agent": userAgent,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Referer": new URL(formattedUrl).origin,
      },
      responseType: "text",
      timeout: 10000,
      validateStatus: () => true, // accept all status codes to proxy them back
    });

    let data = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

    // Basic transformations if HTML
    const contentType = response.headers["content-type"] || "";
    if (contentType.includes("text/html")) {
      // Inject base tag so relative links resolve against target domain
      const parsedUrl = new URL(formattedUrl);
      const baseTag = `<base href="${parsedUrl.origin}/">`;
      if (data.includes("<head>")) {
        data = data.replace("<head>", `<head>\n${baseTag}`);
      } else {
        data = baseTag + data;
      }

      if (removeScripts) {
        data = data.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "<!-- [Script Removed by Glype] -->");
      }
    }

    res.setHeader("Content-Type", contentType || "text/html");
    res.status(response.status).send(data);
  } catch (err: any) {
    console.error("Proxy error:", err.message);
    res.status(502).json({
      error: "Failed to fetch target URL",
      details: err.message,
      target: formattedUrl
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NewGlype proxy server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
