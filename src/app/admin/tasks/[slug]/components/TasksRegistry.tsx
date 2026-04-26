'use client';

import React from 'react';
import { Check } from 'lucide-react';

import { FILTER_STATUS_OPTIONS, TASK_STATUS_OPTIONS } from '../constants';
import type { TaskItem } from '../types';
import { getPriorityColor, getTaskStatusTone } from '../utils';
import { OverlaySelect } from './OverlayControls';

export const TasksRegistry = ({
  filterStatus,
  onFilterStatusChange,
  filteredTasks,
  totalTasks,
  vendorOptions,
  staffOptions,
  onUpdateTaskStatus,
  onUpdateTaskField,
}: {
  filterStatus: string;
  onFilterStatusChange: (value: string) => void;
  filteredTasks: TaskItem[];
  totalTasks: number;
  vendorOptions: string[];
  staffOptions: string[];
  onUpdateTaskStatus: (task: TaskItem, nextStatus: string) => void;
  onUpdateTaskField: (task: TaskItem, field: 'assignee' | 'vendor', value: string) => void;
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100">
        <h2 className="text-[15px] font-extrabold text-gray-900 uppercase tracking-widest">LIVE TASKS REGISTRY</h2>
        <div className="flex items-center gap-4">
          <OverlaySelect
            value={filterStatus}
            onChange={onFilterStatusChange}
            options={FILTER_STATUS_OPTIONS}
            triggerWrapperClassName="relative"
            preferredWidth={165}
            renderTrigger={(selectedOption) => (
              <div className="appearance-none flex items-center justify-center gap-2 pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg text-[12px] font-black text-gray-700 tracking-widest uppercase hover:bg-gray-50 transition-colors shrink-0 outline-none cursor-pointer min-w-[165px]">
                {selectedOption?.label || 'ALL STATUS'}
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                <svg className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            )}
            renderOption={(option, selected) => (
              <>
                <div className="truncate whitespace-nowrap text-[12px] font-black text-gray-800 tracking-wider uppercase">{option.label}</div>
                {selected && <Check size={15} className="shrink-0 text-[#facc15]" />}
              </>
            )}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-4 md:px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.2em] w-[35%]">TASK DETAILS</th>
              <th className="px-4 md:px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.2em] text-center w-[15%]">STATUS</th>
              <th className="px-4 md:px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.2em] text-center w-[15%]">DUE</th>
              <th className="px-4 md:px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.2em] text-center w-[15%]">VENDOR</th>
              <th className="px-4 md:px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.2em] text-right w-[20%]">ASSIGNEE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500 font-medium text-[13px]">
                  No tasks found matching your criteria.
                </td>
              </tr>
            ) : filteredTasks.map((task) => {
              const { statusColor, dotColor } = getTaskStatusTone(task.status);

              return (
                <tr key={task.id} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="px-4 md:px-6 py-4">
                    <div className="font-extrabold text-[14px] text-gray-900 group-hover:text-[#eebf43] transition-colors mb-1">{task.title}</div>
                    <div className="text-[12px] font-medium text-[#71717a] line-clamp-2">
                      {task.description}
                    </div>
                    <div className="mt-2">
                      <span className={`px-2 py-0.5 border text-[8px] font-black uppercase tracking-widest rounded-sm ${getPriorityColor(task.priority)}`}>
                        {task.priority} PRIORITY
                      </span>
                    </div>
                  </td>

                  <td className="px-4 md:px-6 py-4 text-center align-middle">
                    <OverlaySelect
                      value={task.status}
                      onChange={(value) => onUpdateTaskStatus(task, value)}
                      options={TASK_STATUS_OPTIONS}
                      triggerWrapperClassName="relative inline-flex items-center"
                      preferredWidth={170}
                      renderTrigger={(selectedOption) => (
                        <>
                          <span className={`absolute left-2.5 w-1.5 h-1.5 rounded-full ${dotColor}`} />
                          <div className={`appearance-none inline-flex items-center gap-2 pl-5 pr-7 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-widest ${statusColor} cursor-pointer`}>
                            {selectedOption?.label || task.status}
                          </div>
                          <svg className="w-3 h-3 text-current absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </>
                      )}
                      renderOption={(option, selected) => (
                        <>
                          <div className="truncate whitespace-nowrap text-[12px] font-extrabold uppercase tracking-wider text-gray-800">{option.label}</div>
                          {selected && <Check size={15} className="shrink-0 text-[#facc15]" />}
                        </>
                      )}
                    />
                  </td>

                  <td className="px-4 md:px-6 py-4 text-center align-middle">
                    <div className="text-[11px] font-bold text-gray-600">{task.dueDate}</div>
                    <div className="text-[10px] font-bold text-gray-400 mt-0.5">{task.dueTime || 'EOD'}</div>
                  </td>

                  <td className="px-4 md:px-6 py-4 text-center align-middle">
                    <OverlaySelect
                      value={task.vendor || 'None'}
                      onChange={(value) => onUpdateTaskField(task, 'vendor', value)}
                      options={[...new Set(['None', ...(vendorOptions.length ? vendorOptions : [task.vendor || 'None'])])].map((vendorName) => ({ value: vendorName, label: vendorName }))}
                      triggerWrapperClassName="relative inline-block w-full max-w-[140px]"
                      preferredWidth={168}
                      renderTrigger={(selectedOption) => (
                        <>
                          <div className="appearance-none w-full pl-3 pr-8 py-1.5 bg-gray-50 border border-gray-100 rounded-md text-[10px] font-bold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors outline-none cursor-pointer text-center truncate">
                            {selectedOption?.label || 'None'}
                          </div>
                          <svg className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </>
                      )}
                      renderOption={(option, selected) => (
                        <>
                          <div className="truncate whitespace-nowrap text-[12px] font-extrabold text-gray-800">{option.label}</div>
                          {selected && <Check size={15} className="shrink-0 text-[#facc15]" />}
                        </>
                      )}
                    />
                  </td>

                  <td className="px-4 md:px-6 py-4 text-right align-middle">
                    <div className="flex items-center justify-end gap-3">
                      <OverlaySelect
                        value={task.assignee}
                        onChange={(value) => onUpdateTaskField(task, 'assignee', value)}
                        options={[...new Set(['Unassigned', ...(staffOptions.length ? staffOptions : [task.assignee || 'Unassigned'])])].map((staffName) => ({ value: staffName, label: staffName }))}
                        triggerWrapperClassName="relative"
                        preferredWidth={168}
                        renderTrigger={(selectedOption) => (
                          <>
                            <div className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-gray-200 rounded-md text-[11px] font-bold text-[#1d1d1f] hover:bg-gray-50 transition-colors shrink-0 outline-none cursor-pointer">
                              {selectedOption?.label || 'Unassigned'}
                            </div>
                            <svg className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </>
                        )}
                        renderOption={(option, selected) => (
                          <>
                            <div className="truncate whitespace-nowrap text-[12px] font-extrabold text-gray-800">{option.label}</div>
                            {selected && <Check size={15} className="shrink-0 text-[#facc15]" />}
                          </>
                        )}
                      />
                      <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[10px] font-black border border-white shadow-sm overflow-hidden shrink-0">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignee}`} alt={task.assignee} className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-4 md:p-5 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-50/30">
        <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
          SHOWING 1-{filteredTasks.length} OF {totalTasks} TASKS
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-200 bg-white rounded-lg text-[11px] font-extrabold text-gray-500 uppercase tracking-widest hover:border-gray-300 hover:text-gray-700 transition-colors shadow-sm">
            PREV
          </button>
          <button className="px-4 py-2 bg-[#facc15] border border-[#eab308] rounded-lg text-[11px] font-extrabold text-gray-900 uppercase tracking-widest hover:bg-[#eab308] transition-colors shadow-sm">
            NEXT
          </button>
        </div>
      </div>
    </div>
  );
};
