'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, ArrowRight, Scissors, ShieldCheck, Check, Layers, ChevronRight } from 'lucide-react';

const dressingSteps = [
  {
    step: '01',
    title: '1. Mannequin Silhouette Calibration',
    subtitle: 'Establishes bespoke silhouette contour based on height & weight',
    layer: 'body',
    garmentName: 'Anatomy Baseline',
    price: 0,
    fitDetail: 'Chest: 104cm · Shoulder: 49cm · Waist: 84cm'
  },
  {
    step: '02',
    title: '2. Tailored Senator Trousers',
    subtitle: 'Bespoke flat-front cut with hidden stretch flex waistline',
    layer: 'bottoms',
    garmentName: 'Tailored Senator Slim Trousers',
    price: 45000,
    fitDetail: 'Inseam 84cm · Slim Straight Leg Break'
  },
  {
    step: '03',
    title: '3. Onyx Wool Senator Kaftan',
    subtitle: 'Hand-tailored geometric chest embroidery with concealed placket',
    layer: 'tops',
    garmentName: 'Onyx Black Wool Senator Top',
    price: 65000,
    fitDetail: 'Broad Shoulder Line · Zero Chest Pull'
  },
  {
    step: '04',
    title: '4. Midnight Agbada & Kano Slides',
    subtitle: 'Ceremonial 3-piece outer robe & handcrafted calf leather slides',
    layer: 'outerwear',
    garmentName: 'Midnight Black Embroidered Agbada + Slides',
    price: 133000,
    fitDetail: '99.8% Precision Match · Complete Ensemble'
  }
];

