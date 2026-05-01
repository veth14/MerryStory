import { createHmac } from 'crypto';

function getAdminAccessSecret() {
  return process.env.CONTRACT_ADMIN_ACCESS_SECRET || process.env.EMAIL_PASS || '';
}

export function createContractAdminAccessToken(reviewToken: string) {
  const secret = getAdminAccessSecret();
  if (!secret) {
    throw new Error('Missing CONTRACT_ADMIN_ACCESS_SECRET or EMAIL_PASS environment variable.');
  }

  return createHmac('sha256', secret).update(reviewToken).digest('hex');
}

export function isValidContractAdminAccessToken(reviewToken: string, token: string | null | undefined) {
  if (!token) return false;

  try {
    return createContractAdminAccessToken(reviewToken) === token;
  } catch {
    return false;
  }
}
