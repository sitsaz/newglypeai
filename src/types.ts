export interface Stats {
  totalRequests: number;
  bandwidthSaved: string;
  activeSessions: number;
  blockedAds: number;
}

export interface PluginItem {
  name: string;
  domain: string;
  status: string;
  desc: string;
}

export interface ProxyOptions {
  removeScripts: boolean;
  removeImages: boolean;
  userAgent: string;
  encryptUrl: boolean;
}
