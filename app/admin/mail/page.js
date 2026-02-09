'use client';

import { useState } from 'react';
import { Send, Mail, Users, UserCheck, Shield, AlertCircle } from 'lucide-react';
import { showSuccess, showError, showConfirm } from '@/lib/sweetalert';

export default function BulkMailPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    target: 'ALL',
    subject: '',
    message: ''
  });

  const templates = [
    { 
      id: 'welcome', 
      name: 'Welcome Message', 
      subject: 'Welcome to MoneyMind! 🚀', 
      message: "Hi there,\n\nWelcome to MoneyMind! We're excited to help you take control of your finances.\n\nHere are a few tips to get started:\n1. Set up your profile.\n2. Add your accounts.\n3. Start tracking your expenses.\n\nCheers,\nThe MoneyMind Team" 
    },
    { 
      id: 'maintenance', 
      name: 'Maintenance Notice', 
      subject: 'Scheduled Maintenance Notice 🛠️', 
      message: "Hi,\n\nWe will be performing scheduled maintenance on [DATE] from [START TIME] to [END TIME].\n\nDuring this time, the application may be unavailable. We apologize for any inconvenience.\n\nBest,\nThe MoneyMind Team" 
    },
    { 
      id: 'newsletter', 
      name: 'Monthly Newsletter', 
      subject: 'MoneyMind Updates - [MONTH] 📰', 
      message: "Hi,\n\nHere are the latest updates from MoneyMind:\n\n- Feature 1: Description\n- Feature 2: Description\n\nStay tuned for more!\n\nCheers,\nThe MoneyMind Team" 
    }
  ];

  const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    if (!templateId) return;

    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        subject: template.subject,
        message: template.message
      }));
    }
  };


  const targets = [
    { value: 'ALL', label: 'All Users', icon: Users, desc: 'Send to everyone in the database.' },
    { value: 'USERS', label: 'Regular Users', icon: UserCheck, desc: 'Send only to standard users.' },
    { value: 'ADMINS', label: 'Admins Only', icon: Shield, desc: 'Send internal announcement to admins.' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const result = await showConfirm(
      'Send Bulk Email?',
      `This will send an email to ${formData.target === 'ALL' ? 'ALL users' : 'selected group'}. This action cannot be undone.`
    );

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/mail/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to send emails');

      showSuccess('Emails Sent', `Successfully sent to ${data.count} recipients.`);
      setFormData({ target: 'ALL', subject: '', message: '' }); // Reset form
    } catch (error) {
      showError('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-12 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Mail className="text-blue-600" />
          Bulk Mailer
        </h1>
        <p className="text-slate-500 mt-1">Send announcements and updates to your user base.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Section */}
        <div className="lg:col-span-2 glass-panel p-6 sm:p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
               
               {/* Target Selection */}
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-3">Target Audience</label>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {targets.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setFormData({...formData, target: t.value})}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                          formData.target === t.value
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                        }`}
                      >
                         <t.icon size={24} className="mb-2" />
                         <span className="font-bold text-sm">{t.label}</span>
                      </button>
                    ))}
                 </div>
                 <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {targets.find(t => t.value === formData.target)?.desc}
                 </p>
               </div>

               {/* Template Selector */}
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Load Template (Optional)</label>
                  <select 
                    className="input-field"
                    onChange={handleTemplateChange}
                    defaultValue=""
                  >
                     <option value="" disabled>Select a template...</option>
                     {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                     ))}
                  </select>
               </div>

               {/* Subject */}
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject Line</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g., Important System Update"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  />
               </div>

               {/* Message */}
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Message Body</label>
                  <textarea
                    required
                    rows={8}
                    className="input-field resize-y min-h-[150px]"
                    placeholder="Write your message here..."
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                  />
                  <p className="text-xs text-slate-400 mt-1">Supports plain text only for now.</p>
               </div>

               <div className="pt-4 flex justify-end">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="btn-primary w-full sm:w-auto px-8 py-3"
                  >
                     {loading ? 'Sending...' : (
                       <>
                         <Send size={18} className="mr-2" /> Send Broadcast
                       </>
                     )}
                  </button>
               </div>
            </form>
        </div>

        {/* Preview / Tips Section */}
        <div className="lg:col-span-1 space-y-6">
            <div className="glass-panel p-6 bg-linear-to-br from-blue-50 to-indigo-50 border-blue-100">
               <h3 className="font-bold text-blue-900 mb-2">Sending Tips</h3>
               
               <ul className="space-y-3 text-sm text-blue-800/80">
                  <li className="flex gap-2">
                    <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                    Keep subject lines concise and clear.
                  </li>
                  <li className="flex gap-2">
                    <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                     Avoid using spam-trigger words like &quot;FREE&quot;, &quot;URGENT&quot;, &quot;WIN&quot;.
                  </li>
                  <li className="flex gap-2">
                    <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                     Emails are sent using your configured SMTP settings.
                  </li>
               </ul>
            </div>

            {/* Live Preview */}
            <div className="glass-panel p-6 border-slate-200">
                <h3 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wider">Preview</h3>
                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
                    <div className="border-b border-slate-100 pb-3 mb-3">
                       <p className="text-xs text-slate-400 font-bold mb-1">SUBJECT</p>
                       <p className="font-medium text-slate-900">{formData.subject || '...'}</p>
                    </div>
                    <div>
                       <p className="text-xs text-slate-400 font-bold mb-1">BODY</p>
                       <p className="text-sm text-slate-600 whitespace-pre-wrap">{formData.message || '...'}</p>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}
