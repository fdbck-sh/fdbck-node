import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verify an incoming webhook signature from fdbck.
 *
 * @param rawBody - The raw JSON string body of the webhook request
 * @param signature - The value of the `X-FDBCK-Signature` header
 * @param secret - The webhook secret from question creation
 * @returns `true` if the signature is valid
 */
export function verifyWebhook(
  rawBody: string,
  signature: string,
  secret: string,
): boolean {
  const expected = createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  if (expected.length !== signature.length) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(signature, 'hex'),
  );
}
