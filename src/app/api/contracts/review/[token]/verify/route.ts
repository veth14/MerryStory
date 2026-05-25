import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { checkRateLimit } from '@/lib/rate-limit';

type RouteContext = {
  params: Promise<{ token: string }>;
};

function getAccessCookieName(token: string) {
  return `contract-review-${token.replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const rateLimit = checkRateLimit(request, { keyPrefix: 'contract-verify', limit: 5, windowMs: 60_000 });

    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.max(Math.ceil((rateLimit.resetAt - Date.now()) / 1000), 1);
      return new NextResponse(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': String(retryAfterSeconds) },
      });
    }

    const { token } = await context.params;
    const body = await request.json();
    const code = String(body.code || '').trim();

    const db = await getMongoDb();
    const contract = await db.collection('contracts').findOne({ reviewToken: token });

    if (!contract) {
      return NextResponse.json({ error: 'Contract review link not found.' }, { status: 404 });
    }

    const normalizedInput = code.toLowerCase();
    const matchesAccessCode = code === String(contract.accessCode || '').trim();
    const matchesRecipientEmail = normalizedInput === String(contract.recipientEmail || '').trim().toLowerCase();

    if (!code || (!matchesAccessCode && !matchesRecipientEmail)) {
      return NextResponse.json({ error: 'Invalid contract access code.' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(getAccessCookieName(token), 'verified', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 6,
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
