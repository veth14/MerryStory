import nodemailer from 'nodemailer';
import { getMongoDb } from '@/lib/mongodb';

const BUSINESS_EMAIL = 'merrystoryeventservices@gmail.com';
const EMAIL_FROM_NAME = 'Merry Story Productions';

type InquiryType = 'inquiry' | 'consultation';

export type ContactInquiryPayload = {
  type?: InquiryType;
  name?: string;
  email?: string;
  eventType?: string;
  message?: string;
  date?: string;
  guests?: string;
  vision?: string;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatMultiline = (value: string) => escapeHtml(value).replace(/\r?\n/g, '<br />');

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

const buildEmailShell = (content: string) => `
  <div style="background-color: #FDFDFD; padding: 60px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; padding: 50px 40px; border-top: 4px solid #D4AF37; box-shadow: 0 10px 40px rgba(0,0,0,0.03);">
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="font-family: 'Georgia', serif; font-weight: normal; font-size: 26px; color: #111; letter-spacing: 4px; margin: 0;">MERRY STORY</h1>
        <p style="font-size: 10px; letter-spacing: 5px; color: #888; text-transform: uppercase; margin-top: 8px;">Productions</p>
      </div>

      ${content}

      <hr style="border: none; border-top: 1px solid #EAEAEA; margin: 40px 0;" />

      <div style="text-align: center;">
        <p style="font-size: 14px; line-height: 1.5; color: #666; margin-bottom: 5px;">Warmest regards,</p>
        <p style="color: #111; font-family: 'Georgia', serif; font-size: 18px; font-style: italic; margin-top: 0; margin-bottom: 5px;">The Merry Story Team</p>
        <a href="mailto:${BUSINESS_EMAIL}" style="font-size: 11px; color: #999; text-decoration: none; letter-spacing: 1px;">${BUSINESS_EMAIL.toUpperCase()}</a>
      </div>
    </div>

    <div style="text-align: center; margin-top: 40px; font-size: 10px; color: #AAA; letter-spacing: 1px; text-transform: uppercase;">
      &copy; ${new Date().getFullYear()} Merry Story Productions. All rights reserved.
    </div>
  </div>
`;

const buildSummaryRows = (
  rows: Array<{
    label: string;
    value: string;
    multiline?: boolean;
  }>
) =>
  rows
    .filter((row) => row.value.trim())
    .map(
      (row) => `
        <div style="margin-bottom: 12px;">
          <strong style="color: #111; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">${escapeHtml(row.label)}:</strong>
          <div style="color: #555; margin-top: 6px; line-height: 1.7;">
            ${row.multiline ? formatMultiline(row.value) : escapeHtml(row.value)}
          </div>
        </div>
      `
    )
    .join('');

const normalizePayload = (payload: ContactInquiryPayload) => {
  const type: InquiryType = payload.type === 'inquiry' ? 'inquiry' : 'consultation';
  const name = String(payload.name || '').trim();
  const email = String(payload.email || '').trim();
  const eventType = String(payload.eventType || '').trim();
  const message = String(payload.message || '').trim();
  const date = String(payload.date || '').trim();
  const guests = String(payload.guests || '').trim();
  const vision = String(payload.vision || '').trim();

  return { type, name, email, eventType, message, date, guests, vision };
};

const buildAdminEmailHtml = (payload: ReturnType<typeof normalizePayload>) => {
  const summaryRows =
    payload.type === 'inquiry'
      ? buildSummaryRows([
          { label: 'Inquiry Type', value: 'General Inquiry' },
          { label: 'Client Name', value: payload.name },
          { label: 'Client Email', value: payload.email },
          { label: 'Event Type', value: payload.eventType || 'Not specified' },
          { label: 'Message', value: payload.message || 'Not specified', multiline: true },
        ])
      : buildSummaryRows([
          { label: 'Inquiry Type', value: 'Detailed Consultation Request' },
          { label: 'Client Name', value: payload.name },
          { label: 'Client Email', value: payload.email },
          { label: 'Preferred Date', value: payload.date || 'Not specified' },
          { label: 'Guest Count', value: payload.guests || 'Not specified' },
          { label: 'Vision', value: payload.vision || 'Not specified', multiline: true },
        ]);

  return buildEmailShell(`
    <p style="font-size: 15px; line-height: 1.8; margin-bottom: 20px; color: #444; font-family: 'Georgia', serif; font-style: italic; text-align: center;">
      A new contact inquiry has arrived.
    </p>

    <p style="font-size: 15px; line-height: 1.8; margin-bottom: 20px; color: #444;">
      Dear Admin,
    </p>

    <p style="font-size: 15px; line-height: 1.8; margin-bottom: 35px; color: #444;">
      A new ${payload.type === 'inquiry' ? 'landing page inquiry' : 'consultation request'} was submitted through the website. You can reply directly to this sender at <strong>${escapeHtml(payload.email)}</strong>.
    </p>

    <div style="background-color: #FAFAFA; padding: 25px 30px; border-left: 3px solid #D4AF37; margin-bottom: 35px;">
      ${summaryRows}
    </div>
  `);
};

const buildClientEmailHtml = (payload: ReturnType<typeof normalizePayload>) => {
  const summaryRows =
    payload.type === 'inquiry'
      ? buildSummaryRows([
          { label: 'Event Type', value: payload.eventType || 'Not specified' },
          { label: 'Message', value: payload.message || 'Not specified', multiline: true },
        ])
      : buildSummaryRows([
          { label: 'Preferred Date', value: payload.date || 'Not specified' },
          { label: 'Guest Count', value: payload.guests || 'Not specified' },
          { label: 'Vision', value: payload.vision || 'Not specified', multiline: true },
        ]);

  return buildEmailShell(`
    <p style="font-size: 15px; line-height: 1.8; margin-bottom: 20px; color: #444; font-family: 'Georgia', serif; font-style: italic; text-align: center;">
      Your inquiry has been safely received.
    </p>

    <p style="font-size: 15px; line-height: 1.8; margin-bottom: 20px; color: #444;">
      Dear ${escapeHtml(payload.name)},
    </p>

    <p style="font-size: 15px; line-height: 1.8; margin-bottom: 20px; color: #444;">
      Thank you for reaching out to Merry Story Productions. We received your ${payload.type === 'inquiry' ? 'inquiry' : 'consultation request'} and shared it with our team at <strong>${BUSINESS_EMAIL}</strong>.
    </p>

    <p style="font-size: 15px; line-height: 1.8; margin-bottom: 35px; color: #444;">
      For your records, here is a copy of the information you submitted:
    </p>

    <div style="background-color: #FAFAFA; padding: 25px 30px; border-left: 3px solid #D4AF37; margin-bottom: 35px;">
      ${summaryRows}
    </div>

    <p style="font-size: 15px; line-height: 1.8; margin-bottom: 0; color: #444;">
      A member of our team will follow up within <strong>24 business hours</strong>.
    </p>
  `);
};

const saveInquiry = async (payload: ReturnType<typeof normalizePayload>) => {
  const db = await getMongoDb();
  const inquiriesCollection = db.collection('inquiries');

  await inquiriesCollection.insertOne({
    client: payload.name,
    email: payload.email,
    type: payload.type,
    eventType: payload.type === 'inquiry' ? payload.eventType || 'Not specified' : 'Consultation',
    needs:
      payload.type === 'inquiry'
        ? payload.message || 'Not specified'
        : `Preferred Date: ${payload.date || 'Not specified'} | Guests: ${payload.guests || 'Not specified'} | Vision: ${payload.vision || 'Not specified'}`,
    status: 'New',
    submitted: new Date().toISOString(),
    isArchived: false,
  });
};

export const submitContactInquiry = async (input: ContactInquiryPayload) => {
  const payload = normalizePayload(input);

  if (!payload.name || !payload.email) {
    throw new Error('Name and email are required.');
  }

  const transporter = getEmailTransporter();
  const fromAddress = process.env.EMAIL_USER!;

  await Promise.all([
    transporter.sendMail({
      from: `"${EMAIL_FROM_NAME}" <${fromAddress}>`,
      to: BUSINESS_EMAIL,
      replyTo: payload.email,
      subject:
        payload.type === 'inquiry'
          ? `New Inquiry from ${payload.name}`
          : `New Consultation Request from ${payload.name}`,
      html: buildAdminEmailHtml(payload),
    }),
    transporter.sendMail({
      from: `"${EMAIL_FROM_NAME}" <${fromAddress}>`,
      to: payload.email,
      replyTo: BUSINESS_EMAIL,
      subject:
        payload.type === 'inquiry'
          ? 'Your Inquiry - Merry Story'
          : 'Consultation Request Received - Merry Story',
      html: buildClientEmailHtml(payload),
    }),
  ]);

  await saveInquiry(payload);
};
