'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Shield, User as UserIcon } from 'lucide-react';
import { showSuccess, showError, showConfirm } from '@/lib/sweetalert';
import dayjs from 'dayjs';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({
     name: '',
     email: '',
     password: '',
     role: 'USER'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      showError('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await showConfirm('Delete User?', 'This action cannot be undone.');
    if (!isConfirmed) return;

    try {
        const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete');
        
        setUsers(users.filter(u => u.id !== id));
        showSuccess('Deleted', 'User has been removed.');
    } catch (error) {
        showError('Error', 'Failed to delete user');
    }
  };

  const handleCreate = async (e) => {
      e.preventDefault();
      try {
          const res = await fetch('/api/admin/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formData)
          });
          
          if (!res.ok) {
              const err = await res.json();
              throw new Error(err.message || 'Failed to create');
          }

          showSuccess('Success', 'User created successfully');
          setShowAddModal(false);
          setFormData({ name: '', email: '', password: '', role: 'USER' });
          fetchUsers();
      } catch (error) {
          showError('Error', error.message);
      }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-1">Manage system access and accounts</p>
        </div>
        <button 
           onClick={() => setShowAddModal(true)}
           className="btn-primary"
        >
           <Plus size={20} />
           Add User
        </button>
      </div>

      {/* Toolbar */}
      <div className="glass-panel p-4 flex gap-4">
         <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
               type="text" 
               placeholder="Search users..." 
               className="input-field pl-10"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
      </div>

      {/* Users Table */}
      <div className="glass-panel overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                     <th className="p-4 font-semibold text-slate-600">User</th>
                     <th className="p-4 font-semibold text-slate-600">Role</th>
                     <th className="p-4 font-semibold text-slate-600">Joined</th>
                     <th className="p-4 font-semibold text-slate-600 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {loading ? (
                     <tr><td colSpan="4" className="p-8 text-center text-slate-500">Loading users...</td></tr>
                  ) : filteredUsers.length === 0 ? (
                     <tr><td colSpan="4" className="p-8 text-center text-slate-500">No users found.</td></tr>
                  ) : (
                     filteredUsers.map(user => (
                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                           <td className="p-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                                    {user.name?.[0] || 'U'}
                                 </div>
                                 <div>
                                    <div className="font-medium text-slate-900">{user.name || 'Unnamed'}</div>
                                    <div className="text-sm text-slate-500">{user.email}</div>
                                 </div>
                              </div>
                           </td>
                           <td className="p-4">
                              <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                                 user.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'
                              }`}>
                                 {user.role}
                              </span>
                           </td>
                           <td className="p-4 text-slate-500 text-sm">
                              {dayjs(user.createdAt).format('MMM D, YYYY')}
                           </td>
                           <td className="p-4 text-right">
                              <button 
                                 onClick={() => handleDelete(user.id)}
                                 className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                 title="Delete User"
                              >
                                 <Trash2 size={18} />
                              </button>
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
           <div className="glass-panel w-full max-w-md p-6 space-y-6 animate-in fade-in zoom-in duration-200">
              <h2 className="text-xl font-bold text-slate-900">Add New User</h2>
              
              <form onSubmit={handleCreate} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                    <input 
                       required
                       type="text" 
                       className="input-field" 
                       value={formData.name}
                       onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input 
                       required
                       type="email" 
                       className="input-field" 
                       value={formData.email}
                       onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <input 
                       required
                       type="password" 
                       className="input-field" 
                       value={formData.password}
                       onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                    <select 
                       className="input-field"
                       value={formData.role}
                       onChange={e => setFormData({...formData, role: e.target.value})}
                    >
                       <option value="USER">User</option>
                       <option value="ADMIN">Admin</option>
                    </select>
                 </div>

                 <div className="flex gap-3 pt-4">
                    <button 
                       type="button" 
                       onClick={() => setShowAddModal(false)}
                       className="btn-secondary flex-1"
                    >
                       Cancel
                    </button>
                    <button 
                       type="submit" 
                       className="btn-primary flex-1"
                    >
                       Create User
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

    </div>
  );
}
