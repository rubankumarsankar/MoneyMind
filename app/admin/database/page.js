'use client';

import { useState, useEffect } from 'react';
import { Database, RefreshCw, ChevronLeft, ChevronRight, FileJson } from 'lucide-react';
import { showSuccess, showError } from '@/lib/sweetalert';

// Must match the API whitelist
const MODELS = [
  'User', 'Account', 'Income', 'FixedExpense', 'DailyExpense', 
  'Category', 'Budget', 'Saving', 'Investment', 'CreditCard', 
  'CreditSpend', 'EMI', 'Borrow', 'RecurringExpense', 
  'FinancialSnapshot', 'Notification', 'SystemSettings', 'PasswordReset'
];

export default function DatabaseExplorer() {
  const [activeModel, setActiveModel] = useState('User');
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    fetchData(1);
  }, [activeModel]);

  const fetchData = async (page = 1) => {
    setLoading(true);
    setExpandedRow(null);
    try {
      // API expects lowerCamelCase for prisma model names usually, but let's send what we have
      // and let the API handle casing if needed, or we adjust here.
      // Based on my API code: prisma[model]. It expects the exact prisma key.
      // Prisma client keys are usually camelCase (user, account) NOT PascalCase (User, Account).
      // So detailed mapping or simple lowercase might be needed.
      const modelKey = activeModel.charAt(0).toLowerCase() + activeModel.slice(1);
      
      const res = await fetch(`/api/admin/database?model=${modelKey}&page=${page}&limit=${pagination.limit}`);
      if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error || 'Failed to fetch');
      }
      
      const result = await res.json();
      setData(result.data || []);
      setPagination(prev => ({ ...prev, ...result.pagination }));
    } catch (error) {
      showError('Error', error.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
        fetchData(newPage);
    }
  };

  // Helper to render cell content safely
  const renderCell = (value) => {
    if (value === null || value === undefined) return <span className="text-slate-300 italic">null</span>;
    if (typeof value === 'boolean') return <span className={`px-2 py-0.5 rounded text-xs font-bold ${value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{value.toString()}</span>;
    if (typeof value === 'object') return <span className="text-slate-500 italic text-xs">Object/Array</span>; // Don't render full objects in cell
    if (String(value).length > 50) return <span title={value}>{String(value).substring(0, 50)}...</span>;
    return String(value);
  };

  // Get headers from first item, or empty if no data
  const headers = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="p-6 md:p-8 space-y-6 h-[calc(100vh-64px)] flex flex-col">
      <div className="flex justify-between items-center shrink-0">
         <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
               <Database className="text-blue-600" />
               Database Explorer
            </h1>
            <p className="text-slate-500 text-sm">View and analyze raw system data.</p>
         </div>
         <button 
           onClick={() => fetchData(pagination.page)}
           disabled={loading}
           className="btn-secondary text-sm py-2 px-3"
         >
           <RefreshCw size={16} className={loading && 'animate-spin'} />
           Refresh
         </button>
      </div>

      {/* Model Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 shrink-0 scrollbar-hide border-b border-slate-200">
         {MODELS.map(model => (
            <button
               key={model}
               onClick={() => { setActiveModel(model); setPagination(p => ({...p, page: 1})); }}
               className={`px-4 py-2 rounded-t-lg font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
                  activeModel === model 
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
               }`}
            >
               {model}
            </button>
         ))}
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-auto bg-white rounded-xl border border-slate-200 shadow-xs relative">
         {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center z-10">
               <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium text-slate-500">Fetching {activeModel}...</span>
               </div>
            </div>
         )}
         
         {data.length === 0 && !loading ? (
             <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Database size={40} className="mb-2 opacity-50" />
                <p>No records found for {activeModel}</p>
             </div>
         ) : (
             <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0 z-10 shadow-sm">
                   <tr>
                      <th className="px-4 py-3 w-10">#</th>
                      {headers.map(key => (
                         <th key={key} className="px-4 py-3 whitespace-nowrap">{key}</th>
                      ))}
                      <th className="px-4 py-3 w-10">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {data.map((row, idx) => (
                      <>
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                         <td className="px-4 py-3 text-slate-400 text-xs">{(pagination.page - 1) * pagination.limit + idx + 1}</td>
                         {headers.map(key => (
                            <td key={key} className="px-4 py-3 max-w-[200px] truncate text-slate-700">
                               {renderCell(row[key])}
                            </td>
                         ))}
                         <td className="px-4 py-3">
                            <button 
                              onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                              className="p-1 hover:bg-blue-100 text-blue-600 rounded"
                              title="View JSON"
                            >
                               <FileJson size={16} />
                            </button>
                         </td>
                      </tr>
                      {expandedRow === idx && (
                         <tr>
                            <td colSpan={headers.length + 2} className="px-4 py-4 bg-slate-50 shadow-inner">
                               <pre className="text-xs bg-slate-900 text-slate-200 p-4 rounded-lg overflow-auto max-h-60 border border-slate-700">
                                  {JSON.stringify(row, null, 2)}
                               </pre>
                            </td>
                         </tr>
                      )}
                      </>
                   ))}
                </tbody>
             </table>
         )}
      </div>

      {/* Pagination */}
      <div className="shrink-0 flex justify-between items-center bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
          <div className="text-sm text-slate-500">
             PAGE <span className="font-bold text-slate-900">{pagination.page}</span> OF <span className="font-bold text-slate-900">{pagination.totalPages}</span>
             <span className="mx-2 text-slate-300">|</span>
             TOTAL <span className="font-bold text-slate-900">{pagination.total}</span> RECORDS
          </div>
          <div className="flex gap-2">
             <button 
               onClick={() => handlePageChange(pagination.page - 1)}
               disabled={pagination.page === 1}
               className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600"
             >
                <ChevronLeft size={18} />
             </button>
             <button 
               onClick={() => handlePageChange(pagination.page + 1)}
               disabled={pagination.page === pagination.totalPages}
               className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600"
             >
                <ChevronRight size={18} />
             </button>
          </div>
      </div>
    </div>
  );
}
