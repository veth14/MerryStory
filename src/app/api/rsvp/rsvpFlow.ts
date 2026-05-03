import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import { ObjectId, type Db } from 'mongodb';
import { getMongoDb } from '@/lib/mongodb';
import {
  getRsvpCollection,
  type RsvpRecord,
} from './rsvpCollection';

export type HydratedRsvpRecord = RsvpRecord & { _id: ObjectId };

export type EventIdentity = {
  eventId: ObjectId;
  eventName: string;
  eventSlug: string;
  eventType: string;
  eventDate: Date | null;
  location: string;
  coverImageUrl: string;
};

const RSVP_EMAIL_FROM = '"Merry Story Productions" <merrystoryeventservices@gmail.com>';

const getEmailTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error('Missing EMAIL_USER or EMAIL_PASS environment variables.');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
};

export const buildEventSlug = (value?: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'event';

export const buildAbsoluteUrl = (request: Request, pathname: string) => {
  const url = new URL(request.url);
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || url.host;
  const protocol = request.headers.get('x-forwarded-proto') || url.protocol.replace(':', '');
  return `${protocol}://${host}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
};

export const resolveEventIdentity = async (db: Db, eventId: ObjectId): Promise<EventIdentity> => {
  const event = await db.collection('events').findOne(
    { _id: eventId },
    { projection: { title: 1, date: 1, location: 1 } }
  );

  const eventName = String(event?.title || 'Merry Story Event').trim();
  const eventDate =
    event?.date && !Number.isNaN(new Date(event.date).getTime()) ? new Date(event.date) : null;

  return {
    eventId,
    eventName,
    eventSlug: buildEventSlug(eventName),
    eventType: String(event?.type || 'Private Event').trim(),
    eventDate,
    location: String(event?.location || 'Merry Story Productions Venue').trim(),
    coverImageUrl: String(event?.coverImageUrl || '').trim(),
  };
};

export const findRsvpBySlugAndCode = async (db: Db, eventSlug: string, code: string) => {
  const normalizedSlug = buildEventSlug(eventSlug);
  const normalizedCode = String(code || '').trim().toUpperCase();

  if (!normalizedSlug || !normalizedCode) {
    return null;
  }

  return getRsvpCollection(db).findOne({
    eventSlug: normalizedSlug,
    code: normalizedCode,
  }) as Promise<HydratedRsvpRecord | null>;
};

export const buildQrPayload = (record: {
  code: string;
  guestName: string;
  eventSlug: string;
  eventName: string;
}) =>
  JSON.stringify({
    code: record.code,
    guestName: record.guestName,
    eventSlug: record.eventSlug,
    eventName: record.eventName,
  });

const buildInviteEmailHtml = ({
  guestName,
  eventName,
  rsvpLink,
  code,
}: {
  guestName: string;
  eventName: string;
  rsvpLink: string;
  code: string;
}) => `
  <div style="background-color: #FDFDFD; padding: 60px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; padding: 50px 40px; border-top: 4px solid #D4AF37; box-shadow: 0 10px 40px rgba(0,0,0,0.03);">
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="font-family: 'Georgia', serif; font-weight: normal; font-size: 26px; color: #111; letter-spacing: 4px; margin: 0;">MERRY STORY</h1>
        <p style="font-size: 10px; letter-spacing: 5px; color: #888; text-transform: uppercase; margin-top: 8px;">Productions</p>
      </div>

      <p style="font-size: 15px; line-height: 1.8; margin-bottom: 20px; color: #444; font-family: 'Georgia', serif; font-style: italic; text-align: center;">
        You are invited to ${eventName}.
      </p>

      <p style="font-size: 15px; line-height: 1.8; margin-bottom: 20px; color: #444;">
        Dear ${guestName},
      </p>

      <p style="font-size: 15px; line-height: 1.8; margin-bottom: 20px; color: #444;">
        Your RSVP invitation is now ready. Please use the private access code below and complete your response through the secure RSVP page.
      </p>

      <div style="background-color: #FAFAFA; padding: 25px 30px; border-left: 3px solid #D4AF37; margin-bottom: 35px;">
        <div>
          <strong style="color: #111; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">REFERENCE CODE:</strong>
          <span style="color: #555; margin-left: 5px; font-size: 18px; font-weight: 700; letter-spacing: 0.12em;">${code}</span>
        </div>
      </div>

      <div style="text-align: center; margin: 34px 0 38px;">
        <p style="font-size: 13px; line-height: 1.8; margin-bottom: 20px; color: #666; letter-spacing: 1px; text-transform: uppercase;">
          Secure RSVP Link
        </p>
        <a href="${rsvpLink}" style="display: inline-block; padding: 14px 28px; background-color: #D4AF37; color: white; text-decoration: none; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">
          Continue To RSVP
        </a>
      </div>

      <p style="margin:0 0 8px;font-size:13px;color:#71717a;line-height:1.7;">
        You will be asked to enter the access code before confirming your attendance.
      </p>
      <p style="margin:0 0 32px;font-size:12px;color:#a1a1aa;word-break:break-all;">
        <a href="${rsvpLink}" style="color:#D4AF37;">${rsvpLink}</a>
      </p>

      <hr style="border: none; border-top: 1px solid #EAEAEA; margin: 40px 0;" />

      <div style="text-align: center;">
        <p style="font-size: 14px; line-height: 1.5; color: #666; margin-bottom: 5px;">Warmest regards,</p>
        <p style="color: #111; font-family: 'Georgia', serif; font-size: 18px; font-style: italic; margin-top: 0; margin-bottom: 5px;">The Merry Story Team</p>
        <a href="mailto:merrystoryeventservices@gmail.com" style="font-size: 11px; color: #999; text-decoration: none; letter-spacing: 1px;">HELLO@MERRYSTORY.COM</a>
      </div>
    </div>

    <div style="text-align: center; margin-top: 40px; font-size: 10px; color: #AAA; letter-spacing: 1px; text-transform: uppercase;">
      &copy; ${new Date().getFullYear()} Merry Story Productions. All rights reserved.
    </div>
  </div>
`;

const buildTicketEmailHtml = ({
  guestName,
  eventName,
  code,
  notes,
  googleCalendarUrl,
}: {
  guestName: string;
  eventName: string;
  code: string;
  notes: string;
  googleCalendarUrl: string;
}) => `
  <div style="background-color: #FDFDFD; padding: 60px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; padding: 50px 40px; border-top: 4px solid #D4AF37; box-shadow: 0 10px 40px rgba(0,0,0,0.03);">
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="font-family: 'Georgia', serif; font-weight: normal; font-size: 26px; color: #111; letter-spacing: 4px; margin: 0;">MERRY STORY</h1>
        <p style="font-size: 10px; letter-spacing: 5px; color: #888; text-transform: uppercase; margin-top: 8px;">Productions</p>
      </div>

      <p style="font-size: 15px; line-height: 1.8; margin-bottom: 20px; color: #444; font-family: 'Georgia', serif; font-style: italic; text-align: center;">
        You are going to ${eventName}!
      </p>

      <p style="font-size: 15px; line-height: 1.8; margin-bottom: 20px; color: #444;">
        Dear ${guestName},
      </p>

      <p style="font-size: 15px; line-height: 1.8; margin-bottom: 20px; color: #444;">
        Thank you for RSVPing. We have safely recorded your confirmation and prepared your event entry QR code below.
      </p>

      <div style="background-color: #FAFAFA; padding: 25px 30px; border-left: 3px solid #D4AF37; margin-bottom: 35px;">
        <div style="margin-bottom: 8px;">
          <strong style="color: #111; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">REFERENCE CODE:</strong>
          <span style="color: #555; margin-left: 5px;">${code}</span>
        </div>
        ${
          notes
            ? `<div style="margin-bottom: 8px;">
          <strong style="color: #111; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">NOTES:</strong>
          <span style="color: #555; margin-left: 5px;">${notes}</span>
        </div>`
            : ''
        }
      </div>

      <div style="text-align: center; margin-top: 40px; margin-bottom: 40px;">
        <p style="font-size: 13px; line-height: 1.8; margin-bottom: 20px; color: #666; letter-spacing: 1px; text-transform: uppercase;">
          Your Entry QR Code Ticket
        </p>
        <img src="cid:qrcode_id" alt="Your Entry QR Code Ticket" style="width: 200px; height: 200px; border-radius: 8px; border: 1px solid #EAEAEA; padding: 10px;" />
        <p style="font-size: 11px; color: #999; margin-top: 15px;">Please present this QR code upon entering the event.</p>
      </div>

      <div style="text-align: center; margin-bottom: 40px;">
        <a href="${googleCalendarUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; background-color: #D4AF37; color: white; text-decoration: none; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">
          Add to Google Calendar
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #EAEAEA; margin: 40px 0;" />

      <div style="text-align: center;">
        <p style="font-size: 14px; line-height: 1.5; color: #666; margin-bottom: 5px;">Warmest regards,</p>
        <p style="color: #111; font-family: 'Georgia', serif; font-size: 18px; font-style: italic; margin-top: 0; margin-bottom: 5px;">The Merry Story Team</p>
        <a href="mailto:merrystoryeventservices@gmail.com" style="font-size: 11px; color: #999; text-decoration: none; letter-spacing: 1px;">HELLO@MERRYSTORY.COM</a>
      </div>
    </div>

    <div style="text-align: center; margin-top: 40px; font-size: 10px; color: #AAA; letter-spacing: 1px; text-transform: uppercase;">
      &copy; ${new Date().getFullYear()} Merry Story Productions. All rights reserved.
    </div>
  </div>
`;

export const sendRsvpInviteEmail = async ({
  to,
  guestName,
  eventName,
  rsvpLink,
  code,
}: {
  to: string;
  guestName: string;
  eventName: string;
  rsvpLink: string;
  code: string;
}) => {
  const transporter = getEmailTransporter();

  await transporter.sendMail({
    from: RSVP_EMAIL_FROM,
    to,
    subject: `Your RSVP Invitation: ${eventName}`,
    html: buildInviteEmailHtml({ guestName, eventName, rsvpLink, code }),
  });
};

export const sendRsvpQrEmail = async ({
  to,
  guestName,
  eventName,
  code,
  notes,
  eventDate,
  location,
  qrPayload,
}: {
  to: string;
  guestName: string;
  eventName: string;
  code: string;
  notes: string;
  eventDate: Date | null;
  location: string;
  qrPayload: string;
}) => {
  const transporter = getEmailTransporter();
  const qrCodeDataUrl = await QRCode.toDataURL(qrPayload);
  const safeStart = eventDate || new Date();
  const safeEnd = new Date(safeStart.getTime() + 4 * 60 * 60 * 1000);
  const eventDates = `${safeStart.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${safeEnd
    .toISOString()
    .replace(/[-:]/g, '')
    .split('.')[0]}Z`;
  const eventTitle = encodeURIComponent(`RSVP: ${eventName}`);
  const eventDetails = encodeURIComponent(`You are successfully registered for ${eventName}!\nGuest Name: ${guestName}\nReference Code: ${code}`);
  const eventLocation = encodeURIComponent(location);
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${eventDates}&details=${eventDetails}&location=${eventLocation}`;

  await transporter.sendMail({
    from: RSVP_EMAIL_FROM,
    to,
    subject: `Your Ticket: ${eventName} RSVP Confirmed!`,
    html: buildTicketEmailHtml({ guestName, eventName, code, notes, googleCalendarUrl }),
    attachments: [
      {
        filename: 'ticket-qr.png',
        path: qrCodeDataUrl,
        cid: 'qrcode_id',
      },
    ],
  });
};

export const syncEventGuestCounts = async (eventId: ObjectId) => {
  const db = await getMongoDb();
  const rsvpCollection = getRsvpCollection(db);
  const [invited, confirmed, checkedIn] = await Promise.all([
    rsvpCollection.countDocuments({ eventId }),
    rsvpCollection.countDocuments({ eventId, status: 'confirmed' }),
    rsvpCollection.countDocuments({ eventId, qrScannedAt: { $ne: null } }),
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
