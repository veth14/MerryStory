import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/mongodb';
import { requireAuthenticatedUser, AuthGuardError } from '@/lib/auth/guards';
import { getRsvpCollection } from '@/app/api/rsvp/rsvpCollection';
import { syncEventGuestCounts } from '@/app/api/rsvp/rsvpFlow';

export async function POST(request: Request) {
  try {
    await requireAuthenticatedUser(request);

    const body = await request.json();
    const eventId = String(body.eventId || '');
    const rawValue = String(body.rawValue || '');

    if (!ObjectId.isValid(eventId) || !rawValue) {
      return NextResponse.json({ error: 'Valid eventId and QR payload are required.' }, { status: 400 });
    }

    let payload: { code?: string; eventSlug?: string; guestName?: string; eventName?: string } | null = null;

    try {
      payload = JSON.parse(rawValue);
    } catch {
      return NextResponse.json({ error: 'Unrecognized QR format. Please scan a valid check-in ticket.' }, { status: 400 });
    }

    const code = String(payload?.code || '').trim().toUpperCase();
    const eventSlug = String(payload?.eventSlug || '').trim().toLowerCase();

    if (!code || !eventSlug) {
      return NextResponse.json({ error: 'QR payload is missing the required RSVP data.' }, { status: 400 });
    }

    const db = await getMongoDb();
    const rsvpCollection = getRsvpCollection(db);
    const eventObjectId = new ObjectId(eventId);
    const record = await rsvpCollection.findOne({
      eventId: eventObjectId,
      eventSlug,
      code,
    });

    if (!record || !record._id) {
      return NextResponse.json({ error: 'This QR code does not belong to the selected event.' }, { status: 404 });
    }

    if (record.status !== 'confirmed') {
      return NextResponse.json({ error: 'This guest has not confirmed attendance.' }, { status: 409 });
    }

    if (!record.usedAt) {
      return NextResponse.json({ error: 'This RSVP code has not been confirmed yet.' }, { status: 409 });
    }

    if (record.qrScannedAt) {
      return NextResponse.json({ error: 'This QR code has already been used for check-in.' }, { status: 409 });
    }

    const now = new Date();
    await rsvpCollection.updateOne(
      { _id: record._id, eventId: eventObjectId },
      {
        $set: {
          qrScannedAt: now,
          updatedAt: now,
        },
      }
    );

    await syncEventGuestCounts(eventObjectId);

    return NextResponse.json(
      {
        success: true,
        guestName: record.guestName,
        eventName: record.eventName || payload?.eventName || 'Merry Story Event',
        code: record.code,
        scannedAt: now.toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error('RSVP CHECK-IN ERROR:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
