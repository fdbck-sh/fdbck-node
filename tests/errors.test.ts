import { describe, it, expect } from 'vitest';
import { FdbckError, FdbckApiError, FdbckNetworkError } from '../src/errors.js';

describe('FdbckError', () => {
  it('is an instance of Error', () => {
    const err = new FdbckError('test');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('FdbckError');
    expect(err.message).toBe('test');
  });
});

describe('FdbckApiError', () => {
  it('carries status, code, and details', () => {
    const err = new FdbckApiError(422, 'validation_error', 'Invalid', {
      fields: ['question'],
    });
    expect(err).toBeInstanceOf(FdbckError);
    expect(err.name).toBe('FdbckApiError');
    expect(err.status).toBe(422);
    expect(err.code).toBe('validation_error');
    expect(err.message).toBe('Invalid');
    expect(err.details).toEqual({ fields: ['question'] });
  });
});

describe('FdbckNetworkError', () => {
  it('wraps a cause', () => {
    const cause = new TypeError('fetch failed');
    const err = new FdbckNetworkError('Network error', { cause });
    expect(err).toBeInstanceOf(FdbckError);
    expect(err.name).toBe('FdbckNetworkError');
    expect(err.cause).toBe(cause);
  });
});
