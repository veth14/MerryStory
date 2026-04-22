'use client';
import React, { useState, use } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';

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
    vendor: 'Grand Ballroom SMX',
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
    vendor: 'Taste of Manila Catering',
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
    vendor: 'None',
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
    vendor: 'Lumina Floral Design',
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
      assignee: '',
      vendor: 'None'
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
        vendor: newTask.vendor,
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
        assignee: '',
        vendor: 'None'
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
      {/* Header Section */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
        <div className="max-w-3xl">
          <p className="text-[#a1a1aa] text-[10px] font-extrabold tracking-widest uppercase mb-3 flex items-center gap-2">
            <Link href="/admin/events" className="hover:text-[#1d1d1f] transition-colors">Events</Link> <ArrowRight size={10} /> <span className="text-[#1d1d1f]">{eventName}</span>
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

      {/* Main Registry Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tool bar */}
        <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100">
          <h2 className="text-[15px] font-extrabold text-gray-900 uppercase tracking-widest">LIVE TASKS REGISTRY</h2>
          <div className="flex items-center gap-4">
            {/* Filter Button / Select */}
            <div className="relative">
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="appearance-none flex items-center justify-center gap-2 pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg text-[12px] font-black text-gray-700 tracking-widest uppercase hover:bg-gray-50 transition-colors shrink-0 outline-none cursor-pointer"
              >
                <option value="ALL">ALL STATUS</option>
                <option value="TO DO">TO DO</option>
                <option value="IN PROGRESS">IN PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              <svg className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>

        {/* Table View */}
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
                let statusColor = "text-gray-500 bg-gray-50";
                let dotColor = "bg-gray-400";
                if (task.status === 'COMPLETED') {
                  statusColor = "text-emerald-700 bg-emerald-50";
                  dotColor = "bg-emerald-500";
                } else if (task.status === 'IN PROGRESS') {
                  statusColor = "text-[#b48600] bg-[#facc15]/20";
                  dotColor = "bg-[#facc15]";
                }

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
                      <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-widest ${statusColor}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                        {task.status}
                      </span>
                    </td>

                    <td className="px-4 md:px-6 py-4 text-center align-middle">
                      <div className="text-[11px] font-bold text-gray-600">{task.dueDate}</div>
                      <div className="text-[10px] font-bold text-gray-400 mt-0.5">{task.dueTime || 'EOD'}</div>
                    </td>

                    <td className="px-4 md:px-6 py-4 text-center align-middle">
                      <div className="relative inline-block w-full max-w-[140px]">
                         <select 
                            value={task.vendor || 'None'}
                            onChange={(e) => {
                              const updatedTasks = tasks.map(t => t.id === task.id ? {...t, vendor: e.target.value} : t);
                              setTasks(updatedTasks);
                            }}
                            className="appearance-none w-full pl-3 pr-8 py-1.5 bg-gray-50 border border-gray-100 rounded-md text-[10px] font-bold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors outline-none cursor-pointer text-center truncate"
                          >
                            <option value="None">None</option>
                            <option value="Taste of Manila Catering">Taste of Manila Catering</option>
                            <option value="Snap & Shoot Studios">Snap & Shoot Studios</option>
                            <option value="Lumina Floral Design">Lumina Floral Design</option>
                            <option value="Grand Ballroom SMX">Grand Ballroom SMX</option>
                            <option value="The Harmony Strings">The Harmony Strings</option>
                            <option value="Lux Event Rentals">Lux Event Rentals</option>
                          </select>
                          <svg className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </td>

                    <td className="px-4 md:px-6 py-4 text-right align-middle">
                       <div className="flex items-center justify-end gap-3">
                         <div className="relative">
                            <select 
                               value={task.assignee}
                               onChange={(e) => {
                                 const updatedTasks = tasks.map(t => t.id === task.id ? {...t, assignee: e.target.value} : t);
                                 setTasks(updatedTasks);
                               }}
                               className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-gray-200 rounded-md text-[11px] font-bold text-[#1d1d1f] hover:bg-gray-50 transition-colors shrink-0 outline-none cursor-pointer"
                             >
                               <option value="Alesia">Alesia</option>
                               <option value="Julian">Julian</option>
                               <option value="Sarah">Sarah</option>
                               <option value="Ian">Ian</option>
                               <option value="Unassigned">Unassigned</option>
                             </select>
                             <svg className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                         </div>
                         <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[10px] font-black border border-white shadow-sm overflow-hidden shrink-0">
                           <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignee}`} alt={task.assignee} className="w-full h-full object-cover" />
                         </div>
                       </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer info & inline Pagination */}
        <div className="p-4 md:p-5 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-50/30">
          <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
            SHOWING 1-{filteredTasks.length} OF {tasks.length} TASKS
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
                <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">Task Title</label>
                <input 
                  type="text"
                  required
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#eebf43] focus:ring-1 focus:ring-[#eebf43] focus:bg-white rounded-xl text-gray-900 text-[14px] font-medium transition-all outline-none"
                  placeholder="e.g., Finalize floral arrangements"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">Detailed Description</label>
                <textarea 
                  required
                  rows={3}
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#eebf43] focus:ring-1 focus:ring-[#eebf43] focus:bg-white rounded-xl text-gray-900 text-[14px] font-medium transition-all outline-none resize-none"
                  placeholder="Include specific requirements, vendor contacts, or special instructions..."
                ></textarea>
              </div>

              <div>
                <div>
                  <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">Priority Level</label>
                  <select 
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value as any})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#eebf43] focus:bg-white rounded-xl text-gray-900 text-[14px] font-medium transition-all outline-none appearance-none cursor-pointer"
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
                  <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">Due Date</label>
                  <input 
                    type="date"
                    required
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#eebf43] focus:bg-white rounded-xl text-gray-900 text-[14px] font-medium transition-all outline-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">Due Time</label>
                  <input 
                    type="time"
                    required
                    value={newTask.dueTime}
                    onChange={(e) => setNewTask({...newTask, dueTime: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#eebf43] focus:bg-white rounded-xl text-gray-900 text-[14px] font-medium transition-all outline-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">Assignee (Staff Pool)</label>
                  <div className="relative">
                    <select 
                      required
                      value={newTask.assignee}
                      onChange={(e) => setNewTask({...newTask, assignee: e.target.value})}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#eebf43] focus:bg-white rounded-xl text-gray-900 text-[14px] font-medium transition-all outline-none appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Select a team member...</option>
                      <option value="Elena">Elena Vance</option>
                      <option value="Julian">Julian</option>
                      <option value="Sarah">Sarah</option>
                      <option value="Ian">Ian</option>
                      <option value="Alesia">Alesia</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[#71717a]">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">Vendor Partner</label>
                  <div className="relative">
                    <select 
                      value={newTask.vendor}
                      onChange={(e) => setNewTask({...newTask, vendor: e.target.value})}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#eebf43] focus:bg-white rounded-xl text-gray-900 text-[14px] font-medium transition-all outline-none appearance-none cursor-pointer"
                    >
                      <option value="None">None</option>
                      <option value="Taste of Manila Catering">Taste of Manila Catering</option>
                      <option value="Snap & Shoot Studios">Snap & Shoot Studios</option>
                      <option value="Lumina Floral Design">Lumina Floral Design</option>
                      <option value="Grand Ballroom SMX">Grand Ballroom SMX</option>
                      <option value="The Harmony Strings">The Harmony Strings</option>
                      <option value="Lux Event Rentals">Lux Event Rentals</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[#71717a]">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
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
                  className="px-8 py-3 bg-[#eebf43] hover:bg-[#dcae32] text-white text-[12px] font-extrabold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#eebf43]/20"
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
