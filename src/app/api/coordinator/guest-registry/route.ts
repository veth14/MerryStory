import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/mongodb';
import { requireAuthenticatedUser, AuthGuardError } from '@/lib/auth/guards';
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

type GuestStatus = 'Confirmed' | 'Pending' | 'Declined';

const normalizeStatus = (value?: string): GuestStatus => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'confirmed') return 'Confirmed';
  if (normalized === 'declined') return 'Declined';
  return 'Pending';
};

const toRsvpStatus = (value?: string): RsvpStatus => {
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

const formatGuestCode = (tier: GuestTier, token: string) => {
  const normalizedToken = token.trim().toUpperCase();
  return tier === 'VIP' ? `VIP-${normalizedToken}` : normalizedToken;
};

const normalizeRequestedCode = (value: unknown, tier: GuestTier) => {
  const normalized = String(value || '').trim().toUpperCase();
  if (!normalized) return null;
  return tier === 'VIP' && !normalized.startsWith('VIP-') ? `VIP-${normalized}` : normalized;
};

const validateGuestCode = (code: string, tier: GuestTier) => {
  const pattern = buildGuestCodePattern(tier);
  return pattern.test(code);
};

const syncEventGuestCounts = async (eventId: ObjectId) => {
  const db = await getMongoDb();
  const rsvpCollection = getRsvpCollection(db);
  const [invited, confirmed, checkedIn] = await Promise.all([
    rsvpCollection.countDocuments({ eventId }),
    rsvpCollection.countDocuments({ eventId, status: 'confirmed' }),
    rsvpCollection.countDocuments({
      eventId,
      $or: [{ qrScannedAt: { $ne: null } }, { usedAt: { $ne: null } }],
    }),
  ]);

  await db.collection('events').updateOne(
    { _id: eventId },
    {
      $set: {
        'guests.invited': invited,
        'guests.rsvp': confirmed,
        'guests.checkedIn': checkedIn,
      },
    }
  );
};

const resolveGuestCode = async ({
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

const mapRsvpToGuest = (record: RsvpRecord & { _id: ObjectId }) => ({
  _id: record._id.toString(),
  name: record.guestName,
  email: record.email || '',
  tier: record.tier || '',
  status: normalizeStatus(record.status),
  checkedIn: Boolean(record.qrScannedAt || record.usedAt),
  rsvpCode: record.code,
  usedAt: record.usedAt || null,
  qrScannedAt: record.qrScannedAt || null,
  expiresAt: record.expiresAt || null,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});

const resolveExpiryDate = async (eventId: string) => {
  const db = await getMongoDb();
  const event = await db.collection('events').findOne(
    { _id: new ObjectId(eventId) },
    { projection: { date: 1 } }
  );

  if (event?.date) {
    const eventDate = new Date(event.date);
    if (!Number.isNaN(eventDate.getTime())) {
      return eventDate;
    }
  }

  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 30);
  return fallback;
};

export async function GET(request: Request) {
  try {
    await requireAuthenticatedUser(request);

    const url = new URL(request.url);
    const eventId = url.searchParams.get('eventId');

    if (!eventId || !ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: 'Valid eventId is required.' }, { status: 400 });
    }

    const db = await getMongoDb();
    const rsvpCollection = getRsvpCollection(db);
    const eventObjectId = new ObjectId(eventId);
    const guests = await rsvpCollection
      .find({ eventId: eventObjectId })
      .sort({ createdAt: -1 })
      .toArray();

    await syncEventGuestCounts(eventObjectId);

    return NextResponse.json(guests.map((record) => mapRsvpToGuest(record as RsvpRecord & { _id: ObjectId })), { status: 200 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('COORDINATOR GUEST REGISTRY GET ERROR:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAuthenticatedUser(request);

    const body = await request.json();
    const eventId = body.eventId;

    if (!eventId || !ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: 'Valid eventId is required.' }, { status: 400 });
    }

    const guestName = String(body.name || '').trim();
    if (!guestName) {
      return NextResponse.json({ error: 'Guest name is required.' }, { status: 400 });
    }

    const db = await getMongoDb();
    const rsvpCollection = getRsvpCollection(db);
    const status = toRsvpStatus(body.status);
    const now = new Date();
    const expiresAt = await resolveExpiryDate(eventId);
    const eventObjectId = new ObjectId(eventId);
    const tier = normalizeGuestTier(body.tier);
    const code = await resolveGuestCode({
      eventId: eventObjectId,
      requestedCode: body.rsvpCode,
      tier,
    });

    const newGuest: RsvpRecord = {
      eventId: eventObjectId,
      guestName,
      code,
      status,
      email: String(body.email || '').trim(),
      tier: tier === 'VIP' ? 'VIP' : 'Standard',
      usedAt: null,
      expiresAt,
      qrScannedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    const result = await rsvpCollection.insertOne(newGuest);
    await syncEventGuestCounts(eventObjectId);

    return NextResponse.json(mapRsvpToGuest({ ...newGuest, _id: result.insertedId }), { status: 201 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof Error && error.message) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('COORDINATOR GUEST REGISTRY POST ERROR:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAuthenticatedUser(request);

    const body = await request.json();
    const eventId = body.eventId;
    const guestId = body.guestId;

    if (!eventId || !ObjectId.isValid(eventId) || !guestId || !ObjectId.isValid(guestId)) {
      return NextResponse.json({ error: 'Valid eventId and guestId are required.' }, { status: 400 });
    }

    const db = await getMongoDb();
    const rsvpCollection = getRsvpCollection(db);
    const eventObjectId = new ObjectId(eventId);
    const guestObjectId = new ObjectId(guestId);
    const existingGuest = await rsvpCollection.findOne({
      _id: guestObjectId,
      eventId: eventObjectId,
    });

    if (!existingGuest || !existingGuest._id) {
      return NextResponse.json({ error: 'Guest not found.' }, { status: 404 });
    }

    const updateData: Partial<RsvpRecord> & { updatedAt: Date } = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updateData.guestName = String(body.name || '').trim();
    if (body.status !== undefined) updateData.status = toRsvpStatus(body.status);
    const nextTier = body.tier !== undefined ? normalizeGuestTier(body.tier) : normalizeGuestTier(existingGuest.tier);
    const shouldRegenerateCode = body.rsvpCode !== undefined || body.tier !== undefined;
    if (shouldRegenerateCode) {
      updateData.code = await resolveGuestCode({
        eventId: eventObjectId,
        requestedCode: body.rsvpCode,
        tier: nextTier,
        excludeGuestId: guestObjectId,
      });
    }
    if (body.email !== undefined) updateData.email = String(body.email || '').trim();
    if (body.tier !== undefined) updateData.tier = nextTier === 'VIP' ? 'VIP' : 'Standard';
    if (body.usedAt !== undefined) updateData.usedAt = body.usedAt ? new Date(body.usedAt) : null;
    if (body.qrScannedAt !== undefined) updateData.qrScannedAt = body.qrScannedAt ? new Date(body.qrScannedAt) : null;
    if (body.expiresAt !== undefined) updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

    await rsvpCollection.updateOne(
      { _id: guestObjectId, eventId: eventObjectId },
      { $set: updateData }
    );
    await syncEventGuestCounts(eventObjectId);

    return NextResponse.json(
      mapRsvpToGuest({
        ...(existingGuest as RsvpRecord & { _id: ObjectId }),
        ...updateData,
      }),
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof Error && error.message) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('COORDINATOR GUEST REGISTRY PATCH ERROR:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
