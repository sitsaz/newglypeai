<?php
/**
 * NewGlype Modernized Proxy Engine for Traditional Free PHP Hosts
 * Standalone, zero external dependencies, compatible with PHP 7.2 - 8.3.
 */

require_once __DIR__ . '/CookieJar.php';

class NewGlypeProxyEngine {
    private $cookieJar;
    private $gatewayScript = 'proxy.php';
    private $userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

    public function __construct() {
        $this->cookieJar = new NewGlypeCookieJar();
    }

    public function getCookieJar() {
        return $this->cookieJar;
    }

    /**
     * Checks if target host is a private or internal loopback IP (SSRF Protection).
     */
    public function isBlockedHost($host) {
        $host = strtolower(trim($host));
        if (in_array($host, ['localhost', '127.0.0.1', '0.0.0.0', '::1', 'metadata.google.internal', '169.254.169.254'])) {
            return true;
        }
        $ip = ip2long($host);
        if ($ip !== false) {
            // 127.0.0.0/8
            if (($ip & 0xFF000000) === 0x7F000000) return true;
            // 10.0.0.0/8
            if (($ip & 0xFF000000) === 0x0A000000) return true;
            // 172.16.0.0/12
            if (($ip & 0xFFF00000) === 0xAC100000) return true;
            // 192.168.0.0/16
            if (($ip & 0xFFFF0000) === 0xC0A80000) return true;
            // 169.254.0.0/16
            if (($ip & 0xFFFF0000) === 0xA9FE0000) return true;
        }
        return false;
    }

    /**
     * Converts relative or absolute URLs to proxied gateway URLs.
     */
    public function makeProxiedUrl($targetUrl, $baseUrl = null) {
        if (empty($targetUrl)) return $targetUrl;
        $trimmed = trim($targetUrl);

        if (
            strpos($trimmed, 'data:') === 0 ||
            strpos($trimmed, 'blob:') === 0 ||
            strpos($trimmed, 'javascript:') === 0 ||
            strpos($trimmed, '#') === 0 ||
            strpos($trimmed, $this->gatewayScript) !== false
        ) {
            return $trimmed;
        }

        $resolved = $trimmed;
        if ($baseUrl) {
            $resolved = $this->resolveRelativeUrl($trimmed, $baseUrl);
        }

        return $this->gatewayScript . '?url=' . urlencode($resolved);
    }

    /**
     * Resolves a relative URL against a base URL according to RFC 3986.
     */
    public function resolveRelativeUrl($rel, $base) {
        if (parse_url($rel, PHP_URL_SCHEME) != '') return $rel;
        if (strpos($rel, '//') === 0) {
            $baseScheme = parse_url($base, PHP_URL_SCHEME);
            return ($baseScheme ? $baseScheme : 'https') . ':' . $rel;
        }
        if ($rel[0] == '#' || $rel[0] == '?') return $base . $rel;

        extract(parse_url($base));
        $path = isset($path) ? preg_replace('#/[^/]*$#', '', $path) : '';
        if ($rel[0] == '/') $path = '';

        $abs = "$host$path/$rel";
        $re = array('#(/\.?/)#', '#/(?!\.\.)[^/]+/\.\./#');
        for ($n = 1; $n > 0; $abs = preg_replace($re, '/', $abs, -1, $n)) {}

        $scheme = isset($scheme) ? $scheme : 'https';
        $portStr = (isset($port) && $port != 80 && $port != 443) ? ':' . $port : '';
        return $scheme . '://' . $abs;
    }

    /**
     * Rewrites CSS url(...) references.
     */
    public function rewriteCss($css, $baseUrl) {
        return preg_replace_callback('/url\(\s*[\'"]?(.*?)[\'"]?\s*\)/i', function($matches) use ($baseUrl) {
            $url = trim($matches[1]);
            if (strpos($url, 'data:') === 0 || strpos($url, 'blob:') === 0 || strpos($url, '#') === 0) {
                return $matches[0];
            }
            $proxied = $this->makeProxiedUrl($url, $baseUrl);
            return 'url("' . $proxied . '")';
        }, $css);
    }

