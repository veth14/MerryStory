'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Plus, X } from 'lucide-react';
import { TaskDatePicker, TaskMultiSelect, TaskSelect, TaskTimeField, TASK_PRIORITY_OPTIONS, type TaskSelectOption } from './TaskControls';

type CreatedTaskRecord = Record<string, unknown>;

const getTodayDate = () => new Date().toISOString().slice(0, 10);
const getCurrentTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

const isPastDateTime = (date: string, time: string) => {
  if (!date || !time) {
    return false;
  }

  const dueDateTime = new Date(`${date}T${time}`);
  return !Number.isNaN(dueDateTime.getTime()) && dueDateTime.getTime() < Date.now();
};

export default function CreateTaskModal({
  isOpen,
  eventId,
  user,
  staffOptions,
  vendorOptions,
  onClose,
  onTaskCreated,
}: {
  isOpen: boolean;
  eventId: string;
  user: { getIdToken: () => Promise<string> } | null | undefined;
  staffOptions: TaskSelectOption[];
  vendorOptions: TaskSelectOption[];
  onClose: () => void;
  onTaskCreated: (task: CreatedTaskRecord) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    dueTime: '',
    assignees: [] as string[],
    vendor: 'None',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setError('');
      setIsSubmitting(false);
      setFormData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        dueDate: '',
        dueTime: '',
        assignees: [],
        vendor: 'None',
      });
    }
  }, [isOpen]);

  const minTime = useMemo(() => (formData.dueDate === getTodayDate() ? getCurrentTime() : undefined), [formData.dueDate]);

  if (!mounted || !isOpen) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[240] flex items-center justify-center bg-[rgba(18,16,11,0.58)] p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-[32px] border border-[#efe7d1] bg-white shadow-[0_32px_90px_rgba(24,18,8,0.24)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#f2ecdd] bg-[#fffdf7] px-7 py-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#b29d61]">Tasks Registry</p>
            <h2 className="mt-2 text-[28px] font-black tracking-tight text-[#1f1c14]">
              Add New <span className="italic text-[#d2a721]">Task</span>
            </h2>
            <p className="mt-2 max-w-xl text-[13px] font-medium leading-relaxed text-[#7b7465]">
              Capture the task details, due schedule, and team assignments without breaking the current workflow.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-[#ece4cf] p-3 text-[#99876a] transition-colors hover:bg-[#faf5e6] hover:text-[#1f1c14]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setError('');

            if (!formData.title.trim() || !formData.description.trim()) {
              setError('Complete the title and description before creating this task.');
              return;
            }

            if (formData.assignees.length === 0) {
              setError('Assign at least one staff member before creating this task.');
              return;
            }

            if (!formData.dueDate || !formData.dueTime) {
              setError('Choose both a due date and a due time.');
              return;
            }

            if (isPastDateTime(formData.dueDate, formData.dueTime)) {
              setError('Past due dates and times are not allowed.');
              return;
            }

            try {
              setIsSubmitting(true);
              const idToken = await user?.getIdToken();
              const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
                },
                body: JSON.stringify({
                  eventId,
                  title: formData.title.trim(),
                  description: formData.description.trim(),
                  status: 'TO DO',
                  priority: formData.priority,
                  dueDate: formData.dueDate,
                  dueTime: formData.dueTime,
                  assignee: formData.assignees,
                  vendor: formData.vendor,
                }),
              });

              if (!response.ok) {
                const payload = await response.json().catch(() => ({}));
                throw new Error(payload.error || 'Failed to create task.');
              }

              const createdTask = await response.json();
              onTaskCreated(createdTask);
              onClose();
            } catch (submitError) {
              setError(submitError instanceof Error ? submitError.message : 'Failed to create task.');
              setIsSubmitting(false);
              return;
            }

            setIsSubmitting(false);
          }}
          className="space-y-6 px-7 py-7"
        >
          {error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-[12px] font-bold text-red-600">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-5">
            <div className="space-y-2">
              <label className="block text-[11px] font-black uppercase tracking-[0.18em] text-[#8b8371]">
                Task Title
              </label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))}
                placeholder="e.g. Lock vendor walkthrough and staging cues"
                className="w-full rounded-2xl border border-[#e7dfc9] bg-white px-4 py-3.5 text-[14px] font-extrabold text-[#1f1c14] outline-none transition-all placeholder:text-[#b7ae99] focus:border-[#d2a721] focus:ring-2 focus:ring-[#f4d66f]/30"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-black uppercase tracking-[0.18em] text-[#8b8371]">
                Description
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
                placeholder="Add the delivery notes, expected output, or any production-sensitive context."
                className="w-full resize-none rounded-[24px] border border-[#e7dfc9] bg-white px-4 py-3.5 text-[14px] font-medium leading-relaxed text-[#1f1c14] outline-none transition-all placeholder:text-[#b7ae99] focus:border-[#d2a721] focus:ring-2 focus:ring-[#f4d66f]/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <TaskSelect
              label="Priority"
              value={formData.priority}
              onChange={(priority) => setFormData((current) => ({ ...current, priority }))}
              options={TASK_PRIORITY_OPTIONS}
              size="modal"
              overlayMinWidth={240}
              triggerClassName="w-full"
            />

            <TaskSelect
              label="Vendor Partner"
              value={formData.vendor}
              onChange={(vendor) => setFormData((current) => ({ ...current, vendor }))}
              options={vendorOptions}
              size="modal"
              overlayMinWidth={220}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <TaskDatePicker
              label="Due Date"
              value={formData.dueDate}
              onChange={(dueDate) => setFormData((current) => ({ ...current, dueDate }))}
              minDate={getTodayDate()}
              size="modal"
            />

            <TaskTimeField
              label="Due Time"
              value={formData.dueTime}
              min={minTime}
              onChange={(dueTime) => setFormData((current) => ({ ...current, dueTime }))}
              size="modal"
            />
          </div>

          <TaskMultiSelect
            label="Assignees"
            values={formData.assignees}
            onChange={(assignees) => setFormData((current) => ({ ...current, assignees }))}
            options={staffOptions}
            emptyLabel="Select staff"
            size="modal"
            overlayMinWidth={320}
          />

          <div className="flex items-center justify-end gap-3 border-t border-[#f2ecdd] pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#8b8371] transition-colors hover:text-[#1f1c14]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#d2a721] px-6 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-[0_14px_30px_rgba(210,167,33,0.25)] transition-all hover:bg-[#bf9514] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
