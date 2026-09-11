'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles, ArrowUpRight, ShieldCheck, Truck } from 'lucide-react';

interface OccasionEdit {
  id: string;
  number: string;
  categoryTag: string;
  title: string;
  subtitle: string;
  description: string;
  pieces: string;
  image: string;
  link: string;
  dropsCount: string;
}

const OCCASION_EDITS: OccasionEdit[] = [
  {
    id: 'owambe-ceremonial',
    number: '01',
    categoryTag: 'TRADITIONAL & NATIVE',
    title: 'Weddings & Owambe',
    subtitle: 'Agbada Robes & Senator Kaftans',
    description: 'Statement 3-piece Agbada robes and tailored Senator sets crafted for Nigerian weddings, galas, and celebrations.',
    pieces: '3-Piece Agbada · Tailored Senators · Aso-Oke Fila',
    image: '/images/editorial/nigerian_male_couture.jpg',
    link: '/category/native',
    dropsCount: 'Native Outfits'
  },
  {
    id: 'lagos-streetwear',
    number: '02',
    categoryTag: 'STREETWEAR',
    title: 'Streetwear & Drops',
    subtitle: 'Heavyweight Hoodies & Denim',
    description: 'Heavyweight oversized hoodies, baggy cargo pants, and graphic tees engineered for everyday street fashion.',
    pieces: 'Oversized Hoodies · Baggy Jeans · Graphic Tees',
    image: '/images/editorial/modern_male_streetwear.jpg',
    link: '/category/streetwear',
    dropsCount: 'Street Drops'
  },
  {
    id: 'sunday-executive',
    number: '03',
    categoryTag: 'OFFICE & SUNDAY BEST',
    title: 'Tailored & Office Wear',
    subtitle: 'Fine Kaftans & Clean Trousers',
    description: 'Clean Senator sets, pressed formal trousers, and smart leather shoes crafted for church service and corporate meetings.',
    pieces: 'Tailored Kaftans · Dress Trousers · Smart Shoes',
    image: '/images/editorial/male_senator.jpg',
    link: '/category/shirts',
    dropsCount: 'Tailored Outfits'
  },
  {
    id: 'resort-chilling',
    number: '04',
    categoryTag: 'CASUAL & RESORT',
    title: 'Weekend & Casual',
    subtitle: 'Relaxed Shirts & Leather Slides',
    description: 'Breathable linen shirts, lightweight boubous, and comfortable handmade leather slides for easy weekend relaxation.',
    pieces: 'Linen Shirts · Leather Slides · Casual Slippers',
    image: '/images/editorial/male_shirt.jpg',
    link: '/category/footwear',
    dropsCount: 'Footwear & Slides'
  }
];

export default function CuratedAteliers() {
  return (
    <section className="py-20 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-[var(--border-subtle)]">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--badge-bg)] border border-[var(--border-subtle)] text-[var(--gold-accent)] text-xs font-mono-luxury uppercase tracking-widest font-bold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>SHOP BY OCCASION</span>
            </div>

            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-normal text-[var(--text-primary)] leading-tight">
              Dress for Every Nigerian Occasion
            </h2>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-relaxed">
              Outfits and styles for traditional weddings, everyday streetwear, formal events, and weekend relaxation.
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:text-[var(--gold-accent)] transition-all font-semibold self-start md:self-auto group"
          >
            <span>Explore All Outfits</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 4 Cinematic Occasion Cards — Perfectly Balanced, Zero Slider Buttons, Exact Same Height */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {OCCASION_EDITS.map((occasion) => (
            <Link
              key={occasion.id}
              href={occasion.link}
              className="group relative h-[540px] rounded-3xl overflow-hidden border border-[var(--border-subtle)] hover:border-[var(--gold-accent)]/70 transition-all duration-500 flex flex-col justify-between p-6 sm:p-7 shadow-xl hover:shadow-2xl active:scale-[0.99] block"
            >
              {/* Cinematic Background Image with Smooth Hover Zoom */}
              <div className="absolute inset-0 z-0">
                <Image
                  src={occasion.image}
                  alt={occasion.title}
                  fill
                  unoptimized
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out brightness-90 group-hover:brightness-100"
                />
                {/* Multi-Stop Editorial Dark Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/25 group-hover:via-black/45 transition-colors duration-500 pointer-events-none" />
              </div>

              {/* Card Top: Number Pill & Category Badge */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--gold-accent)] font-bold border border-white/10 shadow-sm">
                    {occasion.categoryTag}
                  </span>
                </div>

                <div className="h-8 w-8 rounded-full bg-black/70 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/90 group-hover:bg-[var(--gold-accent)] group-hover:text-black group-hover:scale-110 transition-all shadow-md">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>

              {/* Card Bottom: Titles, Description & Signature Pieces */}
              <div className="relative z-10 space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono-luxury text-amber-400/90 font-bold uppercase tracking-wider block">
                    {occasion.subtitle}
                  </span>
                  <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-white leading-tight group-hover:text-amber-200 transition-colors">
                    {occasion.title}
                  </h3>
                </div>

                <p className="text-xs text-zinc-300 font-light leading-relaxed line-clamp-3">
                  {occasion.description}
                </p>

                {/* Signature Pieces Tag Strip */}
                <div className="pt-2 border-t border-white/15 space-y-2">
                  <span className="text-[9px] font-mono-luxury uppercase tracking-widest text-zinc-400 block font-bold">
                    Popular Items:
                  </span>
                  <div className="text-[11px] font-mono-luxury text-white/90 font-semibold line-clamp-1">
                    {occasion.pieces}
                  </div>
                </div>

                {/* Action Link */}
                <div className="pt-2 flex items-center justify-between text-xs font-mono-luxury text-[var(--gold-accent)] font-bold uppercase tracking-wider">
                  <span>Shop Collection</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* The Ìrísí Trust Ribbon */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-3 p-4 rounded-2xl surface-card border border-[var(--border-subtle)]">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[var(--text-primary)] block">100% Escrow Protection</span>
              <span className="text-[11px] text-[var(--text-secondary)] font-light">Funds released only upon delivery & inspection</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl surface-card border border-[var(--border-subtle)]">
            <div className="h-9 w-9 rounded-xl bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/30 flex items-center justify-center text-[var(--gold-accent)] shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[var(--text-primary)] block">Verified Fashion Brands</span>
              <span className="text-[11px] text-[var(--text-secondary)] font-light">Authentic streetwear, native wear, bags, footwear & jewelry</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl surface-card border border-[var(--border-subtle)]">
            <div className="h-9 w-9 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0">
              <Truck className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[var(--text-primary)] block">Doorstep & Hub Delivery</span>
              <span className="text-[11px] text-[var(--text-secondary)] font-light">Direct courier dispatch and park pickup with live tracking</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
