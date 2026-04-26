'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

import { DEFAULT_NEW_TASK, PRIORITY_OPTIONS } from '../constants';
import type { CreateTaskDraft } from '../types';
import { buildTimeOptions, getDueDateTimeError, getNextSelectableDateTime, toDateInputValue, toTimeInputValue } from '../utils';
import { OverlayDatePicker, OverlaySelect } from './OverlayControls';

export const CreateTaskModal = ({
  staffOptions,
  vendorOptions,
  onClose,
  onCreate,
}: {
  staffOptions: string[];
  vendorOptions: string[];
  onClose: () => void;
  onCreate: (draft: CreateTaskDraft) => Promise<boolean>;
}) => {
  const [draft, setDraft] = useState<CreateTaskDraft>(DEFAULT_NEW_TASK);
  const [dueDateTimeError, setDueDateTimeError] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState(() => new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setCurrentDateTime(new Date());
    const intervalId = window.setInterval(() => {
      setCurrentDateTime(new Date());
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setDueDateTimeError(getDueDateTimeError(draft.dueDate, draft.dueTime, currentDateTime));
  }, [currentDateTime, draft.dueDate, draft.dueTime]);

  const nextSelectableDateTime = getNextSelectableDateTime(currentDateTime);
  const minSelectableDateValue = toDateInputValue(nextSelectableDateTime);
  const minTimeForToday = draft.dueDate === minSelectableDateValue ? toTimeInputValue(nextSelectableDateTime) : undefined;
  const timeOptions = useMemo(
    () => buildTimeOptions(minTimeForToday),
    [minTimeForToday]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setDueDateTimeError('');
    if (!draft.title || !draft.assignee || !draft.dueDate || !draft.dueTime || isSubmitting) return;

    const validationError = getDueDateTimeError(draft.dueDate, draft.dueTime, new Date());
    if (validationError) {
      setDueDateTimeError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      const didCreate = await onCreate(draft);
      if (didCreate) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">Add New Task</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">Task Title</label>
            <input
              type="text"
              required
              value={draft.title}
              onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#eebf43] focus:ring-1 focus:ring-[#eebf43] focus:bg-white rounded-xl text-gray-900 text-[14px] font-medium transition-all outline-none"
              placeholder="e.g., Finalize floral arrangements"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">Detailed Description</label>
            <textarea
              required
              rows={3}
              value={draft.description}
              onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#eebf43] focus:ring-1 focus:ring-[#eebf43] focus:bg-white rounded-xl text-gray-900 text-[14px] font-medium transition-all outline-none resize-none"
              placeholder="Include specific requirements, vendor contacts, or special instructions..."
            ></textarea>
          </div>

          <div>
            <div>
              <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">Priority Level</label>
              <OverlaySelect
                value={draft.priority}
                onChange={(value) => setDraft((prev) => ({ ...prev, priority: value }))}
                options={PRIORITY_OPTIONS}
                triggerWrapperClassName="relative"
                preferredWidth={180}
                renderTrigger={(selectedOption) => (
                  <>
                    <div className="flex min-h-[42px] w-full items-center rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-left text-[14px] font-medium text-gray-900 transition-all outline-none cursor-pointer">
                      <span className="truncate whitespace-nowrap">{selectedOption?.label || 'Medium'}</span>
                    </div>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[#71717a]">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </>
                )}
                renderOption={(option, selected) => (
                  <>
                    <div className="truncate whitespace-nowrap text-[12px] font-extrabold text-gray-800">{option.label}</div>
                    {selected && <Check size={15} className="shrink-0 text-[#facc15]" />}
                  </>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <OverlayDatePicker
                label="Due Date"
                value={draft.dueDate}
                minDate={minSelectableDateValue}
                onChange={(value) => {
                  setDraft((prev) => {
                    const nextTask = { ...prev, dueDate: value };
                    const hasInvalidTime = !!prev.dueTime && !!getDueDateTimeError(value, prev.dueTime, currentDateTime);
                    return hasInvalidTime ? { ...nextTask, dueTime: '' } : nextTask;
                  });
                  setDueDateTimeError('');
                }}
              />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">Due Time</label>
              <OverlaySelect
                value={draft.dueTime}
                onChange={(value) => {
                  setDraft((prev) => ({ ...prev, dueTime: value }));
                  setDueDateTimeError('');
                }}
                options={[
                  { value: '', label: 'Select due time...' },
                  ...timeOptions,
                ]}
                triggerWrapperClassName="relative"
                preferredWidth={180}
                preferredHeight={360}
                renderTrigger={(selectedOption) => (
                  <>
                    <div className="flex min-h-[42px] w-full items-center rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-left text-[14px] font-medium text-gray-900 transition-all outline-none cursor-pointer">
                      <span className={`truncate whitespace-nowrap ${selectedOption?.value ? 'text-gray-900' : 'text-gray-400'}`}>
                        {selectedOption?.value ? selectedOption.label : 'Select due time...'}
                      </span>
                    </div>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[#71717a]">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </>
                )}
                renderOption={(option, selected) => (
                  <>
                    <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                      <div className={`truncate whitespace-nowrap text-[12px] font-extrabold tabular-nums ${option.value ? 'text-gray-800' : 'text-gray-500'}`}>{option.label}</div>
                      {option.value && <div className="shrink-0 whitespace-nowrap text-right text-[10px] font-bold uppercase tracking-wider text-gray-400 tabular-nums">{option.sublabel}</div>}
                    </div>
                    {selected && option.value && <Check size={15} className="shrink-0 text-[#facc15]" />}
                  </>
                )}
              />
            </div>
          </div>

          {dueDateTimeError && (
            <div className="text-[12px] font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {dueDateTimeError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">Assignee (Staff Pool)</label>
              <OverlaySelect
                value={draft.assignee}
                onChange={(value) => setDraft((prev) => ({ ...prev, assignee: value }))}
                options={[
                  { value: '', label: 'Select a team member...' },
                  ...(staffOptions.length ? staffOptions : ['Unassigned']).map((staffName) => ({ value: staffName, label: staffName })),
                ]}
                triggerWrapperClassName="relative"
                preferredWidth={200}
                renderTrigger={(selectedOption) => (
                  <>
                    <div className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#eebf43] focus:bg-white rounded-xl text-[14px] font-medium transition-all outline-none cursor-pointer text-left text-gray-900 min-h-[42px] flex items-center">
                      <span className={`truncate whitespace-nowrap ${selectedOption?.value ? 'text-gray-900' : 'text-gray-400'}`}>
                        {selectedOption?.label || 'Select a team member...'}
                      </span>
                    </div>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[#71717a]">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </>
                )}
                renderOption={(option, selected) => (
                  <>
                    <div className={`truncate whitespace-nowrap text-[12px] font-extrabold ${option.value ? 'text-gray-800' : 'text-gray-500'}`}>{option.label}</div>
                    {selected && option.value && <Check size={15} className="shrink-0 text-[#facc15]" />}
                  </>
                )}
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">Vendor Partner</label>
              <OverlaySelect
                value={draft.vendor}
                onChange={(value) => setDraft((prev) => ({ ...prev, vendor: value }))}
                options={(vendorOptions.length ? vendorOptions : ['None']).map((vendorName) => ({ value: vendorName, label: vendorName }))}
                triggerWrapperClassName="relative"
                preferredWidth={180}
                renderTrigger={(selectedOption) => (
                  <>
                    <div className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#eebf43] focus:bg-white rounded-xl text-gray-900 text-[14px] font-medium transition-all outline-none cursor-pointer text-left min-h-[42px] flex items-center">
                      <span className="truncate whitespace-nowrap">{selectedOption?.label || 'None'}</span>
                    </div>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[#71717a]">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </>
                )}
                renderOption={(option, selected) => (
                  <>
                    <div className="truncate whitespace-nowrap text-[12px] font-extrabold text-gray-800">{option.label}</div>
                    {selected && <Check size={15} className="shrink-0 text-[#facc15]" />}
                  </>
                )}
              />
            </div>
          </div>

          <div className="pt-5 mt-2 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-[12px] font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-[#eebf43] hover:bg-[#dcae32] disabled:opacity-70 text-white text-[12px] font-extrabold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#eebf43]/20"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
