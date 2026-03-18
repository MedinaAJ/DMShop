import { vi, describe, it, expect, beforeEach } from 'vitest';

// ── Mock models & dependencies ─────────────────────────────────────────────
vi.mock('../../models/user.model.js', () => ({
  User: {
    findOne: vi.fn(),
    findByPk: vi.fn(),
    create: vi.fn(),
  },
}));
vi.mock('../../models/refresh-token.model.js', () => ({
  RefreshToken: {
    findOne: vi.fn(),
    create: vi.fn(),
    destroy: vi.fn(),
  },
}));
vi.mock('../../models/user-group.model.js', () => ({
  UserGroup: {
    create: vi.fn().mockResolvedValue({ id_user: 1, id_customer_group: 3 }),
  },
}));
vi.mock('../../models/customer-group.model.js', () => ({
  CustomerGroup: {},
}));
vi.mock('../../models/customer-group-lang.model.js', () => ({
  CustomerGroupLang: {},
}));
vi.mock('../../hooks/event-bus.js', () => ({
  eventBus: {
    emitAsync: vi.fn().mockResolvedValue(undefined),
  },
}));
vi.mock('../mail/mail.service.js', () => ({
  mailService: {
    sendWelcome: vi.fn().mockResolvedValue(undefined),
    sendOrderConfirmation: vi.fn().mockResolvedValue(undefined),
    sendOrderStatusChange: vi.fn().mockResolvedValue(undefined),
  },
}));
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
  hash: vi.fn(),
  compare: vi.fn(),
}));
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(),
  },
  sign: vi.fn(),
  verify: vi.fn(),
}));
vi.mock('../../utils/app-error.js', () => ({
  AppError: {
    notFound: vi.fn((msg: string, code?: string) => Object.assign(new Error(msg), { statusCode: 404, code })),
    badRequest: vi.fn((msg: string, code?: string) => Object.assign(new Error(msg), { statusCode: 400, code })),
    conflict: vi.fn((msg: string, code?: string) => Object.assign(new Error(msg), { statusCode: 409, code })),
    unauthorized: vi.fn((msg: string, code?: string) => Object.assign(new Error(msg), { statusCode: 401, code })),
  },
}));

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../../models/user.model.js';
import { RefreshToken } from '../../models/refresh-token.model.js';
import { authService } from './service.js';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeUser(overrides: Partial<{
  id: number; email: string; password: string; first_name: string; last_name: string;
  role: string; active: boolean; newsletter: boolean;
}> = {}) {
  return {
    id: 1,
    email: 'test@example.com',
    password: 'hashed_password',
    first_name: 'Test',
    last_name: 'User',
    role: 'customer',
    active: true,
    newsletter: false,
    update: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ── register ───────────────────────────────────────────────────────────────

describe('authService.register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(RefreshToken.create).mockResolvedValue({ id: 1 } as any);
    vi.mocked(RefreshToken.destroy).mockResolvedValue(0 as any);
    vi.mocked(jwt.sign).mockReturnValue('mocked_token' as any);
  });

  it('email ya existente → lanza conflict', async () => {
    vi.mocked(User.findOne).mockResolvedValue(makeUser() as any);

    await expect(
      authService.register({ email: 'test@example.com', password: '123456', firstName: 'Test', lastName: 'User' }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('datos válidos → crea usuario y devuelve tokens', async () => {
    vi.mocked(User.findOne).mockResolvedValue(null);
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed_pass' as any);
    const createdUser = makeUser({ id: 2, email: 'nuevo@example.com' });
    vi.mocked(User.create).mockResolvedValue(createdUser as any);
    vi.mocked(jwt.sign)
      .mockReturnValueOnce('access_token' as any)
      .mockReturnValueOnce('refresh_token' as any);

    const result = await authService.register({
      email: 'nuevo@example.com',
      password: 'password123',
      firstName: 'Nuevo',
      lastName: 'Usuario',
    });

    expect(User.create).toHaveBeenCalled();
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(result).toHaveProperty('user');
    expect(result.user.email).toBe('nuevo@example.com');
  });
});

// ── login ──────────────────────────────────────────────────────────────────

describe('authService.login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(RefreshToken.create).mockResolvedValue({ id: 1 } as any);
    vi.mocked(RefreshToken.destroy).mockResolvedValue(0 as any);
  });

  it('email no existe → lanza 401', async () => {
    vi.mocked(User.findOne).mockResolvedValue(null);

    await expect(
      authService.login({ email: 'noexiste@example.com', password: '123' }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('cuenta desactivada → lanza 401', async () => {
    vi.mocked(User.findOne).mockResolvedValue(makeUser({ active: false }) as any);

    await expect(
      authService.login({ email: 'test@example.com', password: '123' }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('password incorrecta → lanza 401', async () => {
    vi.mocked(User.findOne).mockResolvedValue(makeUser() as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as any);

    await expect(
      authService.login({ email: 'test@example.com', password: 'wrong' }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('credenciales correctas → devuelve accessToken y refreshToken', async () => {
    const user = makeUser();
    vi.mocked(User.findOne).mockResolvedValue(user as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as any);
    vi.mocked(jwt.sign)
      .mockReturnValueOnce('access_token' as any)
      .mockReturnValueOnce('refresh_token' as any);

    const result = await authService.login({ email: 'test@example.com', password: 'correct' });

    expect(result.accessToken).toBe('access_token');
    expect(result.refreshToken).toBe('refresh_token');
    expect(result.user).toBeDefined();
  });
});

// ── refresh ────────────────────────────────────────────────────────────────

describe('authService.refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(RefreshToken.create).mockResolvedValue({ id: 1 } as any);
    vi.mocked(RefreshToken.destroy).mockResolvedValue(0 as any);
  });

  it('token vacío → lanza 401', async () => {
    await expect(authService.refresh('')).rejects.toMatchObject({ statusCode: 401 });
  });

  it('token inválido (jwt.verify throws) → lanza 401', async () => {
    vi.mocked(jwt.verify).mockImplementation(() => { throw new Error('invalid'); });

    await expect(authService.refresh('bad_token')).rejects.toMatchObject({ statusCode: 401 });
  });

  it('token válido pero no en BD (reuse) → lanza 401', async () => {
    vi.mocked(jwt.verify).mockReturnValue({ userId: 1, email: 'test@example.com', role: 'customer' } as any);
    vi.mocked(RefreshToken.findOne).mockResolvedValue(null); // not in DB

    await expect(authService.refresh('used_token')).rejects.toMatchObject({ statusCode: 401 });
    expect(RefreshToken.destroy).toHaveBeenCalled(); // all tokens for user revoked
  });

  it('token válido → devuelve nuevo accessToken', async () => {
    vi.mocked(jwt.verify).mockReturnValue({ userId: 1, email: 'test@example.com', role: 'customer' } as any);
    const storedToken = { destroy: vi.fn().mockResolvedValue(undefined) };
    vi.mocked(RefreshToken.findOne).mockResolvedValue(storedToken as any);
    const user = makeUser();
    vi.mocked(User.findByPk).mockResolvedValue(user as any);
    vi.mocked(jwt.sign)
      .mockReturnValueOnce('new_access_token' as any)
      .mockReturnValueOnce('new_refresh_token' as any);

    const result = await authService.refresh('valid_refresh_token');

    expect(storedToken.destroy).toHaveBeenCalled();
    expect(result.accessToken).toBe('new_access_token');
    expect(result.refreshToken).toBe('new_refresh_token');
  });

  it('token válido pero usuario desactivado → lanza 401', async () => {
    vi.mocked(jwt.verify).mockReturnValue({ userId: 1, email: 'test@example.com', role: 'customer' } as any);
    const storedToken = { destroy: vi.fn().mockResolvedValue(undefined) };
    vi.mocked(RefreshToken.findOne).mockResolvedValue(storedToken as any);
    vi.mocked(User.findByPk).mockResolvedValue(makeUser({ active: false }) as any);

    await expect(authService.refresh('valid_refresh_token')).rejects.toMatchObject({ statusCode: 401 });
  });
});
