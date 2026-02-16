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
      <div className="md:hidden fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-40 h-16 flex items-center justify-between px-4">
         <div className="font-bold text-xl bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-purple-600 font-heading">
            MoneyMind
         </div>
         <button 
           onClick={() => setMobileOpen(!mobileOpen)}
           className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
         >
           {mobileOpen ? <X size={24} /> : <Menu size={24} />}
         </button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        w-64 fixed inset-y-0 left-0 bg-white/80 backdrop-blur-2xl border-r border-slate-200/50 flex flex-col z-50
        transition-transform duration-300 ease-out h-[100dvh] shadow-2xl shadow-slate-200/20
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        md:block
      `}>
        
        {/* Logo Area */}
        <div className="h-24 flex items-center px-6 border-b border-slate-100/50 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform duration-300">
              M
            </div>
            <span className="font-bold text-2xl text-slate-900 tracking-tight font-heading group-hover:text-blue-600 transition-colors">MoneyMind</span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-8 space-y-8 overflow-y-auto custom-scrollbar min-h-0 pb-6">
          {menuGroups.map((group, groupIdx) => (
            <div key={groupIdx}>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-3 font-heading">
                    {group.title}
                </h3>
                <div className="space-y-1.5">
                    {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        
                        return (
                        <Link 
                            key={item.path} 
                            href={item.path}
                            onClick={() => setMobileOpen(false)}
                            className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm border border-transparent ${
                            active 
                                ? 'bg-blue-50/80 text-blue-700 shadow-sm shadow-blue-100 border-blue-100' 
                                : 'text-slate-600 hover:bg-slate-50/80 hover:text-slate-900 hover:border-slate-100'
                            }`}
                        >
                            <Icon size={18} className={`transition-colors ${active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                            <span className={`${active ? 'font-bold' : ''}`}>{item.name}</span>
                        </Link>
                        );
                    })}
                </div>
            </div>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100/50 bg-slate-50/30 backdrop-blur-sm space-y-1">
          <Link 
            href="/profile"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
               isActive('/profile')
                 ? 'bg-blue-50 text-blue-600'
                 : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
            }`}
          >
            <UserCircle size={20} className={isActive('/profile') ? 'text-blue-600' : 'text-slate-400'} />
            <span>Profile</span>
          </Link>

          <button 
             onClick={() => signOut({ callbackUrl: '/login' })}
             className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:text-red-600 hover:bg-red-50/50 rounded-xl transition-all duration-200 font-medium text-sm"
          >
             <LogOut size={20} className="text-slate-400 group-hover:text-red-500" />
             <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
