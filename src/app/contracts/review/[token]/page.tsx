'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Download, FileText, Loader, PenLine, RefreshCcw, Send, CheckCircle2, ShieldCheck } from 'lucide-react';

type ContractReview = {
  _id: string;
  name: string;
  type: string;
  eventName: string;
  value: string;
  status: string;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  recipientEmail: string;
  recipientName: string;
  reviewAction?: string;
  reviewNote?: string;
  signedByName?: string;
  signatureDataUrl?: string;
  signedAt?: string;
  reviewSubmittedAt?: string;
  adminView?: boolean;
};

type PdfPageMetric = {
  pageNumber: number;
  width: number;
  height: number;
};

type PdfJsModule = {
  getDocument: (src: string) => { promise: Promise<any> };
  GlobalWorkerOptions: { workerSrc: string };
  version: string;
};

function formatContractValue(value: string) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '\u20B10';
  return trimmed.startsWith('\u20B1') ? trimmed : `\u20B1${trimmed}`;
}

function resolvePreviewMode(fileUrl: string | null, fileType?: string | null, fileName?: string | null) {
  if (!fileUrl) {
    return { previewUrl: null, previewMode: 'empty' as const };
  }

  const normalizedType = String(fileType || '').toLowerCase();
  const normalizedName = String(fileName || '').toLowerCase();
  const isPdf = normalizedType.includes('pdf') || normalizedName.endsWith('.pdf');
  const isOfficeDocument =
    normalizedType.includes('wordprocessingml') ||
    normalizedType.includes('msword') ||
    normalizedName.endsWith('.doc') ||
    normalizedName.endsWith('.docx');

  if (isOfficeDocument) {
    return { previewUrl: fileUrl, previewMode: 'external' as const };
  }

  if (isPdf) {
    return { previewUrl: fileUrl, previewMode: 'pdf' as const };
  }

  return { previewUrl: fileUrl, previewMode: 'pdf' as const };
}

function formatReadableDate(value?: string) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

async function drawSnapshotOnCanvas(
  snapshot: string,
  inkCanvas: HTMLCanvasElement,
  visibleContext: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  if (!snapshot) return;

  await new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const inkContext = inkCanvas.getContext('2d');
      if (inkContext) {
        inkContext.clearRect(0, 0, inkCanvas.width, inkCanvas.height);
        inkContext.drawImage(image, 0, 0, inkCanvas.width, inkCanvas.height);
      }
      visibleContext.drawImage(image, 0, 0, width, height);
      resolve();
    };
    image.onerror = () => reject(new Error('Failed to restore the signature preview.'));
    image.src = snapshot;
  });
}

