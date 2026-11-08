'use client';

import React, { useState } from 'react';
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
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 font-mono">
            Support & Relations
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Contact & Support</h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Have questions about the platform, dispute arbitration, or technical integrations? Reach out to our team or join our official communities.
        </p>
      </div>

      {/* Official Community Channels */}
      <div className="space-y-3">
        <div className="text-center">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            আমাদের কাজ সম্পর্কে জানতে এবং সব নতুন আপডেট পেতে আমাদের অফিসিয়াল চ্যানেলগুলো ফলো করুন
          </h2>
          <p className="text-xs text-slate-500">
            Follow our verified channels for platform news, high-reward tasks, and official announcements
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="https://www.facebook.com/profile.php?id=100086879226470"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 hover:border-blue-500 transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">
                আমাদের ফেসবুক পেজ ফলো করুন
              </div>
              <div className="text-[11px] text-slate-500">Official Facebook Page</div>
            </div>
          </a>

          <a
            href="https://www.youtube.com/@earnxpress-sahmed"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 hover:border-red-500 transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-red-500 transition-colors">
                আমাদের ইউটিউব চ্যানেলে সাবস্ক্রাইব করুন
              </div>
              <div className="text-[11px] text-slate-500">Official YouTube Channel</div>
            </div>
          </a>

          <a
            href="https://t.me/earnxpresssahmed1_2A"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/50 hover:border-sky-500 transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.197 1.006.128.832.922z" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-500 transition-colors">
                আমাদের টেলিগ্রাম চ্যানেলে জয়েন করুন
              </div>
              <div className="text-[11px] text-slate-500">Official Telegram Community</div>
            </div>
          </a>
        </div>
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
