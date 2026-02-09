'use client';

import { useState } from 'react';
import { Check, AlertTriangle, X, Database, Lock, Globe } from 'lucide-react';

export default function ConfigPage() {
  const [formData, setFormData] = useState({
    databaseUrl: '',
    nextAuthUrl: '',
    nextAuthSecret: ''
  });
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResults(null);

    try {
      const res = await fetch('/api/validate-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      setResults(data);
    } catch (error) {
      alert('Failed to validate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-slate-900 p-6 text-white">
          <h1 className="text-2xl font-bold flex items-center gap-3">
             <div className="p-2 bg-blue-500 rounded-lg">
                <Database size={24} />
             </div>
             System Configuration Check
          </h1>
          <p className="text-slate-400 mt-2">
            Enter your environment variables below to validate connectivity and settings.
          </p>
        </div>

        <div className="p-8">
           <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Database URL */}
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Database size={16} className="text-blue-500" /> Database URL
                 </label>
                 <input 
                    type="password"
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="postgresql://..."
                    value={formData.databaseUrl}
                    onChange={e => setFormData({...formData, databaseUrl: e.target.value})}
                 />
              </div>

              {/* NextAuth URL */}
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Globe size={16} className="text-purple-500" /> NextAuth URL
                 </label>
                 <input 
                    type="text"
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                    placeholder="https://your-site.vercel.app"
                    value={formData.nextAuthUrl}
                    onChange={e => setFormData({...formData, nextAuthUrl: e.target.value})}
                 />
              </div>

              {/* Secret */}
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Lock size={16} className="text-emerald-500" /> NextAuth Secret
                 </label>
                 <input 
                    type="password"
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                    placeholder="Run openssl rand -base64 32"
                    value={formData.nextAuthSecret}
                    onChange={e => setFormData({...formData, nextAuthSecret: e.target.value})}
                 />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all disabled:opacity-50"
              >
                {loading ? 'Validating Connection...' : 'Validate Configuration'}
              </button>
           </form>

           {/* Results Section */}
           {results && (
              <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                 <h3 className="font-bold text-lg text-slate-900 border-b pb-2">Validation Results</h3>
                 
                 {/* Database Result */}
                 <div className={`p-4 rounded-xl border ${
                    results.results.database.status === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                    results.results.database.status === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                    'bg-slate-50 border-slate-200 text-slate-600'
                 }`}>
                    <div className="flex items-start gap-3">
                       {results.results.database.status === 'success' ? <Check className="mt-1" /> :
                        results.results.database.status === 'error' ? <X className="mt-1" /> :
                        <AlertTriangle className="mt-1" />}
                       <div>
                          <p className="font-bold">Database Connection</p>
                          <p className="text-sm mt-1">{results.results.database.message}</p>
                       </div>
                    </div>
                 </div>

                 {/* System Status Check */}
                 <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-blue-900">
                    <div className="flex items-start gap-3">
                       <Database className="mt-1" />
                       <div className="w-full">
                          <p className="font-bold">Server Environment Status</p>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                             <div className="flex justify-between border-b border-blue-200 pb-1">
                                <span>Deployed Mode:</span>
                                <span className="font-mono">{results.systemStatus.currentEnv}</span>
                             </div>
                             <div className="flex justify-between border-b border-blue-200 pb-1">
                                <span>Configured URL Match:</span>
                                <span className={`font-bold ${results.systemStatus.configuredNextAuthUrl === 'MATCH' ? 'text-green-600' : 'text-red-600'}`}>
                                   {results.systemStatus.configuredNextAuthUrl}
                                </span>
                             </div>
                          </div>
                          {results.systemStatus.configuredNextAuthUrl === 'MISMATCH' && (
                             <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded">
                                Warning: The URL you entered does not match what the server is currently using (`NEXTAUTH_URL`). This may cause login issues.
                             </p>
                          )}
                       </div>
                    </div>
                 </div>

              </div>
           )}
        </div>
      </div>
    </div>
  );
}
