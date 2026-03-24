// ── Error handler middleware ─────────────────────────────────

import type { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const status  = err.statusCode ?? 500;
  const message = err.message    ?? 'Internal server error';
  const code    = err.code       ?? 'INTERNAL_ERROR';

  if (status >= 500) {
    console.error('[ERROR]', err);
  }

  res.status(status).json({ error: code, message });
}

/** Wrap async route handlers so errors propagate to errorHandler */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
