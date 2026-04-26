'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';

import { useAuth } from '@/components/auth/AuthProvider';

import { CreateTaskModal } from './components/CreateTaskModal';
import { TasksRegistry } from './components/TasksRegistry';
import type { CreateTaskDraft, TaskItem, TaskRecord } from './types';
import { extractNames, mapTaskRecord } from './utils';

export default function TasksAdminPage({ params }: { params: Promise<{ slug: string }> }) {
  const unwrappedParams = use(params);
  const eventId = unwrappedParams.slug;
  const { user } = useAuth();

  const [eventTitle, setEventTitle] = useState('');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [staffOptions, setStaffOptions] = useState<string[]>([]);
  const [vendorOptions, setVendorOptions] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredTasks = filterStatus === 'ALL' ? tasks : tasks.filter((task) => task.status === filterStatus);

  useEffect(() => {
    if (!user) return;

    const fetchEventTitle = async () => {
      try {
        const idToken = await user.getIdToken();
        const response = await fetch(`/api/events/${eventId}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });

        if (!response.ok) {
          return;
        }

        const eventData = await response.json();
        if (eventData?.title) {
          setEventTitle(eventData.title);
        }
      } catch (error) {
        console.error('Failed to load event title:', error);
      }
    };

    const fetchTasks = async () => {
      try {
        console.info('[TasksAdmin] Fetching tasks', { eventId });
        const idToken = await user.getIdToken();
        const requestUrl = `/api/tasks?eventId=${eventId}`;
        console.info('[TasksAdmin] Request', requestUrl);
        const response = await fetch(requestUrl, {
          headers: { Authorization: `Bearer ${idToken}` },
        });

        console.info('[TasksAdmin] Response status', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('[TasksAdmin] Error response', errorData);
          throw new Error(errorData.error || 'Failed to fetch tasks');
        }

        const payload = await response.json();
        console.info('[TasksAdmin] Payload', payload);

        const records = Array.isArray(payload) ? payload : payload?.tasks || [];
        console.info('[TasksAdmin] Records count', records.length);
        setTasks(records.map((record: TaskRecord, index: number) => mapTaskRecord(record, index)));
      } catch (error) {
        console.error('Failed to load tasks:', error);
        setTasks([]);
      }
    };

    const fetchDropdownOptions = async () => {
      try {
        const idToken = await user.getIdToken();

        const [staffResponse, vendorResponse] = await Promise.all([
          fetch('/api/staffs', {
            headers: { Authorization: `Bearer ${idToken}` },
          }),
          fetch('/api/vendors', {
            headers: { Authorization: `Bearer ${idToken}` },
          }),
        ]);

        if (staffResponse.ok) {
          const staffPayload = await staffResponse.json();
          const staffNames = extractNames(staffPayload);
          setStaffOptions(Array.from(new Set([...staffNames, 'Unassigned'])));
        }

        if (vendorResponse.ok) {
          const vendorPayload = await vendorResponse.json();
          const vendorNames = extractNames(vendorPayload);
          setVendorOptions(Array.from(new Set(['None', ...vendorNames])));
        }
      } catch (error) {
        console.error('Failed to load dropdown options:', error);
      }
    };

    fetchEventTitle();
    fetchTasks();
    fetchDropdownOptions();
  }, [eventId, user]);

  const handleAddTask = async (newTask: CreateTaskDraft) => {
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          eventId,
          title: newTask.title,
          description: newTask.description,
          status: newTask.status,
          priority: newTask.priority,
          dueDate: newTask.dueDate,
          dueTime: newTask.dueTime,
          assignee: newTask.assignee,
          vendor: newTask.vendor,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create task');
      }

      const createdTask = await response.json();
      setTasks((prevTasks) => [mapTaskRecord(createdTask, 0), ...prevTasks]);
      return true;
    } catch (error) {
      console.error('Failed to create task:', error);
      return false;
    }
  };

  const updateTaskStatus = async (taskToUpdate: TaskItem, nextStatus: string) => {
    const previousStatus = tasks.find((task) => task.id === taskToUpdate.id)?.status;

    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === taskToUpdate.id ? { ...task, status: nextStatus } : task))
    );

    try {
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          taskObjectId: taskToUpdate.dbId,
          taskId: taskToUpdate.taskCode || taskToUpdate.id,
          status: nextStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
      if (previousStatus) {
        setTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === taskToUpdate.id ? { ...task, status: previousStatus } : task))
        );
      }
    }
  };

  const updateTaskField = async (taskToUpdate: TaskItem, field: 'assignee' | 'vendor', value: string) => {
    const previousValue = tasks.find((task) => task.id === taskToUpdate.id)?.[field];

    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === taskToUpdate.id ? { ...task, [field]: value } : task))
    );

    try {
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          taskObjectId: taskToUpdate.dbId,
          taskId: taskToUpdate.taskCode || taskToUpdate.id,
          [field]: value,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update ${field}`);
      }
    } catch (error) {
      console.error(`Failed to update task ${field}:`, error);
      if (previousValue) {
        setTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === taskToUpdate.id ? { ...task, [field]: previousValue } : task))
        );
      }
    }
  };

  return (
    <div className="animate-in fade-in duration-500 w-full px-4 sm:px-6 lg:px-8 pb-12 mt-2">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
        <div className="max-w-3xl">
          <p className="text-[#a1a1aa] text-[10px] font-extrabold tracking-widest uppercase mb-3 flex items-center gap-2">
            <Link href="/admin/events" className="hover:text-[#1d1d1f] transition-colors">Events</Link> <ArrowRight size={10} /> <span className="text-[#1d1d1f]">{eventTitle || 'Event'}</span>
          </p>
          <h1 className="text-5xl font-black text-[#1d1d1f] tracking-tight">
            Event <span className="text-[#eebf43] italic pr-2">Tasks</span>
          </h1>
          <p className="text-[#71717a] text-sm mt-4 max-w-md leading-relaxed font-medium">
            Monitor deliverables across all your events. Keep your production timeline running seamlessly and easily assign responsibilities to staff.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-7 py-3.5 bg-[#eebf43] hover:bg-[#dcae32] text-white text-[11px] font-black tracking-[0.1em] uppercase transition-colors rounded-xl shadow-md shadow-[#eebf43]/20 shrink-0"
        >
          <Plus className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          ADD NEW TASK
        </button>
      </div>

      <TasksRegistry
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        filteredTasks={filteredTasks}
        totalTasks={tasks.length}
        vendorOptions={vendorOptions}
        staffOptions={staffOptions}
        onUpdateTaskStatus={updateTaskStatus}
        onUpdateTaskField={updateTaskField}
      />

      {isModalOpen && (
        <CreateTaskModal
          staffOptions={staffOptions}
          vendorOptions={vendorOptions}
          onClose={() => setIsModalOpen(false)}
          onCreate={handleAddTask}
        />
      )}
    </div>
  );
}
