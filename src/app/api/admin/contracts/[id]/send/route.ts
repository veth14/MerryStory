import { NextRequest, NextResponse } from 'next/server';
import { AuthGuardError, requireAuthenticatedUser } from '@/lib/auth/guards';
import { getMongoDb } from '@/lib/mongodb';
import { sendContractReviewEmail } from '@/lib/email';
import { randomUUID } from 'crypto';
import { ObjectId } from 'mongodb';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    await requireAuthenticatedUser(request);
    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid contract ID.' }, { status: 400 });
    }

    const db = await getMongoDb();
    const contracts = db.collection('contracts');
    const contract = await contracts.findOne({ _id: new ObjectId(id) });

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found.' }, { status: 404 });
    }

    const recipientEmail = String(contract.recipientEmail || '').trim();
    if (!recipientEmail) {
      return NextResponse.json({ error: 'No recipient email is set for this contract.' }, { status: 400 });
    }

    const reviewToken = contract.reviewToken || randomUUID();
    const accessCode = String(Math.floor(100000 + Math.random() * 900000));
    const origin = new URL(request.url).origin;
    const reviewLink = `${origin}/contracts/review/${reviewToken}`;

    await sendContractReviewEmail({
      to: recipientEmail,
      contractName: String(contract.name || 'Contract Agreement'),
      eventName: String(contract.eventName || 'Unassigned Event'),
      reviewLink,
      accessCode,
      recipientName: String(contract.recipientName || ''),
    });

    await contracts.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          reviewToken,
          accessCode,
          status: 'sent',
          sentAt: new Date(),
          reviewLink,
          lastUpdated: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true, reviewLink });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
