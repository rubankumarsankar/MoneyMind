'use client';

import { useState, useEffect } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Moon, 
  Sun, 
  Palette, 
  CreditCard,
  Calendar,
  Mail,
  Phone,
  LogOut,
  ChevronRight,
  Settings2,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useSession, signOut } from "next-auth/react";
import { showSuccess, showError, showConfirm, showToast } from '@/lib/sweetalert';
import RulesManager from './rules/page';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  
  // User preferences state
  const [preferences, setPreferences] = useState({
    darkMode: false,
    notifications: true,
    emailAlerts: true,
    budgetAlerts: true,
    weeklyReport: true,
    salaryDate: 1,
    currency: 'INR'
  });

  // Edit mode for profile
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: ''
  });

  useEffect(() => {
    if (session?.user) {
      setProfileForm({
        name: session.user.name || '',
        phone: ''
      });
    }
  }, [session]);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Settings2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'rules', label: 'Rules', icon: Sparkles }, // New Tab
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const handleLogout = async () => {
    const result = await showConfirm('Log Out?', 'Are you sure you want to sign out?');
    if (result.isConfirmed) {
      showToast('success', 'Goodbye! 👋');
      setTimeout(() => signOut({ callbackUrl: '/' }), 500);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      showSuccess('Profile Updated', 'Your changes have been saved successfully.');
      setEditMode(false);
    } catch (e) {
      showError('Error', 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const togglePreference = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    showToast('success', 'Preference updated!');
  };

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-panel p-8 text-center">
        <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
        <p className="text-slate-500">Please log in to access settings.</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-indigo-600">
            Settings
          </h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">Manage your account and preferences</p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-all text-sm sm:text-base"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>

      {/* Tab Navigation - Horizontal scroll on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all text-sm sm:text-base ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                  : 'bg-white/60 text-slate-600 hover:bg-white hover:text-blue-600'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Cards */}
      <div className="glass-panel p-4 sm:p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 pb-6 border-b border-slate-100">
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-xl">
                  {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <CheckCircle2 size={12} className="text-white" />
                </div>
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{session.user?.name || 'User'}</h2>
                <p className="text-slate-500 text-sm sm:text-base">{session.user?.email}</p>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full">
                    Premium User
                  </span>
                  <span className="px-2.5 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-full flex items-center gap-1">
                    <Sparkles size={10} /> Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-2 pl-1">
                  <User size={12} className="inline mr-1" /> Full Name
                </label>
                <input 
                  type="text" 
                  value={editMode ? profileForm.name : session.user?.name || ''} 
                  onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                  readOnly={!editMode}
                  className={`input-field text-sm sm:text-base ${!editMode ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-2 pl-1">
                  <Mail size={12} className="inline mr-1" /> Email Address
                </label>
                <input 
                  type="email" 
                  value={session.user?.email || ''} 
                  readOnly
                  className="input-field bg-slate-50 cursor-not-allowed text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-2 pl-1">
                  <Phone size={12} className="inline mr-1" /> Phone Number
                </label>
                <input 
                  type="tel" 
                  placeholder={editMode ? "Add phone number" : "Not provided"}
                  value={editMode ? profileForm.phone : ''}
                  onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                  readOnly={!editMode}
                  className={`input-field text-sm sm:text-base ${!editMode ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-2 pl-1">
                  <Calendar size={12} className="inline mr-1" /> Salary Date
                </label>
                <select 
                  className="input-field text-sm sm:text-base"
                  value={preferences.salaryDate}
                  onChange={(e) => setPreferences(prev => ({...prev, salaryDate: Number(e.target.value)}))}
                >
                  {[...Array(31)].map((_, i) => (
                    <option key={i+1} value={i+1}>Day {i+1} of month</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
              {editMode ? (
                <>
                  <button 
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="flex-1 btn-primary h-11 flex items-center justify-center gap-2 font-bold disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    onClick={() => setEditMode(false)}
                    className="flex-1 px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setEditMode(true)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-all"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
              <Palette size={20} className="text-purple-500" /> Display & Preferences
            </h3>
            
            <div className="space-y-3">
              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between p-4 bg-white/60 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    {preferences.darkMode ? <Moon size={20} className="text-indigo-600" /> : <Sun size={20} className="text-amber-500" />}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm sm:text-base">Dark Mode</p>
                    <p className="text-xs text-slate-500">Reduce eye strain at night</p>
                  </div>
                </div>
                <button 
                  onClick={() => togglePreference('darkMode')}
                  className={`w-12 h-7 rounded-full transition-all relative ${preferences.darkMode ? 'bg-blue-600' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${preferences.darkMode ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>

              {/* Currency */}
              <div className="flex items-center justify-between p-4 bg-white/60 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CreditCard size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm sm:text-base">Currency</p>
                    <p className="text-xs text-slate-500">Display currency format</p>
                  </div>
                </div>
                <select 
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium"
                  value={preferences.currency}
                  onChange={(e) => setPreferences(prev => ({...prev, currency: e.target.value}))}
                >
                  <option value="INR">₹ INR</option>
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                  <option value="GBP">£ GBP</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
              <Bell size={20} className="text-blue-500" /> Notification Settings
            </h3>
            
            <div className="space-y-3">
              {[
                { key: 'notifications', label: 'Push Notifications', desc: 'Receive instant alerts', icon: Bell },
                { key: 'emailAlerts', label: 'Email Alerts', desc: 'Transaction updates via email', icon: Mail },
                { key: 'budgetAlerts', label: 'Budget Alerts', desc: 'When you exceed category limits', icon: AlertCircle },
                { key: 'weeklyReport', label: 'Weekly Report', desc: 'Summary every Sunday', icon: Calendar },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-white/60 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <item.icon size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm sm:text-base">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => togglePreference(item.key)}
                    className={`w-12 h-7 rounded-full transition-all relative ${preferences[item.key] ? 'bg-blue-600' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${preferences[item.key] ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}



        {/* Rules Tab */}
        {activeTab === 'rules' && (
             <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                 <RulesManager />
             </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
              <Shield size={20} className="text-green-500" /> Security & Privacy
            </h3>
            
            <div className="space-y-3">
              <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={24} className="text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800 text-sm sm:text-base">Account Secured</p>
                    <p className="text-xs text-green-600">Your account is active</p>
                  </div>
                </div>
              </div>

              <button className="w-full flex items-center justify-between p-4 bg-white/60 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Shield size={20} className="text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-800 text-sm sm:text-base">Change Password</p>
                    <p className="text-xs text-slate-500">Update your login credentials</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
              </button>

              <button className="w-full flex items-center justify-between p-4 bg-white/60 rounded-xl border border-slate-100 hover:border-red-200 hover:bg-red-50/50 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <AlertCircle size={20} className="text-red-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-red-700 text-sm sm:text-base">Delete Account</p>
                    <p className="text-xs text-slate-500">Permanently remove your data</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-400 group-hover:text-red-600 transition-colors" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* App Info Card */}
      <div className="glass-card p-4 sm:p-6 text-center">
        <p className="text-slate-500 text-sm">MoneyMind v1.0 • Made with ❤️ in India</p>
        <p className="text-xs text-slate-400 mt-1">© 2026 All rights reserved</p>
      </div>
    </div>
  );
}
