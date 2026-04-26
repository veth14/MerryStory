import type { CreateTaskDraft, SelectOption } from './types';

export const FILTER_STATUS_OPTIONS: SelectOption[] = [
  { value: 'ALL', label: 'ALL STATUS' },
  { value: 'TO DO', label: 'TO DO' },
  { value: 'IN PROGRESS', label: 'IN PROGRESS' },
  { value: 'COMPLETED', label: 'COMPLETED' },
];

export const TASK_STATUS_OPTIONS: SelectOption[] = [
  { value: 'TO DO', label: 'TO DO' },
  { value: 'IN PROGRESS', label: 'IN PROGRESS' },
  { value: 'COMPLETED', label: 'COMPLETED' },
];

export const PRIORITY_OPTIONS: SelectOption[] = [
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

export const DEFAULT_NEW_TASK: CreateTaskDraft = {
  title: '',
  description: '',
  status: 'TO DO',
  priority: 'MEDIUM',
  dueDate: '',
  dueTime: '',
  assignee: '',
  vendor: 'None',
};
