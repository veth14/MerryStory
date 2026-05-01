import type { Collection, Db, ObjectId } from 'mongodb';

export type RsvpStatus = 'pending' | 'confirmed' | 'declined';

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

export const getRsvpCollection = (db: Db): Collection<RsvpRecord> =>
  db.collection<RsvpRecord>(RSVP_COLLECTION_NAME);
