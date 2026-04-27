import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser, AuthGuardError } from '@/lib/auth/guards';
import { getMongoDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    await requireAuthenticatedUser(request);

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category')?.trim();
    const eventId = searchParams.get('eventId')?.trim();

    const filter: Record<string, unknown> = {};

    if (category) {
      filter.category = category;
    }

    if (eventId && ObjectId.isValid(eventId)) {
      filter.eventId = new ObjectId(eventId);
    }

    const db = await getMongoDb();
    const documents = await db
      .collection('documents')
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    return NextResponse.json(
      documents.map((document) => ({
        ...document,
        _id: document._id?.toString?.() || document._id,
        eventId: document.eventId?.toString?.() || document.eventId || '',
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
    const result = await db.collection('documents').insertOne({
      ...body,
      eventId:
        typeof body.eventId === 'string' && ObjectId.isValid(body.eventId)
          ? new ObjectId(body.eventId)
          : body.eventId,
      createdBy: user.uid,
      createdAt: new Date()
    });

    return NextResponse.json({ id: result.insertedId }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
