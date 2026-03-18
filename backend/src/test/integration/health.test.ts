/**
 * Integration health test.
 * We avoid spinning up the real app (requires DB connection).
 * Instead we verify that the core modules can be imported without throwing.
 */
import { describe, it, expect } from 'vitest';

describe('Backend module imports (smoke test)', () => {
  it('app-error utility can be imported', async () => {
    const mod = await import('../../utils/app-error.js');
    expect(mod.AppError).toBeDefined();
    expect(typeof mod.AppError.notFound).toBe('function');
    expect(typeof mod.AppError.badRequest).toBe('function');
    expect(typeof mod.AppError.unauthorized).toBe('function');
  });

  it('AppError.notFound returns 404 error', async () => {
    const { AppError } = await import('../../utils/app-error.js');
    const err = AppError.notFound('test');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('test');
  });

  it('AppError.unauthorized returns 401 error', async () => {
    const { AppError } = await import('../../utils/app-error.js');
    const err = AppError.unauthorized('sin auth');
    expect(err.statusCode).toBe(401);
  });

  it('AppError.badRequest returns 400 error', async () => {
    const { AppError } = await import('../../utils/app-error.js');
    const err = AppError.badRequest('bad input');
    expect(err.statusCode).toBe(400);
  });

  it('AppError.conflict returns 409 error', async () => {
    const { AppError } = await import('../../utils/app-error.js');
    const err = AppError.conflict('conflict', 'CONFLICT_CODE');
    expect(err.statusCode).toBe(409);
  });
});
