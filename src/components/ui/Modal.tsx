"use client";
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '4xl';
  // optional actions area (renders sticky on mobile)
  actions?: React.ReactNode;
};

const MAX_WIDTH_MAP: Record<NonNullable<Props['maxWidth']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '4xl': 'max-w-4xl',
};

export default function Modal({ isOpen, onClose, children, maxWidth = 'md', actions }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [detectedActionsHtml, setDetectedActionsHtml] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    // If no explicit actions provided, attempt to detect footer actions inside modal content
    if (!actions && containerRef.current) {
      const el = containerRef.current.querySelector('[data-modal-actions]') as HTMLElement | null;
      if (el) setDetectedActionsHtml(el.innerHTML);
    }
  }, [actions, isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const maxClass = MAX_WIDTH_MAP[maxWidth] || MAX_WIDTH_MAP.md;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onMouseDown={(e) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          onClose();
        }
      }}
    >
      <div
        ref={containerRef}
        className={`bg-white w-full ${maxClass} rounded-[28px] sm:rounded-[40px] p-4 sm:p-8 shadow-2xl relative animate-in zoom-in-95 overflow-hidden`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="max-h-[80vh] overflow-y-auto">{children}</div>

        {actions || detectedActionsHtml ? (
          <div className="sm:hidden fixed left-0 right-0 bottom-0 p-4 bg-white/95 border-t border-gray-100 z-[10000]">
            <div className="max-w-[1000px] mx-auto">
              {actions ? (
                actions
              ) : (
                <div dangerouslySetInnerHTML={{ __html: detectedActionsHtml || '' }} />
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
