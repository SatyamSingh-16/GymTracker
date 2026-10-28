// Single source of truth for where the frontend sends API requests.
// Kept free of `import.meta.env` so vite.config.ts and the unit tests can use it too.

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]']);

/**
 * Resolves VITE_API_URL into the base URL for all `/api` requests.
 *
 * - Empty in development → `/api` (same origin, forwarded by the Vite dev proxy).
 * - Empty, non-HTTPS or localhost in production → throws, so a misconfigured
 *   build fails loudly instead of shipping a frontend that cannot reach the API.
 * - Accepts the backend origin with or without a trailing `/api` or slash.
 */
export function resolveApiBaseUrl(rawUrl: string | undefined, { production }: { production: boolean }): string {
  const value = rawUrl?.trim() ?? '';

  if (!value) {
    if (production) {
      throw new Error(
        'VITE_API_URL is not set. Production builds must point at the public HTTPS URL of the Go backend ' +
          '(e.g. VITE_API_URL=https://api.example.com).'
      );
    }
    return '/api';
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`VITE_API_URL "${value}" is not a valid absolute URL (expected e.g. https://api.example.com).`);
  }

  if (production) {
    if (url.protocol !== 'https:') {
      throw new Error(`VITE_API_URL "${value}" must use https:// in production (the site is served over HTTPS).`);
    }
    if (LOCAL_HOSTNAMES.has(url.hostname)) {
      throw new Error(`VITE_API_URL "${value}" points at localhost, which visitors' browsers cannot reach.`);
    }
  }

  const path = url.pathname.replace(/\/+$/, '');
  const apiPath = path.endsWith('/api') ? path : `${path}/api`;
  return `${url.origin}${apiPath}`;
}

/** Joins a base URL and an endpoint with exactly one slash between them. */
export function joinUrl(base: string, endpoint: string): string {
  return `${base.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;
}
