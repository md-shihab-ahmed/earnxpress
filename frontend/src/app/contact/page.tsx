'use client';

import React, { useState } from 'react';
import { DemoBadge } from '@/components/shared/DemoBadge';
import { Mail, MessageSquare, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 justify-center">
          <DemoBadge size="sm" variant="teal" />
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 font-mono">
            Support & Relations
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Contact & Support</h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Have questions about the platform, dispute arbitration, or technical integrations? Reach out to our team.
        </p>
      </div>

      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-8 shadow-sm space-y-6">
        {submitted ? (
          <div className="p-8 text-center space-y-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
              Message Received
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 max-w-sm mx-auto">
              Thank you, {name}. Your inquiry has been routed to our support team ticket queue.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahim Chowdhury"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs p-3 rounded-lg outline-none focus:border-teal-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs p-3 rounded-lg outline-none focus:border-teal-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Message / Inquiry Details</label>
              <textarea
                rows={5}
                required
                placeholder="Describe your question or feedback..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs p-3 rounded-lg outline-none focus:border-teal-500 text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> Send Message
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
