import type { Collection, Db, ObjectId } from 'mongodb';

export type RsvpStatus = 'pending' | 'confirmed' | 'declined';
export type GuestTier = 'VIP' | 'STANDARD';

export type RsvpRecord = {
  _id?: ObjectId;
  eventId: ObjectId;
  guestName: string;
  code: string;
  status: RsvpStatus;
  email?: string;
  tier?: string;
  usedAt?: Date | null;
  expiresAt?: Date | null;
  qrScannedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export const RSVP_COLLECTION_NAME = 'rsvp';
export const RSVP_CODE_LENGTH = 8;
export const RSVP_CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const VIP_CODE_PREFIX = 'VIP-';

export const getRsvpCollection = (db: Db): Collection<RsvpRecord> =>
  db.collection<RsvpRecord>(RSVP_COLLECTION_NAME);

export const normalizeGuestTier = (value?: string): GuestTier => {
  const normalized = String(value || '').trim().toUpperCase();
  return normalized === 'VIP' ? 'VIP' : 'STANDARD';
};

export const buildGuestCodePattern = (tier: GuestTier) =>
  tier === 'VIP'
    ? new RegExp(`^${VIP_CODE_PREFIX}[A-Z0-9]{${RSVP_CODE_LENGTH}}$`)
    : new RegExp(`^[A-Z0-9]{${RSVP_CODE_LENGTH}}$`);
