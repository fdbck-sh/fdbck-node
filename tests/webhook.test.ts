import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { verifyWebhook } from '../src/webhook.js';

describe('verifyWebhook', () => {
  const secret = 'whsec_test_secret_123';
  const body = JSON.stringify({ event: 'question.response_received', data: { id: '1' } });

  function sign(payload: string, key: string): string {
    return createHmac('sha256', key).update(payload).digest('hex');
  }

  it('returns true for a valid signature', () => {
    const signature = sign(body, secret);
    expect(verifyWebhook(body, signature, secret)).toBe(true);
  });

  it('returns false for an invalid signature', () => {
    expect(verifyWebhook(body, 'deadbeef'.repeat(8), secret)).toBe(false);
  });

  it('returns false for a wrong secret', () => {
    const signature = sign(body, 'wrong_secret');
    expect(verifyWebhook(body, signature, secret)).toBe(false);
  });

  it('returns false for a tampered body', () => {
    const signature = sign(body, secret);
    const tampered = body.replace('1', '2');
    expect(verifyWebhook(tampered, signature, secret)).toBe(false);
  });

  it('returns false for signature with wrong length', () => {
    expect(verifyWebhook(body, 'abc', secret)).toBe(false);
  });
});
