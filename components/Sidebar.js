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
  Calendar,
  UserCircle
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { name: 'Accounts', icon: Wallet, path: '/accounts' },
  { name: 'Income', icon: Banknote, path: '/income' },
  { name: 'Expenses', icon: TrendingDown, path: '/expenses' }, 
  { name: 'Budgets', icon: DollarSign, path: '/budgets' },
  { name: 'Savings', icon: Target, path: '/savings' },
  { name: 'EMI', icon: PieChart, path: '/emi' },
  { name: 'Credit Cards', icon: CreditCard, path: '/credit-cards' },
  { name: 'Borrow/Lend', icon: ArrowLeftRight, path: '/borrow' },
  { name: 'Reports', icon: PiggyBank, path: '/reports' },
  { name: 'Planning', icon: Calendar, path: '/planning' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => pathname === path;

  return (
    <>
      {/* Mobile Header / Toggle */}
      <div className="md:hidden fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-40 h-16 flex items-center justify-between px-4">
         <div className="font-bold text-xl bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-purple-600">
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
        w-64 h-full fixed left-0 top-0 bg-white border-r border-slate-200 flex flex-col z-50
        transition-transform duration-300 ease-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        md:block
      `}>
        
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              M
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">MoneyMind</span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link 
                key={item.path} 
                href={item.path}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
                  active 
                    ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-100' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={20} className={`transition-colors ${active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-1">
          <Link 
            href="/profile"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
               isActive('/profile')
                 ? 'bg-blue-50 text-blue-600'
                 : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <UserCircle size={20} className={isActive('/profile') ? 'text-blue-600' : 'text-slate-400'} />
            <span>Profile</span>
          </Link>

          <button 
             onClick={() => signOut({ callbackUrl: '/login' })}
             className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 font-medium text-sm"
          >
             <LogOut size={20} className="text-slate-400 group-hover:text-red-500" />
             <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