    /**
     * Rewrites HTML tags and injects the Universal Client-Side Hook.
     */
    public function rewriteHtml($html, $targetUrl, $removeScripts = false, $removeImages = false) {
        $parsed = parse_url($targetUrl);
        $baseUrl = (isset($parsed['scheme']) ? $parsed['scheme'] : 'https') . '://' . (isset($parsed['host']) ? $parsed['host'] : '');

        // 1. Remove meta CSP and X-Frame-Options
        $html = preg_replace('/<meta[^>]+http-equiv=[\'"]?(Content-Security-Policy|X-Frame-Options)[\'"]?[^>]*>/i', '', $html);

        // 2. Remove scripts if requested
        if ($removeScripts) {
            $html = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', $html);
            $html = preg_replace('/\son\w+=["\'][^"\']*["\']/i', '', $html);
        }

        // 3. Remove images if requested
        if ($removeImages) {
            $html = preg_replace('/<img\b[^>]*>/i', '<span class="img-removed">[Image Removed]</span>', $html);
        } else {
            // Rewrite <img> src
            $html = preg_replace_callback('/<img\b([^>]*?)\bsrc=([\'"])(.*?)\2([^>]*)>/i', function($m) use ($targetUrl) {
                return '<img' . $m[1] . 'src=' . $m[2] . $this->makeProxiedUrl($m[3], $targetUrl) . $m[2] . $m[4] . '>';
            }, $html);
        }

        // 4. Rewrite <a href="...">
        $html = preg_replace_callback('/<a\b([^>]*?)\bhref=([\'"])(.*?)\2([^>]*)>/i', function($m) use ($targetUrl) {
            return '<a' . $m[1] . 'href=' . $m[2] . $this->makeProxiedUrl($m[3], $targetUrl) . $m[2] . $m[4] . '>';
        }, $html);

        // 5. Rewrite <form action="...">
        $html = preg_replace_callback('/<form\b([^>]*?)\baction=([\'"])(.*?)\2([^>]*)>/i', function($m) use ($targetUrl) {
            return '<form' . $m[1] . 'action=' . $m[2] . $this->makeProxiedUrl($m[3], $targetUrl) . $m[2] . $m[4] . '>';
        }, $html);

        // 6. Rewrite <link href="..."> (stylesheets, icons)
        $html = preg_replace_callback('/<link\b([^>]*?)\bhref=([\'"])(.*?)\2([^>]*)>/i', function($m) use ($targetUrl) {
            return '<link' . $m[1] . 'href=' . $m[2] . $this->makeProxiedUrl($m[3], $targetUrl) . $m[2] . $m[4] . '>';
        }, $html);

        // 7. Rewrite <script src="...">
        if (!$removeScripts) {
            $html = preg_replace_callback('/<script\b([^>]*?)\bsrc=([\'"])(.*?)\2([^>]*)>/i', function($m) use ($targetUrl) {
                return '<script' . $m[1] . 'src=' . $m[2] . $this->makeProxiedUrl($m[3], $targetUrl) . $m[2] . $m[4] . '>';
            }, $html);
        }

        // 8. Rewrite <iframe src="...">
        $html = preg_replace_callback('/<iframe\b([^>]*?)\bsrc=([\'"])(.*?)\2([^>]*)>/i', function($m) use ($targetUrl) {
            return '<iframe' . $m[1] . 'src=' . $m[2] . $this->makeProxiedUrl($m[3], $targetUrl) . $m[2] . $m[4] . '>';
        }, $html);

        // 9. Rewrite inline <style>...</style>
        $html = preg_replace_callback('/<style\b([^>]*)>(.*?)<\/style>/is', function($m) use ($targetUrl) {
            return '<style' . $m[1] . '>' . $this->rewriteCss($m[2], $targetUrl) . '</style>';
        }, $html);

        // 10. Inject Universal Interceptor Hook
        if (!$removeScripts) {
            $hookScript = file_get_contents(__DIR__ . '/proxyHook.js');
            $injection = "\n<script>\n" .
                "window.__NEWGLYPE_TARGET_URL__ = " . json_encode($targetUrl) . ";\n" .
                "window.__NEWGLYPE_GATEWAY_URL__ = " . json_encode($this->gatewayScript) . ";\n" .
                $hookScript .
                "\n</script>\n";

            if (stripos($html, '<head>') !== false) {
                $html = preg_replace('/<head>/i', '<head>' . $injection, $html, 1);
            } else {
                $html = $injection . $html;
            }
        }

        return $html;
    }

