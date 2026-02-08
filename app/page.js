'use client';

import Link from 'next/link';
import { ArrowRight, Wallet, PieChart, ShieldCheck, TrendingUp, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      
      {/* Navigation */}
      <nav className="fixed w-full z-50 transition-all duration-300 backdrop-blur-md bg-white/70 border-b border-white/50 supports-[backdrop-filter]:bg-white/40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-linear-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg shadow-blue-500/20">
               <Wallet className="text-white h-6 w-6" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-700 to-purple-600">
              MoneyMind
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Features</Link>
            <Link href="#testimonials" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Stories</Link>
            <Link href="#pricing" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Pricing</Link>
            <div className="flex items-center gap-4 ml-4">
              <Link href="/login" className="text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors">
                Log In
              </Link>
              <Link href="/register" className="px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-bold hover:bg-black hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300">
                Get Started
              </Link>
            </div>
          </div>

          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
           <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300/30 rounded-full blur-3xl mix-blend-multiply animate-blob"></div>
           <div className="absolute top-20 right-10 w-72 h-72 bg-blue-300/30 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-2000"></div>
           <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-pink-300/30 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold tracking-wide uppercase mb-8 hover:bg-blue-100 transition-colors cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            New: AI Financial Assistant
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1]">
            Master your money <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-600 via-purple-600 to-pink-500">
              with intelligence.
            </span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 mb-10 leading-relaxed">
            Stop guessing where your money goes. MoneyMind gives you crystal-clear insights, 
            smart budgeting, and algorithmic financial health tracking in one premium dashboard.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="h-14 px-8 rounded-full bg-slate-900 text-white text-base font-semibold flex items-center gap-2 hover:bg-black hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300">
               Start Free Trial <ArrowRight size={18} />
            </Link>
            <Link href="/login" className="h-14 px-8 rounded-full bg-white border border-slate-200 text-slate-700 text-base font-semibold flex items-center gap-2 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200">
               View Live Demo
            </Link>
          </div>

          <div className="mt-12 text-sm text-slate-400 font-medium">
             Trusted by 10,000+ early adopters
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={PieChart}
              title="Smart Analytics"
              desc="Visualize your spending patterns with beautiful, interactive charts that help you spot leaks instantly."
              color="bg-blue-500"
            />
            <FeatureCard 
              icon={ShieldCheck}
              title="Bank-Grade Security"
              desc="Your financial data is encrypted with AES-256 bit encryption. Privacy is our top priority."
              color="bg-purple-500"
            />
            <FeatureCard 
              icon={TrendingUp}
              title="Wealth Growth"
              desc="Get personalized algorithmic suggestions to optimize your savings and investment potential."
              color="bg-green-500"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500">
           <div className="flex items-center gap-2">
             <div className="p-1.5 bg-slate-900 rounded-lg">
               <Wallet className="text-white h-4 w-4" />
             </div>
             <span className="font-bold text-slate-900">MoneyMind</span>
           </div>
           <div className="text-sm">
             © 2026 MoneyMind Inc. All rights reserved.
           </div>
        </div>
      </footer>

    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, color }) {
  return (
    <div className="group p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300">
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="text-white" size={24} />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">
        {desc}
      </p>
    </div>
  );
}
