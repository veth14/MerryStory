import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/mongodb';
import { requireRole, AuthGuardError } from '@/lib/auth/guards';
import { getRsvpCollection } from '@/app/api/rsvp/rsvpCollection';
import {
  buildAbsoluteUrl,
  resolveEventIdentity,
  sendRsvpInviteEmail,
  type HydratedRsvpRecord,
} from '@/app/api/rsvp/rsvpFlow';

export async function POST(request: Request) {
  try {
    await requireRole(request, ['admin']);

    const body = await request.json();
    const eventId = String(body.eventId || '');
    const guestId = String(body.guestId || '');

    if (!ObjectId.isValid(eventId) || !ObjectId.isValid(guestId)) {
      return NextResponse.json({ error: 'Valid eventId and guestId are required.' }, { status: 400 });
    }

    const db = await getMongoDb();
    const rsvpCollection = getRsvpCollection(db);
    const eventObjectId = new ObjectId(eventId);
    const guestObjectId = new ObjectId(guestId);
    const guest = (await rsvpCollection.findOne({
      _id: guestObjectId,
      eventId: eventObjectId,
    })) as HydratedRsvpRecord | null;

    if (!guest) {
      return NextResponse.json({ error: 'Guest not found.' }, { status: 404 });
    }

    if (!guest.email?.trim()) {
      return NextResponse.json({ error: 'Guest email is required to send an RSVP link.' }, { status: 400 });
    }

    const eventIdentity = await resolveEventIdentity(db, eventObjectId);
    const rsvpLink = buildAbsoluteUrl(request, `/rsvp/${eventIdentity.eventSlug}`);

    await sendRsvpInviteEmail({
      to: guest.email.trim(),
      guestName: guest.guestName,
      eventName: eventIdentity.eventName,
      rsvpLink,
      code: guest.code,
    });

    await rsvpCollection.updateOne(
      { _id: guestObjectId, eventId: eventObjectId },
      {
        $set: {
          eventSlug: eventIdentity.eventSlug,
          eventName: eventIdentity.eventName,
          invitationSentAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error('ADMIN SEND RSVP LINK ERROR:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send RSVP link.' },
      { status: 500 }
    );
  }
}
