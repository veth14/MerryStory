'use client';
import React, { useState, use } from 'react';
import Link from 'next/link';

// Example Mock Data for production tasks
const INITIAL_TASKS = [
  {
    id: 'TSK-001',
    title: 'Confirm Starlight Gala Venue Capacity',
    description: 'Finalize the floor plan with the venue manager to ensure we can accommodate the VIP list.',
    status: 'IN PROGRESS',
    priority: 'HIGH',
    dueDate: 'Oct 15, 2024',
    dueTime: '14:00',
    assignee: 'Alesia',
  },
  {
    id: 'TSK-002',
    title: 'Finalize Catering Menu Tasting',
    description: 'Schedule tasting sessions with the premium caterers for the Corporate Summit.',
    status: 'TO DO',
    priority: 'MEDIUM',
    dueDate: 'Oct 18, 2024',
    dueTime: '10:30',
    assignee: 'Julian',
  },
  {
    id: 'TSK-003',
    title: 'Send Invitations for Spring Awakening',
    description: 'Draft the email and physical invitations to the curated guest list.',
    status: 'TO DO',
    priority: 'HIGH',
    dueDate: 'Oct 20, 2024',
    dueTime: '09:00',
    assignee: 'Sarah',
  },
  {
    id: 'TSK-004',
    title: 'Secure Golden Accents Decor',
    description: 'Source 200 gold-plated centerpieces from the artisan vendor.',
    status: 'COMPLETED',
    priority: 'LOW',
    dueDate: 'Oct 10, 2024',
    dueTime: '16:45',
    assignee: 'Ian',
  },
];

