'use client';

import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend, 
  ArcElement 
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { Download, TrendingUp, TrendingDown, Wallet, PieChart } from 'lucide-react';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function ReportsPage() {
  const { data: session } = useSession();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('thisMonth'); // Default to this month

  const filterOptions = [
    { key: 'today', label: 'Today', days: 1 },
    { key: 'thisMonth', label: 'This Month', days: 30 },
    { key: '3month', label: '3 Months', days: 90 },
    { key: '6month', label: '6 Months', days: 180 },
    { key: '1year', label: '1 Year', days: 365 },
  ];

  useEffect(() => {
    if (session) fetchReports();
  }, [session, period]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const selectedFilter = filterOptions.find(f => f.key === period);
      const days = selectedFilter?.days || 30;
      const res = await fetch(`/api/reports?days=${days}&filter=${period}`);
      if (res.ok) setData(await res.json());
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const downloadCSV = () => {
    if (!data) return;
    const headers = ['Month', 'Income', 'Expense', 'Savings'].join(',');
    const rows = data.labels.map((label, i) => {
        return [label, data.income[i], data.expense[i], data.savings[i]].join(',');
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "financial_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!session) return <div className="p-8">Please log in.</div>;
  if (loading && !data) return <div className="p-8 text-slate-500">Generating analytics...</div>;

  // Chart Configs
  const trendOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: { position: 'top' },
      title: { display: false },
    },
    scales: {
        y: {
            grid: { color: '#f1f5f9' },
            ticks: { callback: (value) => '₹' + value/1000 + 'k' }
        },
        x: {
            grid: { display: false }
        }
    }
  };

  const trendData = {
    labels: data?.labels,
    datasets: [
      {
        label: 'Income',
        data: data?.income,
        borderColor: '#10b981',
        backgroundColor: '#10b981',
        tension: 0.4,
      },
      {
        label: 'Expense',
        data: data?.expense,
        borderColor: '#ef4444',
        backgroundColor: '#ef4444',
        tension: 0.4,
      },
    ],
  };

  const savingsData = {
    labels: data?.labels,
    datasets: [
        {
            label: 'Savings',
            data: data?.savings,
            backgroundColor: data?.savings.map(s => s >= 0 ? '#3b82f6' : '#f59e0b'),
            borderRadius: 4,
        }
    ]
  };

  const categoryData = {
    labels: data?.categoryBreakdown.map(c => c.category),
    datasets: [
      {
        data: data?.categoryBreakdown.map(c => c.amount),
        backgroundColor: [
          '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 px-1 sm:px-0 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
           <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-indigo-600">
             📊 Financial Reports
           </h1>
           <p className="text-slate-500 mt-1 sm:mt-2 text-sm sm:text-base">Analyze your income, expenses, and savings.</p>
        </div>
        <button 
            onClick={downloadCSV}
            className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700 transition-colors"
        >
            <Download size={16} /> Export
        </button>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {filterOptions.map(filter => (
          <button
            key={filter.key}
            onClick={() => setPeriod(filter.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              period === filter.key
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
         <div className="glass-card p-6 border-l-4 border-l-blue-500">
            <p className="text-xs font-bold text-slate-400 uppercase">Total Income</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">₹{data?.yearlyComparison?.income.toLocaleString()}</p>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-2 font-medium">
                <TrendingUp size={14}/> 
                <span>Last {period} months</span>
            </div>
         </div>
         <div className="glass-card p-6 border-l-4 border-l-red-500">
            <p className="text-xs font-bold text-slate-400 uppercase">Total Expenses</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">₹{data?.yearlyComparison?.expense.toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-2">
                Avg ₹{Math.round(data?.yearlyComparison?.expense / period).toLocaleString()}/mo
            </p>
         </div>
         <div className="glass-card p-6 border-l-4 border-l-green-500">
            <p className="text-xs font-bold text-slate-400 uppercase">Net Savings</p>
            <p className={`text-2xl font-bold mt-1 ${data?.yearlyComparison?.savings >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                ₹{data?.yearlyComparison?.savings.toLocaleString()}
            </p>
            <p className="text-xs text-slate-400 mt-2">
                {data?.yearlyComparison?.savingsRate.toFixed(1)}% Savings Rate
            </p>
         </div>
         <div className="glass-card p-6 border-l-4 border-l-purple-500">
            <p className="text-xs font-bold text-slate-400 uppercase">Fixed Commitments</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">
                ₹{(data?.totalFixed + data?.totalEMI).toLocaleString()}
            </p>
            <p className="text-xs text-slate-400 mt-2">
                Monthly Recurring
            </p>
         </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
         <div className="xl:col-span-2 glass-panel p-4 sm:p-6">
            <h3 className="font-bold text-lg text-slate-700 mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-500"/> Income vs Expense Trend
            </h3>
            <div className="h-[300px]">
                <Line options={trendOptions} data={trendData} />
            </div>
         </div>
         <div className="xl:col-span-1 glass-panel p-4 sm:p-6">
            <h3 className="font-bold text-lg text-slate-700 mb-6 flex items-center gap-2">
                <Wallet size={20} className="text-green-500"/> Savings Analysis
            </h3>
            <div className="h-[300px]">
                <Bar options={{...trendOptions, plugins: { legend: { display: false } }}} data={savingsData} />
            </div>
         </div>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
         <div className="xl:col-span-1 glass-panel p-4 sm:p-6">
            <h3 className="font-bold text-lg text-slate-700 mb-6 flex items-center gap-2">
                <PieChart size={20} className="text-purple-500"/> Spending by Category
            </h3>
            <div className="h-[250px] flex justify-center">
                <Doughnut 
                    data={categoryData} 
                    options={{ 
                        cutout: '60%', 
                        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } } 
                    }} 
                />
            </div>
         </div>
         <div className="xl:col-span-2 glass-panel p-4 sm:p-6">
            <h3 className="font-bold text-base sm:text-lg text-slate-700 mb-4">Top Fixed Expenses</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {data?.fixedExpenses.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-4 bg-slate-50/50 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                {item.name?.[0]}
                            </div>
                            <div>
                                <p className="font-medium text-slate-700">{item.name}</p>
                                <p className="text-xs text-slate-400">{item.category || 'Bill'}</p>
                            </div>
                        </div>
                        <p className="font-bold text-slate-700">₹{item.amount.toLocaleString()}</p>
                    </div>
                ))}
                {data?.fixedExpenses.length === 0 && (
                    <p className="text-slate-400 italic">No fixed expenses found.</p>
                )}
            </div>
         </div>
      </div>
    </div>
  );
}
