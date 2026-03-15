/** Base error for all fdbck SDK errors */
export class FdbckError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FdbckError';
  }
}

/** Error returned by the fdbck API */
export class FdbckApiError extends FdbckError {
  readonly status: number;
  readonly code: string;
  readonly details?: { fields: string[] };

  constructor(
    status: number,
    code: string,
    message: string,
    details?: { fields: string[] },
  ) {
    super(message);
    this.name = 'FdbckApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** Network-level error (fetch failure, timeout, etc.) */
export class FdbckNetworkError extends FdbckError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'FdbckNetworkError';
    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}
