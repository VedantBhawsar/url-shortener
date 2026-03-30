import { UAParser } from 'ua-parser-js';

export interface ParsedUserAgent {
  browser: string;
  os: string;
  device: string;
}

/**
 * Parses a raw User-Agent string into browser, OS, and device type.
 * All fields fall back to empty string on unknown/missing values.
 */
export function parseUserAgent(userAgent: string): ParsedUserAgent {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const browser = result.browser.name ?? '';
  const os = result.os.name ?? '';

  const deviceType = result.device.type;
  let device: string;
  if (deviceType === 'mobile') {
    device = 'Mobile';
  } else if (deviceType === 'tablet') {
    device = 'Tablet';
  } else {
    device = 'Desktop';
  }

  return { browser, os, device };
}