export default function ScrollDressStory() {
  const [activeStepIndex, setActiveStepIndex] = useState(2); // default show full styled look

  const currentStep = dressingSteps[activeStepIndex];

  return (
    <section className="py-20 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--badge-bg)] border border-[var(--border-subtle)] text-[var(--gold-accent)] text-xs font-mono-luxury uppercase tracking-widest font-bold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>HOW VIRTUAL FITTING WORKS</span>
          </div>

          <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--text-primary)]">
            Layer Independent Designers in Real-Time
          </h2>

          <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-relaxed">
            Click any step below to see how bespoke Senator trousers, wool kaftans, and ceremonial Agbada robes calibrate across your exact shoulder, chest, and inseam lines.
          </p>
        </div>

        {/* Interactive Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Interactive Step Selectors */}
          <div className="lg:col-span-6 space-y-3">
            {dressingSteps.map((s, idx) => {
              const isSelected = activeStepIndex === idx;
              return (
                <button
                  key={s.step}
                  onClick={() => setActiveStepIndex(idx)}
                  className={`w-full p-4.5 rounded-2xl text-left border transition-all duration-300 flex items-center justify-between group ${
                    isSelected
                      ? 'bg-[var(--bg-surface)] border-[var(--gold-accent)] shadow-xl ring-1 ring-[var(--gold-accent)]/30'
                      : 'bg-[var(--bg-surface)]/60 border-[var(--border-subtle)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-surface)]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-mono-luxury font-bold text-xs transition-colors ${
                      isSelected
                        ? 'bg-[var(--gold-accent)] text-black'
                        : 'bg-[var(--badge-bg)] text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                    }`}>
                      {s.step}
                    </div>

                    <div>
                      <h4 className={`text-sm font-bold transition-colors ${
                        isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                      }`}>
                        {s.title}
                      </h4>
                      <p className="text-xs text-[var(--text-muted)] font-light mt-0.5">
                        {s.subtitle}
                      </p>
                      {s.price > 0 && (
                        <div className="text-[11px] font-mono-luxury text-[var(--gold-accent)] font-bold mt-1">
                          ₦{s.price.toLocaleString()} · {s.fitDetail}
                        </div>
                      )}
                    </div>
                  </div>

                  <ChevronRight className={`h-4 w-4 transition-transform ${
                    isSelected ? 'text-[var(--gold-accent)] translate-x-1' : 'text-[var(--text-muted)]'
                  }`} />
                </button>
              );
            })}
          </div>

          {/* Right Column: Live Layered Mannequin Visualizer */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative w-full max-w-[450px] rounded-3xl surface-card p-6 shadow-2xl border border-[var(--border-subtle)] flex flex-col items-center justify-between space-y-4">
              
              {/* Top Status Bar */}
              <div className="w-full flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-primary)] font-bold">
                    CAD Fitting Simulation
                  </span>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-mono-luxury font-bold">
                  99.8% Precision Fit
                </span>
              </div>

              {/* Mannequin Stage */}
              <div className="relative w-[240px] h-[340px] flex items-center justify-center my-2">
                
                {/* Mannequin Vector Frame */}
                <svg viewBox="0 0 200 400" className="w-full h-full opacity-20 text-[var(--text-muted)]" fill="none">
                  <circle cx="100" cy="40" r="22" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M65 85 L135 85 L125 180 L75 180 Z" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M75 185 L125 185 L120 360 L80 360 Z" stroke="currentColor" strokeWidth="1.5" />
                </svg>

                {/* BOTTOMS (Shows when step >= 1) */}
                {activeStepIndex >= 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute top-[160px] w-[130px] h-[155px] rounded-b-2xl overflow-hidden shadow-xl border border-[var(--border-subtle)] z-10"
                  >
                    <Image
                      src="/images/products/MenVintageCasualJean.jpg"
                      alt="Senator Trousers"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                    <span className="absolute bottom-1 left-1 text-[8px] font-mono-luxury bg-black/85 px-1.5 py-0.5 rounded text-white font-bold">
                      Trousers: ₦45k
                    </span>
                  </motion.div>
                )}

                {/* TOPS (Shows when step >= 2) */}
                {activeStepIndex >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute top-[45px] w-[145px] h-[145px] rounded-2xl overflow-hidden shadow-xl border border-[var(--border-subtle)] z-20"
                  >
                    <Image
                      src="/images/products/BlackSenator.jpg"
                      alt="Senator Kaftan Top"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                    <span className="absolute top-1 left-1 text-[8px] font-mono-luxury bg-black/85 px-1.5 py-0.5 rounded text-[var(--gold-accent)] font-bold">
                      Senator Top: ₦65k
                    </span>
                  </motion.div>
                )}

                {/* OUTERWEAR (Shows when step >= 3) */}
                {activeStepIndex >= 3 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="absolute top-[35px] w-[185px] h-[225px] rounded-3xl overflow-hidden shadow-2xl border-2 border-[var(--gold-accent)] z-30 pointer-events-none"
                  >
                    <Image
                      src="/images/products/BlackAgbada.jpg"
                      alt="Agbada Robe"
                      fill
                      unoptimized
                      className="object-cover opacity-90 mix-blend-screen"
                    />
                    <span className="absolute top-2 right-2 text-[8px] font-mono-luxury bg-black/90 px-2 py-0.5 rounded text-[var(--gold-accent)] font-bold">
                      Agbada: ₦98k
                    </span>
                  </motion.div>
                )}

                {/* FOOTWEAR (Shows when step >= 3) */}
                {activeStepIndex >= 3 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute bottom-[0px] w-[110px] h-[50px] rounded-xl overflow-hidden shadow-xl border border-[var(--border-subtle)] z-20"
                  >
                    <Image
                      src="/images/products/UnisexSlides.jpg"
                      alt="Kano Slides"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </motion.div>
                )}

              </div>

              {/* Bottom Complete Look Bar */}
              <div className="w-full pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono-luxury text-[var(--text-muted)] uppercase">
                    {currentStep.garmentName}
                  </span>
                  <div className="font-editorial text-lg font-bold text-[var(--text-primary)]">
                    {activeStepIndex === 0 ? 'Baseline Calibrated' : activeStepIndex === 1 ? '₦45,000' : activeStepIndex === 2 ? '₦110,000' : '₦208,000 Total'}
                  </div>
                </div>

                <Link
                  href="/studio"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase tracking-wider text-[10px] font-bold hover:opacity-90 transition-all shadow-md group"
                >
                  <span>Dress in Studio</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
