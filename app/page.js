'use client';

import Link from 'next/link';
import { ArrowRight, Wallet, PieChart, ShieldCheck, TrendingUp, Menu, X, Send, Phone, Mail, MapPin, Star, ChevronRight, Sparkles, BarChart3, Target, Shield, Zap, Users, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [enquiryForm, setEnquiryForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enquiryForm),
      });
      if (res.ok) {
        setSent(true);
        setEnquiryForm({ name: '', email: '', phone: '', message: '' });
      } else {
        alert('Failed to send. Please try again.');
      }
    } catch (e) {
      alert('Error sending message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="fixed w-full z-50 transition-all duration-300 backdrop-blur-md bg-white/70 border-b border-white/50 supports-[backdrop-filter]:bg-white/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-linear-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg shadow-blue-500/20">
               <Wallet className="text-white h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <span className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-700 to-purple-600">
              MoneyMind
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Features</Link>
            <Link href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">How It Works</Link>
            <Link href="#testimonials" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Stories</Link>
            <Link href="#contact" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Contact</Link>
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

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-lg border-t border-slate-100 p-4 space-y-4 animate-in slide-in-from-top-2">
            <Link href="#features" className="block py-2 text-slate-700 font-medium">Features</Link>
            <Link href="#how-it-works" className="block py-2 text-slate-700 font-medium">How It Works</Link>
            <Link href="#testimonials" className="block py-2 text-slate-700 font-medium">Stories</Link>
            <Link href="#contact" className="block py-2 text-slate-700 font-medium">Contact</Link>
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Link href="/login" className="flex-1 py-3 text-center rounded-full border border-slate-200 font-semibold">Log In</Link>
              <Link href="/register" className="flex-1 py-3 text-center rounded-full bg-slate-900 text-white font-semibold">Get Started</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
           <div className="absolute top-20 left-10 w-48 sm:w-72 h-48 sm:h-72 bg-purple-300/30 rounded-full blur-3xl mix-blend-multiply animate-blob"></div>
           <div className="absolute top-20 right-10 w-48 sm:w-72 h-48 sm:h-72 bg-blue-300/30 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-2000"></div>
           <div className="absolute -bottom-32 left-1/2 w-64 sm:w-96 h-64 sm:h-96 bg-pink-300/30 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold tracking-wide uppercase mb-6 sm:mb-8 hover:bg-blue-100 transition-colors cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            New: AI Financial Assistant
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 sm:mb-8 leading-[1.1]">
            Master your money <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-600 via-purple-600 to-pink-500">
              with intelligence.
            </span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-slate-600 mb-8 sm:mb-10 leading-relaxed px-4">
            Stop guessing where your money goes. MoneyMind gives you crystal-clear insights, 
            smart budgeting, and algorithmic financial health tracking in one premium dashboard.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="w-full sm:w-auto h-14 px-8 rounded-full bg-slate-900 text-white text-base font-semibold flex items-center justify-center gap-2 hover:bg-black hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300">
               Start Free Trial <ArrowRight size={18} />
            </Link>
            <Link href="/login" className="w-full sm:w-auto h-14 px-8 rounded-full bg-white border border-slate-200 text-slate-700 text-base font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200">
               View Live Demo
            </Link>
          </div>

          <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-500" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-500" />
              14-day free trial
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-500" />
              Cancel anytime
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
            <div>
              <p className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-purple-400">10K+</p>
              <p className="text-slate-400 mt-1 text-sm sm:text-base">Active Users</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-linear-to-r from-green-400 to-emerald-400">₹50Cr+</p>
              <p className="text-slate-400 mt-1 text-sm sm:text-base">Money Tracked</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-linear-to-r from-purple-400 to-pink-400">98%</p>
              <p className="text-slate-400 mt-1 text-sm sm:text-base">Satisfaction Rate</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-linear-to-r from-orange-400 to-red-400">4.9★</p>
              <p className="text-slate-400 mt-1 text-sm sm:text-base">User Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16 sm:py-24 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-blue-600 font-bold text-sm uppercase tracking-wider mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Everything You Need to Succeed</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Powerful tools designed to help you take control of your finances and build lasting wealth.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <FeatureCard icon={PieChart} title="Smart Analytics" desc="Visualize your spending patterns with beautiful, interactive charts that help you spot leaks instantly." color="bg-blue-500" />
            <FeatureCard icon={ShieldCheck} title="Bank-Grade Security" desc="Your financial data is encrypted with AES-256 bit encryption. Privacy is our top priority." color="bg-purple-500" />
            <FeatureCard icon={TrendingUp} title="Wealth Growth" desc="Get personalized algorithmic suggestions to optimize your savings and investment potential." color="bg-green-500" />
            <FeatureCard icon={BarChart3} title="EMI Tracker" desc="Track all your loans and EMIs in one place. Get smart prepayment recommendations." color="bg-orange-500" />
            <FeatureCard icon={Target} title="Budget Goals" desc="Set and track budgets for each category. Get alerts when you're overspending." color="bg-pink-500" />
            <FeatureCard icon={Zap} title="Instant Insights" desc="Get real-time notifications and AI-powered insights about your spending habits." color="bg-yellow-500" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-blue-600 font-bold text-sm uppercase tracking-wider mb-3">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Get Started in 3 Simple Steps</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-100 flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Sign Up Free</h3>
              <p className="text-slate-600">Create your account in seconds. No credit card required to start.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-100 flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-purple-600">2</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Add Your Accounts</h3>
              <p className="text-slate-600">Link your bank accounts, set income details, and configure budgets.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-green-100 flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Track & Grow</h3>
              <p className="text-slate-600">Monitor spending, get insights, and watch your wealth grow over time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-blue-600 font-bold text-sm uppercase tracking-wider mb-3">Testimonials</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Loved by Thousands</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <TestimonialCard name="Priya Sharma" role="Startup Founder" text="MoneyMind helped me understand where my money was going. Within 3 months, I saved ₹50,000 more!" rating={5} />
            <TestimonialCard name="Rahul Kumar" role="Software Engineer" text="The EMI tracker is a game-changer. I can now plan my prepayments and save on interest." rating={5} />
            <TestimonialCard name="Ananya Patel" role="Marketing Manager" text="Beautiful interface, powerful features. It's like having a personal financial advisor 24/7." rating={5} />
          </div>
        </div>
      </section>

      {/* Contact / Enquiry Section */}
      <section id="contact" className="py-16 sm:py-24 bg-linear-to-br from-slate-900 via-blue-900 to-purple-900 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left Side - Info */}
            <div>
              <p className="text-blue-400 font-bold text-sm uppercase tracking-wider mb-3">Get In Touch</p>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">Have Questions? <br />Let&apos;s Talk!</h2>
              <p className="text-slate-300 mb-8 leading-relaxed">
                We&apos;d love to hear from you! Whether you have questions about our features, pricing, 
                or need help with anything, our team is ready to help.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-xl">
                    <Mail className="text-blue-400" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Email Us</p>
                    <p className="font-medium">srirubankumar@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-xl">
                    <Phone className="text-green-400" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Call Us</p>
                    <p className="font-medium">+91 98765 43210</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-xl">
                    <MapPin className="text-orange-400" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Location</p>
                    <p className="font-medium">Chennai, India</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Enquiry Form */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10">
              {sent ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={40} className="text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Message Sent! 🎉</h3>
                  <p className="text-slate-300 mb-6">Thank you for reaching out. We&apos;ll get back to you within 24-48 hours.</p>
                  <button onClick={() => setSent(false)} className="text-blue-400 hover:text-blue-300 font-medium">
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleEnquirySubmit} className="space-y-5">
                  <h3 className="text-xl font-bold mb-4">Send Us a Message</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Your Name *</label>
                      <input 
                        type="text" 
                        required
                        value={enquiryForm.name}
                        onChange={e => setEnquiryForm({...enquiryForm, name: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Email Address *</label>
                      <input 
                        type="email" 
                        required
                        value={enquiryForm.email}
                        onChange={e => setEnquiryForm({...enquiryForm, email: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                    <input 
                      type="tel"
                      value={enquiryForm.phone}
                      onChange={e => setEnquiryForm({...enquiryForm, phone: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Your Message *</label>
                    <textarea 
                      required
                      rows={4}
                      value={enquiryForm.message}
                      onChange={e => setEnquiryForm({...enquiryForm, message: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Tell us how we can help you..."
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={sending}
                    className="w-full py-4 rounded-xl bg-linear-to-r from-blue-600 to-purple-600 text-white font-semibold flex items-center justify-center gap-2 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50"
                  >
                    {sending ? (
                      <>Sending...</>
                    ) : (
                      <>Send Message <Send size={18} /></>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <Sparkles className="mx-auto text-yellow-500 mb-6" size={40} />
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">Ready to Take Control?</h2>
          <p className="text-lg text-slate-600 mb-8">
            Join thousands of users who have transformed their financial lives with MoneyMind.
          </p>
          <Link href="/register" className="inline-flex h-14 px-10 rounded-full bg-linear-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold items-center justify-center gap-2 hover:from-blue-700 hover:to-purple-700 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300">
            Start Your Free Trial <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-slate-900 rounded-lg">
                  <Wallet className="text-white h-4 w-4" />
                </div>
                <span className="font-bold text-slate-900">MoneyMind</span>
              </div>
              <p className="text-sm text-slate-500">Master your finances with AI-powered intelligence.</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link href="#features" className="hover:text-blue-600">Features</Link></li>
                <li><Link href="#" className="hover:text-blue-600">Pricing</Link></li>
                <li><Link href="#" className="hover:text-blue-600">Security</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link href="#" className="hover:text-blue-600">About</Link></li>
                <li><Link href="#contact" className="hover:text-blue-600">Contact</Link></li>
                <li><Link href="#" className="hover:text-blue-600">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link href="#" className="hover:text-blue-600">Privacy</Link></li>
                <li><Link href="#" className="hover:text-blue-600">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <p>© 2026 MoneyMind Inc. All rights reserved.</p>
            <p>Made with ❤️ in India</p>
          </div>
        </div>
      </footer>

    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, color }) {
  return (
    <div className="group p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300">
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-5 sm:mb-6 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="text-white" size={24} />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
        {desc}
      </p>
    </div>
  );
}

function TestimonialCard({ name, role, text, rating }) {
  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-sm">
      <div className="flex gap-1 mb-4">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} size={18} className="text-yellow-400 fill-yellow-400" />
        ))}
      </div>
      <p className="text-slate-600 mb-6 leading-relaxed">&quot;{text}&quot;</p>
      <div>
        <p className="font-bold text-slate-900">{name}</p>
        <p className="text-sm text-slate-500">{role}</p>
      </div>
    </div>
  );
}
