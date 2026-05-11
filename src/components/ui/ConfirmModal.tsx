"use client";
import React, { useEffect, useState } from "react";
import Modal from './Modal';

type Props = {
  isOpen: boolean;
  title: string;
  description?: string;
  type?: "info" | "danger";
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
};

export default function ConfirmModal({ isOpen, title, description, type = "info", confirmLabel, onConfirm, onClose }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen) return null;
  if (!mounted) return null;

  const confirmText = confirmLabel || (type === 'danger' ? 'Delete' : 'Confirm');
  const confirmButtonClass = type === 'danger'
    ? 'bg-red-500 text-white shadow-xl shadow-red-500/20 hover:bg-red-600'
    : 'bg-[#facc15] text-white shadow-xl shadow-[#facc15]/20 hover:bg-[#dcae32]';

  const [leadWord, ...restWords] = title.trim().split(/\s+/);
  const accentText = restWords.join(' ');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      actions={(
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 text-[12px] font-black uppercase tracking-widest text-gray-400"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={async () => { await onConfirm(); }}
            className={`flex-1 py-4 text-[12px] font-black uppercase tracking-widest rounded-2xl shadow-xl transition-colors flex items-center justify-center ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      )}
    >
      <div className="relative">
        <h2 className="text-[28px] font-black text-gray-900 tracking-tight mb-2 text-center">
          {leadWord}{' '}
          {accentText ? <span className="text-[#facc15] italic">{accentText}</span> : null}
        </h2>
        {description && (
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-8 text-center leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </Modal>
  );
}
