'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Users, UserPlus, Activity, ShieldCheck, Server, Mail, AlertTriangle } from 'lucide-react';
import { showSuccess, showError } from '@/lib/sweetalert';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [sendingTest, setSendingTest] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.status === 403) {
         showError('Access Denied', 'You are not an admin.');
         router.push('/dashboard'); // Redirect to normal dashboard
         return;
      }
      if (!res.ok) throw new Error('Failed to fetch stats');
      
      const jsonData = await res.json();
      setData(jsonData);
    } catch (err) {
      console.error(err);
      // Don't show error immediately on load to avoid flashing if just unauthorized
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    fetchStats();
  }, [status, router, fetchStats]);

  const handleTestEmail = async () => {
    setSendingTest(true);
    try {
      // Use the forgot password endpoint as a quick test mechanism or creating a dedicated one
      // For now, let's just re-verify via the stats API refresh or a dedicated test action
      // We'll use the stats refresh which re-verifies SMTP
      await fetchStats();
      
      if (data?.system?.email?.success) {
        showSuccess('SMTP Verified', 'Connection to email server is successful.');
      } else {
        showError('SMTP Error', data?.system?.email?.message || 'Connection failed');
      }
    } catch (error) {
      showError('Error', 'Failed to test email');
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading Admin Panel...</div>;
  }

  if (!data) {
     return <div className="p-8 text-center">Access Restricted or Error Loading Data</div>;
  }

  return (
    <div className="p-6 md:p-12 space-y-8 relative">
      {/* Background Blobs - Adjusted for content area */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
      </div>
        
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Dashboard
          </h1>
          <p className="text-slate-500 mt-1">System Overview & Health Metrics</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Users */}
        <div className="glass-panel p-6 flex items-center gap-5 transition-transform hover:scale-[1.02] duration-300">
          <div className="w-14 h-14 bg-linear-to-br from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Users size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Users</p>
            <h3 className="text-3xl font-bold text-slate-900">{data.stats.totalUsers}</h3>
          </div>
        </div>

        {/* New Users Today */}
        <div className="glass-panel p-6 flex items-center gap-5 transition-transform hover:scale-[1.02] duration-300">
          <div className="w-14 h-14 bg-linear-to-br from-green-500 to-green-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
            <UserPlus size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">New Users (Today)</p>
            <h3 className="text-3xl font-bold text-slate-900">{data.stats.newUsersToday}</h3>
          </div>
        </div>

        {/* Active Users */}
        <div className="glass-panel p-6 flex items-center gap-5 transition-transform hover:scale-[1.02] duration-300">
          <div className="w-14 h-14 bg-linear-to-br from-purple-500 to-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Activity size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Active (30 Days)</p>
            <h3 className="text-3xl font-bold text-slate-900">{data.stats.activeUsers}</h3>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="glass-panel overflow-hidden">
        <div className="p-6 border-b border-slate-100/50 bg-slate-50/50 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Server size={24} className="text-slate-600" />
            System Health
          </h2>
        </div>
        <div className="p-6 space-y-4">
          
          {/* Environment */}
          <div className="flex items-center justify-between p-4 bg-white/60 border border-white/60 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </div>
              <span className="font-medium text-slate-700">Environment</span>
            </div>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold font-mono uppercase tracking-wider border border-slate-200">
              {data.system.nodeEnv}
            </span>
          </div>

          {/* Email Service */}
          <div className="flex items-center justify-between p-4 bg-white/60 border border-white/60 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              {data.system.email.success ? (
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </div>
              ) : (
                <div className="relative flex h-3 w-3">
                   <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </div>
              )}
              <span className="font-medium text-slate-700 flex items-center gap-2">
                 Email Service (SMTP)
                 {!data.system.email.success && <AlertTriangle size={18} className="text-red-500" />}
              </span>
            </div>
            <div className="flex items-center gap-3">
               <span className={`text-sm font-medium ${data.system.email.success ? 'text-green-600' : 'text-red-600'}`}>
                  {data.system.email.success ? 'Connected' : 'Error'}
               </span>
               <button 
                 onClick={handleTestEmail}
                 disabled={sendingTest}
                 className="btn-secondary text-xs py-1.5 px-3 h-auto"
               >
                 {sendingTest ? 'Verifying...' : 'Re-verify'}
               </button>
            </div>
          </div>

          {/* Error Message if any */}
          {!data.system.email.success && (
             <div className="text-sm text-red-600 bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                <div className="font-mono break-all">{data.system.email.message}</div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
}
