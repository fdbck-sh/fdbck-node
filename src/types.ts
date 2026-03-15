/** Question type */
export type QuestionType = 'yes_no' | 'single_choice' | 'multiple_choice' | 'rating';

/** Question status */
export type QuestionStatus = 'collecting' | 'completed' | 'expired' | 'cancelled';

/** Webhook trigger */
export type WebhookTrigger = 'expiry' | 'each_response' | 'both';

/** Rating scale configuration */
export interface RatingConfig {
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
}

/** Options for creating a question */
export interface CreateQuestionOptions {
  question: string;
  type: QuestionType;
  options?: string[];
  ratingConfig?: RatingConfig;
  /** Seconds until expiry — mutually exclusive with `expiresAt` */
  expiresIn?: number;
  /** ISO date string — mutually exclusive with `expiresIn` */
  expiresAt?: string;
  maxResponses?: number;
  webhookUrl?: string;
  webhookTrigger?: WebhookTrigger;
  metadata?: Record<string, string>;
  themeColor?: string;
  themeMode?: 'light' | 'dark';
  hideBranding?: boolean;
  welcomeMessage?: string;
  thankYouMessage?: string;
}

/** A question resource */
export interface Question {
  id: string;
  question: string;
  type: QuestionType;
  options: string[] | null;
  ratingConfig?: RatingConfig;
  status: QuestionStatus;
  expiresAt: string;
  maxResponses: number | null;
  webhookUrl?: string;
  webhookTrigger?: WebhookTrigger;
  webhookSecret?: string;
  metadata: Record<string, string> | null;
  themeColor: string;
  themeMode: string;
  hideBranding: boolean;
  welcomeMessage: string | null;
  thankYouMessage: string | null;
  totalResponses?: number;
  createdAt: string;
  updatedAt: string;
}

/** Options for listing questions */
export interface ListQuestionsOptions {
  cursor?: string;
  limit?: number;
  status?: QuestionStatus;
  sort?: 'created_at' | 'updated_at';
  order?: 'asc' | 'desc';
  createdAfter?: string;
  createdBefore?: string;
}

/** Paginated list envelope */
export interface PaginatedList<T> {
  data: T[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

/** A single response item */
export interface ResponseItem {
  id: string;
  questionId: string;
  value: unknown;
  respondent: string | null;
  createdAt: string;
}

/** Options for listing responses */
export interface ListResponsesOptions {
  cursor?: string;
  limit?: number;
}

/** A webhook delivery log entry */
export interface WebhookDelivery {
  id: string;
  event: string;
  success: boolean;
  statusCode: number | null;
  attempts: number;
  error: string | null;
  createdAt: string;
  nextRetryAt: string | null;
}

/** Options for listing webhook deliveries */
export interface ListWebhooksOptions {
  cursor?: string;
  limit?: number;
}

/** Options for creating a token */
export interface CreateTokenOptions {
  respondent?: string;
  metadata?: Record<string, string>;
}

/** Token creation result */
export interface TokenResult {
  token: string;
  respondUrl: string;
  expiresAt: string;
}

/** Account info from GET /v1/me */
export interface AccountInfo {
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
  } | null;
  organization: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    role: string | null;
    responsesUsed: number;
    responsesLimit: number | null;
    periodStartsAt: string;
    periodEndsAt: string | null;
    consecutiveOverageMonths: number;
    hasBilling: boolean;
  } | null;
}

/** Aggregated results with paginated individual responses */
export interface QuestionResultsResponse {
  questionId: string;
  type: string;
  status: string;
  totalResponses: number;
  results: Record<string, unknown>;
  data: ResponseItem[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

/** SDK client options */
export interface FdbckOptions {
  /** Base URL for the API (default: https://api.fdbck.sh) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
}
