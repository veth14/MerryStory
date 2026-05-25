import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthGuardError } from '@/lib/auth/guards';
import { getMongoDb } from '@/lib/mongodb';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';
import { ObjectId } from 'mongodb';
import { validateUpload } from '@/lib/upload-validation';
import { createSignedStorageUrl, resolveSignedUrl } from '@/lib/storage';

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value >= 10 || exponent === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[exponent]}`;
}

async function uploadContractFile(file: File, eventId: string) {
  const supabase = getSupabaseServerClient();
  const { extension, mimeType } = validateUpload(file, {
    allowedExtensions: ['pdf'],
    allowedMimeTypes: ['application/pdf'],
    maxBytes: 10 * 1024 * 1024,
  });
  const sanitizedBaseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `contracts/${eventId || 'unassigned'}/${Date.now()}_${sanitizedBaseName}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage.from('user').upload(storagePath, buffer, {
    contentType: mimeType,
    upsert: true,
  });

  if (uploadError) {
    throw new Error(`Failed to upload contract file: ${uploadError.message}`);
  }

  const fileUrl = await createSignedStorageUrl(storagePath);

  return {
    fileUrl,
    storagePath,
    fileName: file.name,
    fileType: file.type || null,
    fileSize: formatBytes(file.size),
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['admin']);

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
      .sort({ lastUpdated: -1, createdAt: -1 })
      .limit(50)
      .toArray();

    // Resolve signed URLs for contract files
    const resolvedContracts = await Promise.all(
      contracts.map(async (contract) => ({
        ...contract,
        _id: contract._id?.toString?.() || contract._id,
        eventId: contract.eventId?.toString?.() || contract.eventId || '',
        fileUrl: await resolveSignedUrl(contract.storagePath || contract.fileUrl),
        signedFileUrl: await resolveSignedUrl(contract.signedStoragePath || contract.signedFileUrl),
      }))
    );

    return NextResponse.json(resolvedContracts);
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, ['admin']);
    const contentType = request.headers.get('content-type') || '';
    const isFormData = contentType.includes('multipart/form-data');
    const body = isFormData ? null : await request.json();
    const formData = isFormData ? await request.formData() : null;
    const eventIdValue = isFormData ? String(formData?.get('eventId') || '').trim() : body?.eventId;
    const uploadedFile = formData?.get('contractFile');

    let uploadedFileMeta: Record<string, unknown> = {};
    if (uploadedFile instanceof File && uploadedFile.size > 0) {
      uploadedFileMeta = await uploadContractFile(uploadedFile, eventIdValue);
    }

    const db = await getMongoDb();
    const result = await db.collection('contracts').insertOne({
      ...(isFormData
        ? {
            name: String(formData?.get('name') || '').trim(),
            type: String(formData?.get('type') || '').trim(),
            value: String(formData?.get('value') || '').trim(),
            eventName: String(formData?.get('eventName') || '').trim(),
            platform: String(formData?.get('platform') || '').trim(),
            recipientEmail: String(formData?.get('recipientEmail') || '').trim(),
            recipientName: String(formData?.get('recipientName') || '').trim(),
            status: String(formData?.get('status') || 'drafting').trim() || 'drafting',
          }
        : body),
      eventId:
        typeof eventIdValue === 'string' && ObjectId.isValid(eventIdValue)
          ? new ObjectId(eventIdValue)
          : eventIdValue,
      ...uploadedFileMeta,
      createdBy: user.uid,
      createdAt: new Date(),
      lastUpdated: new Date(),
      reviewToken: randomUUID(),
      status: (isFormData ? String(formData?.get('status') || 'drafting') : body.status) || 'drafting'
    });

    return NextResponse.json({ id: result.insertedId }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
