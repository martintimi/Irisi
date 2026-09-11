'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MapPin, Sparkles } from 'lucide-react';

const ateliers = [
  {
    name: 'Sartorial Lagos',
    location: 'Victoria Island, Lagos',
    focus: 'Bespoke Senator Suits & Ceremonial Agbada',
    desc: 'Renowned for razor-sharp geometric chest embroidery, structured shoulder lines, and fine Italian merino wool native cuts.',
    image: '/images/products/BlackSenator.jpg',
    tag: 'Bespoke Tailoring',
    heroPieces: 'Senator Sets · Agbada Robes · Velvet Fila'
  },
  {
    name: 'Street Souk Co.',
    location: 'Lekki Phase 1, Lagos',
    focus: 'Afro-Streetwear & 450gsm Heavyweight Fleece',
    desc: 'Lagos youth culture engineered into oversized dropped-shoulder hoodies, boxy graphic tees, and cyber streetwear aesthetics.',
    image: '/images/products/BlackTrapStarHoodie.jpg',
    tag: 'Ready-to-Wear Street',
    heroPieces: 'Trapstar Hoodies · Boxy Tees · Aqua Slides'
  },
  {
    name: 'Yaba Denim Works',
    location: 'Yaba, Lagos',
    focus: 'Raw 14oz Selvedge Denim & Tactical Cargos',
    desc: 'Durable wide-leg denim, straight-cut vintage jeans, and articulated utility trousers tailored for the Nigerian urban rhythm.',
    image: '/images/products/BaggyJean.jpg',
    tag: 'Ready-to-Wear Denim',
    heroPieces: 'Wide-Leg Baggy Denim · Multi-Pocket Cargos'
  },
  {
    name: 'Kano Artisan Footwear',
    location: 'Kano & Lagos',
    focus: 'Handcrafted Full-Grain Calf Leather Slides & Shoes',
    desc: 'Century-old Northern tannery heritage crafting anatomical leather slides, horsebit mules, and Goodyear welted Oxfords.',
    image: '/images/products/UnisexSlides.jpg',
    tag: 'Handmade Leathercraft',
    heroPieces: 'Calf Leather Slides · Suede Mules · Oxfords'
  }
];

export default function HorizontalScrollAteliers() {
  const targetRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  const smoothProgress = useSpring(scrollYProgress, { damping: 20, stiffness: 80 });
  const x = useTransform(smoothProgress, [0, 1], ['1%', '-65%']);

  return (
    <section ref={targetRef} className="relative h-[300vh] bg-[var(--bg-primary)] border-b border-[var(--border-subtle)]">
      
      {/* STICKY HORIZONTAL SLIDER VIEWPORT */}
      <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden py-8">
        
        {/* Section Header */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full mb-6 flex items-end justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--badge-bg)] border border-[var(--border-subtle)] text-[var(--gold-accent)] text-[10px] font-mono-luxury uppercase tracking-widest font-bold">
              <Sparkles className="h-3 w-3" />
              <span>FEATURED DESIGNERS & BRANDS</span>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
              Curated Nigerian Designers
            </h2>
          </div>

          <div className="text-xs font-mono-luxury uppercase text-[var(--text-muted)] hidden sm:block">
            Scroll to explore designers →
          </div>
        </div>

        {/* Horizontal Motion Track */}
        <motion.div style={{ x }} className="flex gap-8 pl-4 sm:pl-8 lg:pl-16 w-max">
          {ateliers.map((atelier, idx) => (
            <div
              key={idx}
              className="relative w-[340px] sm:w-[460px] lg:w-[520px] h-[440px] sm:h-[480px] rounded-3xl surface-card p-6 sm:p-8 flex flex-col justify-between overflow-hidden group hover:border-[var(--gold-accent)]/50 transition-all duration-500 shadow-2xl shrink-0"
            >
              {/* Background Cover Image with Zoom */}
              <div className="absolute inset-0 z-0">
                <Image
                  src={atelier.image}
                  alt={atelier.name}
                  fill
                  unoptimized
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-1000 brightness-[0.35]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
              </div>

              {/* Top Meta Info */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-mono-luxury uppercase text-[var(--gold-accent)] border border-[var(--gold-accent)]/30 font-bold">
                  {atelier.tag}
                </span>

                <div className="flex items-center gap-1.5 text-zinc-300 text-xs font-mono-luxury">
                  <MapPin className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
                  <span>{atelier.location}</span>
                </div>
              </div>

              {/* Bottom Content */}
              <div className="relative z-10 space-y-3">
                <span className="text-[10px] font-mono-luxury text-zinc-400 uppercase tracking-widest">
                  0{idx + 1} / Atelier Profile
                </span>

                <h3 className="font-editorial text-3xl sm:text-4xl font-bold text-white leading-tight">
                  {atelier.name}
                </h3>

                <p className="text-xs sm:text-sm text-zinc-300 font-light leading-relaxed line-clamp-2">
                  {atelier.desc}
                </p>

                <div className="pt-2 flex items-center justify-between border-t border-white/15">
                  <span className="text-[10px] font-mono-luxury text-zinc-400">
                    {atelier.heroPieces}
                  </span>

                  <Link
                    href="/shop"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-black text-xs font-mono-luxury uppercase font-bold hover:bg-zinc-200 transition-colors shadow-lg"
                  >
                    <span>View Collection</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

            </div>
          ))}
        </motion.div>

      </div>

    </section>
  );
}
