import { Request, Response } from 'express';
import { authService } from './service.js';
import { sendSuccess } from '../../utils/response.js';
import { env } from '../../config/env.js';
import type { LoginInput, RegisterInput } from '@dmshop/shared';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: 'strict' as const,
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const authController = {
  async register(req: Request, res: Response) {
    const input: RegisterInput = req.body;
    const { accessToken, refreshToken, user } = await authService.register(input);

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    sendSuccess(res, { accessToken, user }, 201);
  },

  async login(req: Request, res: Response) {
    const input: LoginInput = req.body;
    const { accessToken, refreshToken, user } = await authService.login(input);

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    sendSuccess(res, { accessToken, user });
  },

  async refresh(req: Request, res: Response) {
    const oldRefreshToken = req.cookies.refreshToken;
    const { accessToken, refreshToken } = await authService.refresh(oldRefreshToken);

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    sendSuccess(res, { accessToken });
  },

  async logout(req: Request, res: Response) {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    sendSuccess(res, { message: 'Sesión cerrada' });
  },

  async me(req: Request, res: Response) {
    const user = await authService.getProfile(req.user!.userId);
    sendSuccess(res, user);
  },
};
