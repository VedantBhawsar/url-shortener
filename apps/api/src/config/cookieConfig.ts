import type { CookieOptions } from 'express';

/**
 * Cookie configuration for secure, HttpOnly cookies
 * Works across subdomains using domain-based configuration
 */

const isProduction = process.env.NODE_ENV === 'production';
const baseUrl = process.env.BASE_URL || 'localhost';

// Extract domain for subdomain support (e.g., 'example.com' from 'api.example.com')
const getDomain = (): string => {
  if (isProduction) {
    const parts = baseUrl.split('.');
    // Keep last 2 parts for domain (e.g., 'example.com' from 'api.example.com')
    return parts.length > 1 ? '.' + parts.slice(-2).join('.') : baseUrl;
  }
  return undefined as any; // localhost doesn't use domain
};

/**
 * Secure cookie options for access token
 * - HttpOnly: Prevents JavaScript access, protects against XSS
 * - Secure: Only sent over HTTPS (production)
 * - SameSite: Prevents CSRF attacks
 * - Path: Accessible from API routes only
 */
export const accessTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  path: '/api',
  maxAge: 15 * 60 * 1000, // 15 minutes
  domain: getDomain(),
};

/**
 * Secure cookie options for refresh token
 * - Longer expiration than access token
 * - Stricter path for additional security
 */
export const refreshTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  path: '/api/v1/auth/refresh',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  domain: getDomain(),
};

/**
 * Cookie names for storing tokens
 */
export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
} as const;

/**
 * Clear cookie options (used for logout)
 */
export const clearCookieOptions: CookieOptions = {
  httpOnly: true,
  path: '/api',
  domain: getDomain(),
};

export const clearRefreshCookieOptions: CookieOptions = {
  httpOnly: true,
  path: '/api/v1/auth/refresh',
  domain: getDomain(),
};
