'use client';

import React from 'react';
import Link from 'next/link';
import { Layers, ArrowRight, Home, Sparkles } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center select-none animate-fadeIn bg-white dark:bg-[#0A0A0C] text-black dark:text-white">
      <div className="max-w-md w-full space-y-6">

        {/* Clean Icon Container matching Category / Wishlist empty state */}
        <div className="h-20 w-20 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-400">
          <Layers className="h-9 w-9 stroke-[1.3]" />
        </div>

        {/* Error Code & Heading */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono tracking-widest uppercase text-amber-500 font-bold block">
            ERROR 404 · PAGE NOT FOUND
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black dark:text-white">
            Page Not Found
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-light max-w-sm mx-auto">
            The collection, category, or runway piece you are searching for is no longer active or has been moved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/shop"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-black uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all shadow-md"
          >
            <span>Explore New Drops</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          <Link
            href="/categories"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border border-neutral-300 dark:border-neutral-700 text-xs font-bold uppercase tracking-wider text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Browse Categories</span>
          </Link>
        </div>

        {/* Subtle Home Link */}
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-black dark:hover:text-white transition-colors uppercase font-medium"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Return to Home</span>
          </Link>
        </div>

        {/* Quick Department Chips */}
        <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-2.5">
            Or Jump Directly Into:
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { label: 'Men’s Drops', href: '/shop?gender=men' },
              { label: 'Women’s Edit', href: '/shop?gender=women' },
              { label: 'Native & Agbada', href: '/shop?category=agbada' },
              { label: 'Street Hoodies', href: '/shop?category=hoodies' },
              { label: 'Leather Slides', href: '/shop?category=slides' },
            ].map((chip, idx) => (
              <Link
                key={idx}
                href={chip.href}
                className="px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[10px] font-bold text-neutral-600 dark:text-neutral-300 uppercase hover:border-black dark:hover:border-white transition-colors"
              >
                {chip.label}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
