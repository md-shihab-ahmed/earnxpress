import React from 'react';
import type { Metadata } from 'next';
import { DocumentaryClient } from './documentary-client';

export const metadata: Metadata = {
  title: 'Official Platform Documentary & Complete Walkthrough Guide',
  description:
    'EarnXpress পূর্ণাঙ্গ প্ল্যাটফর্ম ডকুমেন্টারি: বায়ার ও ওয়ার্কার হিসেবে কীভাবে কাজ করবেন, কেন এটি শতভাগ ফ্রি ও আন্তর্জাতিকভাবে নিরাপদ, এবং কীভাবে বিকাশ-নগদ-বাইনান্সে পেমেন্ট নেবেন।',
};

export default function DocumentaryPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <DocumentaryClient />
    </main>
  );
}