import { ErrorCode } from '@dmshop/shared';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly field?: string;

  constructor(statusCode: number, code: string, message: string, field?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.field = field;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string, code = ErrorCode.VALIDATION_ERROR, field?: string) {
    return new AppError(400, code, message, field);
  }

  static unauthorized(message = 'No autorizado', code = ErrorCode.AUTH_INVALID_CREDENTIALS) {
    return new AppError(401, code, message);
  }

  static forbidden(message = 'Acceso denegado') {
    return new AppError(403, ErrorCode.FORBIDDEN, message);
  }

  static notFound(message = 'Recurso no encontrado', code = ErrorCode.NOT_FOUND) {
    return new AppError(404, code, message);
  }

  static conflict(message: string, code: string) {
    return new AppError(409, code, message);
  }

  static internal(message = 'Error interno del servidor') {
    return new AppError(500, ErrorCode.INTERNAL_ERROR, message);
  }
}
