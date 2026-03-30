import type { ShortLink, Click } from '../../generated/prisma/client';

export type CreateShortLinkPayload = {
  originalUrl: string;
  shortUrl?: string;
  userId: string;
  expiresAt?: Date;
  blockedRegions?: string[];
};

export type UpdateShortLinkPayload = Partial<
  Pick<ShortLink, 'originalUrl' | 'status' | 'expiresAt' | 'blockedRegions'>
>;

export type ShortLinkWithClicks = ShortLink & { clicks: Click[] };

export type RecordClickPayload = Pick<
  Click,
  | 'shortLinkId'
  | 'ipAddress'
  | 'userAgent'
  | 'referer'
  | 'country'
  | 'city'
  | 'region'
  | 'latitude'
  | 'longitude'
  | 'device'
  | 'browser'
  | 'os'
>;