export default function ContractReviewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = String(params?.token || '');
  const adminAccess = searchParams.get('adminAccess') || '';
  const drawingRef = useRef(false);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const pageCanvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const pdfDocumentRef = useRef<any>(null);
  const pdfJsRef = useRef<PdfJsModule | null>(null);
  const renderGenerationRef = useRef(0);
  const activeRenderTasksRef = useRef<Array<{ cancel?: () => void }>>([]);
  const inkCanvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const annotationSnapshotsRef = useRef<string[]>([]);
  const annotationHistoryRef = useRef<Array<{ pageIndex: number; snapshot: string }>>([]);
  const activePageIndexRef = useRef<number | null>(null);
  const [contract, setContract] = useState<ContractReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessCode, setAccessCode] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [accessRequired, setAccessRequired] = useState(true);
  const [mode, setMode] = useState<'revision' | 'signature'>('revision');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [pdfPages, setPdfPages] = useState<PdfPageMetric[]>([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfRenderKey, setPdfRenderKey] = useState(0);
  const [canvasReadyTick, setCanvasReadyTick] = useState(0);
  const [canvasVersion, setCanvasVersion] = useState(0);

  const preview = useMemo(
    () => resolvePreviewMode(contract?.fileUrl || null, contract?.fileType || null, contract?.fileName || null),
    [contract]
  );
  const isSignedView = contract?.status === 'signed' && Boolean(contract.signatureDataUrl);
  const canDrawOnPdf = preview.previewMode === 'pdf' && mode === 'signature' && !submitted && !isSignedView;

  useEffect(() => {
    const loadPdfJs = async () => {
      if (typeof window === 'undefined') return;
      const pdfjs = (await import('pdfjs-dist')) as unknown as PdfJsModule;
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      pdfJsRef.current = pdfjs;
    };

    void loadPdfJs();
  }, []);

  useEffect(() => {
    if (!token) return;

    const fetchContract = async () => {
      try {
        setLoading(true);
        const reviewUrl = adminAccess
          ? `/api/contracts/review/${token}?adminAccess=${encodeURIComponent(adminAccess)}`
          : `/api/contracts/review/${token}`;
        const response = await fetch(reviewUrl);
        const payload = await response.json().catch(() => ({}));

        if (response.status === 403) {
          setAccessRequired(true);
          setAccessGranted(false);
          setContract(null);
          setError(null);
          return;
        }

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load contract review page.');
        }

        setAccessGranted(true);
        setAccessRequired(false);
        setContract(payload);
        setNote(payload.reviewNote || '');
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load contract.');
      } finally {
        setLoading(false);
      }
    };

    void fetchContract();
  }, [token, adminAccess]);

  const handleVerifyCode = async () => {
    if (!accessCode.trim()) return;

    try {
      setVerifyingCode(true);
      setError(null);
      const response = await fetch(`/api/contracts/review/${token}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: accessCode.trim() }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        router.push('/');
        return;
      }

      setAccessGranted(true);
      setAccessRequired(false);
      setAccessCode('');
      setLoading(true);
      const reviewUrl = adminAccess
        ? `/api/contracts/review/${token}?adminAccess=${encodeURIComponent(adminAccess)}`
        : `/api/contracts/review/${token}`;
      const contractResponse = await fetch(reviewUrl);
      const contractPayload = await contractResponse.json();
      if (!contractResponse.ok) {
        throw new Error(contractPayload.error || 'Failed to load contract review page.');
      }
      setContract(contractPayload);
      setNote(contractPayload.reviewNote || '');
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'Failed to verify access code.');
    } finally {
      setVerifyingCode(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    const preparePdf = async () => {
      if (preview.previewMode !== 'pdf' || !preview.previewUrl || !pdfContainerRef.current) {
        setPdfPages([]);
        pdfDocumentRef.current = null;
        return;
      }

      try {
        setPdfLoading(true);
        setError(null);
        const pdfjs = pdfJsRef.current;
        if (!pdfjs) {
          throw new Error('PDF renderer is still loading. Please try again in a moment.');
        }
        const loadingTask = pdfjs.getDocument(preview.previewUrl);
        const pdf = await loadingTask.promise;
        pdfDocumentRef.current = pdf;
        const containerWidth = Math.max(320, Math.min(pdfContainerRef.current.clientWidth - 24, 760));
        const nextPages: PdfPageMetric[] = [];

        for (let index = 0; index < pdf.numPages; index += 1) {
          const pageNumber = index + 1;
          const page = await pdf.getPage(pageNumber);
          const baseViewport = page.getViewport({ scale: 1 });
          const scale = Math.min(containerWidth / baseViewport.width, 1.4);
          const viewport = page.getViewport({ scale });

          nextPages.push({
            pageNumber,
            width: viewport.width,
            height: viewport.height,
          });
        }

        setPdfPages(nextPages);
      } catch (renderError) {
        setError(renderError instanceof Error ? renderError.message : 'Failed to render contract PDF.');
      } finally {
        setPdfLoading(false);
      }
    };

    void preparePdf();
  }, [preview.previewMode, preview.previewUrl, pdfRenderKey]);

  useEffect(() => {
    if (!pdfPages.length) return;
    const frame = window.requestAnimationFrame(() => {
      setCanvasReadyTick((current) => current + 1);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pdfPages]);

  useEffect(() => {
    const renderPreparedPages = async () => {
      if (preview.previewMode !== 'pdf') return;
      if (!pdfPages.length || !pdfDocumentRef.current) return;

      const canvasesReady =
        pageCanvasRefs.current.length >= pdfPages.length &&
        pdfPages.every((_, index) => Boolean(pageCanvasRefs.current[index]));

      if (!canvasesReady) return;

      renderGenerationRef.current += 1;
      const generation = renderGenerationRef.current;
      activeRenderTasksRef.current.forEach((task) => task.cancel?.());
      activeRenderTasksRef.current = [];

      try {
        for (let index = 0; index < pdfPages.length; index += 1) {
          if (generation !== renderGenerationRef.current) {
            return;
          }

          const pageNumber = index + 1;
          const page = await pdfDocumentRef.current.getPage(pageNumber);
          const canvas = pageCanvasRefs.current[index];
          const pageMeta = pdfPages[index];
          if (!canvas || !pageMeta) continue;

          const context = canvas.getContext('2d');
          if (!context) continue;

          canvas.width = pageMeta.width;
          canvas.height = pageMeta.height;
          canvas.style.width = `${pageMeta.width}px`;
          canvas.style.height = `${pageMeta.height}px`;

          const viewport = page.getViewport({ scale: pageMeta.width / page.getViewport({ scale: 1 }).width });
          const renderTask = page.render({
            canvas,
            canvasContext: context,
            viewport,
          });
          activeRenderTasksRef.current.push(renderTask);
          await renderTask.promise;

          if (generation !== renderGenerationRef.current) {
            return;
          }

          if (canDrawOnPdf) {
            const inkCanvas = document.createElement('canvas');
            inkCanvas.width = Math.round(pageMeta.width);
            inkCanvas.height = Math.round(pageMeta.height);
            inkCanvasRefs.current[index] = inkCanvas;
            const snapshot = annotationSnapshotsRef.current[index];
            if (snapshot) {
              await drawSnapshotOnCanvas(snapshot, inkCanvas, context, pageMeta.width, pageMeta.height);
            }
          }
        }
      } catch (renderError) {
        const message = renderError instanceof Error ? renderError.message : 'Failed to draw contract pages.';
        if (!message.toLowerCase().includes('cancelled')) {
          setError(message);
        }
      }
    };

    void renderPreparedPages();
    return () => {
      renderGenerationRef.current += 1;
      activeRenderTasksRef.current.forEach((task) => task.cancel?.());
      activeRenderTasksRef.current = [];
    };
  }, [preview.previewMode, pdfPages, canDrawOnPdf, canvasReadyTick]);

  const getPoint = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * event.currentTarget.width,
      y: ((event.clientY - rect.top) / rect.height) * event.currentTarget.height,
    };
  };

  const getPageIndexForCanvas = (canvas: HTMLCanvasElement) => {
    const pageIndex = pageCanvasRefs.current.findIndex((entry) => entry === canvas);
    return pageIndex >= 0 ? pageIndex : null;
  };

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canDrawOnPdf) return;
    const canvas = event.currentTarget;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const pageIndex = getPageIndexForCanvas(canvas);
    if (pageIndex === null) return;
    const point = getPoint(event);
    drawingRef.current = true;
    activePageIndexRef.current = pageIndex;
    annotationHistoryRef.current.push({
      pageIndex,
      snapshot: annotationSnapshotsRef.current[pageIndex] || '',
    });
    context.lineWidth = 2.2;
    context.lineCap = 'round';
    context.strokeStyle = '#1d1d1f';
    context.beginPath();
    context.moveTo(point.x, point.y);
    const inkCanvas = inkCanvasRefs.current[pageIndex];
    const inkContext = inkCanvas?.getContext('2d');
    if (inkCanvas && inkContext) {
      inkContext.lineWidth = 2.2;
      inkContext.lineCap = 'round';
      inkContext.strokeStyle = '#1d1d1f';
      inkContext.beginPath();
      inkContext.moveTo(point.x, point.y);
    }
  };

  const draw = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = event.currentTarget;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const pageIndex = activePageIndexRef.current;
    if (pageIndex === null) return;
    const point = getPoint(event);
    context.lineTo(point.x, point.y);
    context.stroke();
    const inkCanvas = inkCanvasRefs.current[pageIndex];
    const inkContext = inkCanvas?.getContext('2d');
    if (inkCanvas && inkContext) {
      inkContext.lineTo(point.x, point.y);
      inkContext.stroke();
    }
  };

  const stopDrawing = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const pageIndex = activePageIndexRef.current;
    if (pageIndex !== null) {
      annotationSnapshotsRef.current[pageIndex] = getAnnotationDataUrl(pageIndex);
    }
    activePageIndexRef.current = null;
  };

  const clearSignature = () => {
    inkCanvasRefs.current = [];
    annotationHistoryRef.current = [];
    annotationSnapshotsRef.current = [];
    activePageIndexRef.current = null;
    setCanvasVersion((current) => current + 1);
    setCanvasReadyTick((current) => current + 1);
  };



  const getAnnotationDataUrl = (pageIndex: number) => {
    const inkCanvas = inkCanvasRefs.current[pageIndex];
    if (!inkCanvas) return '';
    return inkCanvas.toDataURL('image/png');
  };

  const handleDownload = () => {
    if (!contract?.fileUrl) return;
    const anchor = document.createElement('a');
    anchor.href = contract.fileUrl;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.download = contract.fileName || contract.name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const openOriginal = () => {
    if (!contract?.fileUrl) return;
    const anchor = document.createElement('a');
    anchor.href = contract.fileUrl;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const handleSubmit = async () => {
    if (!contract) return;

    let signatureDataUrl = '';
    const resolvedSignerName = contract.recipientName || contract.recipientEmail || 'Contract Recipient';
    const pageAnnotations = pdfPages
      .map((page, index) => ({
        pageNumber: page.pageNumber,
        dataUrl: annotationSnapshotsRef.current[index] || '',
        width: page.width,
        height: page.height,
      }))
      .filter((entry) => entry.dataUrl);
    if (mode === 'signature') {
      if (preview.previewMode !== 'pdf') {
        setError('Direct signing is only available for PDF contracts.');
        return;
      }

      signatureDataUrl = pageAnnotations[0]?.dataUrl || '';
      if (!pageAnnotations.length) {
        setError('Please draw directly in the PDF before submitting.');
        return;
      }
    }

    try {
      setSaving(true);
      setError(null);
      const response = await fetch(`/api/contracts/review/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: mode,
          note,
          signerName: resolvedSignerName,
          signatureDataUrl,
          pageAnnotations,
        }),
      });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || 'Failed to submit contract response.');
        }

        const reviewUrl = adminAccess
          ? `/api/contracts/review/${token}?adminAccess=${encodeURIComponent(adminAccess)}`
          : `/api/contracts/review/${token}`;
        const refreshedResponse = await fetch(reviewUrl);
        const refreshedPayload = await refreshedResponse.json().catch(() => ({}));
        if (refreshedResponse.ok) {
          setContract(refreshedPayload);
        }
        setSubmitted(true);
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : 'Failed to submit contract response.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f6f4] text-[#1d1d1f]">
        <Loader className="animate-spin mr-3 text-[#eebf43]" />
        Loading contract review...
      </div>
    );
  }

  if (accessRequired && !accessGranted) {
    return (
      <div className="min-h-screen bg-white text-[#1d1d1f]">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center min-h-[78vh]">
            <div className="space-y-8">
              <span className="text-[#D4AF37] font-bold tracking-[0.2em] uppercase text-xs">Secure Contract Access</span>
              <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-[1.03] tracking-tight">
                Your Agreement, <br />
                <span className="text-[#D4AF37] font-light italic font-serif inline-block">Elegantly</span> Protected.
              </h1>
              <p className="text-[17px] text-gray-600 max-w-xl leading-relaxed">
                Enter the private access code from your email before opening the contract review page.
              </p>
            </div>

            <div className="bg-[#fcfbf7] border border-[#efe7cf] rounded-[28px] p-8 shadow-[0_30px_80px_rgba(17,17,17,0.06)]">
              <div className="w-14 h-14 rounded-2xl bg-white border border-[#efe7cf] flex items-center justify-center mb-6 shadow-sm">
                <ShieldCheck className="text-[#D4AF37]" size={24} />
              </div>
              <p className="text-[11px] font-black tracking-[0.2em] uppercase text-[#a1a1aa] mb-3">Access Code</p>
              <input
                value={accessCode}
                onChange={(event) => setAccessCode(event.target.value.trimStart())}
                inputMode="text"
                placeholder="Enter code or email"
                className="w-full px-5 py-5 rounded-2xl border border-[#e9dcc0] bg-white text-lg font-black tracking-[0.08em] text-center text-[#1d1d1f] outline-none focus:border-[#D4AF37]"
              />
              <p className="text-sm text-gray-500 leading-relaxed mt-4">
                Enter the 6-digit code from the email, or use the same recipient email address that received the contract.
              </p>
              {error ? <p className="text-sm text-red-500 mt-4">{error}</p> : null}
              <button
                onClick={handleVerifyCode}
                disabled={verifyingCode || accessCode.trim().length < 3}
                className="mt-8 w-full bg-[#D4AF37] hover:bg-[#c89f2d] text-white px-8 py-5 rounded-[6px] font-bold text-center transition-all shadow-lg text-[11px] tracking-[0.15em] uppercase disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {verifyingCode ? <Loader size={16} className="animate-spin" /> : <ArrowRight size={14} />}
                Unlock Contract
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f6f4] p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-gray-200 shadow-lg p-8 text-center">
          <h1 className="text-2xl font-black text-[#1d1d1f] mb-3">Contract Unavailable</h1>
          <p className="text-sm text-gray-500">{error || 'We could not load this contract review link.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#1d1d1f] px-4 py-8">
      <style jsx global>{`
        .contract-theme-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #111111 #fcfbf7;
        }

        .contract-theme-scrollbar::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }

        .contract-theme-scrollbar::-webkit-scrollbar-track {
          background: #fcfbf7;
          border-left: 1px solid #eee8d8;
        }

        .contract-theme-scrollbar::-webkit-scrollbar-thumb {
          background: #111111;
          border: 2px solid #fcfbf7;
          border-radius: 999px;
        }

        .contract-theme-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #000000;
        }

        .contract-theme-scrollbar::-webkit-scrollbar-corner {
          background: #fcfbf7;
        }
      `}</style>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 px-4 pt-2">
          <p className="text-[#D4AF37] font-bold tracking-[0.2em] uppercase text-xs mb-3">Contract Review</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight tracking-tight">
            Review Your Agreement
          </h1>
        </div>
        <div className="bg-[#fcfbf7] rounded-[28px] border border-[#eee8d8] shadow-[0_30px_80px_rgba(17,17,17,0.06)] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-0">
            <div className="contract-theme-scrollbar bg-white p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              {preview.previewMode === 'pdf' && preview.previewUrl ? (
                <div className="w-full">
                  <div ref={pdfContainerRef} className="contract-theme-scrollbar relative w-full overflow-y-auto overflow-x-hidden bg-white p-4 pr-2" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                    {canDrawOnPdf ? (
                      <div className="sticky top-0 z-10 flex justify-end pr-2 pt-2 pointer-events-none">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#eebf43]/30 bg-white/95 px-3 py-2 shadow-sm">
                        <PenLine size={14} className="text-[#eebf43]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#1d1d1f]">Pen Active</span>
                      </div>
                    </div>
                  ) : null}
                  {pdfLoading ? (
                    <div className="min-h-[640px] h-full flex items-center justify-center">
                      <Loader className="animate-spin mr-3 text-[#eebf43]" />
                      <span className="text-sm text-gray-500">Rendering contract PDF...</span>
                    </div>
                    ) : (
                      <div className="space-y-6 py-2">
                        {pdfPages.map((page) => (
                          <div key={`${page.pageNumber}-${canvasVersion}`} className="flex justify-center">
                            <div className="relative inline-block overflow-hidden border-4 border-[#eebf43] bg-white">
                              <canvas
                                ref={(node) => {
                                  pageCanvasRefs.current[page.pageNumber - 1] = node;
                                }}
                                className={`relative z-[1] block bg-white ${canDrawOnPdf ? 'cursor-[url(\"data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2724%27 height=%2724%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%231d1d1f%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M12 20h9%27/%3E%3Cpath d=%27M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z%27/%3E%3C/svg%3E\")_2_20,auto]' : 'cursor-default'}`}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="max-w-md text-center bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                  <div className="w-16 h-16 rounded-2xl bg-[#fef9ec] border border-[#eebf43]/20 flex items-center justify-center mx-auto mb-5">
                    <FileText size={28} className="text-[#eebf43]" />
                  </div>
                  <h4 className="text-lg font-black text-[#1d1d1f] mb-3">Open Contract File</h4>
                  <p className="text-sm text-gray-500 leading-relaxed mb-6">
                    This file type opens best in its original application. You can still review it in a new tab and come back here to leave notes or sign.
                  </p>
                  <button onClick={openOriginal} className="px-5 py-3 bg-[#1d1d1f] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-colors">
                    Open Original File
                  </button>
                </div>
              )}
            </div>

            <div className="contract-theme-scrollbar bg-white p-8 border-l border-gray-100 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              {submitted ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <CheckCircle2 size={48} className="text-[#22c55e] mb-4" />
                  <h2 className="text-2xl font-black mb-3">Response Sent</h2>
                  <p className="text-sm text-gray-500 max-w-sm">
                    Your contract response has been recorded and sent back to the Merry Story admin team.
                  </p>
                  <button
                    onClick={handleDownload}
                    className="mt-8 px-5 py-4 bg-[#eebf43] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#dcae32] transition-colors flex items-center justify-center gap-2"
                  >
                    <Download size={14} /> Download {contract.status === 'signed' ? 'Signed PDF' : 'File'}
                  </button>
                </div>
              ) : isSignedView ? (
                <div className="space-y-4">
                  <div className="p-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#111111] mb-2">Merry Story Productions</p>
                    <h2 className="text-3xl font-black tracking-tight text-[#1d1d1f]">{contract.name}</h2>
                    <p className="text-sm text-[#111111] mt-2">{contract.type} for {contract.eventName}</p>
                    <p className="mt-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#111111]">Client : {contract.recipientName || 'Not provided'}</p>
                    <p className="mt-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#111111]">Email : {contract.recipientEmail || 'Not provided'}</p>
                  </div>

                  <div className="pt-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a1a1aa] mb-2">Contract Value</p>
                    <p className="text-3xl font-black">{formatContractValue(contract.value)}</p>
                  </div>

                  <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-2">Signed & Confirmed</p>
                    <h2 className="text-2xl font-black text-[#1d1d1f] mb-2">{contract.signedByName || contract.recipientName || contract.recipientEmail}</h2>
                    <p className="text-sm text-gray-500">Signed on {formatReadableDate(contract.signedAt || contract.reviewSubmittedAt)}</p>
                  </div>

                  {contract.reviewNote ? (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a1a1aa] mb-2">Client Note</p>
                      <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-[14px] text-[#1d1d1f] leading-relaxed">
                        {contract.reviewNote}
                      </div>
                    </div>
                  ) : null}

                  <p className="text-sm text-gray-500 leading-relaxed">
                    The signed PDF now has the client signature stamped directly into the document file.
                  </p>
                  <button
                    onClick={handleDownload}
                    className="w-full px-5 py-4 bg-[#eebf43] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#dcae32] transition-colors flex items-center justify-center gap-2"
                  >
                    <Download size={14} /> Download Signed PDF
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="p-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#111111] mb-2">Merry Story Productions</p>
                    <h2 className="text-3xl font-black tracking-tight text-[#1d1d1f]">{contract.name}</h2>
                    <p className="text-sm text-[#111111] mt-2">{contract.type} for {contract.eventName}</p>
                    <p className="mt-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#111111]">Client : {contract.recipientName || 'Not provided'}</p>
                    <p className="mt-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#111111]">Email : {contract.recipientEmail || 'Not provided'}</p>
                  </div>

                  <div className="pt-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a1a1aa] mb-2">Contract Value</p>
                    <p className="text-3xl font-black">{formatContractValue(contract.value)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setMode('revision')}
                      className={`px-4 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${mode === 'revision' ? 'bg-[#1d1d1f] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      <RefreshCcw size={14} /> For Revision
                    </button>
                    <button
                      onClick={() => setMode('signature')}
                      className={`px-4 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${mode === 'signature' ? 'bg-[#eebf43] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      <PenLine size={14} /> For Signature
                    </button>
                  </div>

                  {mode === 'signature' && preview.previewMode === 'pdf' ? (
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#eebf43]/20 bg-[#fffdf7] px-4 py-3">
                      <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#1d1d1f]">
                        <PenLine size={14} className="text-[#eebf43]" />
                        Draw In PDF
                      </div>
                      <div className="flex items-center gap-3">
                   
                        <button onClick={clearSignature} className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-[#1d1d1f]">
                          Clear
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#a1a1aa] mb-2">Note</label>
                    <textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder={mode === 'revision' ? 'Share the revisions you want made...' : 'Optional message for the admin team...'}
                      className="w-full min-h-[160px] px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-[14px] font-medium text-[#1d1d1f] outline-none focus:border-[#eebf43] resize-none"
                    />
                  </div>

                  {error && <p className="text-sm text-red-500">{error}</p>}

                  <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="w-full px-5 py-4 bg-[#1d1d1f] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {saving ? <Loader size={16} className="animate-spin" /> : <Send size={14} />}
                    {mode === 'signature' ? 'Send Back As Signed & Confirmed' : 'Send Revision Request'}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="w-full px-5 py-4 bg-[#eebf43] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#dcae32] transition-colors flex items-center justify-center gap-2"
                  >
                    <Download size={14} /> Download File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
