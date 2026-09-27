'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

interface CategoryCardItem {
  id: string;
  slug: string;
  name: string;
  gender: 'men' | 'women';
  department: string;
  badge: string;
  desc: string;
  image: string;
}

// ─── EXACT CATEGORY IMAGES (Matching Mobile) ───────────────────────────────

const allCategories: CategoryCardItem[] = [
  // ─── MEN'S CATEGORIES ───────────────────────────────────────────────────
  {
    id: 'men-senator',
    slug: 'senator',
    name: 'Senator Sets & Kaftans',
    gender: 'men',
    department: 'Native Wear',
    badge: 'Bespoke Native',
    desc: 'Tailored 2-piece native suits & bespoke Italian wool cuts',
    image: '/images/uploaded/senatorformen.jpeg'
  },
  {
    id: 'men-agbada',
    slug: 'agbada',
    name: 'Grand Agbada 3-Piece',
    gender: 'men',
    department: 'Ceremonial Native',
    badge: 'Royal Bespoke',
    desc: 'Embroidered 3-piece ceremonial robes & cashmere silk',
    image: '/images/uploaded/agbadaformen.jpeg'
  },
  {
    id: 'men-jalabiya',
    slug: 'jalabiya',
    name: 'Jalabiya & Tunics',
    gender: 'men',
    department: 'Native Wear',
    badge: 'Traditional Couture',
    desc: 'Comfortable embroidered Jalabiya robes & tunics',
    image: '/images/uploaded/jalabmen.jpeg'
  },
  {
    id: 'men-hoodie',
    slug: 'hoodies',
    name: 'Hoodies & Sweats',
    gender: 'men',
    department: 'Urban Streetwear',
    badge: 'Streetwear Drop',
    desc: 'Heavyweight boxy fleece hoodies & dropped shoulder cuts',
    image: '/images/uploaded/prod-1788316482065-1-489.jpg'
  },
  {
    id: 'men-denim',
    slug: 'jeans',
    name: 'Jeans & Denim',
    gender: 'men',
    department: 'Streetwear Denim',
    badge: 'Ready to Wear',
    desc: 'Baggy wide-leg jeans, cargo pants & raw denim',
    image: '/images/uploaded/pantsandcargo.jpeg'
  },
  {
    id: 'men-joggers',
    slug: 'cargo',
    name: 'Joggers & Sweatpants',
    gender: 'men',
    department: 'Bottoms & Fleece',
    badge: 'Streetwear',
    desc: 'Relaxed fleece sweatpants & street cargo joggers',
    image: '/images/uploaded/joggersformen.jpeg'
  },
  {
    id: 'men-shorts',
    slug: 'shorts',
    name: 'Shorts & Casual',
    gender: 'men',
    department: 'Bottoms & Shorts',
    badge: 'Casual Drops',
    desc: 'Casual sweat shorts, cargo shorts & trunks',
    image: '/images/uploaded/shortsformen.jpeg'
  },
  {
    id: 'men-tees',
    slug: 'tshirts',
    name: 'Graphic Tees & Tops',
    gender: 'men',
    department: 'Streetwear Apparel',
    badge: 'Graphic Drop',
    desc: 'Oversized street prints & heavyweight 240gsm cotton tees',
    image: '/images/uploaded/t-shirtsandgraphic.jpeg'
  },
  {
    id: 'men-polos',
    slug: 'polos',
    name: 'Polos & Shirts',
    gender: 'men',
    department: 'Apparel',
    badge: 'Casual Luxury',
    desc: 'Collar polo shirts & button-down short sleeves',
    image: '/images/uploaded/poloandshirt.jpeg'
  },
  {
    id: 'men-slides',
    slug: 'slides',
    name: 'Slides, Palms & Slippers',
    gender: 'men',
    department: 'Artisan Footwear',
    badge: 'Handmade Leather',
    desc: 'Handcrafted leather slides & casual comfort slippers',
    image: '/images/uploaded/sides_palm.jpeg'
  },
  {
    id: 'men-sneakers',
    slug: 'sneakers',
    name: 'Street Shoes & Sneakers',
    gender: 'men',
    department: 'Designer Footwear',
    badge: 'Casual & Drops',
    desc: 'Retro trainers, low-tops & urban street shoes',
    image: '/images/uploaded/shoefootwareformen.jpeg'
  },
  {
    id: 'men-clogs',
    slug: 'clogs',
    name: 'Crocs & Foam Clogs',
    gender: 'men',
    department: 'Comfort Footwear',
    badge: 'Everyday Ease',
    desc: 'Platform foam slip-ons, classic clogs & cushioned mules',
    image: '/images/uploaded/crocsformen.jpeg'
  },
  {
    id: 'men-caps',
    slug: 'caps',
    name: 'Caps & Beanies',
    gender: 'men',
    department: 'Accessories',
    badge: 'Street Headwear',
    desc: 'Designer baseball caps, trucker hats & street beanies',
    image: '/images/uploaded/capshatbeanies.jpeg'
  },
  {
    id: 'men-bags',
    slug: 'backpacks',
    name: 'Bags & Accessories',
    gender: 'men',
    department: 'Bags & Luggage',
    badge: 'Everyday Carry',
    desc: 'Crossbodies, chest bags & weekend leather travel bags',
    image: '/images/uploaded/leaderBags.jpeg'
  },
  {
    id: 'men-jewelry',
    slug: 'chains',
    name: 'Jewelry & Watches',
    gender: 'men',
    department: 'Luxury Accessories',
    badge: 'Fine Jewelry',
    desc: 'Micro-plated Cuban links, signet rings & timepieces',
    image: '/images/uploaded/luxerywatches.jpeg'
  },
  {
    id: 'men-eyewear',
    slug: 'sunglasses',
    name: 'Sunglasses & Eyewear',
    gender: 'men',
    department: 'Accessories',
    badge: 'Designer Frames',
    desc: 'UV-protective dark tint lenses & statement frames',
    image: '/images/uploaded/sunglassesandeyewear.jpeg'
  },

  // ─── WOMEN'S CATEGORIES ─────────────────────────────────────────────────
  {
    id: 'women-dresses',
    slug: 'dresses',
    name: 'Dresses & Gowns',
    gender: 'women',
    department: "Women's Apparel",
    badge: 'Evening Gowns',
    desc: 'Evening gowns, bodycons & elegant cocktail dresses',
    image: '/images/categories/dressesforwomen.jpeg'
  },
  {
    id: 'women-coord',
    slug: 'two-piece',
    name: 'Two-Piece Sets',
    gender: 'women',
    department: 'Contemporary Sets',
    badge: 'Ready to Wear',
    desc: 'Matching resort sets, tailored blazer co-ords & chic pant sets',
    image: '/images/categories/women_coord.jpg'
  },
  {
    id: 'women-tops',
    slug: 'tops',
    name: 'Tops & Corset',
    gender: 'women',
    department: "Women's Apparel",
    badge: 'Statement Fit',
    desc: 'Structured corsets, chic crop tops & elegant blouses',
    image: '/images/uploaded/Streetwear&topsWomen.jpeg'
  },
  {
    id: 'women-heels',
    slug: 'heels',
    name: 'Shoes & Heels',
    gender: 'women',
    department: 'Designer Footwear',
    badge: 'Head-to-Toe Glam',
    desc: 'Stiletto heels, strappy dress sandals & elegant mules',
    image: '/images/categories/women_heels.jpg'
  },
  {
    id: 'women-denim',
    slug: 'women-jeans',
    name: 'Jeans & Cargo Pants',
    gender: 'women',
    department: 'Streetwear Denim',
    badge: 'Flattering Cut',
    desc: 'High-waisted denim, wide-leg jeans & utility cargo pants',
    image: '/images/categories/jeanforwomen.jpeg'
  },
  {
    id: 'women-skirts',
    slug: 'skirts',
    name: 'Skirts & Mini Skirts',
    gender: 'women',
    department: "Women's Apparel",
    badge: 'Curated Drop',
    desc: 'Structured mini skirts, pleated midis & satin slip skirts',
    image: '/images/categories/skirtandminishirts.jpeg'
  },
  {
    id: 'women-bags',
    slug: 'handbags',
    name: 'Handbags & Totes',
    gender: 'women',
    department: 'Luxury Leather',
    badge: 'Designer Leather',
    desc: 'Shoulder bags, leather totes & evening clutches',
    image: '/images/uploaded/LeaderbagsWomen.jpeg'
  },
  {
    id: 'women-jewelry',
    slug: 'jewelry',
    name: 'Jewelry & Watches',
    gender: 'women',
    department: 'Fine Jewelry',
    badge: 'Elegant Accents',
    desc: 'Necklaces, earrings, signet rings & luxury timepieces',
    image: '/images/uploaded/WomenJewelry.jpeg'
  },
  {
    id: 'women-slides',
    slug: 'women-slides',
    name: 'Slides & Flat Slippers',
    gender: 'women',
    department: 'Artisan Footwear',
    badge: 'Everyday Comfort',
    desc: 'Casual leather slides, flat slippers & slip-ons',
    image: '/images/uploaded/footwear&slideswomen.jpeg'
  },
  {
    id: 'women-clogs',
    slug: 'clogs',
    name: 'Crocs & Foam Clogs',
    gender: 'women',
    department: 'Comfort Footwear',
    badge: 'Everyday Ease',
    desc: 'Platform foam slip-ons & cushioned mules',
    image: '/images/categories/crocs_women.jpg'
  },
  {
    id: 'women-clutches',
    slug: 'clutches',
    name: 'Clutches & Mini Bags',
    gender: 'women',
    department: 'Luxury Leather',
    badge: 'Statement Mini',
    desc: 'Evening clutches, mini crossbody bags & compact essentials',
    image: '/images/categories/women_clutches.jpg'
  },
  {
    id: 'women-eyewear',
    slug: 'women-sunglasses',
    name: 'Sunglasses & Eyewear',
    gender: 'women',
    department: 'Accessories',
    badge: 'Designer Frames',
    desc: 'Cat-eye frames, dark shades & sun protection eyewear',
    image: '/images/categories/women_sunglasses.jpg'
  },
  {
    id: 'women-watches',
    slug: 'women-watches',
    name: 'Luxury Watches',
    gender: 'women',
    department: 'Fine Jewelry',
    badge: 'Timepieces',
    desc: 'Gold, silver & leather strap timepieces',
    image: '/images/categories/women_watches.jpg'
  },
  {
    id: 'women-boubou',
    slug: 'boubou',
    name: 'Silk Boubou & Kaftans',
    gender: 'women',
    department: 'Luxury Native',
    badge: 'Royal Couture',
    desc: 'Pure silk boubous, embroidered kaftans & abayas',
    image: '/images/editorial/nigerian_female_couture.jpg'
  },
  {
    id: 'women-ankara',
    slug: 'ankara',
    name: 'Lace & Ankara Sets',
    gender: 'women',
    department: 'Bespoke Couture',
    badge: 'Handcrafted',
    desc: 'Tailored lace styles, luxury Ankara cuts & event couture',
    image: '/images/editorial/nigerian_female_model.jpg'
  }
];

