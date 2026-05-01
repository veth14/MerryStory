import { NextRequest, NextResponse } from 'next/server';
import { AuthGuardError, requireAuthenticatedUser } from '@/lib/auth/guards';
import { getMongoDb } from '@/lib/mongodb';
import { buildSimplePdf } from '@/lib/simplePdf';
import { ObjectId } from 'mongodb';

type RouteContext = {
  params: Promise<{ id: string }>;
};

function formatReadableDate(value: unknown) {
  if (!value) return 'Not recorded';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireAuthenticatedUser(request);
    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid contract ID.' }, { status: 400 });
    }

    const db = await getMongoDb();
    const contract = await db.collection('contracts').findOne({ _id: new ObjectId(id) });

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found.' }, { status: 404 });
    }

    const lines = [
      `Contract: ${contract.name || 'Untitled Contract'}`,
      `Type: ${contract.type || 'Contract'}`,
      `Event: ${contract.eventName || 'Unassigned Event'}`,
      `Value: ${contract.value || 'N/A'}`,
      `Status: ${contract.status || 'drafting'}`,
      `Platform: ${contract.platform || 'N/A'}`,
      `Last Updated: ${formatReadableDate(contract.lastUpdated)}`,
    ];

    const pdf = buildSimplePdf(contract.name || 'Contract Preview', lines);
    const isDownload = new URL(request.url).searchParams.get('download') === '1';
    const safeName = String(contract.name || 'contract').replace(/[^a-z0-9._-]+/gi, '_');

    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${isDownload ? 'attachment' : 'inline'}; filename="${safeName}.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
