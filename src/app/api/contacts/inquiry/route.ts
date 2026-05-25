import { NextResponse } from 'next/server';
import { submitContactInquiry } from '@/app/api/contacts/contactInquiry';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit(request, { keyPrefix: 'contact-inquiry', limit: 5, windowMs: 60_000 });

    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.max(Math.ceil((rateLimit.resetAt - Date.now()) / 1000), 1);
      return new NextResponse(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': String(retryAfterSeconds) },
      });
    }

    const body = await request.json();
    await submitContactInquiry(body);

    return NextResponse.json({ message: 'Inquiry submitted successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Failed to submit contact inquiry:', error);

    const message =
      error instanceof Error && error.message === 'Name and email are required.'
        ? error.message
        : 'Failed to send inquiry. Please try again later.';
    const status = message === 'Name and email are required.' ? 400 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
