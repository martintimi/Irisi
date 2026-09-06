'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, User, ShoppingBag, ShieldCheck, Ruler, Camera, Check, Sparkles } from 'lucide-react';
import { useStore } from '@/lib/store/useStore';
import confetti from 'canvas-confetti';

interface ModelTryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    price: number;
    vendorName?: string;
    category?: string;
    imageUrl?: string;
  };
}

export default function ModelTryOnModal({ isOpen, onClose, product }: ModelTryOnModalProps) {
  const { addToCart, setIsCartOpen, bodyProfile } = useStore();

  const [activeGender, setActiveGender] = useState<'male' | 'female'>('male');
  const [selectedSize, setSelectedSize] = useState('L');
  const [snapshotSuccess, setSnapshotSuccess] = useState(false);

  if (!isOpen) return null;

  const n = (product.name || '').toLowerCase();
  const c = (product.category || '').toLowerCase();

  // Pick best matched high-resolution editorial model photo based on product type
  const maleModelImage =
    n.includes('agbada') || c.includes('agbada')
      ? '/images/editorial/nigerian_male_couture.jpg'
      : n.includes('senator') || n.includes('kaftan')
      ? '/images/editorial/male_senator.jpg'
      : n.includes('hoodie') || n.includes('jacket') || c === 'tops'
      ? '/images/editorial/male_hoodie.jpg'
      : n.includes('street') || n.includes('pant') || n.includes('jean')
      ? '/images/editorial/modern_male_streetwear.jpg'
      : '/images/editorial/male_shirt.jpg';

  const femaleModelImage =
    n.includes('agbada') || c.includes('agbada') || n.includes('dress') || n.includes('boubou')
      ? '/images/editorial/nigerian_female_couture.jpg'
      : n.includes('gown') || n.includes('slip')
      ? '/images/editorial/female_dress.jpg'
      : n.includes('hoodie') || c === 'tops'
      ? '/images/editorial/female_hoodie.jpg'
      : n.includes('street')
      ? '/images/editorial/modern_female_streetwear.jpg'
      : '/images/editorial/female_shirt.jpg';

  const activeImage = activeGender === 'male' ? maleModelImage : femaleModelImage;
  const modelName = activeGender === 'male' ? 'Timi (6\'1" · 185cm)' : 'Zainab (5\'10" · 178cm)';

  const handleAdd = () => {
    addToCart(product as any, selectedSize);
    confetti({ particleCount: 40, spread: 55, origin: { y: 0.8 } });
    setIsCartOpen(true);
    onClose();
  };

  const handleSnapshot = () => {
    const link = document.createElement('a');
    link.href = activeImage;
    link.download = `irisi-model-fit-${product.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.jpg`;
    link.click();

    setSnapshotSuccess(true);
    confetti({ particleCount: 25, spread: 45, origin: { y: 0.85 } });
    setTimeout(() => setSnapshotSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl animate-fadeIn p-2 sm:p-4">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-[#0c0c0f] rounded-3xl border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.85)] flex flex-col md:flex-row overflow-hidden">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/60 hover:bg-black border border-white/20 text-white shadow-xl active:scale-90 transition-transform cursor-pointer"
          aria-label="Close Model Fit View"
        >
          <X className="h-4 w-4" />
        </button>

        {/* LEFT: REAL MODEL EDITORIAL DISPLAY */}
        <div className="relative w-full md:w-1/2 h-[420px] sm:h-[500px] md:h-auto bg-black overflow-hidden group">
          <Image
            src={activeImage}
            alt={`${modelName} wearing ${product.name}`}
            fill
            unoptimized
            priority
            className="object-cover object-top"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/20 pointer-events-none" />

          {/* Model Gender Switcher */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-1 p-1 rounded-full bg-black/70 backdrop-blur-xl border border-white/20">
            <button
              type="button"
              onClick={() => setActiveGender('male')}
              className={`px-3 py-1 rounded-full text-[10px] font-mono-luxury font-bold transition-all ${
                activeGender === 'male' ? 'bg-[var(--gold-accent)] text-black' : 'text-white/70'
              }`}
            >
              Male Model
            </button>
            <button
              type="button"
              onClick={() => setActiveGender('female')}
              className={`px-3 py-1 rounded-full text-[10px] font-mono-luxury font-bold transition-all ${
                activeGender === 'female' ? 'bg-[var(--gold-accent)] text-black' : 'text-white/70'
              }`}
            >
              Female Model
            </button>
          </div>

          {/* Model HUD Card on Image */}
          <div className="absolute bottom-4 left-4 right-4 z-20 p-3 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/15 text-white space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono-luxury font-bold text-white uppercase tracking-wider">
                {modelName}
              </span>
              <span className="text-[9px] font-mono-luxury font-bold text-[var(--gold-accent)] bg-[var(--gold-accent)]/15 px-2 py-0.5 rounded-md border border-[var(--gold-accent)]/30">
                Wearing Size {activeGender === 'male' ? 'L' : 'M'}
              </span>
            </div>
            <p className="text-[10px] font-mono-luxury text-white/60">
              Photorealistic Runway Silhouette &amp; Drape Check
            </p>
          </div>

          {/* Snapshot Button */}
          <button
            type="button"
            onClick={handleSnapshot}
            className="absolute bottom-4 right-4 z-30 p-2.5 rounded-full bg-black/60 hover:bg-black border border-white/20 text-white shadow-xl cursor-pointer"
            title="Save Photo"
            aria-label="Save Photo"
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>

        {/* RIGHT: SIZING INTELLIGENCE & ADD TO BAG */}
        <div className="w-full md:w-1/2 p-5 sm:p-6 flex flex-col justify-between space-y-5 bg-[#0e0e12]">
          
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono-luxury uppercase tracking-widest text-[var(--gold-accent)] font-bold block">
                {product.vendorName || 'Ìrísí Verified Atelier'}
              </span>
              <h2 className="font-editorial text-2xl font-bold text-white leading-snug">
                {product.name}
              </h2>
            </div>

            <div className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--gold-accent)]">
              ₦{Number(product.price || 0).toLocaleString()}
            </div>

            {/* Sizing Fit Feedback */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono-luxury text-[var(--gold-accent)] font-bold uppercase">
                <Ruler className="h-4 w-4" />
                <span>Runway Fit Drape</span>
              </div>
              <p className="text-xs text-white/80 font-light leading-relaxed">
                Engineered for natural posture and zero shoulder pull. Tailored cleanly with standard Nigerian bespoke proportions.
              </p>
              <div className="text-[10px] font-mono-luxury text-emerald-400 border-t border-white/10 pt-2 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>100% Fit Guarantee or Free Atelier Alteration</span>
              </div>
            </div>

            {/* Size Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono-luxury">
                <span className="text-white/60 uppercase font-bold">Choose Size:</span>
                <span className="text-[var(--gold-accent)] font-bold">{selectedSize}</span>
              </div>
              <div className="flex items-center gap-2 font-mono-luxury text-xs">
                {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                  <button
                    key={`sz-btn-${sz}`}
                    type="button"
                    onClick={() => setSelectedSize(sz)}
                    className={`min-w-[42px] py-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      selectedSize === sz
                        ? 'bg-[var(--gold-accent)] text-black border-[var(--gold-accent)] font-black shadow-md'
                        : 'bg-white/5 border-white/15 text-white hover:border-white/30'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Add to Bag Action */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleAdd}
              className="w-full py-3.5 rounded-2xl bg-[var(--gold-accent)] hover:bg-amber-400 text-black font-mono-luxury uppercase text-xs font-black tracking-widest transition-all shadow-[0_6px_20px_rgba(196,151,46,0.4)] flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
            >
              <ShoppingBag className="h-4 w-4 stroke-[2.5]" />
              <span>Add to Bag · ₦{Number(product.price || 0).toLocaleString()}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
