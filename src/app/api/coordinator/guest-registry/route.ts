import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/mongodb';
import { requireAuthenticatedUser, AuthGuardError } from '@/lib/auth/guards';
import { getRsvpCollection, type RsvpRecord, type RsvpStatus } from '@/app/api/rsvp/rsvpCollection';

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

const buildRsvpCode = () => {
  const year = new Date().getFullYear();
  const token = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SG-${year}-${token}`;
};

const buildIncUpdate = ({
  invited = 0,
  rsvp = 0,
  checkedIn = 0,
}: {
  invited?: number;
  rsvp?: number;
  checkedIn?: number;
}) => {
  const update: Record<string, number> = {};
  if (invited !== 0) update['guests.invited'] = invited;
  if (rsvp !== 0) update['guests.rsvp'] = rsvp;
  if (checkedIn !== 0) update['guests.checkedIn'] = checkedIn;
  return update;
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
    const guests = await rsvpCollection
      .find({ eventId: new ObjectId(eventId) })
      .sort({ createdAt: -1 })
      .toArray();

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

    const newGuest: RsvpRecord = {
      eventId: new ObjectId(eventId),
      guestName,
      code: String(body.rsvpCode || buildRsvpCode()).trim(),
      status,
      email: String(body.email || '').trim(),
      tier: String(body.tier || '').trim(),
      usedAt: null,
      expiresAt,
      qrScannedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    const result = await rsvpCollection.insertOne(newGuest);
    const incUpdate = buildIncUpdate({
      invited: 1,
      rsvp: status === 'confirmed' ? 1 : 0,
    });

    if (Object.keys(incUpdate).length > 0) {
      await db.collection('events').updateOne({ _id: new ObjectId(eventId) }, { $inc: incUpdate });
    }

    return NextResponse.json(mapRsvpToGuest({ ...newGuest, _id: result.insertedId }), { status: 201 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
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
    const existingGuest = await rsvpCollection.findOne({
      _id: new ObjectId(guestId),
      eventId: new ObjectId(eventId),
    });

    if (!existingGuest || !existingGuest._id) {
      return NextResponse.json({ error: 'Guest not found.' }, { status: 404 });
    }

    const updateData: Partial<RsvpRecord> & { updatedAt: Date } = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updateData.guestName = String(body.name || '').trim();
    if (body.status !== undefined) updateData.status = toRsvpStatus(body.status);
    if (body.rsvpCode !== undefined) updateData.code = String(body.rsvpCode || buildRsvpCode()).trim();
    if (body.email !== undefined) updateData.email = String(body.email || '').trim();
    if (body.tier !== undefined) updateData.tier = String(body.tier || '').trim();
    if (body.usedAt !== undefined) updateData.usedAt = body.usedAt ? new Date(body.usedAt) : null;
    if (body.qrScannedAt !== undefined) updateData.qrScannedAt = body.qrScannedAt ? new Date(body.qrScannedAt) : null;
    if (body.expiresAt !== undefined) updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

    await rsvpCollection.updateOne(
      { _id: new ObjectId(guestId), eventId: new ObjectId(eventId) },
      { $set: updateData }
    );

    const previousStatus = existingGuest.status;
    const nextStatus = updateData.status ?? existingGuest.status;
    const wasCheckedIn = Boolean(existingGuest.qrScannedAt || existingGuest.usedAt);
    const nextCheckedIn = Boolean(
      updateData.qrScannedAt !== undefined
        ? updateData.qrScannedAt
        : updateData.usedAt !== undefined
          ? updateData.usedAt
          : existingGuest.qrScannedAt || existingGuest.usedAt
    );

    const incUpdate = buildIncUpdate({
      rsvp:
        previousStatus === nextStatus
          ? 0
          : previousStatus === 'confirmed'
            ? -1
            : nextStatus === 'confirmed'
              ? 1
              : 0,
      checkedIn: wasCheckedIn === nextCheckedIn ? 0 : nextCheckedIn ? 1 : -1,
    });

    if (Object.keys(incUpdate).length > 0) {
      await db.collection('events').updateOne({ _id: new ObjectId(eventId) }, { $inc: incUpdate });
    }

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
    console.error('COORDINATOR GUEST REGISTRY PATCH ERROR:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
