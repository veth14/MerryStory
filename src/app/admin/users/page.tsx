'use client';
import React, { useState, useRef } from 'react';
import { MoreVertical, Users, BadgeCheck, Mail, ChevronLeft, ChevronRight, ShieldAlert, Download, Plus, ArrowRight } from 'lucide-react';

const INITIAL_USERS = [
  { id: 'USL-001', name: 'Elena Vance', email: 'elena.v@merrystory.com', role: 'ADMINISTRATOR', status: 'Active', statusColor: 'bg-emerald-500', lastActive: '2 mins ago', avatar: 'https://i.pravatar.cc/150?u=12' },
  { id: 'USR-002', name: 'Julian Thorne', email: 'j.thorne@merrystory.com', role: 'LEAD COORDINATOR', status: 'On-Site', statusColor: 'bg-amber-500', lastActive: '4 hours ago', avatar: 'https://i.pravatar.cc/150?u=15' },
  { id: 'USR-003', name: 'Marcus Webb', email: 'm.webb@merrystory.com', role: 'PRODUCTION STAFF', status: 'Away', statusColor: 'bg-blue-400', lastActive: 'Yesterday', avatar: '' },
  { id: 'USR-004', name: 'Sienna Rossi', email: 's.rossi@merrystory.com', role: 'ADMINISTRATOR', status: 'Active', statusColor: 'bg-emerald-500', lastActive: '15 mins ago', avatar: 'https://i.pravatar.cc/150?u=18' },
];

