'use client';

import { useEffect, useState } from 'react';
import {
  Wallet,
  TrendingDown,
  PieChart,
  CreditCard,
  Landmark,
  Target,
  TrendingUp,
  AlertTriangle,
  Zap,
  Bell,
  ChevronRight,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from 'lucide-react';
import { showError, showToast } from '@/lib/sweetalert';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { useSession } from "next-auth/react";

import HealthScoreGauge from '@/components/HealthScoreGauge';
import SmartSuggestions from '@/components/SmartSuggestions';
import SafeSpendCard from '@/components/SafeSpendCard';
import HealthDimensions from '@/components/HealthDimensions';
import StressIndicator from '@/components/StressIndicator';
import CategoryTrends from '@/components/CategoryTrends';
import FinancialProjection from '@/components/FinancialProjection';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function Dashboard() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [magicInput, setMagicInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      setData(json);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchData();
  }, [session]);

  const handleMagicSubmit = async (e) => {
    e.preventDefault();
    if (!magicInput.trim()) return;
    setSubmitting(true);

    const input = magicInput.trim();
    // Simple Heuristic: Extract first number as amount
    const amountMatch = input.match(/(\d+(?:\.\d{1,2})?)/);
    
    if (!amountMatch) {
       showError("Missing Amount", "Please include an amount (e.g. '200 lunch')");
       setSubmitting(false);
       return;
    }

    const amount = parseFloat(amountMatch[0]);
    // Remove amount from string to get note
    const note = input.replace(amountMatch[0], '').trim() || 'Quick Expense';

    try {
        const res = await fetch('/api/daily-expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount,
                note,
                date: new Date().toISOString(),
                category: 'Uncategorized', // API Rules Engine will auto-categorize!
                paymentMethod: 'CASH' // Default
            })
        });

        if (res.ok) {
            const newExpense = await res.json();
            showToast('success', `Added: ₹${amount} (${newExpense.category})`);
            setMagicInput('');
            fetchData(); // Refresh dashboard
        } else {
            showError('Error', 'Failed to add expense');
        }
    } catch (error) {
        console.error(error);
        showError('Error', 'Something went wrong');
    } finally {
        setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium animate-pulse">Analyzing Financial Health...</p>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-center text-red-500">Failed to load dashboard data.</div>;

  const doughnutData = {
    labels: ['Fixed', 'Daily', 'EMI', 'Savings'],
    datasets: [
      {
        data: [
          data.breakdown?.fixed || 0,
          data.breakdown?.daily || 0,
          data.breakdown?.emi || 0,
          Math.max(0, data.savings || 0)
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)', // Blue
          'rgba(239, 68, 68, 0.8)',  // Red
          'rgba(249, 115, 22, 0.8)', // Orange
          'rgba(16, 185, 129, 0.8)', // Green
        ],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const prediction = data.prediction || {};

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10 px-4 sm:px-6 lg:px-8">
      
      {/* 1. Top Section: Header & Magic Input */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
        <div className="lg:col-span-8">
           <h1 className="text-4xl font-bold text-slate-900 tracking-tight font-heading">
             Good Morning, <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-violet-600">{session?.user?.name?.split(' ')[0]}</span>
           </h1>
           <p className="text-slate-500 mt-2 text-lg">Here&apos;s your financial pulse for today.</p>
        </div>
        
        {/* Magic Input - Compact & Modern */}
        <div className="lg:col-span-4">
             <form onSubmit={handleMagicSubmit} className="relative group">
                <div className={`absolute inset-0 bg-linear-to-r from-blue-600 to-violet-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity ${submitting ? 'animate-pulse' : ''}`}></div>
                <div className="relative glass-panel p-1.5 flex items-center transition-all focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500/50">
                    <div className="p-3 bg-linear-to-br from-blue-600 to-violet-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
                        <Sparkles size={20} className={submitting ? "animate-spin" : ""} />
                    </div>
                    <input 
                        type="text" 
                        value={magicInput}
                        onChange={(e) => setMagicInput(e.target.value)}
                        placeholder="Magic Add: '200 coffee'..."
                        className="w-full h-full px-4 text-base font-medium text-slate-700 placeholder:text-slate-400 focus:outline-hidden bg-transparent"
                        disabled={submitting}
                    />
                    <button 
                        type="submit"
                        disabled={submitting || !magicInput.trim()}
                        className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-all"
                    >
                        Add
                    </button>
                </div>
            </form>
        </div>
      </div>

      {/* 2. Notifications Banner */}
      {data.notifications && data.notifications.length > 0 && (
        <div className="bg-linear-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-4 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="p-2 bg-orange-100 text-orange-600 rounded-xl shrink-0">
            <Bell size={20} />
          </div>
          <div className="flex-1 pt-1">
             <h4 className="font-bold text-orange-900 text-sm">{data.notifications[0]?.title}</h4>
             <p className="text-orange-700/80 text-sm mt-0.5">{data.notifications[0]?.message}</p>
          </div>
        </div>
      )}

      {/* 3. Hero Bento Grid: Health + Projections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Health Gauge - Anchor */}
          <div className="lg:col-span-4 glass-panel p-6 flex flex-col relative overflow-hidden min-h-[340px]">
              <div className="absolute top-0 right-0 p-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
              <div className="flex justify-between items-start mb-6 relative z-10">
                 <div>
                   <h3 className="font-bold text-lg text-slate-800 font-heading">Health Score</h3>
                   <p className="text-slate-500 text-sm">Overall vitality</p>
                 </div>
                 <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    data.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                    data.riskLevel === 'WARNING' ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                 }`}>
                   {data.riskLevel || 'STABLE'}
                 </div>
              </div>
              <div className="flex-1 flex items-center justify-center py-4">
                 <HealthScoreGauge score={data.healthScore ?? 0} riskLevel={data.riskLevel || 'STABLE'} size="large" />
              </div>
          </div>

          {/* 3-Month Projection - Prime Real Estate */}
          <div className="lg:col-span-8 flex flex-col justify-center">
               <FinancialProjection />
          </div>
      </div>

      {/* 4. Core Metrics Row - High Precision */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
         <StatsCard 
           title="Total Income" 
           amount={data.totalIncome || 0} 
           icon={Wallet} 
           color="text-emerald-600" 
           bg="bg-emerald-50" 
           trend={12} 
         />
         <StatsCard 
           title="Total Spend" 
           amount={data.totalExpense || 0} 
           icon={TrendingDown} 
           color="text-red-600" 
           bg="bg-red-50" 
           trend={-5} 
         />
         <SafeSpendCard amount={data.safeToSpend?.daily || 0} status={data.safeToSpend?.status} className="glass-card h-full" />
         
         <div className="glass-panel p-5 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300">
             <div className="flex justify-between items-start mb-4">
                <div className="bg-violet-50 p-3 rounded-2xl text-violet-600">
                  <Landmark size={22} />
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-lg bg-violet-100 text-violet-700">Net</span>
             </div>
             <div>
                <h4 className="text-slate-500 font-medium text-sm">Net Savings</h4>
                <p className={`text-2xl font-bold mt-1 font-heading ${data.savings >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                    {data.savings < 0 ? '-' : ''}₹{Math.abs(data.savings || 0).toLocaleString('en-IN')}
                </p>
             </div>
         </div>
      </div>

      {/* 5. Analysis & Insights Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Charts & Insights */}
          <div className="lg:col-span-1 space-y-6">
             <div className="glass-panel p-6">
                <h3 className="font-bold text-lg text-slate-800 mb-6 font-heading">Expense Structure</h3>
                <div className="h-64 relative">
                   <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, font: { family: 'Inter' } } } } }} />
                </div>
             </div>

             <div className="glass-panel p-0 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2 font-heading">
                    <Zap size={18} className="text-amber-500" />
                    Smart Insights
                  </h3>
                </div>
                <div className="p-5">
                   <SmartSuggestions suggestions={data.suggestions} />
                </div>
             </div>
          </div>

          {/* Right Column: Dimensions & Transactions */}
          <div className="lg:col-span-2 space-y-6">
              
              {/* Health Radar */}
              <div className="glass-panel p-6">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="font-bold text-lg text-slate-800 font-heading">Health Dimensions</h3>
                  </div>
                  <HealthDimensions
                    dimensions={data.healthDimensions}
                    overallScore={data.overallHealthScore || data.healthScore}
                  />
              </div>

              {/* Transactions List */}
              <div className="glass-panel p-6">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-800 font-heading">Recent Activity</h3>
                    <button className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
                      View All <ChevronRight size={16} />
                    </button>
                 </div>
                 <div className="space-y-4">
                    {data.recentTransactions && data.recentTransactions.length > 0 ? (
                        data.recentTransactions.map((item, idx) => (
                           <TransactionRow key={idx} item={item} />
                        ))
                    ) : (
                        <div className="text-center py-12 text-slate-400">
                           <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                             <Activity size={24} />
                           </div>
                           No recent transactions found.
                        </div>
                    )}
                 </div>
              </div>

          </div>
      </div>
      
    </div>
  );
}