export default function CategoryIndexPage() {
  // Only Men's and Women's tabs (no "All" tab)
  const [genderFilter, setGenderFilter] = useState<'men' | 'women'>('men');

  const filteredCategories = allCategories.filter((cat) => cat.gender === genderFilter);

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[var(--border-subtle)] pb-8 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--badge-bg)] border border-[var(--border-subtle)] text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-3">
              <Sparkles className="h-3 w-3 text-[var(--gold-accent)]" />
              <span>Verified Nigerian Designers · Escrow Secured</span>
            </div>
            <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-medium text-[var(--text-primary)] leading-tight">
              Shop by Category
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-2xl font-light">
              Explore bespoke native attire, contemporary streetwear, handcrafted artisan footwear, and fine accessories curated across verified independent brands.
            </p>
          </div>

          {/* Department Filter Tabs: Men's vs Women's (No "All" tab) */}
          <div className="flex items-center rounded-2xl p-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm self-start md:self-auto">
            <button
              onClick={() => setGenderFilter('men')}
              className={`px-5 py-2.5 rounded-xl text-xs font-mono-luxury font-bold uppercase tracking-wider transition-all cursor-pointer ${
                genderFilter === 'men'
                  ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Men&apos;s ({allCategories.filter(c => c.gender === 'men').length})
            </button>
            <button
              onClick={() => setGenderFilter('women')}
              className={`px-5 py-2.5 rounded-xl text-xs font-mono-luxury font-bold uppercase tracking-wider transition-all cursor-pointer ${
                genderFilter === 'women'
                  ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Women&apos;s ({allCategories.filter(c => c.gender === 'women').length})
            </button>
          </div>
        </div>

        {/* Visual Category Grid with Mobile-Matched Images */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group relative rounded-3xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-md hover:border-[var(--gold-accent)] hover:shadow-2xl transition-all duration-500 flex flex-col h-[340px]"
            >
              {/* Background Image Container */}
              <div className="relative w-full h-full overflow-hidden bg-black">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  unoptimized
                  className="object-cover object-center group-hover:scale-108 transition-transform duration-700 ease-out"
                />

                {/* Rich Cinematic Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/25 group-hover:via-black/45 transition-colors duration-500" />

                {/* Top Badge Strip */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                  <span className="px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--gold-accent)] border border-[var(--gold-accent)]/30 font-bold shadow-sm">
                    {cat.badge}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[9px] font-mono-luxury text-white/80 uppercase tracking-widest border border-white/10">
                    {cat.gender === 'men' ? "Men's" : "Women's"}
                  </span>
                </div>

                {/* Bottom Content Card */}
                <div className="absolute bottom-0 inset-x-0 p-5 z-10 space-y-1.5">
                  <span className="text-[10px] font-mono-luxury uppercase tracking-wider text-zinc-300 font-bold block">
                    {cat.department}
                  </span>

                  <h3 className="font-editorial text-xl font-bold text-white group-hover:text-[var(--gold-accent)] transition-colors leading-tight drop-shadow-sm">
                    {cat.name}
                  </h3>

                  <p className="text-[11px] text-zinc-300 font-mono-luxury line-clamp-1">
                    {cat.desc}
                  </p>

                  <div className="pt-2 flex items-center gap-1.5 text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--gold-accent)] font-bold group-hover:translate-x-1 transition-transform">
                    <span>Explore Collection</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom Trust Banner */}
        <div className="mt-16 rounded-3xl p-6 sm:p-8 border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--gold-accent)]/10 text-[var(--gold-accent)] border border-[var(--gold-accent)]/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[var(--text-primary)]">
                100% Escrow Protection on Every Order
              </h4>
              <p className="text-xs text-[var(--text-muted)]">
                Your payment is held safely until your package arrives and meets quality standards.
              </p>
            </div>
          </div>

          <Link
            href="/shop"
            className="shrink-0 px-6 py-3 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase tracking-wider text-xs font-bold hover:opacity-90 transition-all shadow-md flex items-center gap-2"
          >
            <span>Browse All Drops</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

      </div>
    </main>
  );
}
