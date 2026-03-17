import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Fdbck } from '../src/client.js';

function mockFetch(response: { status: number; body?: unknown }) {
  return vi.fn().mockResolvedValue({
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    json: () => Promise.resolve(response.body),
  });
}

const apiQuestion = {
  id: 'q_123',
  question: 'How was it?',
  type: 'rating',
  options: null,
  status: 'active',
  expires_at: '2026-01-02T00:00:00.000Z',
  max_responses: 100,
  webhook_url: 'https://example.com/hook',
  webhook_trigger: 'each_response',
  webhook_secret: 'whsec_abc',
  metadata: { source: 'test' },
  theme_color: '#FF6B35',
  theme_mode: 'dark',
  hide_branding: false,
  total_responses: 5,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T12:00:00.000Z',
};

describe('questions.create', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('converts Date expiresAt to ISO string in API body', async () => {
    const fetchMock = mockFetch({ status: 200, body: apiQuestion });
    globalThis.fetch = fetchMock;

    const client = new Fdbck('sk_fdbck_test');
    await client.questions.create({
      question: 'How was it?',
      type: 'rating',
      ratingConfig: { min: 1, max: 5, minLabel: 'Bad', maxLabel: 'Good' },
      expiresAt: new Date('2026-01-02T00:00:00.000Z'),
    });

    const sentBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sentBody.expires_at).toBe('2026-01-02T00:00:00.000Z');
    expect(sentBody.rating_config).toEqual({
      min: 1,
      max: 5,
      min_label: 'Bad',
      max_label: 'Good',
    });
  });

  it('maps API response to camelCase', async () => {
    globalThis.fetch = mockFetch({ status: 200, body: apiQuestion });

    const client = new Fdbck('sk_fdbck_test');
    const q = await client.questions.create({
      question: 'How was it?',
      type: 'rating',
      expiresAt: '2026-01-02T00:00:00.000Z',
    });

    expect(q.id).toBe('q_123');
    expect(q.expiresAt).toBe('2026-01-02T00:00:00.000Z');
    expect(q.maxResponses).toBe(100);
    expect(q.webhookUrl).toBe('https://example.com/hook');
    expect(q.webhookTrigger).toBe('each_response');
    expect(q.themeColor).toBe('#FF6B35');
    expect(q.hideBranding).toBe(false);
    expect(q.totalResponses).toBe(5);
    expect(q.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('passes string expiresAt through unchanged', async () => {
    const fetchMock = mockFetch({ status: 200, body: apiQuestion });
    globalThis.fetch = fetchMock;

    const client = new Fdbck('sk_fdbck_test');
    await client.questions.create({
      question: 'How was it?',
      type: 'yes_no',
      expiresAt: '2026-01-02T00:00:00.000Z',
    });

    const sentBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sentBody.expires_at).toBe('2026-01-02T00:00:00.000Z');
  });
});

describe('questions.list', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns paginated data with camelCase pagination', async () => {
    globalThis.fetch = mockFetch({
      status: 200,
      body: {
        data: [apiQuestion],
        pagination: { next_cursor: 'cur_abc', has_more: true },
      },
    });

    const client = new Fdbck('sk_fdbck_test');
    const result = await client.questions.list({ limit: 10, status: 'active' });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('q_123');
    expect(result.pagination.nextCursor).toBe('cur_abc');
    expect(result.pagination.hasMore).toBe(true);
  });
});

describe('questions.listAll', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('iterates through all pages', async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      const hasMore = callCount < 3;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            data: [{ ...apiQuestion, id: `q_${callCount}` }],
            pagination: {
              next_cursor: hasMore ? `cur_${callCount}` : null,
              has_more: hasMore,
            },
          }),
      });
    });

    const client = new Fdbck('sk_fdbck_test');
    const questions = [];
    for await (const q of client.questions.listAll()) {
      questions.push(q);
    }

    expect(questions).toHaveLength(3);
    expect(questions[0].id).toBe('q_1');
    expect(questions[2].id).toBe('q_3');
  });
});

describe('questions.results', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('maps response items', async () => {
    globalThis.fetch = mockFetch({
      status: 200,
      body: {
        data: [
          {
            id: 'r_1',
            value: 4,
            respondent: 'user_1',
            created_at: '2026-01-01T06:00:00.000Z',
          },
        ],
        pagination: { next_cursor: null, has_more: false },
      },
    });

    const client = new Fdbck('sk_fdbck_test');
    const result = await client.questions.results('q_123');

    expect(result.data[0].createdAt).toBe('2026-01-01T06:00:00.000Z');
    expect(result.pagination.hasMore).toBe(false);
  });
});

describe('questions.cancel', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('sends DELETE request', async () => {
    const fetchMock = mockFetch({
      status: 200,
      body: {
        id: 'q_123',
        status: 'cancelled',
        question: 'Test?',
        type: 'yes_no',
        options: ['Yes', 'No'],
        expires_at: '2026-03-15T12:00:00.000Z',
        created_at: '2026-03-14T12:00:00.000Z',
        updated_at: '2026-03-14T12:00:00.000Z',
      },
    });
    globalThis.fetch = fetchMock;

    const client = new Fdbck('sk_fdbck_test');
    const result = await client.questions.cancel('q_123');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain('/v1/questions/q_123');
    expect(options.method).toBe('DELETE');
    expect(result.status).toBe('cancelled');
  });
});
