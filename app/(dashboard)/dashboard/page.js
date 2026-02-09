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
  ArrowDownRight
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { useSession } from "next-auth/react";

import HealthScoreGauge from '@/components/HealthScoreGauge';
import SmartSuggestions from '@/components/SmartSuggestions';
import SafeSpendCard from '@/components/SafeSpendCard';
import HealthDimensions from '@/components/HealthDimensions';
import StressIndicator from '@/components/StressIndicator';
import CategoryTrends from '@/components/CategoryTrends';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function Dashboard() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (session) {
      fetch('/api/dashboard')
        .then(res => res.json())
        .then(data => {
          setData(data);
          setLoading(false);
        })
        .catch(err => setLoading(false));
    }
  }, [session]);

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
    <div className="space-y-8 max-w-[1600px] mx-auto pb-10">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
             Good Morning, <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-violet-600">{session?.user?.name?.split(' ')[0]}</span>
           </h1>
           <p className="text-slate-500 mt-2 text-lg">Here's your financial pulse for today.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white/60 p-2 pl-4 rounded-2xl border border-white/60 shadow-xs">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Cycle</p>
            <p className="font-semibold text-slate-700">{data.cycleLabel || 'Monthly'}</p>
          </div>
          <div className="h-10 w-px bg-slate-200"></div>
          <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-bold flex flex-col items-center">
             <span className="text-lg leading-none">{data.daysLeft}</span>
             <span className="text-[10px] uppercase">Days Left</span>
          </div>
        </div>
      </div>

      {/* 2. Notifications Banner (if any) */}
      {data.notifications && data.notifications.length > 0 && (
        <div className="bg-linear-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
          <div className="p-2 bg-orange-100 text-orange-600 rounded-xl shrink-0">
            <Bell size={20} />
          </div>
          <div className="flex-1 pt-1">
             <h4 className="font-bold text-orange-900 text-sm">{data.notifications[0]?.title}</h4>
             <p className="text-orange-700/80 text-sm mt-0.5">{data.notifications[0]?.message}</p>
          </div>
          {data.notifications.length > 1 && (
             <span className="px-3 py-1 bg-white/50 text-orange-700 text-xs font-bold rounded-lg border border-orange-100">
               +{data.notifications.length - 1} more
             </span>
          )}
        </div>
      )}

      {/* 3. Key Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Health Gauge - Large Focus */}
          <div className="lg:col-span-4 glass-panel p-6 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 p-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
              <div className="flex justify-between items-start mb-6 relative z-10">
                 <div>
                   <h3 className="font-bold text-lg text-slate-800">Health Score</h3>
                   <p className="text-slate-500 text-sm">Overall financial vitality</p>
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

          {/* Quick Stats Cards */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Safe to Spend */}
              <SafeSpendCard amount={data.safeToSpend?.daily || 0} status={data.safeToSpend?.status} className="glass-card" />

              {/* Velocity */}
              <div className="glass-card p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                      <div className="bg-slate-100 p-2 rounded-xl text-slate-600">
                        <Zap size={20} />
                      </div>
                      {data.dailyVelocity > (data.totalIncome / 30) ? (
                         <span className="flex items-center text-red-500 text-xs font-bold gap-1 bg-red-50 px-2 py-1 rounded-lg">
                           <ArrowUpRight size={14} /> High
                         </span>
                      ) : (
                         <span className="flex items-center text-green-500 text-xs font-bold gap-1 bg-green-50 px-2 py-1 rounded-lg">
                           <TrendingDown size={14} /> Stable
                         </span>
                      )}
                  </div>
                  <div>
                    <h3 className="text-slate-500 font-medium text-sm">Daily Velocity</h3>
                    <p className="text-3xl font-bold text-slate-900 mt-1">₹{(data.dailyVelocity || 0).toLocaleString()}</p>
                    <p className="text-xs text-slate-400 mt-2">Avg. spend per day</p>
                  </div>
              </div>

               {/* Forecast */}
               <div className="glass-card p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                      <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
                        <Activity size={20} />
                      </div>
                      <span className="text-slate-400 text-xs font-bold bg-slate-50 px-2 py-1 rounded-lg">
                        {prediction.confidence || 0}% Conf.
                      </span>
                  </div>
                  <div>
                    <h3 className="text-slate-500 font-medium text-sm">Next Month</h3>
                    <p className="text-3xl font-bold text-slate-900 mt-1">₹{(prediction.predicted || 0).toLocaleString()}</p>
                    <div className="flex items-center gap-2 mt-2">
                       {prediction.trend?.direction === 'INCREASING' ? (
                          <span className="text-xs font-bold text-red-500 flex items-center">
                             <TrendingUp size={12} className="mr-1" /> Rising
                          </span>
                       ) : prediction.trend?.direction === 'DECREASING' ? (
                          <span className="text-xs font-bold text-green-500 flex items-center">
                             <TrendingDown size={12} className="mr-1" /> Falling
                          </span>
                       ) : (
                          <span className="text-xs font-bold text-slate-500">Stable</span>
                       )}
                       <span className="text-slate-300 text-[10px]">•</span>
                       <span className="text-xs text-slate-400">Forecast</span>
                    </div>
                  </div>
              </div>
          </div>
      </div>

      {/* 4. Core Metrics Row */}
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
           trend={-5} // example
         />
         <StatsCard 
           title="Net Savings" 
           amount={data.savings || 0} 
           icon={Target} 
           color={data.savings >= 0 ? "text-blue-600" : "text-orange-600"} 
           bg={data.savings >= 0 ? "bg-blue-50" : "bg-orange-50"} 
         />
         <StatsCard 
           title="Total Assets" 
           amount={data.totalAssets || 0} 
           icon={Landmark} 
           color="text-violet-600" 
           bg="bg-violet-50" 
         />
      </div>

      {/* 5. Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Analysis & Insights */}
          <div className="lg:col-span-1 space-y-6">
             {/* Expense Breakdown */}
             <div className="glass-panel p-6">
                <h3 className="font-bold text-lg text-slate-800 mb-6">Expense Structure</h3>
                <div className="h-64 relative">
                   <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } } }} />
                </div>
             </div>

             {/* Smart Suggestions */}
             <div className="glass-panel p-0 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <Zap size={18} className="text-amber-500" />
                    Smart Insights
                  </h3>
                </div>
                <div className="p-5">
                   <SmartSuggestions suggestions={data.suggestions} />
                </div>
             </div>
          </div>

          {/* Right Column: Detailed Metrics */}
          <div className="lg:col-span-2 space-y-6">
              
              {/* Financial Dimensions */}
              <div className="glass-panel p-6">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="font-bold text-lg text-slate-800">Health Dimensions</h3>
                  </div>
                  <HealthDimensions
                    dimensions={data.healthDimensions}
                    overallScore={data.overallHealthScore || data.healthScore}
                  />
              </div>

              {/* Recent Transactions */}
              <div className="glass-panel p-6">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-800">Recent Activity</h3>
                    <button className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
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
          <p className="text-2xl font-bold text-slate-900 mt-1">₹{(amount || 0).toLocaleString('en-IN')}</p>
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
          <p className={`font-bold text-lg ${isIncome ? 'text-green-600' : 'text-slate-900'}`}>
             {isIncome ? '+' : '-'}₹{Math.abs(item.amount).toLocaleString()}
          </p>
       </div>
    </div>
  );
}
