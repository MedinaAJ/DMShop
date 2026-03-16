import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../utils/app-error.js';
import { logger } from '../config/logger.js';
import type { ApiResponse } from '@dmshop/shared';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      errors: [
        {
          code: err.code,
          message: err.message,
          ...(err.field && { field: err.field }),
        },
      ],
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Unexpected error
  logger.error('Unhandled error:', err);

  const response: ApiResponse = {
    success: false,
    errors: [
      {
        code: 'INTERNAL_ERROR',
        message:
          process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor',
      },
    ],
  };
  res.status(500).json(response);
};
