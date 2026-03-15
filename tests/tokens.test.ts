import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Fdbck } from '../src/client.js';

function mockFetch(response: { status: number; body?: unknown }) {
  return vi.fn().mockResolvedValue({
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    json: () => Promise.resolve(response.body),
  });
}

describe('tokens.create', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('sends POST to correct endpoint', async () => {
    const fetchMock = mockFetch({
      status: 200,
      body: {
        token: 'tok_abc',
        respond_url: 'https://api.fdbck.sh/v1/f/tok_abc',
        expires_at: '2026-01-02T00:00:00.000Z',
      },
    });
    globalThis.fetch = fetchMock;

    const client = new Fdbck('sk_fdbck_test');
    const result = await client.tokens.create('q_123', { respondent: 'user_42' });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain('/v1/questions/q_123/token');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ respondent: 'user_42' });
  });

  it('maps response to camelCase', async () => {
    globalThis.fetch = mockFetch({
      status: 200,
      body: {
        token: 'tok_abc',
        respond_url: 'https://api.fdbck.sh/v1/f/tok_abc',
        expires_at: '2026-01-02T00:00:00.000Z',
      },
    });

    const client = new Fdbck('sk_fdbck_test');
    const result = await client.tokens.create('q_123');

    expect(result.token).toBe('tok_abc');
    expect(result.respondUrl).toBe('https://api.fdbck.sh/v1/f/tok_abc');
    expect(result.expiresAt).toBe('2026-01-02T00:00:00.000Z');
  });
});
