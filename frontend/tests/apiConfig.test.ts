import { test } from 'node:test';
import assert from 'node:assert/strict';
import { joinUrl, resolveApiBaseUrl } from '../src/api/config.ts';

const dev = { production: false };
const prod = { production: true };

test('development without VITE_API_URL uses the same-origin Vite proxy', () => {
  assert.equal(resolveApiBaseUrl(undefined, dev), '/api');
  assert.equal(resolveApiBaseUrl('  ', dev), '/api');
});

test('development may point directly at a local backend', () => {
  assert.equal(resolveApiBaseUrl('http://localhost:8080', dev), 'http://localhost:8080/api');
});

test('production requires VITE_API_URL', () => {
  assert.throws(() => resolveApiBaseUrl(undefined, prod), /VITE_API_URL is not set/);
  assert.throws(() => resolveApiBaseUrl('', prod), /VITE_API_URL is not set/);
});

test('production rejects localhost and plain http', () => {
  assert.throws(() => resolveApiBaseUrl('http://localhost:8080', prod), /https/);
  assert.throws(() => resolveApiBaseUrl('https://localhost:8080', prod), /localhost/);
  assert.throws(() => resolveApiBaseUrl('https://127.0.0.1', prod), /localhost/);
  assert.throws(() => resolveApiBaseUrl('http://api.example.com', prod), /https/);
});

test('rejects values that are not absolute URLs', () => {
  assert.throws(() => resolveApiBaseUrl('api.example.com', prod), /not a valid absolute URL/);
  assert.throws(() => resolveApiBaseUrl('/api', dev), /not a valid absolute URL/);
});

test('normalizes trailing slashes and an explicit /api suffix', () => {
  for (const value of [
    'https://api.example.com',
    'https://api.example.com/',
    'https://api.example.com/api',
    'https://api.example.com/api/',
    ' https://api.example.com// ',
  ]) {
    assert.equal(resolveApiBaseUrl(value, prod), 'https://api.example.com/api', value);
  }
  assert.equal(resolveApiBaseUrl('https://example.com/gym/', prod), 'https://example.com/gym/api');
});

test('joinUrl produces exactly one slash between parts', () => {
  assert.equal(joinUrl('/api', '/auth/login'), '/api/auth/login');
  assert.equal(joinUrl('https://x.dev/api/', 'auth/login'), 'https://x.dev/api/auth/login');
  assert.equal(joinUrl('https://x.dev/api//', '//auth/login'), 'https://x.dev/api/auth/login');
});
