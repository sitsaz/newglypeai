import { CookieJar, Cookie } from 'tough-cookie';

// In-memory session cookie jars mapped by sessionId
const sessionJars = new Map<string, CookieJar>();

export function getSessionJar(sessionId: string = 'default'): CookieJar {
  let jar = sessionJars.get(sessionId);
  if (!jar) {
    jar = new CookieJar();
    sessionJars.set(sessionId, jar);
  }
  return jar;
}

export async function storeCookiesFromHeaders(
  setCookieHeaders: string | string[] | undefined,
  url: string,
  sessionId: string = 'default'
): Promise<void> {
  if (!setCookieHeaders) return;
  const jar = getSessionJar(sessionId);
  const headers = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];

  for (const header of headers) {
    try {
      await jar.setCookie(header, url, { ignoreError: true });
    } catch (e) {
      // Ignore invalid cookies safely
    }
  }
}

export async function getCookieHeaderString(
  url: string,
  sessionId: string = 'default'
): Promise<string> {
  try {
    const jar = getSessionJar(sessionId);
    return await jar.getCookieString(url);
  } catch (e) {
    return '';
  }
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

export async function getAllCookiesForSession(sessionId: string = 'default'): Promise<DetailedCookie[]> {
  const jar = getSessionJar(sessionId);
  const results: DetailedCookie[] = [];

  try {
    // tough-cookie serialize
    const serialized = await jar.serialize();
    if (serialized && serialized.cookies) {
      for (const c of serialized.cookies) {
        results.push({
          domain: c.domain || '',
          path: c.path || '/',
          key: c.key || '',
          value: c.value || '',
          expires: c.expires ? new Date(c.expires).toISOString() : undefined,
          httpOnly: Boolean(c.httpOnly),
          secure: Boolean(c.secure),
          sameSite: c.sameSite,
        });
      }
    }
  } catch (e) {
    console.error('Failed to get cookies:', e);
  }

  return results;
}

export async function setManualCookie(
  cookieStr: string,
  url: string,
  sessionId: string = 'default'
): Promise<boolean> {
  try {
    const jar = getSessionJar(sessionId);
    await jar.setCookie(cookieStr, url, { ignoreError: false });
    return true;
  } catch (e) {
    return false;
  }
}

export function clearSessionCookies(sessionId: string = 'default'): void {
  const jar = sessionJars.get(sessionId);
  if (jar) {
    jar.removeAllCookiesSync();
  }
}
