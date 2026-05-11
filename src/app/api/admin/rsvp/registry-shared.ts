import { ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/mongodb';
import {
  buildGuestCodePattern,
  getRsvpCollection,
  normalizeGuestTier,
  RSVP_CODE_CHARSET,
  RSVP_CODE_LENGTH,
  type GuestTier,
  type RsvpRecord,
  type RsvpStatus,
} from '@/app/api/rsvp/rsvpCollection';

export type GuestStatus = 'Confirmed' | 'Pending' | 'Declined';

export const normalizeStatus = (value?: string): GuestStatus => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'confirmed') return 'Confirmed';
  if (normalized === 'declined') return 'Declined';
  return 'Pending';
};

export const toRsvpStatus = (value?: string): RsvpStatus => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'confirmed') return 'confirmed';
  if (normalized === 'declined') return 'declined';
  return 'pending';
};

const buildCodeToken = () => {
  let token = '';
  for (let index = 0; index < RSVP_CODE_LENGTH; index += 1) {
    const randomIndex = Math.floor(Math.random() * RSVP_CODE_CHARSET.length);
    token += RSVP_CODE_CHARSET[randomIndex];
  }
  return token;
};

export const formatGuestCode = (tier: GuestTier, token: string) => {
  const normalizedToken = token.trim().toUpperCase();
  return tier === 'VIP' ? `VIP-${normalizedToken}` : normalizedToken;
};

export const normalizeRequestedCode = (value: unknown, tier: GuestTier) => {
  const normalized = String(value || '').trim().toUpperCase();
  if (!normalized) return null;
  return tier === 'VIP' && !normalized.startsWith('VIP-') ? `VIP-${normalized}` : normalized;
};

export const validateGuestCode = (code: string, tier: GuestTier) => {
  const pattern = buildGuestCodePattern(tier);
  return pattern.test(code);
};

export const resolveGuestCode = async ({
  eventId,
  requestedCode,
  tier,
  excludeGuestId,
}: {
  eventId: ObjectId;
  requestedCode?: unknown;
  tier: GuestTier;
  excludeGuestId?: ObjectId;
}) => {
  const db = await getMongoDb();
  const rsvpCollection = getRsvpCollection(db);
  const normalizedRequestedCode = normalizeRequestedCode(requestedCode, tier);

  if (normalizedRequestedCode) {
    if (!validateGuestCode(normalizedRequestedCode, tier)) {
      throw new Error(
        tier === 'VIP'
          ? 'VIP RSVP codes must use the format VIP-<8-character unique code>.'
          : 'Standard RSVP codes must use an 8-character unique code.'
      );
    }

    const existingCode = await rsvpCollection.findOne({
      eventId,
      code: normalizedRequestedCode,
      ...(excludeGuestId ? { _id: { $ne: excludeGuestId } } : {}),
    });

    if (existingCode) {
      throw new Error('This RSVP code is already assigned to another guest in this event.');
    }

    return normalizedRequestedCode;
  }

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const candidateCode = formatGuestCode(tier, buildCodeToken());
    const existingCode = await rsvpCollection.findOne({ eventId, code: candidateCode });
    if (!existingCode) {
      return candidateCode;
    }
  }

  throw new Error('Unable to generate a unique RSVP code for this guest.');
};

export const mapRsvpToGuest = (record: RsvpRecord & { _id: ObjectId }) => ({
  _id: record._id.toString(),
  name: record.guestName,
  email: record.email || '',
  notes: record.notes || '',
  tier: record.tier || '',
  status: normalizeStatus(record.status),
  checkedIn: Boolean(record.qrScannedAt),
  rsvpCode: record.code,
  usedAt: record.usedAt || null,
  qrScannedAt: record.qrScannedAt || null,
  expiresAt: record.expiresAt || null,
  eventSlug: record.eventSlug || '',
  eventName: record.eventName || '',
  invitationSentAt: record.invitationSentAt || null,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});
