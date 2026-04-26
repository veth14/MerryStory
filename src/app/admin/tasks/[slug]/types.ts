export type TaskItem = {
  id: string;
  dbId?: string;
  taskCode?: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  dueTime: string;
  assignee: string;
  vendor: string;
};

export type TaskRecord = {
  _id?: string;
  taskId?: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  due?: { date?: string; time?: string };
  dueDate?: string;
  dueTime?: string;
  assignee?: { name?: string } | string;
  vendor?: { name?: string } | string;
};

export type OptionRecord = {
  name?: string;
  firstName?: string;
  lastName?: string;
};

export type SelectOption = {
  value: string;
  label: string;
  sublabel?: string;
};

export type CreateTaskDraft = {
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  dueTime: string;
  assignee: string;
  vendor: string;
};
