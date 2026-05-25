import { NextRequest, NextResponse } from 'next/server';
import { AuthGuardError, requireRole } from '@/lib/auth/guards';
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

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireRole(request, ['admin']);
    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid document ID.' }, { status: 400 });
    }

    const db = await getMongoDb();
    const document = await db.collection('documents').findOne({ _id: new ObjectId(id) });

    if (!document) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    }

    const lines = [
      `Name: ${document.name || 'Untitled Document'}`,
      `Type: ${document.type || 'FILE'}`,
      `Event: ${document.event || 'Unassigned Event'}`,
      `Category: ${document.category || 'documents'}`,
      `Status: ${document.status || 'Pending'}`,
      `Size: ${document.size || 'Unknown'}`,
      `Recorded: ${formatReadableDate(document.date)}`,
    ];

    const pdf = buildSimplePdf(document.name || 'Document Preview', lines);
    const isDownload = new URL(request.url).searchParams.get('download') === '1';
    const safeName = String(document.name || 'document').replace(/[^a-z0-9._-]+/gi, '_');

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
