import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Fdbck } from '../src/client.js';
import { FdbckApiError, FdbckNetworkError } from '../src/errors.js';

function mockFetch(response: { status: number; body?: unknown }) {
  return vi.fn().mockResolvedValue({
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    json: () => Promise.resolve(response.body),
  });
}

describe('Fdbck constructor', () => {
  it('rejects invalid API keys', () => {
    expect(() => new Fdbck('bad_key')).toThrow('must start with "sk_fdbck_"');
  });

  it('accepts valid API keys', () => {
    expect(() => new Fdbck('sk_fdbck_test123')).not.toThrow();
  });

  it('strips trailing slash from base URL', () => {
    const client = new Fdbck('sk_fdbck_test', { baseUrl: 'https://example.com/' });
    expect(client).toBeDefined();
  });
});

describe('Fdbck.request', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('sends auth header', async () => {
    const fetchMock = mockFetch({ status: 200, body: { id: '1' } });
    globalThis.fetch = fetchMock;

    const client = new Fdbck('sk_fdbck_test123');
    await client.request('GET', '/v1/me');

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer sk_fdbck_test123');
  });

  it('sends User-Agent header', async () => {
    const fetchMock = mockFetch({ status: 200, body: {} });
    globalThis.fetch = fetchMock;

    const client = new Fdbck('sk_fdbck_test123');
    await client.request('GET', '/v1/me');

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers['User-Agent']).toMatch(/^fdbck-node\//);
  });

  it('uses custom base URL', async () => {
    const fetchMock = mockFetch({ status: 200, body: {} });
    globalThis.fetch = fetchMock;

    const client = new Fdbck('sk_fdbck_test', { baseUrl: 'https://custom.api.com' });
    await client.request('GET', '/v1/me');

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('https://custom.api.com/v1/me');
  });

  it('appends query params', async () => {
    const fetchMock = mockFetch({ status: 200, body: { data: [] } });
    globalThis.fetch = fetchMock;

    const client = new Fdbck('sk_fdbck_test');
    await client.request('GET', '/v1/questions', { query: { status: 'active', limit: '10' } });

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('status=active');
    expect(url).toContain('limit=10');
  });

  it('throws FdbckApiError on API errors', async () => {
    globalThis.fetch = mockFetch({
      status: 401,
      body: { error: { code: 'unauthorized', message: 'Invalid API key' } },
    });

    const client = new Fdbck('sk_fdbck_test');
    await expect(client.request('GET', '/v1/me')).rejects.toThrow(FdbckApiError);

    try {
      await client.request('GET', '/v1/me');
    } catch (e) {
      const err = e as FdbckApiError;
      expect(err.status).toBe(401);
      expect(err.code).toBe('unauthorized');
    }
  });

  it('throws FdbckNetworkError on fetch failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('fetch failed'));

    const client = new Fdbck('sk_fdbck_test');
    await expect(client.request('GET', '/v1/me')).rejects.toThrow(FdbckNetworkError);
  });

  it('returns undefined for 204 responses', async () => {
    globalThis.fetch = mockFetch({ status: 204 });

    const client = new Fdbck('sk_fdbck_test');
    const result = await client.request('DELETE', '/v1/questions/123');
    expect(result).toBeUndefined();
  });

  it('sends JSON body for POST requests', async () => {
    const fetchMock = mockFetch({ status: 200, body: { id: '1' } });
    globalThis.fetch = fetchMock;

    const client = new Fdbck('sk_fdbck_test');
    await client.request('POST', '/v1/questions', { body: { question: 'test' } });

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(options.body).toBe('{"question":"test"}');
  });
});

describe('Fdbck.me', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('maps snake_case response to camelCase', async () => {
    globalThis.fetch = mockFetch({
      status: 200,
      body: {
        user: { id: 'usr_1', email: 'dev@example.com', name: 'Dev', avatar_url: null },
        organization: {
          id: 'org_1',
          name: 'Test',
          slug: 'test',
          plan: 'free',
          role: 'owner',
          responses_used: 42,
          responses_limit: 500,
          period_starts_at: '2026-03-01T00:00:00.000Z',
          period_ends_at: '2026-03-31T00:00:00.000Z',
          consecutive_overage_months: 0,
          has_billing: false,
        },
      },
    });

    const client = new Fdbck('sk_fdbck_test');
    const info = await client.me();

    expect(info.organization!.responsesUsed).toBe(42);
    expect(info.organization!.responsesLimit).toBe(500);
    expect(info.organization!.id).toBe('org_1');
    expect(info.organization!.hasBilling).toBe(false);
    expect(info.user!.id).toBe('usr_1');
    expect(info.user!.avatarUrl).toBeNull();
  });
});
