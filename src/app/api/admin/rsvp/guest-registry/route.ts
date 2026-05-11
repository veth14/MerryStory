import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/mongodb';
import { requireRole, AuthGuardError } from '@/lib/auth/guards';
import { getRsvpCollection, normalizeGuestTier, type RsvpRecord } from '@/app/api/rsvp/rsvpCollection';
import { resolveEventIdentity, syncEventGuestCounts } from '@/app/api/rsvp/rsvpFlow';
import {
  mapRsvpToGuest,
  resolveGuestCode,
  toRsvpStatus,
} from '@/app/api/admin/rsvp/registry-shared';

export async function GET(request: Request) {
  try {
    await requireRole(request, ['admin']);

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

    return NextResponse.json(guests.map((record) => mapRsvpToGuest(record as RsvpRecord & { _id: ObjectId })), {
      status: 200,
    });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('ADMIN GUEST REGISTRY GET ERROR:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireRole(request, ['admin']);

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
    const eventObjectId = new ObjectId(eventId);
    const eventIdentity = await resolveEventIdentity(db, eventObjectId);
    const tier = normalizeGuestTier(body.tier);
    const code = await resolveGuestCode({
      eventId: eventObjectId,
      requestedCode: body.rsvpCode,
      tier,
    });

    const newGuest: RsvpRecord = {
      eventId: eventObjectId,
      eventSlug: eventIdentity.eventSlug,
      eventName: eventIdentity.eventName,
      guestName,
      code,
      status,
      email: String(body.email || '').trim(),
      notes: String(body.notes || '').trim(),
      tier: tier === 'VIP' ? 'VIP' : 'Standard',
      usedAt: null,
      expiresAt: eventIdentity.eventDate,
      qrScannedAt: null,
      invitationSentAt: null,
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
    console.error('ADMIN GUEST REGISTRY POST ERROR:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireRole(request, ['admin']);

    const body = await request.json();
    const eventId = body.eventId;
    const guestId = body.guestId;

    if (!eventId || !ObjectId.isValid(eventId) || !guestId || !ObjectId.isValid(guestId)) {
      return NextResponse.json({ error: 'Valid eventId and guestId are required.' }, { status: 400 });
    }

    const db = await getMongoDb();
    const rsvpCollection = getRsvpCollection(db);
    const eventObjectId = new ObjectId(eventId);
    const eventIdentity = await resolveEventIdentity(db, eventObjectId);
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
    if (body.notes !== undefined) updateData.notes = String(body.notes || '').trim();
    if (body.tier !== undefined) updateData.tier = nextTier === 'VIP' ? 'VIP' : 'Standard';
    if (body.usedAt !== undefined) updateData.usedAt = body.usedAt ? new Date(body.usedAt) : null;
    if (body.qrScannedAt !== undefined) updateData.qrScannedAt = body.qrScannedAt ? new Date(body.qrScannedAt) : null;
    if (body.expiresAt !== undefined) updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    updateData.eventSlug = eventIdentity.eventSlug;
    updateData.eventName = eventIdentity.eventName;

    await rsvpCollection.updateOne({ _id: guestObjectId, eventId: eventObjectId }, { $set: updateData });
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
    console.error('ADMIN GUEST REGISTRY PATCH ERROR:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireRole(request, ['admin']);

    const url = new URL(request.url);
    const eventId = url.searchParams.get('eventId');
    const guestId = url.searchParams.get('guestId');

    if (!eventId || !ObjectId.isValid(eventId) || !guestId || !ObjectId.isValid(guestId)) {
      return NextResponse.json({ error: 'Valid eventId and guestId are required.' }, { status: 400 });
    }

    const db = await getMongoDb();
    const rsvpCollection = getRsvpCollection(db);
    const eventObjectId = new ObjectId(eventId);
    const guestObjectId = new ObjectId(guestId);

    const deleteResult = await rsvpCollection.deleteOne({
      _id: guestObjectId,
      eventId: eventObjectId,
    });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ error: 'Guest not found.' }, { status: 404 });
    }

    await syncEventGuestCounts(eventObjectId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('ADMIN GUEST REGISTRY DELETE ERROR:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
