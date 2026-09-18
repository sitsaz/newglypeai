export interface Stats {
  totalRequests: number;
  rewrittenLinks: number;
  blockedSecurityHeaders: number;
  activeCookies: number;
}

export interface PluginItem {
  name: string;
  domain: string;
  status: string;
  desc: string;
}

export interface DetailedCookie {
  domain: string;
  path: string;
  key: string;
  value: string;
  expires?: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite?: string;
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

export interface ProxyConfig {
  removeScripts: boolean;
  removeImages: boolean;
  userAgent: string;
  stripSecurityHeaders: boolean;
  injectHook: boolean;
}
