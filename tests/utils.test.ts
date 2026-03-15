import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  mapKeys,
  computeExpiresAt,
  questionFieldsToApi,
  questionFieldsFromApi,
  ratingConfigFieldsToApi,
  ratingConfigFieldsFromApi,
} from '../src/utils.js';

describe('mapKeys', () => {
  it('renames keys using the field map', () => {
    const result = mapKeys(
      { ratingConfig: { min: 1 }, question: 'Hello' },
      questionFieldsToApi,
    );
    expect(result).toEqual({ rating_config: { min: 1 }, question: 'Hello' });
  });

  it('passes through keys not in the map', () => {
    const result = mapKeys({ foo: 'bar', metadata: { a: 1 } }, questionFieldsToApi);
    expect(result).toEqual({ foo: 'bar', metadata: { a: 1 } });
  });

  it('round-trips question fields', () => {
    const api = mapKeys({ maxResponses: 10, webhookUrl: 'https://x.com' }, questionFieldsToApi);
    expect(api).toEqual({ max_responses: 10, webhook_url: 'https://x.com' });

    const sdk = mapKeys(api, questionFieldsFromApi);
    expect(sdk).toEqual({ maxResponses: 10, webhookUrl: 'https://x.com' });
  });

  it('round-trips rating config fields', () => {
    const api = mapKeys({ minLabel: 'Bad', maxLabel: 'Good' }, ratingConfigFieldsToApi);
    expect(api).toEqual({ min_label: 'Bad', max_label: 'Good' });

    const sdk = mapKeys(api, ratingConfigFieldsFromApi);
    expect(sdk).toEqual({ minLabel: 'Bad', maxLabel: 'Good' });
  });
});

describe('computeExpiresAt', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds seconds to current time', () => {
    const result = computeExpiresAt(3600);
    expect(result).toBe('2026-01-01T01:00:00.000Z');
  });

  it('handles large durations', () => {
    const result = computeExpiresAt(172800); // 2 days
    expect(result).toBe('2026-01-03T00:00:00.000Z');
  });
});