export default function TasksAdminPage({ params }: { params: Promise<{ slug: string }> }) {
  const unwrappedParams = use(params);
  const slug = unwrappedParams.slug;
  const eventName = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const filteredTasks = filterStatus === 'ALL' ? tasks : tasks.filter(t => t.status === filterStatus);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'TO DO',
    priority: 'MEDIUM',
    dueDate: '',
      dueTime: '',
      assignee: ''
    });

    const handleAddTask = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTask.title || !newTask.assignee) return;

      const taskToAdd = {
        id: `TSK-00${tasks.length + 1}`,
        title: newTask.title,
        description: newTask.description,
        status: newTask.status,
        priority: newTask.priority,
        dueDate: newTask.dueDate || 'No Date',
        dueTime: newTask.dueTime || 'Any Time',
        assignee: newTask.assignee,
      };

      setTasks([taskToAdd, ...tasks]);
      setIsModalOpen(false);
      setNewTask({
        title: '',
        description: '',
        status: 'TO DO',
        priority: 'MEDIUM',
        dueDate: '',
        dueTime: '',
        assignee: ''
      });
    };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-700 bg-red-50 border-red-200';
      case 'MEDIUM': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'LOW': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TO DO': return 'bg-gray-100 text-gray-500';
      case 'IN PROGRESS': return 'bg-[#facc15]/20 text-[#b48600]';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  return (
    <div className="animate-in fade-in duration-500 w-full px-4 sm:px-6 lg:px-8 pb-12 mt-2">
      {/* Breadcrumb / Back Navigation */}
      <div className="w-full mb-4">
        <Link href="/admin/events" className="inline-flex items-center gap-2 text-[11px] font-extrabold text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-colors mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          BACK TO EVENTS
        </Link>
      </div>

      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">{eventName} Tasks</h1>
          <p className="text-gray-500 text-[14px] font-medium leading-relaxed">
            Monitor deliverables across all your events. Keep your production timeline running seamlessly.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-900 hover:bg-black text-white text-[11px] font-extrabold uppercase tracking-widest rounded-sm transition-all shadow-xl shadow-gray-900/20 shrink-0"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
          ADD NEW TASK
        </button>
      </div>

      {/* Control Board */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
         <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'TO DO', 'IN PROGRESS', 'COMPLETED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest rounded-md transition-all whitespace-nowrap ${
                  filterStatus === status 
                    ? 'bg-[#facc15] text-gray-900 shadow-md shadow-[#facc15]/20' 
                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                {status}
              </button>
            ))}
         </div>
         <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-md w-full sm:w-auto text-center shrink-0">
           {filteredTasks.length} TASKS FOUND
         </div>
      </div>

      {/* Task Grid (Masonry/Responsive Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map((task) => (
          <div key={task.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative group hover:shadow-md transition-shadow flex flex-col h-full hover:border-[#facc15]/50">
             <div className="flex items-start justify-between mb-4">
                <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-md ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
                <span className={`px-2 py-0.5 border text-[9px] font-black uppercase tracking-widest rounded-sm ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
             </div>
             
             <h3 className="text-[16px] font-extrabold text-gray-900 leading-tight mb-2 group-hover:text-[#d4a017] transition-colors line-clamp-2">
               {task.title}
             </h3>
             
             <p className="text-gray-500 text-[13px] font-medium leading-relaxed mb-6 flex-grow">
               {task.description}
             </p>

             <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[10px] font-black border border-white shadow-sm overflow-hidden">
                     <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignee}`} alt={task.assignee} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">ASSIGNEE</span>
                    <span className="text-[12px] font-bold text-gray-900">{task.assignee}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                   <svg className="w-4 h-4 text-gray-300 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                   <span className="text-[11px] font-bold text-gray-500">{task.dueDate}</span>                     {task.dueTime && <span className="text-[9px] font-bold text-gray-400 mt-0.5">{task.dueTime}</span>}                </div>
             </div>
          </div>
        ))}
      </div>

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Add New Task</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleAddTask} className="p-6 space-y-5">
              <div>
                <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Task Title</label>
                <input 
                  type="text"
                  required
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] focus:bg-white rounded-xl text-gray-900 text-[14px] font-medium transition-all outline-none"
                  placeholder="e.g., Finalize floral arrangements"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Detailed Description</label>
                <textarea 
                  required
                  rows={3}
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] focus:bg-white rounded-xl text-gray-900 text-[14px] font-medium transition-all outline-none resize-none"
                  placeholder="Include specific requirements, vendor contacts, or special instructions..."
                ></textarea>
              </div>

              <div>
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Priority Level</label>
                  <select 
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value as any})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#D4AF37] focus:bg-white rounded-xl text-gray-900 text-[14px] font-medium transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value="CRITICAL">🔴 Critical</option>
                    <option value="HIGH">🟠 High</option>
                    <option value="MEDIUM">🟡 Medium</option>
                    <option value="LOW">🟢 Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Due Date</label>
                  <input 
                    type="date"
                    required
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#D4AF37] focus:bg-white rounded-xl text-gray-900 text-[14px] font-medium transition-all outline-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Due Time</label>
                  <input 
                    type="time"
                    required
                    value={newTask.dueTime}
                    onChange={(e) => setNewTask({...newTask, dueTime: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#D4AF37] focus:bg-white rounded-xl text-gray-900 text-[14px] font-medium transition-all outline-none cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Assignee (Staff Pool)</label>
                <div className="relative">
                  <select 
                    required
                    value={newTask.assignee}
                    onChange={(e) => setNewTask({...newTask, assignee: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#D4AF37] focus:bg-white rounded-xl text-gray-900 text-[14px] font-medium transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select a team member...</option>
                    <option value="EV">Elena Vance (Creative Director)</option>
                    <option value="JD">James Director (Event Manager)</option>
                    <option value="SO">Sarah Operations (Logistics Lead)</option>
                    <option value="MV">Michael Vendor (Vendor Relations)</option>
                    <option value="CS">Chloe Styles (Design & Styling)</option>
                    <option value="AG">Alex Garcia (Technical Director)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              <div className="pt-5 mt-2 flex items-center justify-end gap-3 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 text-[12px] font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-8 py-3 bg-[#D4AF37] hover:bg-[#C5A028] text-white text-[12px] font-extrabold uppercase tracking-widest rounded-sm transition-all shadow-lg shadow-[#D4AF37]/20"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
