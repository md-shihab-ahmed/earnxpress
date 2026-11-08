'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, CheckCircle2, Share, PlusSquare, Monitor } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Global hook & dispatcher so any button in the app can trigger the install modal
let globalPrompt: BeforeInstallPromptEvent | null = null;
let openModalFn: (() => void) | null = null;

export function triggerAppInstall() {
  if (openModalFn) {
    openModalFn();
  }
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deviceType, setDeviceType] = useState<'android' | 'ios' | 'desktop'>('android');

  useEffect(() => {
    // Detect OS
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setDeviceType('ios');
    } else if (/android/.test(ua)) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      const p = e as BeforeInstallPromptEvent;
      setDeferredPrompt(p);
      globalPrompt = p;
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsModalOpen(false);
      setDeferredPrompt(null);
      globalPrompt = null;
    });

    openModalFn = () => setIsModalOpen(true);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleNativeInstall = async () => {
    const prompt = deferredPrompt || globalPrompt;
    if (prompt) {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsModalOpen(false);
      }
    }
  };

  if (isInstalled && !isModalOpen) return null;

  return (
    <>
      {/* Floating Pill Banner (Persistent & Subtle on mobile) */}
      {!isInstalled && !isModalOpen && (
        <div className="fixed bottom-4 right-4 z-40">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-full shadow-2xl border border-teal-400/30 transition-all hover:scale-105"
          >
            <Smartphone className="w-4 h-4 animate-bounce" />
            <span>Install App</span>
          </button>
        </div>
      )}

      {/* Full Explainer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-navy-900 border border-teal-500/40 rounded-2xl p-6 shadow-2xl max-w-md w-full text-white space-y-5 relative">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center font-black text-lg shadow-md text-white">
                EX
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">EarnXpress Mobile App</h3>
                <p className="text-xs text-slate-300">Fast 1-tap access • Zero storage required</p>
              </div>
            </div>

            {/* If native prompt available */}
            {deferredPrompt ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Click the button below to instantly install the official EarnXpress App on your home screen.
                </p>
                <button
                  type="button"
                  onClick={handleNativeInstall}
                  className="w-full bg-teal-500 hover:bg-teal-400 text-navy-950 font-black text-xs py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Install Now (1-Tap)
                </button>
              </div>
            ) : (
              /* Step by Step Manual Guide for Android / iOS / Desktop */
              <div className="space-y-4">
                <div className="text-xs font-semibold text-teal-300 uppercase tracking-wider">
                  How to install on {deviceType === 'ios' ? 'iPhone / iPad' : deviceType === 'android' ? 'Android' : 'Desktop / PC'}:
                </div>

                {deviceType === 'ios' ? (
                  <ol className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-start gap-2.5 bg-navy-950/60 p-2.5 rounded-xl border border-navy-800">
                      <Share className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                      <span>1. Tap Safari&#39;s <strong>Share</strong> button at the bottom of the screen.</span>
                    </li>
                    <li className="flex items-start gap-2.5 bg-navy-950/60 p-2.5 rounded-xl border border-navy-800">
                      <PlusSquare className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                      <span>2. Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong>.</span>
                    </li>
                    <li className="flex items-start gap-2.5 bg-navy-950/60 p-2.5 rounded-xl border border-navy-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>3. Tap <strong>Add</strong> at top right. EarnXpress is ready on your phone!</span>
                    </li>
                  </ol>
                ) : deviceType === 'android' ? (
                  <ol className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-start gap-2.5 bg-navy-950/60 p-2.5 rounded-xl border border-navy-800">
                      <span className="font-bold text-teal-400">⋮</span>
                      <span>1. Tap Chrome&#39;s <strong>3 dots menu</strong> at the top-right corner.</span>
                    </li>
                    <li className="flex items-start gap-2.5 bg-navy-950/60 p-2.5 rounded-xl border border-navy-800">
                      <Download className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                      <span>2. Tap <strong>&ldquo;Install App&rdquo;</strong> or <strong>&ldquo;Add to Home screen&rdquo;</strong>.</span>
                    </li>
                    <li className="flex items-start gap-2.5 bg-navy-950/60 p-2.5 rounded-xl border border-navy-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>3. Confirm <strong>Install</strong>. The app icon will appear on your phone screen!</span>
                    </li>
                  </ol>
                ) : (
                  <ol className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-start gap-2.5 bg-navy-950/60 p-2.5 rounded-xl border border-navy-800">
                      <Monitor className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                      <span>1. Look at your browser address bar (top right).</span>
                    </li>
                    <li className="flex items-start gap-2.5 bg-navy-950/60 p-2.5 rounded-xl border border-navy-800">
                      <Download className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                      <span>2. Click the <strong>&ldquo;Install&rdquo; (computer icon)</strong> in the address bar.</span>
                    </li>
                  </ol>
                )}

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 rounded-xl transition-colors"
                >
                  Got It
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}