'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { User, Mail, Lock, Save, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { showSuccess, showError } from '@/lib/sweetalert';

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState({ name: '', email: '' });
  
  // Password State
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setUser({
        name: session.user.name || '',
        email: session.user.email || ''
      });
    }
  }, [session]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: user.name }),
      });

      if (!res.ok) throw new Error('Failed to update profile');

      await update({ name: user.name }); // Update session
      showSuccess('Profile Updated', 'Your details have been saved successfully.');
    } catch (error) {
      showError('Update Failed', 'Could not update your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      showError('Password Mismatch', 'New password and confirmation do not match.');
      return;
    }
    
    setPwLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          currentPassword: passwords.current, 
          newPassword: passwords.new 
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');

      showSuccess('Password Changed', 'Your password has been updated successfully.');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error) {
      showError('Error', error.message);
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Profile Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account preferences and security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         
         {/* Left Column: Profile Card */}
         <div className="md:col-span-1 space-y-6">
            <div className="glass-panel p-6 flex flex-col items-center text-center">
               <div className="w-24 h-24 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-blue-500/30 mb-4">
                  {user.name ? user.name.charAt(0).toUpperCase() : <User size={40} />}
               </div>
               <h2 className="text-xl font-bold text-slate-900">{user.name || 'User'}</h2>
               <p className="text-sm text-slate-500">{user.email}</p>
               
               <div className="mt-6 w-full pt-6 border-t border-slate-100 flex justify-between text-sm">
                  <span className="text-slate-500">Member Since</span>
                  <span className="font-medium text-slate-900">
                    {session?.user ? 'Jan 2024' : '...'} {/* Ideally fetch from DB */}
                  </span>
               </div>
            </div>
         </div>

         {/* Right Column: Forms */}
         <div className="md:col-span-2 space-y-8">
            
            {/* General Settings */}
            <div className="glass-panel p-6 sm:p-8">
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <User size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Personal Information</h3>
               </div>
               
               <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                        <input 
                          type="text" 
                          value={user.name}
                          onChange={(e) => setUser({...user, name: e.target.value})}
                          className="input-field"
                          placeholder="Your Name"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                        <div className="relative">
                           <input 
                             type="email" 
                             value={user.email}
                             disabled
                             className="input-field bg-slate-50 text-slate-500 cursor-not-allowed pl-10"
                           />
                           <Mail size={18} className="absolute left-3 top-3.5 text-slate-400" />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Email cannot be changed.</p>
                     </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                     <button 
                       type="submit" 
                       disabled={loading}
                       className="btn-primary"
                     >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Save Changes
                     </button>
                  </div>
               </form>
            </div>

            {/* Security Settings */}
            <div className="glass-panel p-6 sm:p-8">
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                    <ShieldCheck size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Security</h3>
               </div>

               <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1.5">Current Password</label>
                     <div className="relative">
                        <input 
                          type="password" 
                          value={passwords.current}
                          onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                          className="input-field pl-10"
                          placeholder="••••••••"
                        />
                        <Lock size={18} className="absolute left-3 top-3.5 text-slate-400" />
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                        <input 
                          type="password" 
                          value={passwords.new}
                          onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                          className="input-field"
                          placeholder="Min. 6 chars"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                        <input 
                          type="password" 
                          value={passwords.confirm}
                          onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                          className="input-field"
                          placeholder="Confirm new password"
                        />
                     </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                     <button 
                       type="submit" 
                       disabled={pwLoading}
                       className="btn-secondary"
                     >
                        {pwLoading ? <Loader2 size={18} className="animate-spin" /> : 'Update Password'}
                     </button>
                  </div>
               </form>
            </div>

         </div>
      </div>
    </div>
  );
}
