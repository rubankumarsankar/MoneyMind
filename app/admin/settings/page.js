'use client';

import { useState, useEffect } from 'react';
import { Save, Server, Globe, Lock, Mail, Key, Database } from 'lucide-react';
import { showSuccess, showError } from '@/lib/sweetalert';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
     appName: '',
     smtpHost: '',
     smtpPort: 587,
     smtpUser: '',
     smtpPass: '',
     smtpSecure: false,
     googleClientId: '',
     googleClientSecret: '',
     databaseUrl: '',
     activeDatabaseUrl: '', // Read-only
     maintenanceMode: false,
     allowRegistrations: true
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setFormData(prev => ({ 
        ...prev, 
        ...data, 
        smtpPass: '',       // Don't show password
        googleClientSecret: '', // Don't show secret
        databaseUrl: ''      // Don't show raw global DB URL if masked
      })); 
    } catch (error) {
      showError('Error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
      e.preventDefault();
      try {
          // Remove activeDatabaseUrl from payload
          const { activeDatabaseUrl, ...payload } = formData;
          
          const res = await fetch('/api/admin/settings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
          
          if (!res.ok) throw new Error('Failed to save');

          showSuccess('Saved', 'System settings updated successfully.');
      } catch (error) {
          showError('Error', 'Failed to save settings');
      }
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Loading settings...</div>;

  return (
    <div className="p-6 md:p-12 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">System Settings</h1>
        <p className="text-slate-500 mt-1">Configure global application parameters</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
         
         {/* General Settings */}
         <div className="glass-panel p-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
               <Globe size={20} className="text-blue-600" />
               General Configuration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">App Name</label>
                  <input 
                     type="text" 
                     className="input-field" 
                     value={formData.appName}
                     onChange={e => setFormData({...formData, appName: e.target.value})}
                  />
               </div>
               <div className="flex flex-col gap-3 justify-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                     <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                        checked={formData.allowRegistrations}
                        onChange={e => setFormData({...formData, allowRegistrations: e.target.checked})}
                     />
                     <span className="text-slate-700 font-medium">Allow Registrations</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                     <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded text-red-600 focus:ring-red-500"
                        checked={formData.maintenanceMode}
                        onChange={e => setFormData({...formData, maintenanceMode: e.target.checked})}
                     />
                     <span className="text-slate-700 font-medium">Maintenance Mode</span>
                  </label>
               </div>
            </div>
         </div>

         {/* Google OAuth Settings */}
         <div className="glass-panel p-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
               <Globe size={20} className="text-red-500" />
               Google Authentication
            </h2>
            <div className="p-4 bg-red-50 rounded-xl text-sm text-red-700 mb-4 flex gap-2">
               <Key size={16} className="shrink-0 mt-0.5" />
               These settings override the `.env` configuration. Used for "Sign in with Google".
            </div>

            <div className="grid grid-cols-1 gap-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Google Client ID</label>
                  <input 
                     type="text" 
                     className="input-field" 
                     placeholder="e.g., 123...apps.googleusercontent.com"
                     value={formData.googleClientId}
                     onChange={e => setFormData({...formData, googleClientId: e.target.value})}
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Google Client Secret</label>
                  <input 
                     type="password" 
                     className="input-field" 
                     placeholder="••••••••"
                     value={formData.googleClientSecret}
                     onChange={e => setFormData({...formData, googleClientSecret: e.target.value})}
                  />
                  <p className="text-xs text-slate-400 mt-1">Leave blank to keep existing secret.</p>
               </div>
            </div>
         </div>

         {/* Database Connection */}
         <div className="glass-panel p-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
               <Database size={20} className="text-emerald-600" />
               Database Connection
            </h2>
            <div className="p-4 bg-emerald-50 rounded-xl text-sm text-emerald-800 mb-4">
               <strong>Active Connection:</strong> <code className="bg-white/50 px-1 rounded">{formData.activeDatabaseUrl}</code>
               <br/>
               <span className="text-xs opacity-80">This is the connection string currently being used by the application (from .env).</span>
            </div>

            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Override Database URL (Optional)</label>
               <input 
                  type="password" 
                  className="input-field" 
                  placeholder="postgresql://user:password@host:port/db"
                  value={formData.databaseUrl}
                  onChange={e => setFormData({...formData, databaseUrl: e.target.value})}
               />
               <p className="text-xs text-slate-500 mt-1">
                  WARNING: Setting this updates the stored configuration but might not take effect until a restart or if the app is configured to use dynamic DB connections (advanced).
               </p>
            </div>
         </div>

         {/* SMTP Settings */}
         <div className="glass-panel p-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
               <Mail size={20} className="text-purple-600" />
               SMTP Email Configuration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SMTP Host</label>
                  <input 
                     type="text" 
                     className="input-field" 
                     placeholder="smtp.gmail.com"
                     value={formData.smtpHost}
                     onChange={e => setFormData({...formData, smtpHost: e.target.value})}
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SMTP Port</label>
                  <input 
                     type="number" 
                     className="input-field" 
                     placeholder="587"
                     value={formData.smtpPort}
                     onChange={e => setFormData({...formData, smtpPort: parseInt(e.target.value || 0)})}
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SMTP User</label>
                  <input 
                     type="text" 
                     className="input-field" 
                     value={formData.smtpUser}
                     onChange={e => setFormData({...formData, smtpUser: e.target.value})}
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SMTP Password</label>
                  <input 
                     type="password" 
                     className="input-field" 
                     placeholder="••••••••"
                     value={formData.smtpPass}
                     onChange={e => setFormData({...formData, smtpPass: e.target.value})}
                  />
               </div>
            </div>
         </div>

         <div className="flex justify-end pt-4 pb-8">
            <button type="submit" className="btn-primary px-8">
               <Save size={20} />
               Save Changes
            </button>
         </div>

      </form>
    </div>
  );
}