    /**
     * Executes the proxy request via cURL (or stream context fallback).
     */
    public function executeRequest($targetUrl, $method = 'GET', $postData = null, $customHeaders = []) {
        $parsed = parse_url($targetUrl);
        if (!isset($parsed['host'])) {
            throw new Exception("آدرس نامعتبر است.");
        }

        if ($this->isBlockedHost($parsed['host'])) {
            throw new Exception("دسترسی به آدرس‌های لوکال و متادیتا جهت حفاظت از هاست مسدود است (SSRF Guard).");
        }

        $cookieHeader = $this->cookieJar->getCookieHeader($targetUrl);

        $headers = [
            'User-Agent: ' . $this->userAgent,
            'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language: en-US,en;q=0.9,fa;q=0.8',
            'Referer: ' . $parsed['scheme'] . '://' . $parsed['host'] . '/',
            'Sec-Ch-Ua: "Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
            'Sec-Ch-Ua-Mobile: ?0',
            'Sec-Ch-Ua-Platform: "Windows"',
        ];

        if (!empty($cookieHeader)) {
            $headers[] = 'Cookie: ' . $cookieHeader;
        }

        if (!empty($customHeaders['content-type'])) {
            $headers[] = 'Content-Type: ' . $customHeaders['content-type'];
        }

        // Preferred: cURL
        if (function_exists('curl_init')) {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $targetUrl);
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HEADER, true);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
            curl_setopt($ch, CURLOPT_TIMEOUT, 12);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
            curl_setopt($ch, CURLOPT_ENCODING, ''); // Auto decompress gzip/deflate

            if ($method === 'POST' && !empty($postData)) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
            }

            $rawResponse = curl_exec($ch);
            if ($rawResponse === false) {
                $err = curl_error($ch);
                curl_close($ch);
                throw new Exception("خطای cURL: " . $err);
            }

            $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
            curl_close($ch);

            $rawHeaders = substr($rawResponse, 0, $headerSize);
            $body = substr($rawResponse, $headerSize);

            // Parse returned Set-Cookie headers
            $headerLines = explode("\r\n", $rawHeaders);
            foreach ($headerLines as $line) {
                if (stripos($line, 'Set-Cookie:') === 0) {
                    $cookieVal = trim(substr($line, 11));
                    $this->cookieJar->addCookieFromHeader($cookieVal, $targetUrl);
                }
            }

            return [
                'status' => $httpCode,
                'contentType' => $contentType ? $contentType : 'text/html',
                'body' => $body,
            ];
        } else {
            // Fallback: file_get_contents with stream context
            $opts = [
                'http' => [
                    'method' => $method,
                    'header' => implode("\r\n", $headers) . "\r\n",
                    'timeout' => 12,
                    'ignore_errors' => true,
                ],
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                ]
            ];
            if ($method === 'POST' && !empty($postData)) {
                $opts['http']['content'] = is_array($postData) ? http_build_query($postData) : $postData;
            }

            $context = stream_context_create($opts);
            $body = @file_get_contents($targetUrl, false, $context);
            if ($body === false) {
                throw new Exception("عدم امکان دریافت داده از سرور مقصد.");
            }

            $contentType = 'text/html';
            if (isset($http_response_header)) {
                foreach ($http_response_header as $hdr) {
                    if (stripos($hdr, 'Set-Cookie:') === 0) {
                        $this->cookieJar->addCookieFromHeader(trim(substr($hdr, 11)), $targetUrl);
                    }
                    if (stripos($hdr, 'Content-Type:') === 0) {
                        $contentType = trim(substr($hdr, 13));
                    }
                }
            }

            return [
                'status' => 200,
                'contentType' => $contentType,
                'body' => $body,
            ];
        }
    }
}
