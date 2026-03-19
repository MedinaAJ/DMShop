import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/app-error.js';
import { ErrorCode } from '@dmshop/shared';
import { User } from '../../models/user.model.js';
import { RefreshToken } from '../../models/refresh-token.model.js';
import { UserGroup } from '../../models/user-group.model.js';
import { CustomerGroup } from '../../models/customer-group.model.js';
import { CustomerGroupLang } from '../../models/customer-group-lang.model.js';
import { eventBus } from '../../hooks/event-bus.js';
import { HookName } from '@dmshop/shared';
import type { JwtPayload } from '../../middleware/authenticate.js';
import type { LoginInput, RegisterInput } from '@dmshop/shared';
import { mailService } from '../mail/mail.service.js';

const SALT_ROUNDS = 12;

export const authService = {
  async register(input: RegisterInput) {
    const existingUser = await User.findOne({ where: { email: input.email } });
    if (existingUser) {
      throw AppError.conflict('El email ya está registrado', ErrorCode.AUTH_EMAIL_EXISTS);
    }

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await User.create({
      email: input.email,
      password: hashedPassword,
      first_name: input.firstName,
      last_name: input.lastName,
      role: 'customer',
      active: true,
      newsletter: input.newsletter ?? false,
    });

    const tokens = await this.generateTokens(user);

    // Assign to default "Cliente" group (id=3) on registration
    await UserGroup.create({ id_user: user.id, id_customer_group: 3 }).catch((err) =>
      console.error('[AuthService] Error assigning default group:', err),
    );

    await eventBus.emitAsync(HookName.ON_USER_REGISTER, { userId: user.id });

    // Fire-and-forget: send welcome email
    mailService.sendWelcome({ email: user.email, first_name: user.first_name }).catch((err) =>
      console.error('[AuthService] Error sending welcome email:', err),
    );

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  },

  async login(input: LoginInput) {
    const user = await User.findOne({ where: { email: input.email } });
    if (!user) {
      throw AppError.unauthorized('Credenciales inválidas', ErrorCode.AUTH_INVALID_CREDENTIALS);
    }

    if (!user.active) {
      throw AppError.unauthorized('Cuenta desactivada', ErrorCode.AUTH_ACCOUNT_DISABLED);
    }

    const isValidPassword = await bcrypt.compare(input.password, user.password);
    if (!isValidPassword) {
      throw AppError.unauthorized('Credenciales inválidas', ErrorCode.AUTH_INVALID_CREDENTIALS);
    }

    // Update last login
    await user.update({ last_login_at: new Date() });

    const tokens = await this.generateTokens(user);

    await eventBus.emitAsync(HookName.ON_USER_LOGIN, { userId: user.id });

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  },

  async refresh(refreshTokenStr: string) {
    if (!refreshTokenStr) {
      throw AppError.unauthorized('Refresh token no proporcionado', ErrorCode.AUTH_REFRESH_INVALID);
    }

    let payload: JwtPayload;
    try {
      payload = jwt.verify(refreshTokenStr, env.JWT_REFRESH_SECRET) as JwtPayload;
    } catch {
      throw AppError.unauthorized('Refresh token inválido', ErrorCode.AUTH_REFRESH_INVALID);
    }

    // Find and delete the used refresh token (rotation)
    const storedToken = await RefreshToken.findOne({
      where: { token: refreshTokenStr, id_user: payload.userId },
    });

    if (!storedToken) {
      // Token reuse detected — invalidate all tokens for this user
      await RefreshToken.destroy({ where: { id_user: payload.userId } });
      throw AppError.unauthorized('Refresh token reutilizado', ErrorCode.AUTH_REFRESH_INVALID);
    }

    await storedToken.destroy();

    const user = await User.findByPk(payload.userId);
    if (!user || !user.active) {
      throw AppError.unauthorized('Usuario no encontrado', ErrorCode.AUTH_REFRESH_INVALID);
    }

    return this.generateTokens(user);
  },

  async logout(refreshTokenStr: string) {
    await RefreshToken.destroy({ where: { token: refreshTokenStr } });
  },

  async getProfile(userId: number) {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: CustomerGroup,
          as: 'groups',
          through: { attributes: [] },
          include: [{ model: CustomerGroupLang, as: 'translations' }],
        },
      ],
    });
    if (!user) {
      throw AppError.notFound('Usuario no encontrado', ErrorCode.USER_NOT_FOUND);
    }
    return user;
  },

  async generateTokens(user: User) {
    const jwtPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(jwtPayload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRATION as any,
    });

    const refreshToken = jwt.sign(jwtPayload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRATION as any,
    });

    // Store refresh token in DB
    await RefreshToken.create({
      id_user: user.id,
      token: refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Clean up expired tokens for this user
    await RefreshToken.destroy({
      where: {
        id_user: user.id,
        expires_at: { [Symbol.for('lt')]: new Date() },
      },
    });

    return { accessToken, refreshToken };
  },

  sanitizeUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
    };
  },
};
