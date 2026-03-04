import Bun from 'bun';
import { SignJWT, jwtVerify } from 'jose';
import type { User } from '../../generated/prisma/client';
import type { Result } from '../types/result';
import type { TokenPair, AccessTokenPayload } from '../types/auth';
import { userRepository } from '../repositories/userRepository';
import { authRepository } from '../repositories/authRepository';
import { JWT_SECRET, JWT_REFRESH_SECRET } from '../config/constant';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const accessSecret = new TextEncoder().encode(JWT_SECRET);
const refreshSecret = new TextEncoder().encode(JWT_REFRESH_SECRET);

async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(accessSecret);
}

async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(refreshSecret);
}

export const authService = {
  register: async (
    payload: Pick<User, 'name' | 'email' | 'password'>,
  ): Promise<Result<TokenPair>> => {
    try {
      const existing = await userRepository.findByEmail(payload.email);
      if (existing) return { data: null, error: 'Email already in use' };

      const hashedPassword = await Bun.password.hash(payload.password, {
        algorithm: 'bcrypt',
        cost: 10,
      });

      const user = await userRepository.create({ ...payload, password: hashedPassword });

      const tokens = await authService._issueTokenPair(user.id, user.email);
      return { data: tokens, error: null };
    } catch (error) {
      console.error('authService.register:', error);
      return { data: null, error: 'Registration failed' };
    }
  },

  login: async (email: string, password: string): Promise<Result<TokenPair>> => {
    try {
      const user = await userRepository.findByEmail(email);
      if (!user) return { data: null, error: 'Invalid credentials' };

      const valid = await Bun.password.verify(password, user.password);
      if (!valid) return { data: null, error: 'Invalid credentials' };

      const tokens = await authService._issueTokenPair(user.id, user.email);
      return { data: tokens, error: null };
    } catch (error) {
      console.error('authService.login:', error);
      return { data: null, error: 'Login failed' };
    }
  },

  refresh: async (token: string): Promise<Result<TokenPair>> => {
    try {
      const stored = await authRepository.findRefreshToken(token);
      if (!stored) return { data: null, error: 'Invalid refresh token' };
      if (stored.expiresAt < new Date()) {
        await authRepository.deleteRefreshToken(token);
        return { data: null, error: 'Refresh token expired' };
      }

      // Verify signature
      const { payload } = await jwtVerify(token, refreshSecret);
      const userId = payload.sub;
      if (!userId) return { data: null, error: 'Invalid refresh token' };

      const user = await userRepository.findById(userId);
      if (!user) return { data: null, error: 'User not found' };

      // Rotate: delete old, issue new pair
      await authRepository.deleteRefreshToken(token);
      const tokens = await authService._issueTokenPair(user.id, user.email);
      return { data: tokens, error: null };
    } catch (error) {
      console.error('authService.refresh:', error);
      return { data: null, error: 'Token refresh failed' };
    }
  },

  logout: async (refreshToken: string): Promise<Result<null>> => {
    try {
      const stored = await authRepository.findRefreshToken(refreshToken);
      if (!stored) return { data: null, error: 'Invalid refresh token' };
      await authRepository.deleteRefreshToken(refreshToken);
      return { data: null, error: null };
    } catch (error) {
      console.error('authService.logout:', error);
      return { data: null, error: 'Logout failed' };
    }
  },

  verifyAccessToken: async (token: string): Promise<Result<AccessTokenPayload>> => {
    try {
      const { payload } = await jwtVerify(token, accessSecret);
      const sub = payload.sub;
      const email = payload['email'];

      if (!sub || typeof email !== 'string') {
        return { data: null, error: 'Invalid token payload' };
      }

      return { data: { sub, email }, error: null };
    } catch {
      return { data: null, error: 'Invalid or expired access token' };
    }
  },

  /** Internal helper — sign both tokens and persist the refresh token */
  _issueTokenPair: async (userId: string, email: string): Promise<TokenPair> => {
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken({ sub: userId, email }),
      signRefreshToken(userId),
    ]);

    await authRepository.createRefreshToken({
      token: refreshToken,
      userId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });

    return { accessToken, refreshToken };
  },
};
