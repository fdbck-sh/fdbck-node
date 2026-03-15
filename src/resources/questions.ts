import type { Fdbck } from '../client.js';
import type {
  CreateQuestionOptions,
  ListQuestionsOptions,
  ListResponsesOptions,
  ListWebhooksOptions,
  PaginatedList,
  Question,
  QuestionResultsResponse,
  ResponseItem,
  WebhookDelivery,
} from '../types.js';
import {
  computeExpiresAt,
  mapKeys,
  paginationFieldsFromApi,
  questionFieldsFromApi,
  questionFieldsToApi,
  ratingConfigFieldsFromApi,
  ratingConfigFieldsToApi,
  responseFieldsFromApi,
  resultsFieldsFromApi,
  webhookDeliveryFieldsFromApi,
} from '../utils.js';

function mapQuestionFromApi(raw: Record<string, unknown>): Question {
  const mapped = mapKeys(raw, questionFieldsFromApi) as Record<string, unknown>;
  if (mapped.ratingConfig && typeof mapped.ratingConfig === 'object') {
    mapped.ratingConfig = mapKeys(
      mapped.ratingConfig as Record<string, unknown>,
      ratingConfigFieldsFromApi,
    );
  }
  return mapped as unknown as Question;
}

function mapResponseFromApi(raw: Record<string, unknown>): ResponseItem {
  return mapKeys(raw, responseFieldsFromApi) as unknown as ResponseItem;
}

function mapWebhookDeliveryFromApi(raw: Record<string, unknown>): WebhookDelivery {
  return mapKeys(raw, webhookDeliveryFieldsFromApi) as unknown as WebhookDelivery;
}

function mapPagination(raw: Record<string, unknown>): PaginatedList<never>['pagination'] {
  return mapKeys(raw, paginationFieldsFromApi) as unknown as PaginatedList<never>['pagination'];
}

export class QuestionsResource {
  constructor(private readonly client: Fdbck) {}

  /** Create a new question. */
  async create(opts: CreateQuestionOptions): Promise<Question> {
    const { expiresIn, ratingConfig, ...rest } = opts;

    if (expiresIn !== undefined && opts.expiresAt !== undefined) {
      throw new Error('Provide either expiresIn or expiresAt, not both');
    }
    if (expiresIn === undefined && opts.expiresAt === undefined) {
      throw new Error('Either expiresIn or expiresAt is required');
    }

    const body: Record<string, unknown> = { ...rest };

    if (expiresIn !== undefined) {
      body.expiresAt = computeExpiresAt(expiresIn);
    }

    if (ratingConfig) {
      body.ratingConfig = mapKeys(
        ratingConfig as unknown as Record<string, unknown>,
        ratingConfigFieldsToApi,
      );
    }

    const apiBody = mapKeys(body, questionFieldsToApi);
    const raw = await this.client.request<Record<string, unknown>>('POST', '/v1/questions', {
      body: apiBody,
    });
    return mapQuestionFromApi(raw);
  }

  /** Get a question by ID. */
  async get(id: string): Promise<Question> {
    const raw = await this.client.request<Record<string, unknown>>('GET', `/v1/questions/${id}`);
    return mapQuestionFromApi(raw);
  }

  /** List questions with pagination. */
  async list(opts?: ListQuestionsOptions): Promise<PaginatedList<Question>> {
    const query: Record<string, string> = {};
    if (opts?.cursor) query.cursor = opts.cursor;
    if (opts?.limit) query.limit = String(opts.limit);
    if (opts?.status) query.status = opts.status;
    if (opts?.sort) query.sort = opts.sort;
    if (opts?.order) query.order = opts.order;
    if (opts?.createdAfter) query.created_after = opts.createdAfter;
    if (opts?.createdBefore) query.created_before = opts.createdBefore;

    const raw = await this.client.request<Record<string, unknown>>('GET', '/v1/questions', {
      query,
    });

    const data = (raw.data as Record<string, unknown>[]).map(mapQuestionFromApi);
    const pagination = mapPagination(raw.pagination as Record<string, unknown>);
    return { data, pagination };
  }

  /** Auto-paginate through all questions. */
  async *listAll(opts?: Omit<ListQuestionsOptions, 'cursor'>): AsyncGenerator<Question> {
    let cursor: string | undefined;
    do {
      const page = await this.list({ ...opts, cursor });
      for (const question of page.data) {
        yield question;
      }
      cursor = page.pagination.nextCursor ?? undefined;
    } while (cursor);
  }

  /** Get responses for a question with aggregated results. */
  async results(id: string, opts?: ListResponsesOptions): Promise<QuestionResultsResponse> {
    const query: Record<string, string> = {};
    if (opts?.cursor) query.cursor = opts.cursor;
    if (opts?.limit) query.limit = String(opts.limit);

    const raw = await this.client.request<Record<string, unknown>>(
      'GET',
      `/v1/questions/${id}/responses`,
      { query },
    );

    const envelope = mapKeys(raw, resultsFieldsFromApi);
    const data = (raw.data as Record<string, unknown>[]).map(mapResponseFromApi);
    const pagination = mapPagination(raw.pagination as Record<string, unknown>);
    return {
      questionId: envelope.questionId as string,
      type: envelope.type as string,
      status: envelope.status as string,
      totalResponses: envelope.totalResponses as number,
      results: envelope.results as Record<string, unknown>,
      data,
      pagination,
    };
  }

  /** Cancel (delete) a question. */
  async cancel(id: string): Promise<Question> {
    const raw = await this.client.request<Record<string, unknown>>('DELETE', `/v1/questions/${id}`);
    return mapQuestionFromApi(raw);
  }

  /** Get webhook delivery logs for a question. */
  async webhooks(id: string, opts?: ListWebhooksOptions): Promise<PaginatedList<WebhookDelivery>> {
    const query: Record<string, string> = {};
    if (opts?.cursor) query.cursor = opts.cursor;
    if (opts?.limit) query.limit = String(opts.limit);

    const raw = await this.client.request<Record<string, unknown>>(
      'GET',
      `/v1/questions/${id}/webhooks`,
      { query },
    );

    const data = (raw.data as Record<string, unknown>[]).map(mapWebhookDeliveryFromApi);
    const pagination = mapPagination(raw.pagination as Record<string, unknown>);
    return { data, pagination };
  }
}
