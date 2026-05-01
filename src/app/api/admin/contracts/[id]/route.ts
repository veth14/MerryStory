import { NextRequest, NextResponse } from 'next/server';
import { AuthGuardError, requireAuthenticatedUser } from '@/lib/auth/guards';
import { getMongoDb } from '@/lib/mongodb';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';
import { ObjectId } from 'mongodb';

type RouteContext = {
  params: Promise<{ id: string }>;
};

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value >= 10 || exponent === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[exponent]}`;
}

async function uploadContractFile(file: File, eventId: string) {
  const supabase = getSupabaseServerClient();
  const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const sanitizedBaseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `contracts/${eventId || 'unassigned'}/${Date.now()}_${sanitizedBaseName}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage.from('user').upload(storagePath, buffer, {
    contentType: file.type || 'application/octet-stream',
    upsert: true,
  });

  if (uploadError) {
    throw new Error(`Failed to upload contract file: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('user').getPublicUrl(storagePath);

  return {
    fileUrl: publicUrl,
    fileName: file.name,
    fileType: file.type || null,
    fileSize: formatBytes(file.size),
    storagePath,
  };
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

    return NextResponse.json({
      ...contract,
      _id: contract._id?.toString?.() || contract._id,
      eventId: contract.eventId?.toString?.() || contract.eventId || '',
    });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuthenticatedUser(request);
    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid contract ID.' }, { status: 400 });
    }

    const formData = await request.formData();
    const eventIdValue = String(formData.get('eventId') || '').trim();
    const uploadedFile = formData.get('contractFile');

    const updateDoc: Record<string, unknown> = {
      name: String(formData.get('name') || '').trim(),
      type: String(formData.get('type') || '').trim(),
      value: String(formData.get('value') || '').trim(),
      eventName: String(formData.get('eventName') || '').trim(),
      platform: String(formData.get('platform') || '').trim(),
      recipientEmail: String(formData.get('recipientEmail') || '').trim(),
      recipientName: String(formData.get('recipientName') || '').trim(),
      status: String(formData.get('status') || 'drafting').trim() || 'drafting',
      eventId: ObjectId.isValid(eventIdValue) ? new ObjectId(eventIdValue) : eventIdValue,
      lastUpdated: new Date(),
      updatedBy: user.uid,
    };

    if (uploadedFile instanceof File && uploadedFile.size > 0) {
      Object.assign(updateDoc, await uploadContractFile(uploadedFile, eventIdValue));
    }

    const db = await getMongoDb();
    const existingContract = await db.collection('contracts').findOne({ _id: new ObjectId(id) });
    if (!existingContract) {
      return NextResponse.json({ error: 'Contract not found.' }, { status: 404 });
    }

    if (!existingContract.reviewToken) {
      updateDoc.reviewToken = randomUUID();
    }

    await db.collection('contracts').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateDoc }
    );

    const updatedContract = await db.collection('contracts').findOne({ _id: new ObjectId(id) });

    if (!updatedContract) {
      return NextResponse.json({ error: 'Contract not found.' }, { status: 404 });
    }

    return NextResponse.json({
      ...updatedContract,
      _id: updatedContract._id?.toString?.() || updatedContract._id,
      eventId: updatedContract.eventId?.toString?.() || updatedContract.eventId || '',
    });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
