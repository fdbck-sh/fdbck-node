import type { Fdbck } from '../client.js';
import type { CreateTokenOptions, TokenResult } from '../types.js';
import { mapKeys, tokenFieldsFromApi } from '../utils.js';

export class TokensResource {
  constructor(private readonly client: Fdbck) {}

  /** Create a respondent token for a question. */
  async create(questionId: string, opts?: CreateTokenOptions): Promise<TokenResult> {
    const raw = await this.client.request<Record<string, unknown>>(
      'POST',
      `/v1/questions/${questionId}/token`,
      { body: (opts ?? {}) as Record<string, unknown> },
    );
    return mapKeys(raw, tokenFieldsFromApi) as unknown as TokenResult;
  }
}
