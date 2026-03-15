/**
 * Rename object keys using an explicit field map.
 * Only keys present in the map are renamed; others pass through unchanged.
 */
export function mapKeys(
  obj: Record<string, unknown>,
  fieldMap: Record<string, string>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const mappedKey = fieldMap[key] ?? key;
    result[mappedKey] = value;
  }
  return result;
}

/** camelCase → snake_case field maps for API requests */
export const questionFieldsToApi: Record<string, string> = {
  ratingConfig: 'rating_config',
  expiresAt: 'expires_at',
  maxResponses: 'max_responses',
  webhookUrl: 'webhook_url',
  webhookTrigger: 'webhook_trigger',
  themeColor: 'theme_color',
  themeMode: 'theme_mode',
  hideBranding: 'hide_branding',
  welcomeMessage: 'welcome_message',
  thankYouMessage: 'thank_you_message',
};

/** snake_case → camelCase field maps for API responses */
export const questionFieldsFromApi: Record<string, string> = {
  expires_at: 'expiresAt',
  max_responses: 'maxResponses',
  webhook_url: 'webhookUrl',
  webhook_trigger: 'webhookTrigger',
  webhook_secret: 'webhookSecret',
  theme_color: 'themeColor',
  theme_mode: 'themeMode',
  hide_branding: 'hideBranding',
  welcome_message: 'welcomeMessage',
  thank_you_message: 'thankYouMessage',
  total_responses: 'totalResponses',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
};

/** snake_case → camelCase for rating_config subfields */
export const ratingConfigFieldsToApi: Record<string, string> = {
  minLabel: 'min_label',
  maxLabel: 'max_label',
};

export const ratingConfigFieldsFromApi: Record<string, string> = {
  min_label: 'minLabel',
  max_label: 'maxLabel',
};

/** snake_case → camelCase for response items */
export const responseFieldsFromApi: Record<string, string> = {
  question_id: 'questionId',
  created_at: 'createdAt',
};

/** snake_case → camelCase for token results */
export const tokenFieldsFromApi: Record<string, string> = {
  respond_url: 'respondUrl',
  expires_at: 'expiresAt',
};

/** snake_case → camelCase for webhook delivery logs */
export const webhookDeliveryFieldsFromApi: Record<string, string> = {
  status_code: 'statusCode',
  next_retry_at: 'nextRetryAt',
  created_at: 'createdAt',
};

/** snake_case → camelCase for pagination */
export const paginationFieldsFromApi: Record<string, string> = {
  next_cursor: 'nextCursor',
  has_more: 'hasMore',
};

/** snake_case → camelCase for account info (organization subobject) */
export const accountOrgFieldsFromApi: Record<string, string> = {
  responses_used: 'responsesUsed',
  responses_limit: 'responsesLimit',
  period_starts_at: 'periodStartsAt',
  period_ends_at: 'periodEndsAt',
  consecutive_overage_months: 'consecutiveOverageMonths',
  has_billing: 'hasBilling',
};

/** snake_case → camelCase for account info (user subobject) */
export const accountUserFieldsFromApi: Record<string, string> = {
  avatar_url: 'avatarUrl',
};

/** snake_case → camelCase for results response envelope */
export const resultsFieldsFromApi: Record<string, string> = {
  question_id: 'questionId',
  total_responses: 'totalResponses',
};

/**
 * Compute an ISO `expires_at` string from a duration in seconds.
 */
export function computeExpiresAt(seconds: number): string {
  return new Date(Date.now() + seconds * 1000).toISOString();
}
