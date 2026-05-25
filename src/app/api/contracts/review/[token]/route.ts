import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { isValidContractAdminAccessToken } from '@/lib/contract-review-access';
import { resolveSignedUrl } from '@/lib/storage';

type RouteContext = {
  params: Promise<{ token: string }>;
};

function getAccessCookieName(token: string) {
  return `contract-review-${token.replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;
    const adminAccess = request.nextUrl.searchParams.get('adminAccess');
    const accessCookie = request.cookies.get(getAccessCookieName(token))?.value;
    const hasAdminAccess = isValidContractAdminAccessToken(token, adminAccess);

    if (accessCookie !== 'verified' && !hasAdminAccess) {
      return NextResponse.json({ error: 'Contract access code required.' }, { status: 403 });
    }
    const db = await getMongoDb();
    const contract = await db.collection('contracts').findOne({ reviewToken: token });

    if (!contract) {
      return NextResponse.json({ error: 'Contract review link not found.' }, { status: 404 });
    }

    // Resolve signed URL from storage path or legacy public URL
    const resolvedFileUrl = await resolveSignedUrl(
      contract.signedStoragePath || contract.signedFileUrl ||
      contract.storagePath || contract.fileUrl || null
    );

    return NextResponse.json({
      _id: contract._id?.toString?.() || contract._id,
      name: contract.name || 'Contract Agreement',
      type: contract.type || 'Contract',
      eventName: contract.eventName || 'Unassigned Event',
      value: contract.value || '',
      status: contract.status || 'drafting',
      fileUrl: resolvedFileUrl,
      fileName: contract.signedFileName || contract.fileName || null,
      fileType: contract.signedFileType || contract.fileType || null,
      recipientEmail: contract.recipientEmail || '',
      recipientName: contract.recipientName || '',
      reviewAction: contract.reviewAction || '',
      reviewNote: contract.reviewNote || '',
      signedByName: contract.signedByName || '',
      signatureDataUrl: contract.signatureDataUrl || '',
      signedAt: contract.signedAt || '',
      reviewSubmittedAt: contract.reviewSubmittedAt || '',
      adminView: hasAdminAccess,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
