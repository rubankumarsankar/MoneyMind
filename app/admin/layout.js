'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ShieldCheck,
  Database,
  Mail
} from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Database', href: '/admin/database', icon: Database },
    { name: 'Mail', href: '/admin/mail', icon: Mail },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const isActive = (path) => pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 fixed h-full z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
           <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-xl text-slate-900">
              <ShieldCheck className="text-blue-600" size={24} />
              <span>Admin Panel</span>
           </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                  active 
                    ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-100' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon size={20} className={active ? 'text-blue-600' : 'text-slate-400'} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium"
          >
            <LogOut size={20} className="text-slate-400" />
            Exit to App
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white border-b border-slate-200 z-30 h-16 flex items-center justify-between px-4">
         <div className="flex items-center gap-2 font-bold text-lg text-slate-900">
            <ShieldCheck className="text-blue-600" size={24} />
            <span>Admin</span>
         </div>
         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
         </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <aside className={`md:hidden fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] bg-white border-r border-slate-200 z-30 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                  active 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <item.icon size={20} className={active ? 'text-blue-600' : 'text-slate-400'} />
                {item.name}
              </Link>
            );
          })}
          
          <div className="pt-4 mt-4 border-t border-slate-100">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-600 hover:bg-slate-50 font-medium"
            >
              <LogOut size={20} className="text-slate-400" />
              Exit to App
            </button>
          </div>
         </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:pl-64 pt-16 md:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}
