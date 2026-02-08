'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Target,
  TrendingUp,
  Calculator,
  Zap,
  Calendar,
  DollarSign,
  AlertTriangle,
  ChevronRight,
  Play,
  RefreshCw,
} from 'lucide-react';

export default function PlanningPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('cashflow');
  
  // Simulation states
  const [cashFlowMonths, setCashFlowMonths] = useState(6);
  const [whatIfScenario, setWhatIfScenario] = useState({
    incomeChange: 0,
    expenseChange: 0,
    newEMI: 0,
  });
  const [simulationResult, setSimulationResult] = useState(null);

  useEffect(() => {
    if (session) {
      fetch('/api/planning')
        .then(res => res.json())
        .then(result => {
          setData(result);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [session]);

  const runWhatIfSimulation = async () => {
    const res = await fetch('/api/planning/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: whatIfScenario }),
    });
    const result = await res.json();
    setSimulationResult(result);
  };

  if (loading) {
    return (
      <div className="p-10 text-center animate-pulse">
        Loading Financial Planning...
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-10 px-1 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-purple-600 to-blue-600">
            Financial Planning
          </h1>
          <p className="text-slate-500 text-sm sm:text-base">Simulate and visualize your financial future</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {[
          { id: 'cashflow', label: 'Cash Flow', icon: TrendingUp },
          { id: 'goals', label: 'Goals', icon: Target },
          { id: 'whatif', label: 'What-If', icon: Calculator },
          { id: 'freedom', label: 'Freedom Date', icon: Calendar },
          { id: 'stress', label: 'Stress Test', icon: AlertTriangle },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6">
        
        {/* Cash Flow Simulation */}
        {activeTab === 'cashflow' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-700">Cash Flow Projection</h2>
              <div className="flex items-center gap-2">
                <select
                  value={cashFlowMonths}
                  onChange={(e) => setCashFlowMonths(Number(e.target.value))}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  <option value={3}>3 months</option>
                  <option value={6}>6 months</option>
                  <option value={12}>12 months</option>
                </select>
              </div>
            </div>

            {data?.cashFlow?.simulation && (
              <div className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-xs text-blue-600 font-medium">Final Balance</p>
                    <p className="text-xl font-bold text-blue-700">
                      ₹{data.cashFlow.summary?.finalBalance?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl">
                    <p className="text-xs text-green-600 font-medium">Positive Months</p>
                    <p className="text-xl font-bold text-green-700">
                      {cashFlowMonths - (data.cashFlow.summary?.negativeMonths || 0)}
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl ${data.cashFlow.summary?.negativeMonths > 0 ? 'bg-red-50' : 'bg-slate-50'}`}>
                    <p className={`text-xs font-medium ${data.cashFlow.summary?.negativeMonths > 0 ? 'text-red-600' : 'text-slate-600'}`}>Negative Months</p>
                    <p className={`text-xl font-bold ${data.cashFlow.summary?.negativeMonths > 0 ? 'text-red-700' : 'text-slate-700'}`}>
                      {data.cashFlow.summary?.negativeMonths || 0}
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl ${
                    data.cashFlow.summary?.riskLevel === 'HIGH' ? 'bg-red-50' :
                    data.cashFlow.summary?.riskLevel === 'MEDIUM' ? 'bg-yellow-50' : 'bg-green-50'
                  }`}>
                    <p className="text-xs font-medium text-slate-600">Risk Level</p>
                    <p className={`text-xl font-bold ${
                      data.cashFlow.summary?.riskLevel === 'HIGH' ? 'text-red-700' :
                      data.cashFlow.summary?.riskLevel === 'MEDIUM' ? 'text-yellow-700' : 'text-green-700'
                    }`}>
                      {data.cashFlow.summary?.riskLevel || 'LOW'}
                    </p>
                  </div>
                </div>

                {/* Monthly Breakdown */}
                <div className="space-y-2">
                  {data.cashFlow.simulation.slice(0, cashFlowMonths).map((month, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        month.status === 'NEGATIVE' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-600 w-20">{month.monthLabel}</span>
                        <span className="text-xs text-slate-500">
                          In: ₹{month.income?.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500">
                          Out: ₹{month.expenses?.toLocaleString()}
                        </span>
                      </div>
                      <div className={`text-sm font-bold ${month.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {month.netFlow >= 0 ? '+' : ''}₹{month.netFlow?.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Goals */}
        {activeTab === 'goals' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-700">Savings Goals Timeline</h2>
            
            {data?.goals && data.goals.length > 0 ? (
              <div className="space-y-4">
                {data.goals.map((goal, idx) => (
                  <div key={idx} className="p-4 border border-slate-200 rounded-xl">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-slate-700">{goal.name}</h3>
                        <p className="text-xs text-slate-500">Target: ₹{goal.targetAmount?.toLocaleString()}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        goal.timeline?.achievable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {goal.timeline?.achievable ? `${goal.timeline.monthsRemaining} months` : 'Needs adjustment'}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-purple-500 to-blue-500 rounded-full"
                        style={{ width: `${goal.timeline?.currentProgress || 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      {goal.timeline?.currentProgress || 0}% complete • 
                      Target date: {goal.timeline?.targetDate ? new Date(goal.timeline.targetDate).toLocaleDateString() : 'TBD'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500">
                <Target size={40} className="mx-auto mb-3 opacity-30" />
                <p>No savings goals set yet</p>
                <a href="/savings" className="text-purple-600 text-sm hover:underline">Create a goal →</a>
              </div>
            )}
          </div>
        )}

        {/* What-If Analysis */}
        {activeTab === 'whatif' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-700">What-If Scenario</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Income Change</label>
                <input
                  type="number"
                  value={whatIfScenario.incomeChange}
                  onChange={(e) => setWhatIfScenario({ ...whatIfScenario, incomeChange: Number(e.target.value) })}
                  placeholder="+5000 or -5000"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Expense Change</label>
                <input
                  type="number"
                  value={whatIfScenario.expenseChange}
                  onChange={(e) => setWhatIfScenario({ ...whatIfScenario, expenseChange: Number(e.target.value) })}
                  placeholder="+2000 or -2000"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">New EMI</label>
                <input
                  type="number"
                  value={whatIfScenario.newEMI}
                  onChange={(e) => setWhatIfScenario({ ...whatIfScenario, newEMI: Number(e.target.value) })}
                  placeholder="New monthly EMI"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <button
              onClick={runWhatIfSimulation}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <Play size={16} />
              Run Simulation
            </button>

            {simulationResult && (
              <div className="p-4 bg-slate-50 rounded-xl space-y-4">
                <h3 className="font-bold text-slate-700">Simulation Result</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Before</p>
                    <p className="font-medium">Savings: ₹{simulationResult.before?.monthlySavings?.toLocaleString()}</p>
                    <p className="font-medium">Health: {simulationResult.before?.healthScore}/100</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">After</p>
                    <p className={`font-medium ${simulationResult.after?.monthlySavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      Savings: ₹{simulationResult.after?.monthlySavings?.toLocaleString()}
                    </p>
                    <p className={`font-medium ${simulationResult.after?.healthScore >= simulationResult.before?.healthScore ? 'text-green-600' : 'text-red-600'}`}>
                      Health: {simulationResult.after?.healthScore}/100
                    </p>
                  </div>
                </div>
                <p className={`text-sm p-3 rounded-lg ${
                  simulationResult.after?.monthlySavings >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {simulationResult.impact?.recommendation}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Financial Freedom */}
        {activeTab === 'freedom' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-700">Financial Freedom Roadmap</h2>
            
            {data?.freedomDate && (
              <div className="space-y-6">
                {/* Freedom Date */}
                <div className="text-center p-6 bg-linear-to-br from-purple-500 to-blue-500 rounded-2xl text-white">
                  <p className="text-sm opacity-80">Estimated Freedom Date</p>
                  <p className="text-3xl font-bold mt-1">
                    {data.freedomDate.isAlreadyFree 
                      ? '🎉 You are debt-free!' 
                      : new Date(data.freedomDate.freedomDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
                    }
                  </p>
                  <p className="text-sm mt-2 opacity-80">
                    {data.freedomDate.yearsToFreedom} years to go
                  </p>
                </div>

                {/* Phases */}
                <div className="space-y-3">
                  {data.freedomDate.phases?.map((phase, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        phase.status === 'COMPLETE' ? 'bg-green-500' : 'bg-slate-200'
                      }`}>
                        {phase.status === 'COMPLETE' ? (
                          <span className="text-white">✓</span>
                        ) : (
                          <span className="text-slate-500">{idx + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-700">{phase.name}</p>
                        <p className="text-xs text-slate-500">
                          {phase.status === 'COMPLETE' ? 'Completed' : `${phase.months} months remaining`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stress Test */}
        {activeTab === 'stress' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-700">Stress Test Results</h2>
            <p className="text-sm text-slate-500">What happens if your income drops by 30%?</p>
            
            {data?.stressTest && (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl ${
                  data.stressTest.riskLevel === 'HIGH' ? 'bg-red-50 border border-red-200' :
                  data.stressTest.riskLevel === 'MEDIUM' ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-green-50 border border-green-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={
                      data.stressTest.riskLevel === 'HIGH' ? 'text-red-500' :
                      data.stressTest.riskLevel === 'MEDIUM' ? 'text-yellow-500' : 'text-green-500'
                    } size={24} />
                    <div>
                      <p className="font-bold">Risk Level: {data.stressTest.riskLevel}</p>
                      <p className="text-sm">
                        Survival: {data.stressTest.survivalMonths === 'Indefinite' 
                          ? 'Can survive indefinitely' 
                          : `${data.stressTest.survivalMonths} months`
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500">Reduced Income</p>
                    <p className="text-lg font-bold text-slate-700">₹{data.stressTest.reducedIncome?.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500">Monthly Shortfall</p>
                    <p className="text-lg font-bold text-red-600">₹{data.stressTest.monthlyShortfall?.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="font-medium text-slate-700">Recommendations:</p>
                  {data.stressTest.recommendations?.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                      <ChevronRight size={16} className="mt-0.5 text-purple-500" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
