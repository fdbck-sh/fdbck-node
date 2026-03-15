# fdbck-node

[![npm](https://img.shields.io/npm/v/fdbck-node)](https://www.npmjs.com/package/fdbck-node)

Official Node.js SDK for [fdbck](https://fdbck.sh) — a simple API to programmatically collect and structure feedback from your users.

Full TypeScript definitions included.

```ts
import { Fdbck } from 'fdbck-node';

const fdbck = new Fdbck('sk_fdbck_...');

const question = await fdbck.questions.create({
  question: 'How was your first purchase?',
  type: 'rating',
  ratingConfig: { min: 1, max: 5 },
  expiresIn: 172800,
});

const token = await fdbck.tokens.create(question.id, {
  respondent: 'user_8f2a',
});

// Trigger the question in your app using the sdk
// ...

// Or send this URL to your user — they answer on fdbck's hosted page
console.log(token.respondUrl);

// Get a webhook for each response
// ...

// Later, read the results
const results = await fdbck.questions.results(question.id);
console.log(results.data); // [{ respondent: 'user_8f2a', value: 5, ... }]
```

## Install

```sh
npm install fdbck-node
```

Requires Node.js 18 or later. Zero runtime dependencies.

## Get your API key

Sign up at [dashboard.fdbck.sh](https://dashboard.fdbck.sh) and grab your API key from the **API Keys** page. Keys start with `sk_fdbck_`.

## Quick start

The typical workflow is: **create a question**, **generate a token** for each respondent, **collect their answer**, and **read the results**.

Respondents can answer via fdbck's hosted response page, or directly from your app using a UI SDK ([React](https://github.com/fdbck-sh), [Flutter](https://github.com/fdbck-sh)).

### 1. Create a question

```ts
const question = await fdbck.questions.create({
  question: 'How would you rate our onboarding?',
  type: 'rating',
  ratingConfig: {
    min: 1,
    max: 5,
    minLabel: 'Terrible',
    maxLabel: 'Loved it',
  },
  expiresIn: 86400, // 24 hours
});
```

Four question types are available:

| Type | Description | Required fields | Response `value` |
|------|-------------|-----------------|------------------|
| `yes_no` | Yes or no (options default to `["Yes", "No"]`) | — | `"Yes"` or `"No"` |
| `single_choice` | Pick one option | `options` | `"Option A"` |
| `multiple_choice` | Pick one or more | `options` | `["Option A", "Option B"]` |
| `rating` | Numeric scale | `ratingConfig` | `4` |

### 2. Generate tokens

Each respondent gets a unique, single-use token that authorizes them to answer once.

```ts
const token = await fdbck.tokens.create(question.id, {
  respondent: 'user_42', // your internal user ID (optional)
});

// token.respondUrl → https://fdbck.sh/f/V1StGXR8_Z5jdHi6
// token.expiresAt  → ISO timestamp (1 hour from creation)
```

Send `token.respondUrl` to your user however you like — email, in-app notification, SMS, etc. They open the link, answer on fdbck's hosted response page, and see a confirmation message. The page does not redirect — if you need to bring users back to your app, include a link in the question text or follow up after you receive the response.

You can also embed the question directly in your app using `fdbck-react` or `fdbck-flutter` — pass the `token.token` value to the UI component and it handles submission for you.

### 3. Read results

Poll for responses at any time — they're available as soon as respondents answer.

```ts
const results = await fdbck.questions.results(question.id);

for (const response of results.data) {
  console.log(response.respondent, response.value);
  // → 'user_42', 5
}

// Results are paginated — follow the cursor for more
if (results.pagination.hasMore) {
  const nextPage = await fdbck.questions.results(question.id, {
    cursor: results.pagination.nextCursor,
  });
}
```

### 4. Or use webhooks

Get notified in real time instead of polling.

```ts
const question = await fdbck.questions.create({
  question: 'How was your experience?',
  type: 'yes_no',
  expiresIn: 86400,
  webhookUrl: 'https://myapp.com/hooks/fdbck',
  webhookTrigger: 'each_response', // or 'expiry', 'both'
});
```

Verify incoming webhooks with the signing secret:

```ts
const isValid = fdbck.verifyWebhook(rawBody, signature, webhookSecret);
// signature = X-FDBCK-Signature header
// webhookSecret = question.webhookSecret from creation response
```

`verifyWebhook` is also available as a standalone import if you don't need a client instance:

```ts
import { verifyWebhook } from 'fdbck-node';
```

## API reference

### `new Fdbck(apiKey, options?)`

| Option | Type | Default |
|--------|------|---------|
| `baseUrl` | `string` | `https://api.fdbck.sh` |
| `timeout` | `number` | `30000` (ms) |

### Questions

#### `fdbck.questions.create(options)` → `Question`

Creates a new question.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `question` | `string` | Yes | The question text (max 500 chars) |
| `type` | `QuestionType` | Yes | `yes_no`, `single_choice`, `multiple_choice`, or `rating` |
| `options` | `string[]` | For choice types | 2–20 answer options |
| `ratingConfig` | `RatingConfig` | For `rating` | `{ min, max, minLabel?, maxLabel? }` |
| `expiresIn` or `expiresAt` | `number` or `string` | Yes (exactly one) | Seconds from now, or ISO 8601 timestamp |
| `maxResponses` | `number` | No | Auto-complete after N responses |
| `webhookUrl` | `string` | No | HTTPS URL to receive events |
| `webhookTrigger` | `WebhookTrigger` | No | `each_response`, `expiry`, or `both` |
| `metadata` | `Record<string, string>` | No | Arbitrary key-value pairs |
| `themeColor` | `string` | No | Hex color for response page |
| `themeMode` | `'light' \| 'dark'` | No | Response page theme |
| `hideBranding` | `boolean` | No | Hide "Powered by fdbck" (paid plans) |

#### `fdbck.questions.get(id)` → `Question`

Returns a single question by ID.

#### `fdbck.questions.list(options?)` → `PaginatedList<Question>`

Returns a paginated list of questions.

```ts
const page = await fdbck.questions.list({ status: 'collecting', limit: 20 });

console.log(page.data);                // Question[]
console.log(page.pagination.hasMore);  // boolean
console.log(page.pagination.nextCursor); // string | null

// Fetch the next page
if (page.pagination.nextCursor) {
  const next = await fdbck.questions.list({
    status: 'collecting',
    cursor: page.pagination.nextCursor,
  });
}
```

| Option | Type | Description |
|--------|------|-------------|
| `status` | `QuestionStatus` | Filter by `collecting`, `completed`, `expired`, or `cancelled` |
| `sort` | `string` | Sort by `created_at` or `updated_at` |
| `order` | `string` | Sort direction: `asc` or `desc` |
| `createdAfter` | `string` | ISO 8601 — only return questions created after this time |
| `createdBefore` | `string` | ISO 8601 — only return questions created before this time |
| `limit` | `number` | Items per page |
| `cursor` | `string` | Cursor from a previous page's `pagination.nextCursor` |

#### `fdbck.questions.listAll(options?)` → `AsyncGenerator<Question>`

Auto-paginates through all questions. Same options as `list` except `cursor`.

Each page is fetched sequentially as you consume the iterator — there is no prefetching. If you have a large number of questions, be mindful of the number of API calls this produces.

```ts
for await (const question of fdbck.questions.listAll({ status: 'collecting' })) {
  console.log(question.id, question.question);
}
```

#### `fdbck.questions.results(id, options?)` → `QuestionResultsResponse`

Returns aggregated results and individual responses for a question.

```ts
const results = await fdbck.questions.results(question.id, { limit: 50 });

console.log(results.totalResponses); // 142
console.log(results.results);        // { average: 4.3, distribution: { ... } }
console.log(results.type);           // 'rating'
console.log(results.status);         // 'completed'

for (const response of results.data) {
  console.log(response.respondent); // 'user_42' or null
  console.log(response.value);      // answer value (type depends on question type)
  console.log(response.createdAt);  // ISO timestamp
}

// Next page
if (results.pagination.hasMore) {
  const next = await fdbck.questions.results(question.id, {
    cursor: results.pagination.nextCursor,
  });
}
```

Each `ResponseItem` contains:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Response ID |
| `questionId` | `string` | Parent question ID |
| `value` | `unknown` | The answer — `"Yes"`/`"No"` for yes_no, `"Option A"` for single_choice, `["A", "B"]` for multiple_choice, `4` for rating |
| `respondent` | `string \| null` | The respondent identifier you passed when creating the token |
| `createdAt` | `string` | ISO timestamp |

#### `fdbck.questions.cancel(id)` → `Question`

Cancels a question and returns the cancelled question. It stops accepting responses immediately.

#### `fdbck.questions.webhooks(id, options?)` → `PaginatedList<WebhookDelivery>`

Returns webhook delivery logs for a question. Same pagination options as `results`.

### Tokens

#### `fdbck.tokens.create(questionId, options?)` → `TokenResult`

Generates a single-use respondent token.

```ts
const token = await fdbck.tokens.create(question.id, {
  respondent: 'user_42', // optional — your internal ID for this respondent
});

token.token;      // the raw token string
token.respondUrl; // full URL to the hosted response page
token.expiresAt;  // ISO timestamp (1 hour from creation)
```

### Account

```ts
const info = await fdbck.me();
// info.user         → { id, email, name, avatarUrl }
// info.organization → { id, name, slug, plan, role, responsesUsed, responsesLimit, ... }
```

## Error handling

```ts
import { FdbckApiError, FdbckNetworkError } from 'fdbck-node';

try {
  await fdbck.questions.create({ ... });
} catch (err) {
  if (err instanceof FdbckApiError) {
    console.error(err.status);  // 401, 422, etc.
    console.error(err.code);    // 'unauthorized', 'validation_error', etc.
    console.error(err.message); // Human-readable message
    console.error(err.details); // { fields: [...] } for validation errors
  }

  if (err instanceof FdbckNetworkError) {
    console.error(err.message); // 'fetch failed', timeout, etc.
    console.error(err.cause);   // Original error
  }
}
```

## Requirements

- Node.js 18+
- An API key from [dashboard.fdbck.sh](https://dashboard.fdbck.sh)

## Links

- [Documentation](https://docs.fdbck.sh)
- [Dashboard](https://dashboard.fdbck.sh)
- [GitHub](https://github.com/fdbck-sh)

## License

MIT
