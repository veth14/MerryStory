import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { getRsvpCollection } from '@/app/api/rsvp/rsvpCollection';
import {
  buildQrPayload,
  findRsvpBySlugAndCode,
  resolveEventIdentity,
  sendRsvpQrEmail,
  syncEventGuestCounts,
  type HydratedRsvpRecord,
} from '@/app/api/rsvp/rsvpFlow';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const eventSlug = String(body.eventSlug || '');
    const code = String(body.code || '').trim().toUpperCase();
    const attending = Boolean(body.attending);
    const notes = String(body.notes || '').trim();

    if (!eventSlug || !code) {
      return NextResponse.json({ error: 'Event slug and RSVP code are required.' }, { status: 400 });
    }

    const db = await getMongoDb();
    const record = await findRsvpBySlugAndCode(db, eventSlug, code);

    if (!record) {
      return NextResponse.json({ error: 'Invalid code for this event. Please try again.' }, { status: 404 });
    }

    if (record.usedAt) {
      return NextResponse.json({ error: 'This RSVP code has already been used.' }, { status: 409 });
    }

    const rsvpCollection = getRsvpCollection(db);
    const now = new Date();
    const nextStatus = attending ? 'confirmed' : 'declined';

    const updateData: Partial<HydratedRsvpRecord> = {
      status: nextStatus,
      notes,
      usedAt: now,
      updatedAt: now,
    };

    await rsvpCollection.updateOne(
      { _id: record._id, eventId: record.eventId },
      { $set: updateData }
    );

    await syncEventGuestCounts(record.eventId);

    if (attending && record.email?.trim()) {
      const eventIdentity = await resolveEventIdentity(db, record.eventId);
      const qrPayload = buildQrPayload({
        code: record.code,
        guestName: record.guestName,
        eventSlug: record.eventSlug || eventIdentity.eventSlug,
        eventName: record.eventName || eventIdentity.eventName,
      });

      await sendRsvpQrEmail({
        to: record.email.trim(),
        guestName: record.guestName,
        eventName: record.eventName || eventIdentity.eventName,
        code: record.code,
        notes,
        eventDate: eventIdentity.eventDate,
        location: eventIdentity.location,
        qrPayload,
      });
    }

    return NextResponse.json(
      {
        success: true,
        status: nextStatus,
        emailed: Boolean(attending && record.email?.trim()),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('RSVP RESPOND ERROR:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
