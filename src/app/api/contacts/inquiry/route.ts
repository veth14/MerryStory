import { NextResponse } from 'next/server';
import { submitContactInquiry } from '@/app/api/contacts/contactInquiry';

export async function POST(request: Request) {
  try {
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
