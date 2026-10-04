'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { X, Sparkles, Check, Ruler, ArrowRight, Info } from 'lucide-react';
import { useStore } from '@/lib/store/useStore';
import confetti from 'canvas-confetti';
import {
  SIZE_CHARTS,
  resolveSizeChartKey,
  predictBestSize,
  formatMeasurement,
} from '@/lib/data/sizeChartData';

export interface FitPredictorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSize: (size: string) => void;
  category?: string;
  availableSizes?: string[];
  product?: any;
  selectedSize?: string;
  initialTab?: 'check_size' | 'size_guide';
}

export default function FitPredictorModal({
  isOpen,
  onClose,
  onSelectSize,
  category = 'tops',
  availableSizes = ['S', 'M', 'L', 'XL', 'XXL'],
  product,
  selectedSize,
  initialTab = 'check_size',
}: FitPredictorModalProps) {
  const { bodyProfile, setBodyProfile } = useStore();

  const [activeTab, setActiveTab] = useState<'check_size' | 'size_guide'>(initialTab);
  const [measurementUnit, setMeasurementUnit] = useState<'cm' | 'inch'>('cm');

  // Prevent background scrolling and handle Escape key while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Sync initial tab when opened
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Determine chart key
  const chartKey = useMemo(() => {
    return resolveSizeChartKey(product || { category });
  }, [product, category]);

  const currentChart = useMemo(() => {
    return SIZE_CHARTS[chartKey] || SIZE_CHARTS.tops;
  }, [chartKey]);

  const isFootwear = chartKey === 'footwear';

  // State initialized with user profile or standard average
  const [heightCm, setHeightCm] = useState<number>(bodyProfile?.heightCm || 178);
  const [weightKg, setWeightKg] = useState<number>(bodyProfile?.weightKg || 75);
  const [fitPreference, setFitPreference] = useState<'slim' | 'regular' | 'oversized'>(
    bodyProfile?.preferredFit || 'regular'
  );
  const [heightUnit, setHeightUnit] = useState<'ft' | 'cm'>('ft');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [footLengthCm, setFootLengthCm] = useState<number>(26.5);

  // Convert CM to Feet & Inches
  const feetInches = useMemo(() => {
    const totalInches = heightCm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
  }, [heightCm]);

  // Size prediction algorithm
  const prediction = useMemo(() => {
    return predictBestSize({
      heightCm,
      weightKg,
      fitPreference,
      chartKey,
      availableSizes,
      footLengthCm: isFootwear ? footLengthCm : undefined,
    });
  }, [heightCm, weightKg, fitPreference, chartKey, availableSizes, footLengthCm, isFootwear]);

  if (!isOpen) return null;

  const handleApplySize = (sizeToApply: string) => {
    setBodyProfile({
      heightCm,
      weightKg,
      preferredSize: sizeToApply as any,
      preferredFit: fitPreference,
    });

    onSelectSize(sizeToApply);

    confetti({
      particleCount: 50,
      spread: 55,
      origin: { y: 0.8 },
      colors: ['#e6c367', '#10b981', '#ffffff'],
    });

    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn overscroll-contain"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        className="w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[88vh] surface-card rounded-t-3xl sm:rounded-3xl border border-[var(--border-subtle)] shadow-2xl flex flex-col overflow-hidden animate-slideUp overscroll-contain"
      >
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] flex items-center justify-between shrink-0 bg-[var(--bg-secondary)]/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/30 text-[var(--gold-accent)]">
              {activeTab === 'check_size' ? <Sparkles className="h-4 w-4" /> : <Ruler className="h-4 w-4" />}
            </div>
            <div>
              <h3 className="font-editorial text-lg font-bold text-[var(--text-primary)]">
                {activeTab === 'check_size' ? 'Check My Size' : 'Size Guide & Measurements'}
              </h3>
              <p className="text-[10px] font-mono-luxury text-[var(--text-secondary)]">
                {currentChart.categoryName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)]/30 transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Switcher (Shein Style Segmented Control) */}
        <div className="px-4 sm:px-6 pt-3 shrink-0">
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs font-mono-luxury font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('check_size')}
              className={`py-2 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'check_size'
                  ? 'bg-[var(--gold-accent)] text-black shadow-md font-extrabold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Check My Size</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('size_guide')}
              className={`py-2 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'size_guide'
                  ? 'bg-[var(--gold-accent)] text-black shadow-md font-extrabold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Ruler className="h-3.5 w-3.5" />
              <span>Size Guide (Chart)</span>
            </button>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 overscroll-contain touch-pan-y">
          
          {/* ======================================================== */}
          {/* TAB 1: CHECK MY SIZE (FIT FINDER)                         */}
          {/* ======================================================== */}
          {activeTab === 'check_size' && (
            <div className="space-y-4">
              <p className="text-xs text-[var(--text-secondary)]">
                Move the sliders to match your frame. We'll automatically determine your best fit.
              </p>

              {/* Height Slider */}
              <div className="p-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono-luxury font-bold">
                  <span className="text-[var(--text-secondary)] uppercase">Your Height</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-[var(--gold-accent)]">
                      {heightUnit === 'ft' ? `${feetInches} (${heightCm}cm)` : `${heightCm} cm`}
                    </span>
                    <div className="flex rounded-md border border-[var(--border-subtle)] overflow-hidden text-[10px]">
                      <button
                        type="button"
                        onClick={() => setHeightUnit('ft')}
                        className={`px-2 py-0.5 transition-colors cursor-pointer ${heightUnit === 'ft' ? 'bg-[var(--gold-accent)] text-black font-bold' : 'text-[var(--text-secondary)]'}`}
                      >
                        ft
                      </button>
                      <button
                        type="button"
                        onClick={() => setHeightUnit('cm')}
                        className={`px-2 py-0.5 transition-colors cursor-pointer ${heightUnit === 'cm' ? 'bg-[var(--gold-accent)] text-black font-bold' : 'text-[var(--text-secondary)]'}`}
                      >
                        cm
                      </button>
                    </div>
                  </div>
                </div>
                <input
                  type="range"
                  min={148}
                  max={206}
                  step={1}
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full accent-[var(--gold-accent)] cursor-pointer h-2 bg-[var(--bg-secondary)] rounded-lg touch-none"
                />
                <div className="flex justify-between text-[10px] font-mono-luxury text-[var(--text-secondary)]">
                  <span>4'11" (150cm)</span>
                  <span>5'10" (178cm)</span>
                  <span>6'8" (205cm)</span>
                </div>
              </div>

              {/* Weight Slider (for clothes) */}
              {!isFootwear && (
                <div className="p-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono-luxury font-bold">
                    <span className="text-[var(--text-secondary)] uppercase">Your Weight</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-[var(--gold-accent)]">
                        {weightUnit === 'lbs'
                          ? `${Math.round(weightKg * 2.20462)} lbs`
                          : `${weightKg} kg`}
                      </span>
                      <div className="flex rounded-md border border-[var(--border-subtle)] overflow-hidden text-[10px]">
                        <button
                          type="button"
                          onClick={() => setWeightUnit('kg')}
                          className={`px-2 py-0.5 transition-colors cursor-pointer ${weightUnit === 'kg' ? 'bg-[var(--gold-accent)] text-black font-bold' : 'text-[var(--text-secondary)]'}`}
                        >
                          kg
                        </button>
                        <button
                          type="button"
                          onClick={() => setWeightUnit('lbs')}
                          className={`px-2 py-0.5 transition-colors cursor-pointer ${weightUnit === 'lbs' ? 'bg-[var(--gold-accent)] text-black font-bold' : 'text-[var(--text-secondary)]'}`}
                        >
                          lbs
                        </button>
                      </div>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={45}
                    max={125}
                    step={1}
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full accent-[var(--gold-accent)] cursor-pointer h-2 bg-[var(--bg-secondary)] rounded-lg touch-none"
                  />
                  <div className="flex justify-between text-[10px] font-mono-luxury text-[var(--text-secondary)]">
                    <span>45 kg (99 lbs)</span>
                    <span>75 kg (165 lbs)</span>
                    <span>125 kg (275 lbs)</span>
                  </div>
                </div>
              )}

              {/* Foot Length Slider (for Footwear) */}
              {isFootwear && (
                <div className="p-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono-luxury font-bold">
                    <span className="text-[var(--text-secondary)] uppercase">Foot Length</span>
                    <span className="text-sm font-black text-[var(--gold-accent)]">
                      {footLengthCm} cm ({(footLengthCm / 2.54).toFixed(1)}")
                    </span>
                  </div>
                  <input
                    type="range"
                    min={23.5}
                    max={30.5}
                    step={0.5}
                    value={footLengthCm}
                    onChange={(e) => setFootLengthCm(Number(e.target.value))}
                    className="w-full accent-[var(--gold-accent)] cursor-pointer h-2 bg-[var(--bg-secondary)] rounded-lg touch-none"
                  />
                  <div className="flex justify-between text-[10px] font-mono-luxury text-[var(--text-secondary)]">
                    <span>23.5 cm (EU 37)</span>
                    <span>26.5 cm (EU 42)</span>
                    <span>30.5 cm (EU 47)</span>
                  </div>
                </div>
              )}

              {/* Fit Preference Pills */}
              <div className="space-y-2">
                <span className="text-xs font-mono-luxury font-bold text-[var(--text-secondary)] uppercase block">
                  Desired Fit Feel
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'slim', label: isFootwear ? 'Snug Fit' : 'Tailored / Slim' },
                    { id: 'regular', label: 'Regular Fit' },
                    { id: 'oversized', label: isFootwear ? 'Extra Room' : 'Relaxed / Roomy' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFitPreference(f.id as any)}
                      className={`py-2 px-2 rounded-xl text-xs font-mono-luxury font-bold text-center border transition-all cursor-pointer ${
                        fitPreference === f.id
                          ? 'border-[var(--gold-accent)] bg-[var(--gold-subtle)] text-[var(--gold-accent)] shadow-sm ring-1 ring-[var(--gold-accent)]/40'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Recommendation Output */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--gold-subtle)] via-[var(--bg-secondary)] to-[var(--bg-primary)] border border-[var(--gold-accent)]/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono-luxury font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Recommended Size
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono-luxury font-bold">
                    {prediction.confidence}% Fit Match
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-mono-luxury font-black text-[var(--gold-accent)]">
                    {isFootwear ? `EU ${prediction.size}` : `Size ${prediction.size}`}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)]">
                    for your measurements
                  </span>
                </div>

                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  {prediction.reason}
                </p>
              </div>

              {/* Apply Size CTA */}
              <button
                type="button"
                onClick={() => handleApplySize(prediction.size)}
                className="w-full py-3.5 rounded-full bg-[var(--gold-accent)] text-black font-mono-luxury uppercase text-xs font-black tracking-wider hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl cursor-pointer"
              >
                <span>Select Size {prediction.size} & Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: SIZE GUIDE (MEASUREMENT CHART)                    */}
          {/* ======================================================== */}
          {activeTab === 'size_guide' && (
            <div className="space-y-4">
              
              {/* Unit Toggle and Description */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-xs text-[var(--text-secondary)] max-w-[360px]">
                  {currentChart.description}
                </p>

                {/* CM / INCH Toggle Switch */}
                <div className="flex rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-0.5 text-xs font-mono-luxury font-bold shrink-0">
                  <button
                    type="button"
                    onClick={() => setMeasurementUnit('cm')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      measurementUnit === 'cm'
                        ? 'bg-[var(--gold-accent)] text-black shadow-xs font-extrabold'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    CM
                  </button>
                  <button
                    type="button"
                    onClick={() => setMeasurementUnit('inch')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      measurementUnit === 'inch'
                        ? 'bg-[var(--gold-accent)] text-black shadow-xs font-extrabold'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    INCH
                  </button>
                </div>
              </div>

              {/* Interactive Measurement Table */}
              <div className="rounded-2xl border border-[var(--border-subtle)] overflow-hidden bg-[var(--bg-primary)] shadow-sm">
                <div className="overflow-x-auto overscroll-contain">
                  <table className="w-full text-left border-collapse text-xs font-mono-luxury">
                    <thead>
                      <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] text-[10px] text-[var(--text-secondary)] uppercase">
                        {currentChart.columns.map((col) => (
                          <th key={col.key} className="py-2.5 px-3 sm:px-3.5 font-bold whitespace-nowrap">
                            {col.label}
                            {col.unitType === 'length' && (
                              <span className="ml-1 text-[9px] text-[var(--gold-accent)]">({measurementUnit})</span>
                            )}
                          </th>
                        ))}
                        <th className="py-2.5 px-3 sm:px-3.5 text-right font-bold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                      {currentChart.rows.map((row) => {
                        const isCurrentSelected = row.size === selectedSize;
                        const isAvailable = availableSizes.length === 0 || availableSizes.includes(row.size);

                        return (
                          <tr
                            key={row.size}
                            onClick={() => isAvailable && handleApplySize(row.size)}
                            className={`transition-colors cursor-pointer ${
                              isCurrentSelected
                                ? 'bg-[var(--gold-subtle)]/50 font-bold'
                                : isAvailable
                                ? 'hover:bg-[var(--bg-secondary)]/60'
                                : 'opacity-40'
                            }`}
                          >
                            <td className="py-3 px-3 sm:px-3.5 font-black text-[var(--text-primary)] whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span>{row.size}</span>
                                {row.subLabel && (
                                  <span className="text-[9px] font-normal text-[var(--text-secondary)]">
                                    ({row.subLabel})
                                  </span>
                                )}
                              </div>
                            </td>

                            {currentChart.columns.slice(1).map((col) => {
                              const rawVal = row.measurements[col.key] ?? '-';
                              const formatted = formatMeasurement(rawVal, measurementUnit, col.unitType);
                              return (
                                <td key={col.key} className="py-3 px-3 sm:px-3.5 text-[var(--text-secondary)] whitespace-nowrap">
                                  {formatted}
                                </td>
                              );
                            })}

                            <td className="py-3 px-3 sm:px-3.5 text-right whitespace-nowrap">
                              {isCurrentSelected ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-[var(--gold-accent)] font-bold">
                                  <Check className="h-3 w-3" />
                                  <span>Selected</span>
                                </span>
                              ) : isAvailable ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApplySize(row.size);
                                  }}
                                  className="text-[10px] uppercase font-bold text-[var(--text-secondary)] hover:text-[var(--gold-accent)] px-2.5 py-0.5 rounded border border-[var(--border-subtle)] hover:border-[var(--gold-accent)] transition-all cursor-pointer"
                                >
                                  Select
                                </button>
                              ) : (
                                <span className="text-[10px] text-[var(--text-muted)]">N/A</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* How to Measure Guide */}
              <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-mono-luxury font-bold text-[var(--text-primary)]">
                  <Info className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
                  <span>How to Measure</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentChart.measuringTips.map((tip, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-[var(--bg-secondary)]/40 border border-[var(--border-subtle)] space-y-1">
                      <div className="text-[11px] font-mono-luxury font-bold text-[var(--gold-accent)]">
                        {tip.title}
                      </div>
                      <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                        {tip.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
