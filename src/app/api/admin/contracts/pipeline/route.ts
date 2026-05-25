import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthGuardError } from '@/lib/auth/guards';
import { getMongoDb } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['admin']);

    const db = await getMongoDb();
    const contracts = await db.collection('contracts').find({}).sort({ lastUpdated: -1, createdAt: -1 }).toArray();

    // Group by status
    const pipeline = {
      drafting: contracts
        .filter(c => c.status === 'drafting')
        .map((contract) => ({ ...contract, _id: contract._id?.toString?.() || contract._id, eventId: contract.eventId?.toString?.() || contract.eventId || '' })),
      sent: contracts
        .filter(c => c.status === 'sent')
        .map((contract) => ({ ...contract, _id: contract._id?.toString?.() || contract._id, eventId: contract.eventId?.toString?.() || contract.eventId || '' })),
      signed: contracts
        .filter(c => c.status === 'signed')
        .map((contract) => ({ ...contract, _id: contract._id?.toString?.() || contract._id, eventId: contract.eventId?.toString?.() || contract.eventId || '' }))
    };

    return NextResponse.json(pipeline);
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
