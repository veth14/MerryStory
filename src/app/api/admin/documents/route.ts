import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser, AuthGuardError } from '@/lib/auth/guards';
import { getMongoDb } from '@/lib/mongodb';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { ObjectId } from 'mongodb';

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value >= 10 || exponent === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[exponent]}`;
}

async function uploadDocumentFile(file: File, eventId: string, category: string) {
  const supabase = getSupabaseServerClient();
  const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const sanitizedBaseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `documents/${category || 'uploads'}/${eventId || 'unassigned'}/${Date.now()}_${sanitizedBaseName}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage.from('user').upload(storagePath, buffer, {
    contentType: file.type || 'application/octet-stream',
    upsert: true,
  });

  if (uploadError) {
    throw new Error(`Failed to upload document file: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('user').getPublicUrl(storagePath);

  return {
    fileUrl: publicUrl,
    fileName: file.name,
    fileType: file.type || null,
    size: formatBytes(file.size),
    storagePath,
  };
}

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
    const contentType = request.headers.get('content-type') || '';
    const isFormData = contentType.includes('multipart/form-data');
    const body = isFormData ? null : await request.json();
    const formData = isFormData ? await request.formData() : null;

    const eventIdValue = isFormData ? String(formData?.get('eventId') || '').trim() : String(body?.eventId || '').trim();
    const categoryValue = isFormData ? String(formData?.get('category') || 'uploads').trim() : String(body?.category || 'uploads').trim();
    const uploadedFile = formData?.get('file');

    let uploadedFileMeta: Record<string, unknown> = {};
    if (uploadedFile instanceof File && uploadedFile.size > 0) {
      uploadedFileMeta = await uploadDocumentFile(uploadedFile, eventIdValue, categoryValue);
    }

    const db = await getMongoDb();
    const result = await db.collection('documents').insertOne({
      ...(isFormData
        ? {
            name: String(formData?.get('name') || uploadedFileMeta.fileName || '').trim(),
            type: String(formData?.get('type') || uploadedFileMeta.fileType || '').trim(),
            event: String(formData?.get('event') || '').trim(),
            date: String(formData?.get('date') || '').trim(),
            status: String(formData?.get('status') || 'Pending').trim(),
            category: categoryValue,
            icon: String(formData?.get('icon') || 'file').trim(),
          }
        : body),
      eventId:
        typeof eventIdValue === 'string' && ObjectId.isValid(eventIdValue)
          ? new ObjectId(eventIdValue)
          : eventIdValue,
      ...uploadedFileMeta,
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
