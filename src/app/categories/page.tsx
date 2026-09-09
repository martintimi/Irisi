'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Search, Sparkles, ChevronRight,
  Layers, ArrowUpRight
} from 'lucide-react';
import {
  DEPARTMENTS,
  DepartmentKey,
  GenderKey,
  getCategoriesGroupedByDepartment,
  INITIAL_CATEGORIES
} from '@/lib/data/categories';

export default function CategoriesPage() {
  const router = useRouter();

  // Active Gender Division: 'men' | 'women'
  const [activeGender, setActiveGender] = useState<GenderKey>('men');

  // Search filter query
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Department Filter (or 'all' to show all sections)
  const [selectedDept, setSelectedDept] = useState<'all' | DepartmentKey>('all');

  // Grouped categories for active gender
  const groupedCategories = useMemo(() => {
    return getCategoriesGroupedByDepartment(activeGender);
  }, [activeGender]);

  // Flattened & filtered for search
  const filteredDepartments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const result: Array<{
      department: typeof DEPARTMENTS[0];
      items: typeof INITIAL_CATEGORIES;
    }> = [];

    DEPARTMENTS.forEach((dept) => {
      if (selectedDept !== 'all' && selectedDept !== dept.key) return;

      const items = (groupedCategories[dept.key] || []).filter((item) => {
        if (!q) return true;
        return (
          item.name.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.slug.toLowerCase().includes(q)
        );
      });

      if (items.length > 0) {
        result.push({
          department: dept,
          items,
        });
      }
    });

    return result;
  }, [groupedCategories, selectedDept, searchQuery]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0C] text-black dark:text-white pb-32">

      {/* ── TOP STICKY HEADER ───────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0A0A0C]/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
              aria-label="Go Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-sm font-black uppercase tracking-wider">
                Explore Categories
              </h1>
              <span className="text-[10px] text-neutral-500 font-medium">
                {activeGender === 'men' ? "Men's Collection" : "Women's Collection"}
              </span>
            </div>
          </div>
        </div>

        {/* ── GENDER DIVISION SWITCHER (MEN / WOMEN) ──────────── */}
        <div className="grid grid-cols-2 border-t border-neutral-100 dark:border-neutral-900 bg-neutral-50 dark:bg-neutral-950">
          <button
            type="button"
            onClick={() => setActiveGender('men')}
            className={`py-3 text-xs font-black uppercase tracking-widest transition-all cursor-pointer border-b-2 ${
              activeGender === 'men'
                ? 'border-black dark:border-white text-black dark:text-white bg-white dark:bg-[#0A0A0C]'
                : 'border-transparent text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            MEN
          </button>
          <button
            type="button"
            onClick={() => setActiveGender('women')}
            className={`py-3 text-xs font-black uppercase tracking-widest transition-all cursor-pointer border-b-2 ${
              activeGender === 'women'
                ? 'border-black dark:border-white text-black dark:text-white bg-white dark:bg-[#0A0A0C]'
                : 'border-transparent text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            WOMEN
          </button>
        </div>

        {/* ── SEARCH INPUT ────────────────────────────────────── */}
        <div className="px-4 py-2.5 border-t border-neutral-200 dark:border-neutral-800">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder={`Search ${activeGender.toUpperCase()} categories (e.g. Hoodies, Agbada, Slides)...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-black dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
            />
          </div>
        </div>

        {/* ── HORIZONTAL DEPARTMENT PILL JUMP-BAR ──────────────── */}
        <div className="flex items-center gap-1.5 px-4 py-2 overflow-x-auto no-scrollbar border-t border-neutral-100 dark:border-neutral-900">
          <button
            type="button"
            onClick={() => setSelectedDept('all')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
              selectedDept === 'all'
                ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
                : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
          >
            All
          </button>
          {DEPARTMENTS.map((dept) => (
            <button
              key={dept.key}
              type="button"
              onClick={() => setSelectedDept(dept.key)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
                selectedDept === dept.key
                  ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
                  : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              {dept.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── DEPARTMENT SECTIONS & PHOTO TILES ─────────────────── */}
      <main className="px-4 py-6 space-y-10 max-w-6xl mx-auto">
        {filteredDepartments.map(({ department, items }) => (
          <section key={department.key} className="space-y-4">
            
            {/* Section Heading */}
            <div className="flex items-end justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-400 uppercase">
                  {activeGender.toUpperCase()} CATALOG
                </span>
                <h2 className="text-lg font-black uppercase tracking-tight text-black dark:text-white mt-0.5">
                  {department.label}
                </h2>
                <p className="text-xs text-neutral-500 font-light">
                  {department.description}
                </p>
              </div>

              <Link
                href={`/shop?gender=${activeGender}&department=${department.key}`}
                className="text-xs font-bold text-neutral-500 hover:text-black dark:hover:text-white flex items-center gap-0.5 uppercase tracking-wider shrink-0"
              >
                <span>View All</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Subcategories Visual Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {items.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop?gender=${cat.gender}&category=${cat.slug}&department=${cat.department}`}
                  className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-black border border-neutral-200 dark:border-neutral-800 flex flex-col justify-end p-3.5 transition-all duration-300 hover:shadow-lg"
                >
                  {/* Photo */}
                  <Image
                    src={cat.imageUrl}
                    alt={cat.name}
                    fill
                    unoptimized
                    className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                  {/* Top Popular Pill if flagged */}
                  {cat.isPopular && (
                    <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-white text-black text-[9px] font-black uppercase tracking-wider shadow-sm z-10">
                      Popular
                    </span>
                  )}

                  {/* Bottom Text */}
                  <div className="relative z-10 space-y-1 text-left">
                    <h3 className="text-sm font-black uppercase text-white leading-tight drop-shadow-md">
                      {cat.name}
                    </h3>
                    <p className="text-[10px] text-neutral-300 line-clamp-1 drop-shadow-sm font-light">
                      {cat.subtitle}
                    </p>
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider group-hover:underline">
                        Shop Now
                      </span>
                      <span className="h-5 w-5 rounded-full bg-white/20 text-white flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
                        <ArrowUpRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}

        {filteredDepartments.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <Layers className="h-10 w-10 text-neutral-400 mx-auto" />
            <h3 className="text-base font-bold text-neutral-700 dark:text-neutral-300">
              No categories found for &ldquo;{searchQuery}&rdquo;
            </h3>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDept('all');
              }}
              className="px-5 py-2.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-wider"
            >
              Clear Search
            </button>
          </div>
        )}
      </main>

    </div>
  );
}
