"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Check, Rocket, Landmark, Wallet, Layers } from "lucide-react";
import { showSuccess, showError } from "@/lib/sweetalert";

export default function OnboardingPage() {
  const router = useRouter();
  const { update } = useSession();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [salaryDate, setSalaryDate] = useState(1);
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankBalance, setBankBalance] = useState("");
  const [accountPurpose, setAccountPurpose] = useState("SALARY"); // SALARY, SAVINGS, SPENDING
  const [categories, setCategories] = useState([
    { name: "Food & Dining", type: "EXPENSE", icon: "Utensils", color: "#EF4444", selected: true },
    { name: "Transportation", type: "EXPENSE", icon: "Bus", color: "#F59E0B", selected: true },
    { name: "Bills & Utilities", type: "EXPENSE", icon: "Zap", color: "#3B82F6", selected: true },
    { name: "Shopping", type: "EXPENSE", icon: "ShoppingBag", color: "#EC4899", selected: true },
    { name: "Entertainment", type: "EXPENSE", icon: "Film", color: "#8B5CF6", selected: false },
    { name: "Health", type: "EXPENSE", icon: "Activity", color: "#10B981", selected: false },
    { name: "Salary", type: "INCOME", icon: "Briefcase", color: "#10B981", selected: true },
  ]);

  const handleCategoryToggle = (index) => {
    const newCategories = [...categories];
    newCategories[index].selected = !newCategories[index].selected;
    setCategories(newCategories);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const selectedCategories = categories.filter(c => c.selected);
      
      const res = await fetch("/api/setup/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salaryDate: parseInt(salaryDate),
          monthlyIncome: parseFloat(monthlyIncome),
          bankName,
          bankBalance: parseFloat(bankBalance),
          accountPurpose,
          categories: selectedCategories
        }),
      });

      if (res.ok) {
        // Update session to reflect new onboarding status
        await update({ onboardingCompleted: true });
        
        await showSuccess('Setup Complete!', 'Your financial dashboard is ready.');
        router.refresh(); // Refresh router cache
        router.push("/dashboard");
      } else {
        showError('Setup Failed', 'Please try again.');
      }
    } catch (error) {
      console.error(error);
      showError('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        
        {/* Progress Bar */}
        <div className="h-2 bg-slate-100 w-full">
          <div 
            className="h-full bg-blue-600 transition-all duration-500 ease-out" 
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="p-8">
          {/* Step 1: Salary & Income */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet size={32} />
                </div>
                <h1 className="text-2xl font-bold text-slate-800">Let&apos;s set up your finances</h1>
                <p className="text-slate-500">First, tell us about your income cycle.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Salary Date (Day of Month)
                  </label>
                  <select 
                    value={salaryDate}
                    onChange={(e) => setSalaryDate(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {[...Array(31)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">
                    We&apos;ll reset your monthly cycle on this day.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Monthly Income (Approx.)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400">₹</span>
                    <input 
                      type="number"
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(e.target.value)}
                      className="w-full p-3 pl-8 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="50000"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setStep(2)}
                disabled={!monthlyIncome}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Primary Account */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Landmark size={32} />
                </div>
                <h1 className="text-2xl font-bold text-slate-800">Add your primary account</h1>
                <p className="text-slate-500">Where do you mostly spend from?</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Bank / Wallet Name
                  </label>
                  <input 
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="e.g. HDFC Bank, PayTM"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Current Balance
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400">₹</span>
                    <input 
                      type="number"
                      value={bankBalance}
                      onChange={(e) => setBankBalance(e.target.value)}
                      className="w-full p-3 pl-8 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                      placeholder="10000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Account Purpose
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["SALARY", "SAVINGS", "SPENDING"].map((purpose) => (
                      <button
                        key={purpose}
                        type="button"
                        onClick={() => setAccountPurpose(purpose)}
                        className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          accountPurpose === purpose
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {purpose.charAt(0) + purpose.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setStep(1)}
                  className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors"
                >
                  Back
                </button>
                <button 
                  onClick={() => setStep(3)}
                  disabled={!bankName || !bankBalance}
                  className="w-2/3 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Categories */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Layers size={32} />
                </div>
                <h1 className="text-2xl font-bold text-slate-800">Customize Categories</h1>
                <p className="text-slate-500">Select categories relevant to you.</p>
              </div>

              <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
                {categories.map((cat, idx) => (
                  <div 
                    key={idx}
                    onClick={() => handleCategoryToggle(idx)}
                    className={`p-3 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all ${
                      cat.selected 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs"
                      style={{ backgroundColor: cat.selected ? cat.color : '#cbd5e1' }}
                    >
                      {cat.name[0]}
                    </div>
                    <span className={`text-sm font-medium ${cat.selected ? 'text-slate-800' : 'text-slate-400'}`}>
                      {cat.name}
                    </span>
                    {cat.selected && <Check size={16} className="ml-auto text-green-600" />}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setStep(2)}
                  className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors"
                >
                  Back
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-2/3 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Setting up...' : (
                    <>
                      Complete Setup <Rocket size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