export default function UsersAdministrationPage() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  const [formData, setFormData] = useState({ name: '', email: '', role: 'PRODUCTION STAFF', status: 'Active', avatar: '' });

  const handleAddNew = () => {
    setFormData({ name: '', email: '', role: 'PRODUCTION STAFF', status: 'Active', avatar: '' });
    setEditingUser(null);
    setIsAddingUser(true);
  };

  const handleEdit = (user: any) => {
    setFormData(user);
    setEditingUser(user);
    setIsAddingUser(true);
  };

  const handleDelete = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...formData, id: u.id, statusColor: u.statusColor, lastActive: u.lastActive } : u));
    } else {
      const newId = `USR-00${users.length + 1}`;
      setUsers([...users, { ...formData, id: newId, statusColor: 'bg-emerald-500', lastActive: 'Just now' }]);
    }
    setIsAddingUser(false);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full max-w-none">
      <div className="w-full text-[#1d1d1f]">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6 pt-2">
          <div>
            <p className="text-[#a1a1aa] text-[10px] font-extrabold tracking-widest uppercase mb-3 flex items-center gap-2">
              System Admin <ArrowRight size={10} /> <span className="text-[#1d1d1f]">Access Control</span>
            </p>
            <h1 className="text-5xl font-black text-[#1d1d1f] tracking-tight">
              Users & <span className="text-[#eebf43] italic pr-2">Management</span>
            </h1>
            <p className="text-[#71717a] text-sm mt-4 max-w-md leading-relaxed font-medium">
              Curate your production collective. Assign roles that mirror the bespoke precision of your events.
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0 mt-4 md:mt-0">
            <button className="flex items-center justify-center gap-2 px-7 py-3.5 bg-white border border-gray-200 text-[#0f172a] text-[11px] font-black tracking-[0.1em] uppercase hover:bg-gray-50 transition-colors rounded-xl shadow-sm">
              <Download size={14} className="text-[#0f172a]" /> Export Directory
            </button>
            <button onClick={handleAddNew} className="flex items-center justify-center gap-2 px-7 py-3.5 bg-[#eebf43] hover:bg-[#dcae32] text-white text-[11px] font-black tracking-[0.1em] uppercase transition-colors rounded-xl shadow-md shadow-[#eebf43]/20">
              <Plus size={14} className="text-white" /> Invite New User
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#eebf43]"></div>
            <div className="flex justify-between items-start mb-4">
              <Users className="text-[#eebf43] w-5 h-5" />
              <span className="text-[#a88231] text-xs font-semibold">+4 this month</span>
            </div>
            <h2 className="text-4xl font-black text-[#1d1d1f] mb-1">128</h2>
            <p className="text-[#a1a1aa] text-[10px] font-bold tracking-widest uppercase">Total Curators</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#3f3f46]"></div>
            <div className="flex justify-between items-start mb-4">
              <BadgeCheck className="text-[#71717a] w-5 h-5" />
              <span className="text-[#71717a] text-xs font-semibold">24 Active Duty</span>
            </div>
            <h2 className="text-4xl font-black text-[#1d1d1f] mb-1">42</h2>
            <p className="text-[#a1a1aa] text-[10px] font-bold tracking-widest uppercase">Lead Coordinators</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <Mail className="text-[#a1a1aa] w-5 h-5" />
              <span className="text-red-500 text-xs font-semibold">Expiring soon</span>
            </div>
            <h2 className="text-4xl font-black text-[#1d1d1f] mb-1">12</h2>
            <p className="text-[#a1a1aa] text-[10px] font-bold tracking-widest uppercase">Pending Invites</p>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Active Directory (Table) */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
            <div className="p-6 flex items-center justify-between border-b border-gray-50">
              <h3 className="text-[#1d1d1f] text-xs font-bold tracking-[0.1em] uppercase">Active Directory</h3>
              <div className="flex items-center text-xs font-semibold text-[#71717a] cursor-pointer hover:text-[#1d1d1f]">
                Filter by Role
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest border-b border-gray-50">User</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest border-b border-gray-50">Role</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest border-b border-gray-50">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest border-b border-gray-50">Last Active</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest border-b border-gray-50 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="group hover:bg-[#fafafa] transition-colors border-b border-gray-50 last:border-b-0">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover shadow-sm bg-gray-100" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#f4f4f5] border border-[#e4e4e7] flex items-center justify-center text-[#71717a] text-xs font-bold shadow-sm">
                              {user.name.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                          )}
                          <div>
                            <p className="text-[#1d1d1f] font-bold text-sm">{user.name}</p>
                            <p className="text-[#71717a] text-[11px]">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex py-1.5 px-3 rounded-full bg-[#fef9ec] border border-[#eebf43]/30 text-[#a88231] text-[10px] font-bold tracking-widest uppercase">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${user.statusColor || 'bg-gray-400'}`}></span>
                          <span className="text-[#3f3f46] text-xs font-semibold">{user.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-[#71717a] text-xs font-medium">
                        {user.lastActive}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button onClick={() => handleEdit(user)} className="text-[#a1a1aa] hover:text-[#1d1d1f] transition-colors outline-none focus:outline-none">
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="mt-auto px-6 py-4 flex items-center justify-between border-t border-gray-50 bg-[#fafafa]/50 rounded-b-xl">
              <span className="text-xs text-[#a1a1aa] font-medium">Showing {users.length} of 128 Curators</span>
              <div className="flex items-center gap-1">
                <button className="w-8 h-8 flex items-center justify-center rounded bg-white border border-gray-200 text-[#a1a1aa] hover:bg-gray-50 transition-colors shadow-sm">
                  <ChevronLeft size={14} />
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded bg-[#eebf43] text-[#1d1d1f] font-bold text-xs shadow-sm shadow-[#eebf43]/20">
                  1
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded bg-white border border-gray-200 text-[#1d1d1f] hover:bg-gray-50 transition-colors shadow-sm">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Quick Permissions and Security */}
          <div className="flex flex-col gap-6">
            
            {/* Quick Permissions Box */}
            <div className="bg-[#fafafa] rounded-xl p-6 border border-gray-200/60 shadow-sm relative">
              <h3 className="text-[#1d1d1f] text-xs font-bold tracking-[0.1em] uppercase mb-6">Quick Permissions</h3>
              
              <div className="space-y-5 mb-8">
                <div>
                  <h4 className="text-[#1d1d1f] text-xs font-bold mb-1 uppercase tracking-wide">Financial Access</h4>
                  <p className="text-[#71717a] text-[11px] leading-relaxed">Allows viewing and modifying event budgets and payment schedules.</p>
                </div>
                <div>
                  <h4 className="text-[#1d1d1f] text-xs font-bold mb-1 uppercase tracking-wide">Event Creation</h4>
                  <p className="text-[#71717a] text-[11px] leading-relaxed">Permits the drafting and publishing of new production schedules.</p>
                </div>
                <div>
                  <h4 className="text-[#1d1d1f] text-xs font-bold mb-1 uppercase tracking-wide">Contract Signing</h4>
                  <p className="text-[#71717a] text-[11px] leading-relaxed">High-level authority to approve vendor and talent agreements.</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                <h4 className="text-[#a1a1aa] text-[10px] font-bold uppercase tracking-widest mb-3">Audit Snippet</h4>
                <div className="space-y-3 relative before:absolute before:inset-y-2 before:left-[3px] before:w-[2px] before:bg-gray-100">
                  <div className="relative pl-4">
                    <span className="absolute left-[2px] top-1.5 w-1 h-1 rounded-full bg-[#eebf43]"></span>
                    <p className="text-[#3f3f46] text-xs font-bold">Elena V. modified budget</p>
                    <p className="text-[#a1a1aa] text-[10px]">Today, 9:42 AM</p>
                  </div>
                  <div className="relative pl-4">
                    <span className="absolute left-[2px] top-1.5 w-1 h-1 rounded-full bg-[#eebf43]"></span>
                    <p className="text-[#3f3f46] text-xs font-bold">Julian T. logged in</p>
                    <p className="text-[#a1a1aa] text-[10px]">Today, 8:15 AM</p>
                  </div>
                </div>
                <button className="w-full mt-4 py-2 border border-gray-200 rounded-md text-[#1d1d1f] text-[10px] font-bold tracking-widest uppercase hover:bg-gray-50 transition">
                  View Full Log
                </button>
              </div>
            </div>

            {/* Security Status Box */}
            <div className="bg-[#a88231] rounded-xl p-6 text-white shadow-md relative overflow-hidden">
               <div className="absolute -right-8 -top-8 opacity-10">
                 <ShieldAlert className="w-40 h-40" />
               </div>
               <div className="relative z-10">
                 <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center mb-4">
                   <ShieldAlert className="w-4 h-4 text-white" />
                 </div>
                 <h3 className="text-white text-sm font-bold mb-2">Security Status</h3>
                 <p className="text-white/80 text-xs leading-relaxed mb-6">
                   Your portal is currently enforcing mandatory 2FA for all staff access tokens.
                 </p>
                 <button className="text-white text-[10px] font-bold uppercase tracking-widest hover:text-white/70 transition">
                   View Protocol &#8594;
                 </button>
               </div>
            </div>

          </div>
        </div>

      </div>

      {/* Modal for Add / Edit */}
      {isAddingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-[#1d1d1f]/60 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={() => setIsAddingUser(false)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-8">
              <div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-xl font-extrabold text-[#1d1d1f]" id="modal-title">
                    {editingUser ? 'Edit User Credentials' : 'Invite New User'}
                  </h3>
                  <p className="text-xs text-[#71717a] mt-1">{editingUser ? 'Modify access levels and details for this user.' : 'Send an invitation to join the production collective.'}</p>
                  
                  <div className="mt-8">
                    <form onSubmit={handleSave}>
                      <div className="space-y-5">
                        
                        <div className="flex justify-center mb-6">
                          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            {formData.avatar ? (
                                <img src={formData.avatar} alt="Profile" className="h-20 w-20 rounded-full object-cover border border-gray-200 shadow-sm" />
                            ) : (
                                <div className="h-20 w-20 rounded-full bg-[#fafafa] flex items-center justify-center border border-dashed border-[#dcae32] group-hover:bg-[#fef9ec] transition-colors">
                                    <span className="text-[10px] text-[#a88231] font-bold uppercase tracking-wider">Photo</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-[10px] font-bold tracking-widest uppercase">Change</span>
                            </div>
                            <input 
                              type="file" 
                              ref={fileInputRef} 
                              onChange={handleImageUpload} 
                              accept="image/*" 
                              className="hidden" />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="name" className="block text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-1">Full Name</label>
                          <input type="text" name="name" id="name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="block w-full border border-gray-200 rounded-md shadow-sm py-2.5 px-3 focus:outline-none focus:border-[#dcae32] focus:ring-1 focus:ring-[#dcae32] text-sm text-[#1d1d1f]" />
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-[10px] font-bold text-[#a1a1aa] uppercase trancking-widest mb-1">Email Address</label>
                          <input type="email" name="email" id="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="block w-full border border-gray-200 rounded-md shadow-sm py-2.5 px-3 focus:outline-none focus:border-[#dcae32] focus:ring-1 focus:ring-[#dcae32] text-sm text-[#1d1d1f]" />
                        </div>

                        <div>
                          <label htmlFor="role" className="block text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-1">Access Role</label>
                          <select id="role" name="role" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="block w-full py-2.5 px-3 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:border-[#dcae32] focus:ring-1 focus:ring-[#dcae32] text-sm text-[#1d1d1f]">
                            <option value="LEAD COORDINATOR">Lead Coordinator</option>
                            <option value="PRODUCTION STAFF">Production Staff</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="status" className="block text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-1">Status</label>
                          <select id="status" name="status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="block w-full py-2.5 px-3 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:border-[#dcae32] focus:ring-1 focus:ring-[#dcae32] text-sm text-[#1d1d1f]">
                            <option value="Active">Active</option>
                            <option value="On-Site">On-Site</option>
                            <option value="Away">Away</option>
                          </select>
                        </div>
                      </div>
                      <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                        <button type="button" onClick={() => setIsAddingUser(false)} className="w-full sm:w-auto inline-flex justify-center items-center rounded-md border border-gray-200 px-6 py-2.5 bg-white text-xs font-bold tracking-widest text-[#3f3f46] hover:bg-gray-50 focus:outline-none transition-colors uppercase">
                          Cancel
                        </button>
                        <button type="submit" className="w-full sm:w-auto inline-flex justify-center items-center rounded-md border border-transparent px-6 py-2.5 bg-[#1d1d1f] text-xs font-bold tracking-widest text-white hover:bg-[#3f3f46] focus:outline-none transition-colors shadow-md uppercase">
                          {editingUser ? 'Save Changes' : 'Send Invite'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}