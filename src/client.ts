import { FdbckApiError, FdbckNetworkError } from './errors.js';
import { QuestionsResource } from './resources/questions.js';
import { TokensResource } from './resources/tokens.js';
import type { AccountInfo, FdbckOptions } from './types.js';
import { accountOrgFieldsFromApi, accountUserFieldsFromApi, mapKeys } from './utils.js';
import { verifyWebhook as _verifyWebhook } from './webhook.js';

const DEFAULT_BASE_URL = 'https://api.fdbck.sh';
const DEFAULT_TIMEOUT = 30_000;
const SDK_VERSION = '0.1.0';

interface RequestOptions {
  body?: Record<string, unknown>;
  query?: Record<string, string>;
}

export class Fdbck {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;

  readonly questions: QuestionsResource;
  readonly tokens: TokensResource;

  constructor(apiKey: string, options?: FdbckOptions) {
    if (!apiKey.startsWith('sk_fdbck_')) {
      throw new Error('Invalid API key: must start with "sk_fdbck_"');
    }

    this.apiKey = apiKey;
    this.baseUrl = (options?.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.timeout = options?.timeout ?? DEFAULT_TIMEOUT;

    this.questions = new QuestionsResource(this);
    this.tokens = new TokensResource(this);
  }

  /** Make an authenticated request to the fdbck API. */
  async request<T = unknown>(
    method: string,
    path: string,
    options?: RequestOptions,
  ): Promise<T> {
    const url = new URL(path, this.baseUrl);
    if (options?.query) {
      for (const [key, value] of Object.entries(options.query)) {
        url.searchParams.set(key, value);
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'User-Agent': `@fdbck/node/${SDK_VERSION}`,
    };

    const fetchOptions: RequestInit & { signal?: AbortSignal } = {
      method,
      headers,
    };

    if (options?.body) {
      headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(options.body);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    fetchOptions.signal = controller.signal;

    let response: Response;
    try {
      response = await fetch(url.toString(), fetchOptions);
    } catch (error) {
      clearTimeout(timeoutId);
      throw new FdbckNetworkError(
        error instanceof Error ? error.message : 'Network request failed',
        { cause: error },
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new FdbckApiError(response.status, 'parse_error', 'Failed to parse response body');
    }

    if (!response.ok) {
      const err = (data as Record<string, unknown>)?.error as
        | { code?: string; message?: string; details?: { fields: string[] } }
        | undefined;
      throw new FdbckApiError(
        response.status,
        err?.code ?? 'unknown_error',
        err?.message ?? `Request failed with status ${response.status}`,
        err?.details,
      );
    }

    return data as T;
  }

  /** Get current account info. */
  async me(): Promise<AccountInfo> {
    const raw = await this.request<Record<string, unknown>>('GET', '/v1/me');
    const rawUser = raw.user as Record<string, unknown> | null;
    const rawOrg = raw.organization as Record<string, unknown> | null;
    return {
      user: rawUser ? mapKeys(rawUser, accountUserFieldsFromApi) as unknown as AccountInfo['user'] : null,
      organization: rawOrg ? mapKeys(rawOrg, accountOrgFieldsFromApi) as unknown as AccountInfo['organization'] : null,
    };
  }

  /** Verify a webhook signature. */
  verifyWebhook(rawBody: string, signature: string, secret: string): boolean {
    return _verifyWebhook(rawBody, signature, secret);
  }
}
