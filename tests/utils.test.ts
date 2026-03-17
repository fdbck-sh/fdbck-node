import { describe, it, expect } from 'vitest';
import {
  mapKeys,
  questionFieldsToApi,
  questionFieldsFromApi,
  ratingConfigFieldsToApi,
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

  it('maps rating config fields to API', () => {
    const api = mapKeys({ minLabel: 'Bad', maxLabel: 'Good' }, ratingConfigFieldsToApi);
    expect(api).toEqual({ min_label: 'Bad', max_label: 'Good' });
  });
});
