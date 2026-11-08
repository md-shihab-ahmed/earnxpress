'use client';

import React, { useState, useEffect } from 'react';

export function SplashScreen() {
  const [stage, setStage] = useState<'entering' | 'fused' | 'revealed' | 'diving' | 'completed'>('entering');
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Check if splash was played very recently (within 4 seconds) to avoid spam on fast internal route shifts
    const lastPlayed = sessionStorage.getItem('earnxpress_splash_timestamp');
    const now = Date.now();

    if (lastPlayed && now - parseInt(lastPlayed, 10) < 4000) {
      // Skip if triggered in quick succession
      setVisible(false);
      return;
    }

    sessionStorage.setItem('earnxpress_splash_timestamp', now.toString());

      // Sequence timeline:
      // 0.0s - 1.0s: E & X fly in with energetic trails
      // 1.0s: Collision & Fusion shockwave
      const t1 = setTimeout(() => setStage('fused'), 1000);

      // 1.8s: Brand Name Reveal & Light Sweep
      const t2 = setTimeout(() => setStage('revealed'), 1750);

      // 2.7s: Cinematic Warp Dive into the App
      const t3 = setTimeout(() => setStage('diving'), 2650);

      // 3.3s: Complete and unmount
      const t4 = setTimeout(() => {
        setStage('completed');
        setVisible(false);
      }, 3200);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
  }, []);

  const handleSkip = () => {
    setStage('diving');
    setTimeout(() => {
      setStage('completed');
      setVisible(false);
    }, 350);
  };

  if (!visible || stage === 'completed') return null;

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-[99999] bg-[#040812] flex flex-col items-center justify-center overflow-hidden cursor-pointer select-none transition-all duration-700 ${
        stage === 'diving' ? 'scale-[2.8] opacity-0 blur-lg pointer-events-none' : 'scale-100 opacity-100'
      }`}
      style={{ perspective: '1200px' }}
    >
      <style>{`
        @keyframes flyInE {
          0% {
            transform: translate3d(-340px, -240px, 0) scale(0.3) rotate(-35deg);
            opacity: 0;
            filter: drop-shadow(0 0 45px #00f2fe) blur(8px);
          }
          65% {
            transform: translate3d(18px, 12px, 0) scale(1.15) rotate(4deg);
            opacity: 1;
            filter: drop-shadow(0 0 35px #00f2fe) blur(0px);
          }
          85% {
            transform: translate3d(-6px, -4px, 0) scale(0.96) rotate(-1deg);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
            opacity: 1;
            filter: drop-shadow(0 0 30px rgba(0,242,254,0.9));
          }
        }

        @keyframes flyInX {
          0% {
            transform: translate3d(340px, 240px, 0) scale(0.3) rotate(35deg);
            opacity: 0;
            filter: drop-shadow(0 0 45px #ff9900) blur(8px);
          }
          65% {
            transform: translate3d(-18px, -12px, 0) scale(1.15) rotate(-4deg);
            opacity: 1;
            filter: drop-shadow(0 0 35px #ff9900) blur(0px);
          }
          85% {
            transform: translate3d(6px, 4px, 0) scale(0.96) rotate(1deg);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
            opacity: 1;
            filter: drop-shadow(0 0 30px rgba(255,153,0,0.9));
          }
        }

        @keyframes shockwavePulse {
          0% {
            transform: scale(0.2);
            opacity: 0.95;
            border-width: 6px;
          }
          60% {
            opacity: 0.7;
          }
          100% {
            transform: scale(3.8);
            opacity: 0;
            border-width: 1px;
          }
        }

        @keyframes fusionAura {
          0%, 100% {
            filter: drop-shadow(0 0 25px rgba(20,184,166,0.8)) drop-shadow(0 0 35px rgba(245,158,11,0.6));
          }
          50% {
            filter: drop-shadow(0 0 45px rgba(0,242,254,1)) drop-shadow(0 0 40px rgba(255,180,0,0.95));
          }
        }

        @keyframes specularShine {
          0% {
            transform: translateX(-160%) skewX(-30deg);
            opacity: 0;
          }
          20% {
            opacity: 0.9;
          }
          80% {
            opacity: 0.9;
          }
          100% {
            transform: translateX(260%) skewX(-30deg);
            opacity: 0;
          }
        }

        @keyframes energyRingSpin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes particleBurst {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: var(--burst-vector);
            opacity: 0;
          }
        }
      `}</style>

      {/* Atmospheric Star Dust & Cosmic Aurora */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-600/20 blur-[100px] animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-amber-500/20 blur-[100px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-teal-500/10 blur-[120px]" />
      </div>

      {/* Cinematic Grid Lines Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(to_right,#14b8a6_1px,transparent_1px),linear-gradient(to_bottom,#14b8a6_1px,transparent_1px)] bg-[size:4rem_4rem]"
      />

      {/* Shockwave Rings on Fusion Impact */}
      {(stage === 'fused' || stage === 'revealed' || stage === 'diving') && (
        <>
          <div
            className="absolute rounded-full border-2 border-cyan-400 pointer-events-none"
            style={{
              width: '180px',
              height: '180px',
              animation: 'shockwavePulse 1.1s cubic-bezier(0.1, 0.8, 0.2, 1) forwards',
              boxShadow: '0 0 30px #00f2fe, inset 0 0 20px #00f2fe',
            }}
          />
          <div
            className="absolute rounded-full border-2 border-amber-400 pointer-events-none"
            style={{
              width: '180px',
              height: '180px',
              animation: 'shockwavePulse 1.3s cubic-bezier(0.1, 0.8, 0.2, 1) 0.12s forwards',
              boxShadow: '0 0 35px #ff9900, inset 0 0 20px #ff9900',
            }}
          />
        </>
      )}

      {/* Floating Spark Burst Particles */}
      {(stage === 'fused' || stage === 'revealed') && (
        <div className="absolute pointer-events-none">
          {[
            { angle: '0deg', color: '#00f2fe', dist: '130px' },
            { angle: '45deg', color: '#ffd700', dist: '150px' },
            { angle: '90deg', color: '#00f2fe', dist: '120px' },
            { angle: '135deg', color: '#ff8800', dist: '140px' },
            { angle: '180deg', color: '#10b981', dist: '135px' },
            { angle: '225deg', color: '#ffd700', dist: '160px' },
            { angle: '270deg', color: '#00f2fe', dist: '125px' },
            { angle: '315deg', color: '#ffaa00', dist: '145px' },
          ].map((p, idx) => (
            <div
              key={idx}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: p.color,
                boxShadow: `0 0 10px ${p.color}`,
                transformOrigin: 'center',
                animation: 'particleBurst 0.9s cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
                // @ts-ignore
                '--burst-vector': `translate(calc(cos(${p.angle}) * ${p.dist}), calc(sin(${p.angle}) * ${p.dist})) scale(0)`,
              }}
            />
          ))}
        </div>
      )}

      {/* Main Center Stage */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Emblem Shield with Dual Energy Spinning Ring */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          {/* Futuristic Conic Energy Ring */}
          <div
            className={`absolute inset-0 rounded-3xl p-[2px] transition-opacity duration-700 ${
              stage !== 'entering' ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              background: 'conic-gradient(from 0deg, #00f2fe, #10b981, #ffd700, #ff8800, #00f2fe)',
              animation: 'energyRingSpin 4s linear infinite',
            }}
          >
            <div className="w-full h-full bg-[#070d1c]/90 rounded-3xl backdrop-blur-md" />
          </div>

          {/* Letter Combination Zone */}
          <div
            className="relative flex items-center justify-center select-none"
            style={{
              animation: stage !== 'entering' ? 'fusionAura 2s ease-in-out infinite' : undefined,
            }}
          >
            {/* Letter "E" - Flying from Top-Left with Cyan/Emerald Energy Trail */}
            <div
              className="relative inline-block font-black text-7xl sm:text-8xl tracking-tighter"
              style={{
                animation: 'flyInE 0.95s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              }}
            >
              <span
                className="bg-clip-text text-transparent bg-gradient-to-br from-cyan-300 via-teal-400 to-emerald-500"
                style={{
                  WebkitTextStroke: '1px rgba(0, 242, 254, 0.4)',
                }}
              >
                E
              </span>
            </div>

            {/* Letter "X" - Flying from Bottom-Right with Molten Gold/Amber Fire Trail */}
            <div
              className="relative inline-block font-black text-7xl sm:text-8xl -ml-2 tracking-tighter"
              style={{
                animation: 'flyInX 0.95s cubic-bezier(0.16, 1, 0.3, 1) 0.05s forwards',
              }}
            >
              <span
                className="bg-clip-text text-transparent bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500"
                style={{
                  WebkitTextStroke: '1px rgba(255, 180, 0, 0.4)',
                }}
              >
                X
              </span>
            </div>

            {/* Color Combination Fusion Core Overlay (Blends Teal & Gold where they overlap) */}
            {stage !== 'entering' && (
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none mix-blend-screen opacity-90 transition-opacity duration-500"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-400/50 via-white/70 to-amber-400/50 blur-md animate-pulse" />
              </div>
            )}
          </div>
        </div>

        {/* Brand Name Title with Specular Gleam Sweep */}
        <div
          className={`mt-6 text-center transition-all duration-700 transform ${
            stage === 'revealed' || stage === 'diving'
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-6 scale-95'
          }`}
        >
          {/* Main Title "EarnXpress" */}
          <div className="relative inline-block overflow-hidden px-4 py-1">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center justify-center drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-teal-200">
                Earn
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                Xpress
              </span>
            </h1>

            {/* Specular White Light Gleam Sweeping Across */}
            <div
              className="absolute inset-0 w-28 h-full bg-gradient-to-r from-transparent via-white/70 to-transparent pointer-events-none"
              style={{
                animation: stage === 'revealed' ? 'specularShine 1.2s ease-in-out infinite' : undefined,
              }}
            />
          </div>

          {/* Subtitle & Futuristic Micro-Platform Badge */}
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f2fe] animate-ping" />
            <p className="text-[10px] sm:text-xs font-semibold tracking-[0.25em] uppercase text-cyan-300/90 font-mono">
              Global Micro-Task &amp; Freelance Ecosystem
            </p>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#ff9900] animate-ping" />
          </div>

          {/* Luxury High-Tech Speed Loading Bar */}
          <div className="w-48 sm:w-56 h-1.5 bg-slate-900/90 border border-slate-700/60 rounded-full overflow-hidden mt-4 mx-auto relative p-[1px]">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: stage === 'revealed' || stage === 'diving' ? '100%' : '20%',
                background: 'linear-gradient(90deg, #00f2fe 0%, #10b981 50%, #ffd700 80%, #ff8800 100%)',
                boxShadow: '0 0 12px rgba(0, 242, 254, 0.8)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Skip Button Hint */}
      <div className="absolute bottom-6 flex items-center gap-1.5 text-[11px] text-slate-400/80 font-mono tracking-wider bg-slate-900/60 px-3 py-1 rounded-full border border-slate-800 backdrop-blur-sm hover:text-white transition-colors">
        <span>Tap anywhere to dive in</span>
        <span className="text-cyan-400">⚡</span>
      </div>
    </div>
  );
}
