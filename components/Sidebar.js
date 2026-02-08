'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
import { 
  Home, 
  Wallet, 
  CreditCard, 
  PieChart, 
  Settings, 
  LogOut,
  TrendingDown,
  PiggyBank,
  ArrowLeftRight,
  Banknote,
  Target,
  Menu,
  X,
  DollarSign,
  Calendar
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', icon: Home, path: '/dashboard', description: 'Overview & insights' },
  { name: 'Accounts', icon: Wallet, path: '/accounts', description: 'Bank & wallet balances' },
  { name: 'Income', icon: Banknote, path: '/income', description: 'Salary & earnings' },
  { name: 'Expenses', icon: TrendingDown, path: '/expenses', description: 'Daily & fixed costs' }, 
  { name: 'Budgets', icon: DollarSign, path: '/budgets', description: 'Category limits' },
  { name: 'Savings', icon: Target, path: '/savings', description: 'Goals & milestones' },
  { name: 'EMI', icon: PieChart, path: '/emi', description: 'Loan payments' },
  { name: 'Credit Cards', icon: CreditCard, path: '/credit-cards', description: 'Card management' },
  { name: 'Borrow/Lend', icon: ArrowLeftRight, path: '/borrow', description: 'Track IOUs' },
  { name: 'Reports', icon: PiggyBank, path: '/reports', description: 'Charts & analysis' },
  { name: 'Planning', icon: Calendar, path: '/planning', description: 'Future simulations' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-xl shadow-lg border border-slate-200"
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        w-64 h-screen fixed left-0 top-0 glass-panel border-r border-white/20 flex flex-col z-50 rounded-none border-y-0 border-l-0
        transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-purple-600">
            💰 MoneyMind
          </h1>
          <p className="text-xs text-slate-400 mt-1">Smart Finance Manager</p>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.path} 
                href={item.path}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'text-slate-600 hover:bg-white/60 hover:text-blue-600'
                }`}
              >
                <Icon size={20} />
                <div className="flex-1">
                  <span className="font-medium block">{item.name}</span>
                  {!isActive && (
                    <span className="text-[10px] text-slate-400 group-hover:text-blue-400 hidden lg:block">
                      {item.description}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link 
            href="/settings"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              pathname === '/settings' 
                 ? 'bg-blue-600 text-white' 
                 : 'text-slate-600 hover:bg-white/40 hover:text-blue-600'
            }`}
          >
            <Settings size={20} />
            <span className="font-medium">Settings</span>
          </Link>
          <button 
             onClick={() => signOut({ callbackUrl: '/' })}
             className="w-full mt-2 flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
             <LogOut size={20} />
             <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
