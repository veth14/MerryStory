import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { sendContractStatusEmail } from '@/lib/email';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

function decodeDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid signature image format.');
  }

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  };
}

async function createSignedPdf(contract: any, signerName: string, signatureDataUrl: string) {
  const originalUrl = String(contract.fileUrl || '').trim();
  const originalName = String(contract.fileName || contract.name || 'contract.pdf').trim();
  const originalType = String(contract.fileType || '').toLowerCase();

  if (!originalUrl || (!originalType.includes('pdf') && !originalName.toLowerCase().endsWith('.pdf'))) {
    return null;
  }

  const response = await fetch(originalUrl);
  if (!response.ok) {
    throw new Error('Failed to load original PDF for signing.');
  }

  const originalBytes = await response.arrayBuffer();
  const pdfDoc = await PDFDocument.load(originalBytes);
  const pages = pdfDoc.getPages();
  const page = pages[pages.length - 1];
  const { width } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const signatureImageBytes = decodeDataUrl(signatureDataUrl).buffer;
  const signatureImage = await pdfDoc.embedPng(signatureImageBytes);

  const boxWidth = 210;
  const boxHeight = 96;
  const marginRight = 56;
  const bottomY = 72;
  const boxX = Math.max(48, width - boxWidth - marginRight);
  const boxY = bottomY;
  const signatureDims = signatureImage.scaleToFit(boxWidth - 32, 42);

  page.drawRectangle({
    x: boxX,
    y: boxY,
    width: boxWidth,
    height: boxHeight,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.86, 0.86, 0.86),
    borderWidth: 1,
    opacity: 0.98,
  });

  page.drawText('Client Signature', {
    x: boxX + 16,
    y: boxY + boxHeight - 18,
    size: 8,
    font: boldFont,
    color: rgb(0.45, 0.45, 0.5),
  });

  page.drawImage(signatureImage, {
    x: boxX + 16,
    y: boxY + 28,
    width: signatureDims.width,
    height: signatureDims.height,
  });

  page.drawLine({
    start: { x: boxX + 16, y: boxY + 24 },
    end: { x: boxX + boxWidth - 16, y: boxY + 24 },
    thickness: 0.8,
    color: rgb(0.82, 0.82, 0.82),
  });

  page.drawText(signerName, {
    x: boxX + 16,
    y: boxY + 10,
    size: 9,
    font: boldFont,
    color: rgb(0.12, 0.12, 0.12),
  });

  page.drawText(`Signed on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`, {
    x: boxX + boxWidth - 102,
    y: boxY + 10,
    size: 7,
    font,
    color: rgb(0.45, 0.45, 0.5),
  });

  const signedBytes = await pdfDoc.save();
  const supabase = getSupabaseServerClient();
  const safeBaseName = originalName.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `contracts/signed/${contract.eventId?.toString?.() || 'unassigned'}/${Date.now()}_${safeBaseName}_signed.pdf`;

  const { error: uploadError } = await supabase.storage.from('user').upload(storagePath, Buffer.from(signedBytes), {
    contentType: 'application/pdf',
    upsert: true,
  });

  if (uploadError) {
    throw new Error(`Failed to upload signed PDF: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('user').getPublicUrl(storagePath);

  return {
    signedFileUrl: publicUrl,
    signedFileName: `${safeBaseName}_signed.pdf`,
    signedFileType: 'application/pdf',
    signedStoragePath: storagePath,
  };
}

async function createAnnotatedPdf(
  contract: any,
  annotations: Array<{ pageNumber: number; dataUrl: string; width?: number; height?: number }>
) {
  const originalUrl = String(contract.fileUrl || '').trim();
  const originalName = String(contract.fileName || contract.name || 'contract.pdf').trim();
  const originalType = String(contract.fileType || '').toLowerCase();

  if (!originalUrl || (!originalType.includes('pdf') && !originalName.toLowerCase().endsWith('.pdf'))) {
    return null;
  }

  const response = await fetch(originalUrl);
  if (!response.ok) {
    throw new Error('Failed to load original PDF for signing.');
  }

  const originalBytes = await response.arrayBuffer();
  const pdfDoc = await PDFDocument.load(originalBytes);
  const pages = pdfDoc.getPages();

  for (const annotation of annotations) {
    if (!annotation?.dataUrl) continue;
    const page = pages[annotation.pageNumber - 1];
    if (!page) continue;
    const { width, height } = page.getSize();
    const imageBytes = decodeDataUrl(annotation.dataUrl).buffer;
    const image = await pdfDoc.embedPng(imageBytes);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width,
      height,
    });
  }

  const signedBytes = await pdfDoc.save();
  const supabase = getSupabaseServerClient();
  const safeBaseName = originalName.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `contracts/signed/${contract.eventId?.toString?.() || 'unassigned'}/${Date.now()}_${safeBaseName}_signed.pdf`;

  const { error: uploadError } = await supabase.storage.from('user').upload(storagePath, Buffer.from(signedBytes), {
    contentType: 'application/pdf',
    upsert: true,
  });

  if (uploadError) {
    throw new Error(`Failed to upload signed PDF: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('user').getPublicUrl(storagePath);

  return {
    signedFileUrl: publicUrl,
    signedFileName: `${safeBaseName}_signed.pdf`,
    signedFileType: 'application/pdf',
    signedStoragePath: storagePath,
  };
}

type RouteContext = {
  params: Promise<{ token: string }>;
};

function getAccessCookieName(token: string) {
  return `contract-review-${token.replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;
    const accessCookie = request.cookies.get(getAccessCookieName(token))?.value;
    if (accessCookie !== 'verified') {
      return NextResponse.json({ error: 'Contract access code required.' }, { status: 403 });
    }
    const body = await request.json();
    const action = String(body.action || '').trim();
    const note = String(body.note || '').trim();
    const signerName = String(body.signerName || '').trim();
    const signatureDataUrl = String(body.signatureDataUrl || '').trim();
    const pageAnnotations = Array.isArray(body.pageAnnotations) ? body.pageAnnotations : [];

    if (action !== 'revision' && action !== 'signature') {
      return NextResponse.json({ error: 'Invalid review action.' }, { status: 400 });
    }

    if (action === 'signature' && (!signerName || (!signatureDataUrl && pageAnnotations.length === 0))) {
      return NextResponse.json({ error: 'Signer name and signature are required.' }, { status: 400 });
    }

    const db = await getMongoDb();
    const contracts = db.collection('contracts');
    const contract = await contracts.findOne({ reviewToken: token });

    if (!contract) {
      return NextResponse.json({ error: 'Contract review link not found.' }, { status: 404 });
    }

    const updateDoc: Record<string, unknown> = {
      reviewAction: action,
      reviewNote: note,
      reviewSubmittedAt: new Date(),
      lastUpdated: new Date(),
      status: action === 'signature' ? 'signed' : 'drafting',
    };

    if (action === 'signature') {
      const signedPdfMeta =
        pageAnnotations.length > 0
          ? await createAnnotatedPdf(contract, pageAnnotations)
          : await createSignedPdf(contract, signerName, signatureDataUrl);
      updateDoc.signatureDataUrl = signatureDataUrl || String(pageAnnotations[0]?.dataUrl || '');
      updateDoc.signedByName = signerName;
      updateDoc.signedByEmail = contract.recipientEmail || '';
      updateDoc.signedAt = new Date();
      if (signedPdfMeta) {
        Object.assign(updateDoc, signedPdfMeta);
      }
    }

    await contracts.updateOne({ reviewToken: token }, { $set: updateDoc });

    const adminEmail = process.env.EMAIL_USER;
    if (adminEmail) {
      await sendContractStatusEmail({
        to: adminEmail,
        contractName: String(contract.name || 'Contract Agreement'),
        signerName: signerName || String(contract.recipientName || contract.recipientEmail || 'Contract Recipient'),
        action: action as 'revision' | 'signature',
        note,
      });
    }

    await db.collection('notifications').insertOne({
      type: action === 'signature' ? 'contract-signature' : 'contract-revision',
      title:
        action === 'signature'
          ? `${signerName || contract.recipientName || contract.recipientEmail || 'Client'} signed ${String(contract.name || 'a contract')}`
          : `${signerName || contract.recipientName || contract.recipientEmail || 'Client'} requested a revision for ${String(contract.name || 'a contract')}`,
      contractId: contract._id,
      contractName: String(contract.name || 'Contract Agreement'),
      eventName: String(contract.eventName || 'Unassigned Event'),
      signerName: signerName || String(contract.recipientName || ''),
      signerEmail: String(contract.recipientEmail || ''),
      note,
      isRead: false,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
