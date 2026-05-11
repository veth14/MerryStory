import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { findRsvpBySlugAndCode, resolveEventIdentity } from '@/app/api/rsvp/rsvpFlow';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const eventSlug = String(body.eventSlug || '');
    const code = String(body.code || '').trim().toUpperCase();

    if (!eventSlug || !code) {
      return NextResponse.json({ error: 'Event slug and RSVP code are required.' }, { status: 400 });
    }

    const db = await getMongoDb();
    const record = await findRsvpBySlugAndCode(db, eventSlug, code);

    if (!record) {
      return NextResponse.json({ error: 'Invalid code for this event. Please try again.' }, { status: 404 });
    }

    if (record.qrScannedAt) {
      return NextResponse.json({ error: 'Your RSVP has been locked after check-in and cannot be edited.' }, { status: 409 });
    }

    if (record.expiresAt && new Date(record.expiresAt).getTime() < Date.now()) {
      return NextResponse.json({ error: 'This RSVP code has expired.' }, { status: 410 });
    }

    const eventIdentity = await resolveEventIdentity(db, record.eventId);

    return NextResponse.json(
      {
        guestId: record._id.toString(),
        guestName: record.guestName,
        email: record.email || '',
        tier: record.tier || 'Standard',
        status: record.status,
        eventName: record.eventName || eventIdentity.eventName,
        eventType: eventIdentity.eventType,
        location: eventIdentity.location,
        coverImageUrl: eventIdentity.coverImageUrl,
        date: eventIdentity.eventDate ? eventIdentity.eventDate.toISOString() : null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('RSVP VALIDATE ERROR:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
