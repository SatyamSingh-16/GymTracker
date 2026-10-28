import { joinUrl, resolveApiBaseUrl } from './config';

// Generous enough for a sleeping Render free-tier backend to cold-start (can take ~1 minute),
// short enough that a dead one doesn't spin forever.
export const REQUEST_TIMEOUT_MS = 60_000;

let BASE_URL = '';
let configError: string | null = null;
try {
  BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_URL, { production: import.meta.env.PROD });
} catch (err) {
  // vite.config.ts blocks such builds; this guards against bypassing it.
  configError = (err as Error).message;
}

export class ApiError extends Error {
  // 0 means no HTTP response was received (network failure, CORS rejection, timeout)
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<T> {
  if (configError) {
    throw new ApiError(0, `GymTracker is misconfigured: ${configError}`);
  }

  const token = sessionStorage.getItem('gymtracker_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const callerSignal = options.signal;
  callerSignal?.addEventListener('abort', () => controller.abort(), { once: true });

  let response: Response;
  try {
    response = await fetch(joinUrl(BASE_URL, endpoint), {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    if (callerSignal?.aborted) throw err;
    if (timedOut) {
      throw new ApiError(0, 'The GymTracker server took too long to respond. Please try again in a moment.');
    }
    // fetch only rejects when no HTTP response arrived: DNS failure, server offline,
    // TLS error, or the browser blocking the response because of CORS.
    throw new ApiError(
      0,
      `Can't reach the GymTracker server (${BASE_URL}). It may be offline, or the app's API URL/CORS settings are wrong.`
    );
  } finally {
    clearTimeout(timer);
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  let data: any = null;
  if (isJson) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorMessage = data?.error || data?.message || `Request failed with status ${response.status}`;
    // If token expired or unauthorized, trigger session clean
    if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
      sessionStorage.removeItem('gymtracker_token');
      sessionStorage.removeItem('gymtracker_user');
      window.dispatchEvent(new Event('gymtracker_auth_logout'));
    }
    throw new ApiError(response.status, errorMessage);
  }

  if (data === null && response.status !== 204) {
    // e.g. the SPA's index.html served because the request never reached the Go API
    throw new ApiError(
      response.status,
      `Unexpected non-JSON response from ${BASE_URL}. The API URL is probably pointing at the wrong server.`
    );
  }

  return data as T;
}
