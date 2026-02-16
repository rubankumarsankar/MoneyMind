'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
import { Line, Doughnut, Bar, getElementAtEvent } from 'react-chartjs-2';
import { Download, TrendingUp, TrendingDown, Wallet, PieChart, Calendar, ChevronLeft, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

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
  
  // Filter States
  const [filterType, setFilterType] = useState('thisMonth'); 
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  
  // Drilldown State
  const [drilldown, setDrilldown] = useState(null); // { label, date }

  const chartRef = useRef(null);

  const filterOptions = [
    { key: 'today', label: 'Today' },
    { key: 'thisMonth', label: 'This Month' },
    { key: 'lastMonth', label: 'Last Month' },
    { key: '3month', label: '3 Months' },
    { key: '6month', label: '6 Months' },
    { key: '1year', label: '1 Year' },
    { key: 'all', label: 'All Time' },
    { key: 'custom', label: 'Custom' },
  ];

  const fetchReports = useCallback(async (overrideParams = {}) => {
    setLoading(true);
    try {
      let query = `?filter=${filterType}`;
      
      // Handle Custom Range
      if (filterType === 'custom' || overrideParams.startDate) {
          const start = overrideParams.startDate || customRange.start;
          const end = overrideParams.endDate || customRange.end;
          query = `?filter=custom&startDate=${start}&endDate=${end}`;
      }

      const res = await fetch(`/api/reports${query}`);
      if (res.ok) {
          const jsonData = await res.json();
          setData(jsonData);
          // Reset drilldown when main filter changes
          setDrilldown(null); 
      }
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  }, [filterType, customRange]);

  useEffect(() => {
    if (session) {
        if (filterType !== 'custom') {
            fetchReports();
        } else if (customRange.start && customRange.end) {
            fetchReports();
        }
    } 
  }, [session, filterType, customRange, fetchReports]);

  const handleChartClick = (event) => {
    const { current: chart } = chartRef;
    if (!chart) return;
    
    const elements = getElementAtEvent(chart, event);
    if (elements.length > 0) {
      const index = elements[0].index;
      const label = data.labels[index];
      
      // specific logic: if label is a Month (MMM yyyy), allow drilldown
      // if label is already a day (dd MMM), do nothing or show details
      if (label.includes(' ')) { // Simple check for "MMM yyyy"
         // Parse date from label
         const date = new Date(label);
         if (!isNaN(date)) {
             setDrilldown({
                 label,
                 date,
                 index
             });
             // Scroll to drilldown section
             setTimeout(() => {
                document.getElementById('drilldown-section')?.scrollIntoView({ behavior: 'smooth' });
             }, 100);
         }
      }
    }
  };

  const downloadCSV = () => {
    if (!data) return;
    const headers = ['Period', 'Income', 'Expense', 'Savings'].join(',');
    const rows = data.labels.map((label, i) => {
        return [label, data.income[i], data.expense[i], data.savings[i]].join(',');
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `financial_report_${filterType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!session) return <div className="p-8">Please log in.</div>;

  // Chart Configs
  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: handleChartClick,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: { position: 'top' },
      tooltip: {
          callbacks: {
              footer: (items) => {
                  return 'Click to see daily breakdown';
              }
          }
      }
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
    labels: data?.labels || [],
    datasets: [
      {
        label: 'Income',
        data: data?.income || [],
        borderColor: '#10b981',
        backgroundColor: '#10b981',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Expense',
        data: data?.expense || [],
        borderColor: '#ef4444',
        backgroundColor: '#ef4444',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  // Secondary Charts Data
  const categoryData = {
    labels: data?.categoryBreakdown.map(c => c.category) || [],
    datasets: [
      {
        data: data?.categoryBreakdown.map(c => c.amount) || [],
        backgroundColor: [
          '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 px-1 sm:px-0 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
           <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-indigo-600">
             📊 Financial Reports
           </h1>
           <p className="text-slate-500 mt-1 sm:mt-2 text-sm sm:text-base">
               {data?.meta?.startDate ? 
                  `${new Date(data.meta.startDate).toLocaleDateString()} - ${new Date(data.meta.endDate).toLocaleDateString()}` 
                  : 'Analyze your financial health'}
           </p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={downloadCSV}
                className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700 transition-colors shadow-lg shadow-slate-900/10"
            >
                <Download size={16} /> Export
            </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {filterOptions.map(filter => (
            <button
                key={filter.key}
                onClick={() => {
                    setFilterType(filter.key);
                    if(filter.key === 'custom') setShowCustomPicker(true);
                    else setShowCustomPicker(false);
                }}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                filterType === filter.key
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
                }`}
            >
                {filter.label}
            </button>
            ))}
        </div>

        {/* Custom Range Picker */}
        {showCustomPicker && (
            <div className="glass-panel p-4 flex flex-col sm:flex-row gap-4 items-end sm:items-center animate-in slide-in-from-top-2 duration-200">
                <div className="w-full sm:w-auto">
                    <label className="text-xs font-bold text-slate-500 uppercase">Start Date</label>
                    <input 
                        type="date" 
                        value={customRange.start}
                        onChange={e => setCustomRange({...customRange, start: e.target.value})}
                        className="input-field mt-1"
                    />
                </div>
                <div className="w-full sm:w-auto">
                    <label className="text-xs font-bold text-slate-500 uppercase">End Date</label>
                    <input 
                        type="date" 
                        value={customRange.end}
                        onChange={e => setCustomRange({...customRange, end: e.target.value})}
                        className="input-field mt-1"
                    />
                </div>
                <button 
                    onClick={() => fetchReports()}
                    className="btn-primary h-[42px] mb-[1px]"
                    disabled={!customRange.start || !customRange.end}
                >
                    Apply Range
                </button>
            </div>
        )}
      </div>

      {loading && !data ? (
          <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-500">Crunching the numbers...</p>
          </div>
      ) : (
        <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <div className="glass-card p-6 border-l-4 border-l-green-500">
                    <p className="text-xs font-bold text-slate-400 uppercase">Total Income</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">₹{data?.yearlyComparison?.income.toLocaleString()}</p>
                </div>
                <div className="glass-card p-6 border-l-4 border-l-red-500">
                    <p className="text-xs font-bold text-slate-400 uppercase">Total Expenses</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">₹{data?.yearlyComparison?.expense.toLocaleString()}</p>
                </div>
                <div className="glass-card p-6 border-l-4 border-l-blue-500">
                    <p className="text-xs font-bold text-slate-400 uppercase">Net Savings</p>
                    <p className={`text-2xl font-bold mt-1 ${data?.yearlyComparison?.savings >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        ₹{data?.yearlyComparison?.savings.toLocaleString()}
                    </p>
                </div>
                <div className="glass-card p-6 border-l-4 border-l-purple-500">
                    <p className="text-xs font-bold text-slate-400 uppercase">Savings Rate</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">
                        {data?.yearlyComparison?.savingsRate.toFixed(1)}%
                    </p>
                </div>
            </div>

            {/* Main Trend Chart */}
            <div className="glass-panel p-4 sm:p-6">
                <h3 className="font-bold text-lg text-slate-700 mb-6 flex items-center gap-2">
                    <TrendingUp size={20} className="text-blue-500"/> 
                    {data?.meta?.groupBy === 'daily' ? 'Daily Trend' : 'Monthly Trend'}
                    {data?.meta?.groupBy === 'monthly' && <span className="text-xs font-normal text-slate-400 ml-2">(Click bar to drill down)</span>}
                </h3>
                <div className="h-[350px]">
                    <Line ref={chartRef} options={trendOptions} data={trendData} />
                </div>
            </div>

            {/* Drilldown Section */}
            {drilldown && (
                <div id="drilldown-section" className="border-t-2 border-slate-100 pt-8 mt-8 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Calendar className="text-indigo-500" />
                            Breakdown: {drilldown.label}
                        </h3>
                        <button onClick={() => setDrilldown(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-red-500">
                            <X size={20} />
                        </button>
                    </div>
                    <DrilldownChart date={drilldown.date} />
                </div>
            )}

            {/* Breakdowns */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
                <div className="glass-panel p-4 sm:p-6">
                    <h3 className="font-bold text-lg text-slate-700 mb-6 flex items-center gap-2">
                        <PieChart size={20} className="text-purple-500"/> Spending by Category
                    </h3>
                    <div className="h-[300px] flex justify-center">
                         {categoryData.labels.length > 0 ? (
                             <Doughnut 
                                data={categoryData} 
                                options={{ 
                                    cutout: '60%', 
                                    plugins: { legend: { position: 'right', labels: { boxWidth: 12 } } } 
                                }} 
                            />
                         ) : (
                             <div className="flex items-center justify-center text-slate-400">No category data</div>
                         )}
                    </div>
                </div>

                <div className="glass-panel p-4 sm:p-6">
                    <h3 className="font-bold text-base sm:text-lg text-slate-700 mb-4">Fixed Expenses & Commitments</h3>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {data?.fixedExpenses.map(item => (
                            <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-blue-200 transition-colors">
                                <div>
                                    <p className="font-semibold text-slate-700">{item.name}</p>
                                    <p className="text-xs text-slate-400 capitalize">{item.category || 'Bill'}</p>
                                </div>
                                <p className="font-bold text-slate-700">₹{item.amount.toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
      )}
    </div>
  );
}

// Sub-component for Drilldown
function DrilldownChart({ date }) {
    const [dailyData, setDailyData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDaily = async () => {
            setLoading(true);
            try {
                // Calculate start/end of that month
                const start = format(startOfMonth(date), 'yyyy-MM-dd');
                const end = format(endOfMonth(date), 'yyyy-MM-dd');
                
                const res = await fetch(`/api/reports?view=daily&startDate=${start}&endDate=${end}`);
                if (res.ok) setDailyData(await res.json());
            } catch(e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchDaily();
    }, [date]);

    if(loading) return <div className="p-8 text-center text-slate-500">Loading daily details...</div>;
    if(!dailyData) return null;

    const data = {
        labels: dailyData.labels,
        datasets: [
            {
                label: 'Expense',
                type: 'bar',
                data: dailyData.expense,
                backgroundColor: '#ef4444',
                borderRadius: 4,
            },
            {
                label: 'Income',
                type: 'bar', // Mixed chart?
                data: dailyData.income,
                backgroundColor: '#10b981',
                borderRadius: 4,
            }
        ]
    };

    return (
        <div className="glass-panel p-4 h-[400px]">
             <Bar 
                data={data}
                options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'top' } },
                    scales: {
                        y: { 
                            beginAtZero: true,
                            grid: { color: '#f1f5f9' }
                        },
                        x: { grid: { display: false } }
                    }
                }}
             />
        </div>
    );
}
