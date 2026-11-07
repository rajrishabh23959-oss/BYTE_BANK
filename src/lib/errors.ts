import { ZodError } from 'zod';

export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'INSUFFICIENT_FUNDS'
  | 'ACCOUNT_FROZEN'
  | 'KYC_NOT_VERIFIED'
  | 'IDEMPOTENCY_CONFLICT'
  | 'IDEMPOTENCY_IN_PROGRESS'
  | 'AUTHORIZATION_INVALID'
  | 'RISK_REJECTED'
  | 'RECONCILIATION_MISMATCH'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;

  constructor(statusCode: number, code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function formatErrorResponse(err: unknown) {
  if (err instanceof AppError) {
    return {
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      status: err.statusCode,
    };
  }

  if (err instanceof ZodError) {
    return {
      error: {
        code: 'VALIDATION_ERROR' as ErrorCode,
        message: err.issues.map((i) => `${i.path.join('.') || 'field'}: ${i.message}`).join(', '),
        details: err.issues,
      },
      status: 400,
    };
  }

  if (err instanceof SyntaxError) {
    return {
      error: {
        code: 'VALIDATION_ERROR' as ErrorCode,
        message: 'Invalid request JSON payload format',
      },
      status: 400,
    };
  }

  const message = err instanceof Error ? err.message : 'An unexpected error occurred';
  return {
    error: {
      code: 'INTERNAL_ERROR' as ErrorCode,
      message,
    },
    status: 500,
  };
}
