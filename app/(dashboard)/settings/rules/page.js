'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash, Zap, CheckCircle, RefreshCcw } from 'lucide-react';

export default function RulesPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRule, setNewRule] = useState({ pattern: '', category: '', matchType: 'CONTAINS' });
  const [refiling, setRefiling] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/rules');
      if (res.ok) {
        const data = await res.json();
        setRules(data);
      }
    } catch (error) {
      console.error("Error fetching rules", error);
    } finally {
      setLoading(false);
    }
  };

  const addRule = async (e) => {
    e.preventDefault();
    if (!newRule.pattern || !newRule.category) return;

    try {
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule)
      });

      if (res.ok) {
        const addedRule = await res.json();
        setRules([addedRule, ...rules]); // Add to top
        setNewRule({ pattern: '', category: '', matchType: 'CONTAINS' });
        setMessage("Rule added!");
      } else {
        const err = await res.json();
        setMessage(`Error: ${err.message}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const deleteRule = async (id) => {
    try {
      await fetch(`/api/rules?id=${id}`, { method: 'DELETE' });
      setRules(rules.filter(r => r.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const refileExpenses = async () => {
    if (!confirm("This will overwrite categories for ALL past expenses matching these rules. Continue?")) return;
    
    setRefiling(true);
    try {
      const res = await fetch('/api/rules/apply', { method: 'POST' });
      const data = await res.json();
      setMessage(`Success! Refiled ${data.count} expenses.`);
    } catch (error) {
       setMessage("Error refiling expenses.");
    } finally {
      setRefiling(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Smart Categorization Rules</h1>
           <p className="text-slate-500">Automatically assign categories based on keywords.</p>
        </div>
        <button 
          onClick={refileExpenses}
          disabled={refiling}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {refiling ? <RefreshCcw className="animate-spin" size={18} /> : <Zap size={18} />}
          {refiling ? 'Processing...' : 'Auto-Refile All'}
        </button>
      </div>

      {message && (
          <div className="p-3 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 border border-green-200">
              <CheckCircle size={18} />
              {message}
          </div>
      )}

      {/* Add New Rule */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-700 mb-4">Add New Rule</h2>
        <form onSubmit={addRule} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">If note contains</label>
            <input 
              type="text" 
              placeholder="e.g. Uber, Starbucks" 
              value={newRule.pattern}
              onChange={(e) => setNewRule({...newRule, pattern: e.target.value})}
              className="w-full p-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Match Type</label>
            <select 
              value={newRule.matchType}
              onChange={(e) => setNewRule({...newRule, matchType: e.target.value})}
              className="w-full p-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="CONTAINS">Contains</option>
              <option value="EXACT">Exact Match</option>
              <option value="STARTS_WITH">Starts With</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Set Category To</label>
            <input 
               type="text" 
               placeholder="e.g. Transport, Food"
               value={newRule.category}
               onChange={(e) => setNewRule({...newRule, category: e.target.value})}
               className="w-full p-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
               required
            />
          </div>
          <button 
             type="submit"
             className="w-full py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex justify-center items-center gap-2 font-medium"
          >
             <Plus size={18} />
             Add Rule
          </button>
        </form>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-700">Active Rules</h2>
        {loading ? (
             <div className="text-center py-10 text-slate-400">Loading rules...</div>
        ) : rules.length === 0 ? (
             <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-500">No rules defined yet.</p>
                <p className="text-sm text-slate-400 mt-1">Add a rule above to start automating categorization.</p>
             </div>
        ) : (
            <div className="grid grid-cols-1 gap-3">
                {rules.map((rule) => (
                    <div key={rule.id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                {rule.matchType}
                            </div>
                            <div className="font-mono text-slate-600">
                                "{rule.pattern}"
                            </div>
                            <div className="text-slate-400">→</div>
                            <div className="font-bold text-slate-800">
                                {rule.category}
                            </div>
                        </div>
                        <button 
                           onClick={() => deleteRule(rule.id)}
                           className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                        >
                            <Trash size={18} />
                        </button>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
