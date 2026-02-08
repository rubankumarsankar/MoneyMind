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
  Activity
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
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

  if (loading) return <div className="p-10 text-center animate-pulse">Loading MoneyMind Intelligence...</div>;
  if (!data) return <div className="p-10 text-center">Failed to load data.</div>;

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
          'rgba(59, 130, 246, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(16, 185, 129, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const prediction = data.prediction || {};
  const budgetAnalysis = data.budgetAnalysis || {};

  return (
    <div className="space-y-4 sm:space-y-6 pb-10 px-1 sm:px-0">
      {/* Header with Cycle Info */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 sm:gap-4">
        <div>
           <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-700 to-purple-600">
             Financial Overview
           </h1>
           <p className="text-slate-500 text-sm sm:text-base">Welcome back, {session?.user?.name}</p>
        </div>
        <div className="text-left sm:text-right flex sm:block gap-3 sm:gap-0">
          <div className="text-xs sm:text-sm font-medium text-slate-600">{data.cycleLabel || 'Current Cycle'}</div>
          <div className="text-xs text-slate-400">{data.daysLeft} days remaining</div>
        </div>
      </div>

      {/* V3 Notifications Banner */}
      {data.notifications && data.notifications.length > 0 && (
        <div className="bg-linear-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <Bell className="text-orange-500" size={20} />
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-800">{data.notifications[0]?.title}</p>
              <p className="text-xs text-orange-600">{data.notifications[0]?.message}</p>
            </div>
            {data.notifications.length > 1 && (
              <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full">
                +{data.notifications.length - 1} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Top Intelligence Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Health Gauge */}
          <div className="lg:col-span-3 glass-card p-4 flex flex-col items-center justify-center relative bg-white shadow-sm border border-slate-100 rounded-2xl">
              <h3 className="absolute top-4 left-4 font-bold text-slate-700 text-sm">Health Score</h3>
              <HealthScoreGauge score={data.healthScore ?? 0} riskLevel={data.riskLevel || 'STABLE'} />
          </div>

          {/* V3 Analytics Cards */}
          <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

              {/* Safe to Spend */}
              <SafeSpendCard amount={data.safeToSpend?.daily || 0} status={data.safeToSpend?.status} />

              {/* Spending Velocity - NEW */}
              <div className="glass-card p-6 flex flex-col justify-between bg-white shadow-sm border border-slate-100 rounded-2xl">
                  <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-slate-500">Daily Velocity</h3>
                      <Zap className={`${data.dailyVelocity > (data.totalIncome / 30) ? 'text-red-500' : 'text-green-500'}`} size={18} />
                  </div>
                  <p className="text-3xl font-bold text-slate-800 mt-1">₹{(data.dailyVelocity || 0).toLocaleString()}/day</p>
                  <div className="mt-3 space-y-2">
                      <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Projected Month-End</span>
                          <span className={`font-bold ${data.projectedMonthEnd > data.totalIncome ? 'text-red-500' : 'text-green-600'}`}>
                              ₹{(data.projectedMonthEnd || 0).toLocaleString()}
                          </span>
                      </div>
                      {data.projectedMonthEnd > data.totalIncome && (
                          <div className="text-xs text-red-500 bg-red-50 p-2 rounded-lg">
                              ⚠️ Over budget by ₹{(data.projectedMonthEnd - data.totalIncome).toLocaleString()}
                          </div>
                      )}
                  </div>
              </div>

              {/* Prediction with Confidence - NEW */}
              <div className="glass-card p-6 flex flex-col justify-between bg-white shadow-sm border border-slate-100 rounded-2xl">
                  <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-slate-500">Next Month Forecast</h3>
                      <Activity className="text-blue-500" size={18} />
                  </div>
                  <p className="text-3xl font-bold text-slate-800 mt-1">₹{(prediction.predicted || 0).toLocaleString()}</p>
                  <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                          <span className={`px-2 py-0.5 rounded-full ${
                              prediction.trend?.direction === 'INCREASING' ? 'bg-red-100 text-red-700' :
                              prediction.trend?.direction === 'DECREASING' ? 'bg-green-100 text-green-700' :
                              'bg-slate-100 text-slate-600'
                          }`}>
                              {prediction.trend?.direction === 'INCREASING' ? '↑' : prediction.trend?.direction === 'DECREASING' ? '↓' : '→'}
                              {' '}{prediction.trend?.direction || 'STABLE'}
                          </span>
                          <span className="text-slate-400">|</span>
                          <span className="text-slate-500">{prediction.confidence || 0}% confidence</span>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* Stats Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard title="Income" amount={data.totalIncome || 0} icon={Wallet} color="text-blue-600" bg="bg-blue-50" />
        <StatsCard title="Expense" amount={data.totalExpense || 0} icon={TrendingDown} color="text-red-600" bg="bg-red-50" />
        <StatsCard title="Savings" amount={data.savings || 0} icon={Target} color={data.savings >= 0 ? "text-green-600" : "text-red-600"} bg={data.savings >= 0 ? "bg-green-50" : "bg-red-50"} />
        <StatsCard title="Assets" amount={data.totalAssets || 0} icon={Landmark} color="text-purple-600" bg="bg-purple-50" />
      </div>

      {/* V2 Intelligence Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Health Dimensions - Multi-dimensional score */}
        <HealthDimensions
          dimensions={data.healthDimensions}
          overallScore={data.overallHealthScore || data.healthScore}
        />

        {/* Stress Indicator */}
        <StressIndicator
          stressLevel={data.stressLevel}
          signals={data.stressSignals}
          isStressed={data.isFinanciallyStressed}
        />

        {/* Category Trends */}
        <CategoryTrends trends={data.trendSignals} />
      </div>

      {/* 50/30/20 Budget Rule Analysis */}
      {data.rule503020 && (
        <div className="glass-panel p-6 bg-white shadow-sm border border-slate-100 rounded-2xl">
          <h2 className="font-bold text-lg text-slate-700 mb-4 flex items-center gap-2">
            📊 50/30/20 Budget Rule
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <BudgetRuleCard
              label={data.rule503020.needs?.label}
              actual={data.rule503020.needs?.actual}
              target={data.rule503020.needs?.target}
              percentage={data.rule503020.needs?.percentage}
              status={data.rule503020.needs?.status}
              description={data.rule503020.needs?.description}
              color="blue"
            />
            <BudgetRuleCard
              label={data.rule503020.wants?.label}
              actual={data.rule503020.wants?.actual}
              target={data.rule503020.wants?.target}
              percentage={data.rule503020.wants?.percentage}
              status={data.rule503020.wants?.status}
              description={data.rule503020.wants?.description}
              color="purple"
            />
            <BudgetRuleCard
              label={data.rule503020.savings?.label}
              actual={data.rule503020.savings?.actual}
              target={data.rule503020.savings?.target}
              percentage={data.rule503020.savings?.percentage}
              status={data.rule503020.savings?.status}
              description={data.rule503020.savings?.description}
              color="green"
            />
          </div>
        </div>
      )}

      {/* Financial Freedom Roadmap */}
      {data.freedomRoadmap && data.freedomRoadmap.totalDebt > 0 && (
        <div className="glass-panel p-6 bg-linear-to-br from-slate-900 to-slate-800 text-white rounded-2xl">
          <h2 className="font-bold text-xl mb-4 flex items-center gap-2">
            🎯 Financial Freedom Roadmap
          </h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="bg-white/10 p-4 rounded-xl">
              <p className="text-xs text-slate-300 uppercase font-bold">Total Debt</p>
              <p className="text-2xl font-bold text-red-400">₹{data.freedomRoadmap.totalDebt.toLocaleString()}</p>
            </div>
            <div className="bg-white/10 p-4 rounded-xl">
              <p className="text-xs text-slate-300 uppercase font-bold">Monthly Payments</p>
              <p className="text-2xl font-bold text-amber-400">₹{data.freedomRoadmap.monthlyDebtPayments.toLocaleString()}</p>
            </div>
            <div className="bg-white/10 p-4 rounded-xl">
              <p className="text-xs text-slate-300 uppercase font-bold">Debt-Free By</p>
              <p className="text-2xl font-bold text-green-400">
                {data.freedomRoadmap.debtFreeDate 
                  ? new Date(data.freedomRoadmap.debtFreeDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
                  : 'Already Free!'}
              </p>
            </div>
            <div className="bg-white/10 p-4 rounded-xl">
              <p className="text-xs text-slate-300 uppercase font-bold">CC Debt</p>
              <p className="text-2xl font-bold text-purple-400">₹{data.freedomRoadmap.totalCCDebt.toLocaleString()}</p>
            </div>
          </div>

          {/* EMI Payoff Order */}
          {data.freedomRoadmap.emiPayoffOrder && data.freedomRoadmap.emiPayoffOrder.length > 0 && (
            <div>
              <h3 className="font-bold text-sm text-slate-300 mb-3">📋 EMI Payoff Priority (Finish One by One)</h3>
              <div className="space-y-2">
                {data.freedomRoadmap.emiPayoffOrder.slice(0, 4).map((emi, idx) => (
                  <div key={emi.id} className={`flex items-center justify-between p-3 rounded-lg ${idx === 0 ? 'bg-green-500/20 border border-green-500/30' : 'bg-white/5'}`}>
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-green-500 text-white' : 'bg-white/20'}`}>
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-medium">{emi.name}</p>
                        <p className="text-xs text-slate-400">{emi.remainingMonths} months left • {emi.interestRate}% rate</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₹{emi.remainingAmount.toLocaleString()}</p>
                      <p className="text-xs text-slate-400">₹{emi.monthlyAmount}/mo</p>
                    </div>
                  </div>
                ))}
              </div>
              {data.freedomRoadmap.emiPayoffOrder.length > 0 && (
                <p className="text-xs text-green-400 mt-3 bg-green-500/10 p-2 rounded-lg">
                  💡 Focus on paying off "{data.freedomRoadmap.emiPayoffOrder[0].name}" first to free up ₹{data.freedomRoadmap.emiPayoffOrder[0].monthlyAmount}/mo!
                </p>
              )}
            </div>
          )}

          {/* Accelerated Payoff Tip */}
          {data.freedomRoadmap.acceleratedPayoff && data.freedomRoadmap.acceleratedPayoff.extraPerMonth > 0 && (
            <div className="mt-4 p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl">
              <p className="text-sm">🚀 <strong>Accelerate Freedom:</strong> Put ₹{data.freedomRoadmap.acceleratedPayoff.extraPerMonth.toLocaleString()}/mo extra towards debt to save ~{data.freedomRoadmap.acceleratedPayoff.monthsSaved} months!</p>
            </div>
          )}
        </div>
      )}

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: Charts & Suggestions */}
        <div className="space-y-6 lg:col-span-1">
            <div className="glass-card p-6 flex flex-col h-72 bg-white shadow-sm border border-slate-100 rounded-2xl">
                <h3 className="font-bold text-lg mb-4 text-slate-700">Breakdown</h3>
                <div className="flex-1 relative">
                    <Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} />
                </div>
            </div>

             {/* Expense Leaks */}
             <div className="glass-card p-6 overflow-hidden relative bg-white shadow-sm border border-slate-100 rounded-2xl flex flex-col max-h-64">
                 <h3 className="font-bold text-sm mb-3 text-slate-700 flex items-center gap-2">
                     <AlertTriangle size={16} className="text-orange-500" /> Expense Leaks
                 </h3>
                 <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                     {data.expenseLeaks && data.expenseLeaks.length > 0 ? (
                         data.expenseLeaks.slice(0, 4).map((leak, idx) => (
                             <div key={idx} className={`p-2 rounded-lg text-xs border ${
                                 leak.severity === 'HIGH' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-orange-50 text-orange-700 border-orange-100'
                             }`}>
                                 <strong>{leak.category}</strong> ↑{leak.percentChange}%
                                 <span className="block text-[10px] opacity-70">{leak.message}</span>
                             </div>
                         ))
                     ) : (
                         <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                             No leaks detected this month.
                         </div>
                     )}
                 </div>
             </div>

             {/* Smart Suggestions */}
             <div className="glass-card p-6 bg-white shadow-sm border border-slate-100 rounded-2xl">
                <h3 className="font-bold text-lg mb-4 text-slate-700 flex items-center gap-2">
                    💡 Smart Suggestions
                </h3>
                <SmartSuggestions suggestions={data.suggestions} />
            </div>
        </div>

        {/* Right: Recent Transactions */}
        <div className="glass-card p-6 lg:col-span-2 flex flex-col bg-white shadow-sm border border-slate-100 rounded-2xl">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-slate-700">Recent Transactions</h3>
            </div>

            <div className="space-y-3 flex-1">
                {data.recentTransactions && data.recentTransactions.length > 0 ? (
                    data.recentTransactions.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border-b border-slate-50 last:border-0">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                                    item.type === 'INCOME' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                }`}>
                                    {item.type === 'INCOME' ? '+' : '-'}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">{item.category}</p>
                                    <p className="text-xs text-slate-500">
                                        {new Date(item.date).toLocaleDateString()}
                                        {item.paymentMethod && <span className="ml-2 px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-500">{item.paymentMethod}</span>}
                                    </p>
                                </div>
                            </div>
                            <span className={`font-bold text-lg ${item.type === 'INCOME' ? 'text-green-600' : 'text-slate-700'}`}>
                                {item.type === 'INCOME' ? '+' : '-'}₹{item.amount.toLocaleString()}
                            </span>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-slate-400">No recent activity.</div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, amount, icon: Icon, color, bg }) {
  return (
    <div className="glass-card p-4 flex items-center gap-3 bg-white shadow-sm border border-slate-100 rounded-2xl">
      <div className={`p-2.5 rounded-xl ${bg} ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{title}</p>
        <h3 className="text-lg font-bold text-slate-800">
          ₹{(amount ?? 0).toLocaleString('en-IN')}
        </h3>
      </div>
    </div>
  );
}

function BudgetRuleCard({ label, actual, target, percentage, status, color, description }) {
  const colors = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', bar: 'bg-blue-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', bar: 'bg-purple-500' },
    green: { bg: 'bg-green-50', text: 'text-green-700', bar: 'bg-green-500' },
  };
  const c = colors[color] || colors.blue;
  const pct = Math.min(100, Math.abs(percentage || 0));
  const isOver = status === 'OVER' || status === 'UNDER';

  return (
    <div className={`p-4 rounded-xl ${c.bg}`}>
      <div className="flex justify-between items-center mb-2">
        <span className={`text-sm font-medium ${c.text}`}>{label}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${isOver ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {status === 'OVER' ? 'Over' : status === 'UNDER' ? 'Under' : 'OK'}
        </span>
      </div>
      <div className="text-2xl font-bold text-slate-800 mb-1">
        ₹{(actual || 0).toLocaleString()}
      </div>
      <div className="text-xs text-slate-500 mb-2">
        Target: ₹{(target || 0).toLocaleString()}
      </div>
      <div className="h-2 bg-white/50 rounded-full overflow-hidden">
        <div className={`h-full ${isOver ? 'bg-red-500' : c.bar} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-slate-500 mt-1">
        {description && <span className="truncate">{description}</span>}
        <span>{Math.round(percentage || 0)}%</span>
      </div>
    </div>
  );
}

