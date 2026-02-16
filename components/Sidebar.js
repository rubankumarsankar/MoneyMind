'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  CreditCard, 
  PieChart, 
  TrendingDown,
  PiggyBank,
  ArrowLeftRight,
  Banknote,
  Target,
  Menu,
  X,
  DollarSign,
  Calendar,
  UserCircle,
  RefreshCcw,
  LogOut
} from 'lucide-react';

const menuGroups = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { name: 'Cash Flow', icon: ArrowLeftRight, path: '/cash-flow' }, // Unified View
      { name: 'Reports', icon: PiggyBank, path: '/reports' },
    ]
  },
  {
    title: 'Daily Money',
    items: [
      { name: 'Income', icon: Banknote, path: '/income' },
      { name: 'Expenses', icon: TrendingDown, path: '/expenses' },
      { name: 'Budgets', icon: DollarSign, path: '/budgets' },
      { name: 'Subscriptions', icon: RefreshCcw, path: '/subscriptions' },
    ]
  },
  {
    title: 'My Wealth',
    items: [
      { name: 'Accounts', icon: Wallet, path: '/accounts' },
      { name: 'Savings', icon: Target, path: '/savings' },
      { name: 'Planning', icon: Calendar, path: '/planning' },
    ]
  },
  {
    title: 'Liabilities',
    items: [
      { name: 'Credit Cards', icon: CreditCard, path: '/credit-cards' },
      { name: 'Loans & EMI', icon: PieChart, path: '/emi' },
      { name: 'Borrow/Lend', icon: ArrowLeftRight, path: '/borrow' },
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => pathname === path;

  return (
    <>
      {/* Mobile Header / Toggle */}
      <div className="md:hidden fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-white/20 z-40 h-16 flex items-center justify-between px-4 shadow-sm">
         <div className="font-bold text-xl bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-violet-600 font-heading tracking-tight">
            MoneyMind
         </div>
         <button 
           onClick={() => setMobileOpen(!mobileOpen)}
           className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
         >
           {mobileOpen ? <X size={24} /> : <Menu size={24} />}
         </button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/20 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        w-72 fixed inset-y-0 left-0 bg-white/80 backdrop-blur-2xl border-r border-white/40 flex flex-col z-50
        transition-transform duration-300 ease-out h-[100dvh] shadow-2xl shadow-blue-900/5
         ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        md:block
      `}>
        
        {/* Logo Area */}
        <div className="h-24 flex items-center px-8 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3.5 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform duration-500 z-10 relative">
                M
              </div>
              <div className="absolute inset-0 bg-blue-600 blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-xl" />
            </div>
            <span className="font-bold text-2xl text-slate-900 tracking-tight font-heading group-hover:text-blue-600 transition-colors">MoneyMind</span>
          </Link>
        </div>

        {/* Navigation Items */}
        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar min-h-0 pb-24 mask-image-b overscroll-contain">
          {menuGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-3">
                {groupIdx > 0 && <div className="mx-4 h-px bg-slate-100/80 my-2" />} 
                <h3 className="text-[11px] font-bold text-slate-400/80 uppercase tracking-widest px-4 font-heading">
                    {group.title}
                </h3>
                <div className="space-y-1">
                    {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        
                        return (
                        <Link 
                            key={item.path} 
                            href={item.path}
                            onClick={() => setMobileOpen(false)}
                            className={`group flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-300 font-medium text-[15px] border border-transparent relative overflow-hidden ${
                            active 
                                ? 'bg-linear-to-r from-blue-50 to-indigo-50/50 text-blue-700 shadow-sm shadow-blue-100/50 border-blue-100/50' 
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            {active && (
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full shadow-[0_0_12px_rgba(37,99,235,0.4)]" />
                            )}
                            <Icon 
                              size={20} 
                              className={`transition-all duration-300 ${
                                active 
                                  ? 'text-blue-600 scale-110' 
                                  : 'text-slate-400 group-hover:text-slate-600 group-hover:scale-105'
                              }`} 
                              strokeWidth={active ? 2.5 : 2}
                            />
                            <span className={`relative z-10 ${active ? 'font-bold' : ''}`}>{item.name}</span>
                        </Link>
                        );
                    })}
                </div>
            </div>
          ))}
        </nav>

        {/* Footer Actions / User Profile */}
        <div className="p-4 mx-4 mb-4 rounded-3xl bg-linear-to-b from-white/40 to-white/80 border border-white/60 shadow-lg shadow-slate-200/40 backdrop-blur-xl">
           <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-slate-100 to-slate-200 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
                  <UserCircle size={28} className="text-slate-400" />
                  {/* Image would go here if available */}
              </div>
              <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate font-heading">My Account</p>
                  <Link href="/profile" className="text-xs text-blue-600 hover:text-blue-700 font-medium truncate flex items-center gap-1">
                    Manage Profile
                  </Link>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-2">
             <Link 
                href="/settings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-white hover:shadow-sm hover:text-slate-900 transition-all border border-transparent hover:border-slate-100"
             >
                <Target size={14} />
                <span>Settings</span>
             </Link>
             <button 
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 hover:shadow-sm transition-all border border-transparent hover:border-red-100"
             >
                <LogOut size={14} />
                <span>Sign Out</span>
             </button>
           </div>
        </div>
      </aside>
    </>
  );
}
