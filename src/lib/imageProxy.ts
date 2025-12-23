/**
 * Proxy HTTP images through our API to avoid mixed content issues in Chrome.
 * HTTPS images are passed through unchanged.
 */
export function proxyImageUrl(url: string | undefined): string {
  if (!url) return "";
  // Only proxy HTTP URLs, let HTTPS pass through
  if (url.startsWith("http://")) {
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  }
  return url;
}
