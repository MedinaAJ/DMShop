import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/app-error.js';
import { ErrorCode } from '@dmshop/shared';

type ValidationTarget = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[target]);
      req[target] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.errors[0];
        throw new AppError(
          400,
          ErrorCode.VALIDATION_ERROR,
          firstError.message,
          firstError.path.join('.'),
        );
      }
      next(error);
    }
  };
}
