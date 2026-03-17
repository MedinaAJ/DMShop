import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error.js';
import type { UserRoleType } from '@dmshop/shared';

export function authorize(...roles: UserRoleType[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw AppError.unauthorized();
    }

    if (!roles.includes(req.user.role as UserRoleType)) {
      throw AppError.forbidden('No tienes permisos para acceder a este recurso');
    }

    next();
  };
}
