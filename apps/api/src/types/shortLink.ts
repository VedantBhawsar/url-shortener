import type { ShortLink, Click } from '../../generated/prisma/client';

export type CreateShortLinkPayload = {
  originalUrl: string;
  shortUrl?: string; // optional — auto-generated if not provided
  userId: string;
};

export type UpdateShortLinkPayload = Partial<Pick<ShortLink, 'originalUrl' | 'status'>>;

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
>;
