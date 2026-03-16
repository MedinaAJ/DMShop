import type { ApiResponse, PaginationMeta } from '@dmshop/shared';
import { Response } from 'express';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  const response: ApiResponse<T> = { success: true, data };
  res.status(statusCode).json(response);
}

export function sendPaginated<T>(res: Response, data: T[], meta: PaginationMeta): void {
  const response: ApiResponse<T[]> = { success: true, data, meta };
  res.status(200).json(response);
}

export function sendCreated<T>(res: Response, data: T): void {
  sendSuccess(res, data, 201);
}

export function sendNoContent(res: Response): void {
  res.status(204).send();
}
