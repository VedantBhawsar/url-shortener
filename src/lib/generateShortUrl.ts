import Bun from 'bun';
import { base64url } from 'jose';
import { shortLinkRepository } from '../repositories/shortLinkRepository';

export function generateShortLink(originalUrl: string): string {
  // SHA256 hash as Uint8Array
  const hash = Bun.CryptoHasher.hash('sha256', originalUrl);

  // take first 6 bytes (48 bits entropy)
  const shortBytes = hash.slice(0, 6);

  // encode to url-safe string
  const shortCode = base64url.encode(shortBytes);

  return shortCode;
}

export async function generateUniqueShortUrl(
  originalUrl: string,
  attempt: number = 0,
): Promise<string> {
  const MAX_RETRIES = 5;

  // base guard to prevent infinite recursion
  if (attempt >= MAX_RETRIES) {
    throw new Error('Unable to generate unique short URL after retries');
  }

  // BUG FIX: add random salt on every attempt (not just after the first) so that
  // retrying the same originalUrl doesn't deterministically re-produce the same hash
  // and loop forever.
  const salt = attempt === 0 ? '' : `-${Date.now()}-${attempt}-${Math.random()}`;
  const input = `${originalUrl}${salt}`;

  const shortUrl = generateShortLink(input);

  const existing = await shortLinkRepository.findByShortUrl(shortUrl);

  // base condition
  if (!existing) {
    return shortUrl;
  }

  // recursive call with changed state
  return generateUniqueShortUrl(originalUrl, attempt + 1);
}
