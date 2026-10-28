import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type ViteDevServer } from 'vite';

// The client reads import.meta.env, so load it through Vite rather than plain Node.
const API = 'https://api.test.example';
process.env.VITE_API_URL = API;

type ClientModule = typeof import('../src/api/client.ts');

let server: ViteDevServer;
let client: ClientModule;
let fetchImpl: (url: string, init: RequestInit) => Promise<Response>;
let calls: { url: string; init: RequestInit }[];
let logoutEvents: number;
const storage = new Map<string, string>();

before(async () => {
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => storage.get(k) ?? null,
      setItem: (k: string, v: string) => void storage.set(k, v),
      removeItem: (k: string) => void storage.delete(k),
    },
  });
  const win = new EventTarget();
  win.addEventListener('gymtracker_auth_logout', () => logoutEvents++);
  Object.defineProperty(globalThis, 'window', { configurable: true, value: win });
  globalThis.fetch = ((url: string, init: RequestInit) => {
    calls.push({ url, init });
    return fetchImpl(url, init);
  }) as typeof fetch;

  server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  client = (await server.ssrLoadModule('/src/api/client.ts')) as ClientModule;
});

after(() => server.close());

beforeEach(() => {
  calls = [];
  logoutEvents = 0;
  storage.clear();
});

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function rejection(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (err) {
    return err as InstanceType<ClientModule['ApiError']>;
  }
  assert.fail('expected request to reject');
}

test('builds the URL from VITE_API_URL and sends the bearer token', async () => {
  storage.set('gymtracker_token', 'abc');
  fetchImpl = async () => json(200, { id: 1 });

  assert.deepEqual(await client.request('/auth/me'), { id: 1 });
  assert.equal(calls[0].url, `${API}/api/auth/me`);
  assert.equal((calls[0].init.headers as Record<string, string>).Authorization, 'Bearer abc');
});

test('a network-level failure becomes an actionable ApiError with status 0', async () => {
  fetchImpl = async () => {
    throw new TypeError('Failed to fetch');
  };

  const err = await rejection(client.request('/auth/login', { method: 'POST' }));
  assert.ok(err instanceof client.ApiError);
  assert.equal(err.status, 0);
  assert.match(err.message, /Can't reach the GymTracker server \(https:\/\/api\.test\.example\/api\)/);
});

test('a stalled request times out with a clear message', async () => {
  fetchImpl = (_url, init) =>
    new Promise((_resolve, reject) => {
      init.signal!.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    });

  const err = await rejection(client.request('/auth/login', { method: 'POST' }, 20));
  assert.equal(err.status, 0);
  assert.match(err.message, /took too long/);
});

test('a caller abort is passed through untouched', async () => {
  fetchImpl = (_url, init) =>
    new Promise((_resolve, reject) => {
      init.signal!.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    });
  const ctrl = new AbortController();
  const pending = client.request('/exercises', { signal: ctrl.signal });
  ctrl.abort();

  const err = await rejection(pending);
  assert.equal((err as unknown as DOMException).name, 'AbortError');
});

test('a 401 from login surfaces the server message without forcing a logout', async () => {
  storage.set('gymtracker_token', 'stale');
  fetchImpl = async () => json(401, { error: 'Invalid email or password' });

  const err = await rejection(client.request('/auth/login', { method: 'POST' }));
  assert.equal(err.status, 401);
  assert.equal(err.message, 'Invalid email or password');
  assert.equal(logoutEvents, 0);
  assert.equal(storage.get('gymtracker_token'), 'stale');
});

test('a 401 on a protected endpoint clears the session', async () => {
  storage.set('gymtracker_token', 'expired');
  fetchImpl = async () => json(401, { error: 'Invalid or expired token' });

  const err = await rejection(client.request('/workouts'));
  assert.equal(err.status, 401);
  assert.equal(logoutEvents, 1);
  assert.equal(storage.has('gymtracker_token'), false);
});

test('non-JSON error responses fall back to the status code', async () => {
  fetchImpl = async () => new Response('<html>Bad gateway</html>', { status: 502, headers: { 'Content-Type': 'text/html' } });

  const err = await rejection(client.request('/auth/login', { method: 'POST' }));
  assert.equal(err.status, 502);
  assert.equal(err.message, 'Request failed with status 502');
});

test('a 200 HTML page (wrong server) is rejected instead of crashing the caller', async () => {
  fetchImpl = async () => new Response('<!doctype html>', { status: 200, headers: { 'Content-Type': 'text/html' } });

  const err = await rejection(client.request('/auth/login', { method: 'POST' }));
  assert.match(err.message, /Unexpected non-JSON response/);
});
