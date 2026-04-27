import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser, AuthGuardError } from '@/lib/auth/guards';
import { getMongoDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    await requireAuthenticatedUser(request);

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId')?.trim();
    const status = searchParams.get('status')?.trim();

    const filter: Record<string, unknown> = {};

    if (eventId && ObjectId.isValid(eventId)) {
      filter.eventId = new ObjectId(eventId);
    }

    if (status) {
      filter.status = status;
    }

    const db = await getMongoDb();
    const contracts = await db
      .collection('contracts')
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json(
      contracts.map((contract) => ({
        ...contract,
        _id: contract._id?.toString?.() || contract._id,
        eventId: contract.eventId?.toString?.() || contract.eventId || '',
      }))
    );
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(request);
    const body = await request.json();

    const db = await getMongoDb();
    const result = await db.collection('contracts').insertOne({
      ...body,
      eventId:
        typeof body.eventId === 'string' && ObjectId.isValid(body.eventId)
          ? new ObjectId(body.eventId)
          : body.eventId,
      createdBy: user.uid,
      createdAt: new Date(),
      lastUpdated: new Date(),
      status: body.status || 'drafting'
    });

    return NextResponse.json({ id: result.insertedId }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
