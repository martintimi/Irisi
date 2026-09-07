'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ShieldCheck, Sparkles, Flame, ShoppingBag, Gem, Check, ArrowUpRight } from 'lucide-react';

const maleOutfits = [
  '/images/editorial/male_hoodie.jpg',
  '/images/editorial/male_senator.jpg',
  '/images/editorial/male_shirt.jpg',
];

const femaleOutfits = [
  '/images/editorial/female_hoodie.jpg',
  '/images/editorial/female_dress.jpg',
  '/images/editorial/female_shirt.jpg',
];

export default function ProblemSolution() {
  const sectionRef = useRef<HTMLElement>(null);

  // Creative hardware-accelerated scroll parallax with generous depth
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start']
  });

  const leftY = useTransform(scrollYProgress, [0, 1], [-130, 130]);
  const rightY = useTransform(scrollYProgress, [0, 1], [130, -130]);
  const leftScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1.05, 0.95]);
  const rightScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1.05, 0.95]);
  const modelOpacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.4, 0.95, 0.95, 0.4]);

  // Slow, dreamy crossfade cycling through outfit categories every 5 seconds
  const [activeOutfitIdx, setActiveOutfitIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveOutfitIdx((prev) => (prev + 1) % maleOutfits.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // 4 Comprehensive, Head-to-Toe Nigerian Fashion Pillars (Clothes + Shoes + Bags + Jewelry)
  const pillars = [
    {
      icon: Flame,
      title: 'The Complete Nigerian Fit',
      desc: 'Bespoke Senator native suits, royal Agbada cuts, 450gsm heavyweight street hoodies, and relaxed linen sets — crafted with precision cuts and premium finishing.',
      tag: 'Native & Streetwear',
      sub: 'Senator · Agbada · Hoodies',
      num: '01'
    },
    {
      icon: ShoppingBag,
      title: 'Artisanal Shoes & Leather Bags',
      desc: 'Handcrafted genuine leather slides, artisanal smart mules, structured crossbodies, and luxury weekend travel totes handmade by Nigeria’s master leather artisans.',
      tag: 'Shoes & Leather Bags',
      sub: 'Leather Slides · Totes · Mules',
      num: '02'
    },
    {
      icon: Gem,
      title: 'Fine Jewelry & Statement Accents',
      desc: 'Solid gold cuban chains, statement signet rings, iced pendants, and regal heritage wrist cuffs crafted for modern Nigerian royalty.',
      tag: 'Fine Gold & Jewelry',
      sub: 'Chains · Rings · Heritage Cuffs',
      num: '03'
    },
    {
      icon: ShieldCheck,
      title: 'Direct Dispatch & Escrow Security',
      desc: 'Shop clothes, shoes, bags, and jewelry from verified Nigerian brands. Each designer dispatches directly to your doorstep, and funds stay 100% locked in escrow until you receive and inspect your pieces.',
      tag: '100% Escrow Protected',
      sub: 'Zero Risk · All 36 States',
      num: '04'
    }
  ];

  return (
    <section 
      ref={sectionRef} 
      className="relative pt-8 sm:pt-10 lg:pt-12 pb-24 sm:pb-28 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] overflow-hidden transition-colors"
    >
      {/* ======================================================== */}
      {/* 1. LEFT FLANK: MALE MODEL SLOW DISSOLVE OUTFIT CHANGER   */}
      {/* ======================================================== */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-[24%] lg:w-[28%] xl:w-[30%] pointer-events-none overflow-hidden select-none z-0 hidden md:block"
        style={{
          maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)',
        }}
      >
        <motion.div 
          style={{ 
            y: leftY,
            scale: leftScale,
            opacity: modelOpacity
          }}
          className="relative w-full h-full min-h-[650px] -top-[4%] will-change-transform"
        >
          {maleOutfits.map((src, idx) => (
            <motion.div
              key={src}
              initial={false}
              animate={{ opacity: idx === activeOutfitIdx ? 0.95 : 0 }}
              transition={{ duration: 1.8, ease: 'easeInOut' }}
              className="absolute inset-0 w-full h-full"
            >
              <Image
                src={src}
                alt="Nigerian Menswear Fashion Model"
                fill
                unoptimized
                priority={idx === 0}
                className="object-cover object-top filter contrast-[1.04] brightness-[0.98] dark:brightness-[0.9]"
              />
            </motion.div>
          ))}

          {/* Vignette blend */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FAF9F5]/30 dark:via-[var(--bg-primary)]/40 to-[#FAF9F5] dark:to-[var(--bg-primary)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAF9F5] dark:from-[var(--bg-primary)] via-transparent to-[#FAF9F5]/80 dark:to-[var(--bg-primary)]/80" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#FAF9F5] dark:from-[var(--bg-primary)] via-transparent to-[#FAF9F5]/90 dark:to-[var(--bg-primary)]/90" />
        </motion.div>

        {/* Minimalist Vertical Editorial Accent */}
        <div className="absolute bottom-12 left-6 z-10 hidden xl:flex items-center gap-3 rotate-[-90deg] origin-left text-[9px] font-mono-luxury uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-60">
          <span>NIGERIAN MENSWEAR</span>
          <span className="h-px w-8 bg-[var(--gold-accent)]" />
          <span>MENS EDITORIAL</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. RIGHT FLANK: FEMALE MODEL SLOW DISSOLVE OUTFIT CHANGER */}
      {/* ======================================================== */}
      <div 
        className="absolute right-0 top-0 bottom-0 w-[24%] lg:w-[28%] xl:w-[30%] pointer-events-none overflow-hidden select-none z-0 hidden md:block"
        style={{
          maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)',
        }}
      >
        <motion.div 
          style={{ 
            y: rightY,
            scale: rightScale,
            opacity: modelOpacity
          }}
          className="relative w-full h-full min-h-[650px] -top-[4%] will-change-transform"
        >
          {femaleOutfits.map((src, idx) => (
            <motion.div
              key={src}
              initial={false}
              animate={{ opacity: idx === activeOutfitIdx ? 0.95 : 0 }}
              transition={{ duration: 1.8, ease: 'easeInOut' }}
              className="absolute inset-0 w-full h-full"
            >
              <Image
                src={src}
                alt="Nigerian Womenswear Fashion Model"
                fill
                unoptimized
                priority={idx === 0}
                className="object-cover object-top filter contrast-[1.04] brightness-[0.98] dark:brightness-[0.9]"
              />
            </motion.div>
          ))}

          {/* Vignette blend */}
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#FAF9F5]/30 dark:via-[var(--bg-primary)]/40 to-[#FAF9F5] dark:to-[var(--bg-primary)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAF9F5] dark:from-[var(--bg-primary)] via-transparent to-[#FAF9F5]/80 dark:to-[var(--bg-primary)]/80" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#FAF9F5] dark:from-[var(--bg-primary)] via-transparent to-[#FAF9F5]/90 dark:to-[var(--bg-primary)]/90" />
        </motion.div>

        {/* Minimalist Vertical Editorial Accent */}
        <div className="absolute top-28 right-6 z-10 hidden xl:flex items-center gap-3 rotate-[90deg] origin-right text-[9px] font-mono-luxury uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-60">
          <span>NIGERIAN WOMENSWEAR</span>
          <span className="h-px w-8 bg-[var(--gold-accent)]" />
          <span>WOMENS EDITORIAL</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. CENTER AMBIENT LUXURY SPOTLIGHT                      */}
      {/* ======================================================== */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[var(--gold-accent)]/8 dark:bg-[var(--gold-accent)]/10 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* ======================================================== */}
      {/* 4. MAIN LUXURY CONTENT CONTAINER                        */}
      {/* ======================================================== */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3.5 mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/30 text-[var(--gold-accent)] text-xs font-mono-luxury uppercase tracking-[0.2em] font-bold shadow-sm backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            <span>HEAD-TO-TOE NIGERIAN LUXURY · CULTURE & DRIP</span>
          </div>

          <h2 className="font-editorial text-3xl sm:text-5xl lg:text-6xl font-normal text-[var(--text-primary)] tracking-tight leading-[1.15]">
            The Complete Nigerian Drip. <span className="italic font-light text-[var(--gold-accent)]">Escrow Secured.</span>
          </h2>

          <p className="text-sm sm:text-base text-[var(--text-secondary)] font-light leading-relaxed max-w-2xl mx-auto">
            From bespoke Senator cuts and streetwear drops to handcrafted leather shoes, luxury bags, and fine jewelry — assemble your entire fit from Nigeria&apos;s finest independent fashion houses.
          </p>
        </div>

        {/* 4 Crisp, Solid High-Contrast Luxury Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {pillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="relative p-7 sm:p-8 rounded-3xl surface-card border border-[var(--border-subtle)] hover:border-[var(--gold-accent)]/80 flex flex-col justify-between space-y-7 shadow-xl hover:-translate-y-2.5 transition-all duration-500 group cursor-default"
              >
                {/* Top Subtle Gold Accent Bar on Hover */}
                <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-[var(--gold-accent)]/0 group-hover:via-[var(--gold-accent)]/90 to-transparent transition-all duration-500" />

                <div className="space-y-4">
                  {/* Top Bar: Icon Monogram + Pill Number */}
                  <div className="flex items-center justify-between">
                    <div className="h-13 w-13 rounded-2xl bg-gradient-to-br from-[var(--gold-subtle)] to-[var(--gold-accent)]/20 border border-[var(--gold-accent)]/30 text-[var(--gold-accent)] flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-sm">
                      <Icon className="h-6 w-6 stroke-[1.8]" />
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] group-hover:border-[var(--gold-accent)]/40 transition-colors">
                      <span className="text-[10px] font-mono-luxury font-bold tracking-widest text-[var(--gold-accent)]">
                        {item.num}
                      </span>
                    </div>
                  </div>

                  {/* Title & Micro Divider */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[9px] font-mono-luxury uppercase tracking-wider text-[var(--gold-accent)] font-bold block">
                      {item.sub}
                    </span>
                    <h3 className="font-editorial text-2xl font-bold text-[var(--text-primary)] group-hover:text-[var(--gold-accent)] transition-colors duration-300 leading-snug">
                      {item.title}
                    </h3>
                    <div className="h-0.5 w-8 bg-[var(--gold-accent)]/30 group-hover:w-14 group-hover:bg-[var(--gold-accent)] transition-all duration-500 rounded-full" />
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                {/* Footer Meta Badge */}
                <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono-luxury">
                  <span className="text-emerald-500 font-bold flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                    <span>{item.tag}</span>
                  </span>

                  <span className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] group-hover:text-[var(--gold-accent)] transition-colors flex items-center gap-0.5">
                    <span>Protocol</span>
                    <ArrowUpRight className="h-3 w-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Luxury Guarantee Banner */}
        <div className="mt-14 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs font-mono-luxury text-[var(--text-secondary)] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Escrow Fit Guarantee: Order native wear, shoes, bags & jewelry with 100% money-back security across Nigeria</span>
          </div>
        </div>

      </div>
    </section>
  );
}