// Sub-components
function StatsCard({ title, amount, icon: Icon, color, bg, trend }) {
  return (
    <div className="glass-panel p-5 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300">
       <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-2xl ${bg} ${color}`}>
            <Icon size={22} />
          </div>
          {trend && (
            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
               {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
       </div>
       <div>
          <h4 className="text-slate-500 font-medium text-sm">{title}</h4>
          <p className="text-2xl font-bold text-slate-900 mt-1 font-heading">₹{(amount || 0).toLocaleString('en-IN')}</p>
       </div>
    </div>
  );
}

function TransactionRow({ item }) {
  const isIncome = item.type === 'INCOME';
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50/80 transition-colors border border-transparent hover:border-slate-100 group">
       <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl shadow-sm ${
             isIncome ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'
          }`}>
             {isIncome ? <ArrowDownRight size={24} /> : <ArrowUpRight size={24} />}
          </div>
          <div>
             <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{item.category}</h4>
             <p className="text-xs text-slate-500 flex items-center gap-2">
                {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                {item.paymentMethod && (
                   <>
                     <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                     <span className="uppercase">{item.paymentMethod}</span>
                   </>
                )}
             </p>
          </div>
       </div>
       <div className="text-right">
          <p className={`font-bold text-lg font-heading ${isIncome ? 'text-green-600' : 'text-slate-900'}`}>
             {isIncome ? '+' : '-'}₹{Math.abs(item.amount).toLocaleString()}
          </p>
       </div>
    </div>
  );
}
