'use client';

import React, { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Sparkles,
  Camera,
  ShoppingBag,
  RotateCw,
  Sun,
  User,
  ShieldCheck,
  Check,
  Layers,
  ArrowRight,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { useStore } from '@/lib/store/useStore';
import confetti from 'canvas-confetti';
import type { Real3DCanvasViewerHandle } from './Real3DCanvasViewer';

const Real3DCanvasViewer = dynamic(() => import('./Real3DCanvasViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#09090b]">
      <div className="relative h-12 w-12 mb-3">
        <div className="h-12 w-12 rounded-full border-2 border-[var(--gold-accent)] border-t-transparent animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-[var(--gold-accent)]" />
        </div>
      </div>
      <p className="text-xs font-mono-luxury uppercase tracking-widest text-white/80 font-bold">
        Loading 3D Runway Studio...
      </p>
      <span className="text-[10px] font-mono-luxury text-[var(--gold-accent)] mt-1">
        WebGL 60FPS Hardware Accelerated
      </span>
    </div>
  ),
});

interface StudioPiece {
  id: string;
  name: string;
  category: 'garment' | 'shoe' | 'accessory';
  price: number;
  atelier: string;
  modelUrl: string;
  badge: string;
  colors: Array<{ name: string; hex: string }>;
}

const STUDIO_PIECES: StudioPiece[] = [
  {
    id: 'prod-1787616646574-370',
    name: 'Trap Star Street Hoodie',
    category: 'garment',
    price: 33000,
    atelier: 'Moji Wears · Lagos',
    modelUrl: '/models/hoodie.glb',
    badge: 'Streetwear Drop',
    colors: [
      { name: 'Noir Black', hex: '#141416' },
      { name: 'Sahara Sand', hex: '#d4b996' },
      { name: 'Forest Moss', hex: '#2b3e2f' },
    ],
  },
  {
    id: 'prod-1787629836328-644',
    name: 'Black Senator For Men',
    category: 'garment',
    price: 30000,
    atelier: 'Arike Brand · Lagos',
    modelUrl: '/models/jacket.glb',
    badge: 'Master Tailored',
    colors: [
      { name: 'Midnight Navy', hex: '#1b263b' },
      { name: 'Charcoal Wool', hex: '#242426' },
      { name: 'Royal Burgundy', hex: '#541212' },
    ],
  },
  {
    id: 'prod-1788317731161-2-82',
    name: 'Blacksmartshoes2 Oxford',
    category: 'shoe',
    price: 20000,
    atelier: 'Moji Wears · Abuja',
    modelUrl: '/models/luxury-shoe.glb',
    badge: 'Artisanal Footwear',
    colors: [
      { name: 'Burnished Tan', hex: '#8b4513' },
      { name: 'Onyx Polish', hex: '#111111' },
      { name: 'Mahogany Cordovan', hex: '#4a0e17' },
    ],
  },
  {
    id: 'prod-1788608723447-344',
    name: 'Stainless Chain Neckless',
    category: 'accessory',
    price: 10000,
    atelier: 'Vee Roy Atelier',
    modelUrl: '/models/luxury-watch.glb',
    badge: 'Luxury Accessory',
    colors: [
      { name: '18K Yellow Gold', hex: '#d4af37' },
      { name: 'Rose Gold', hex: '#b76e79' },
      { name: 'Platinum Silver', hex: '#d9d9d9' },
    ],
  },
];

export default function StudioDressingStage() {
  const viewerRef = useRef<Real3DCanvasViewerHandle>(null);
  const { addToCart, setIsCartOpen } = useStore();

  const [activePieceIndex, setActivePieceIndex] = useState(0);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [showMannequin, setShowMannequin] = useState(false);
  const [mannequinGender, setMannequinGender] = useState<'female' | 'neutral'>('female');
  const [snapshotTaken, setSnapshotTaken] = useState(false);

  const currentPiece = STUDIO_PIECES[activePieceIndex];
  const activeColor = currentPiece.colors[selectedColorIndex] || currentPiece.colors[0];

  // Active Model URL: either garment or full runway mannequin
  const activeModelUrl = showMannequin
    ? mannequinGender === 'female'
      ? '/models/mannequin-female.glb'
      : '/models/mannequin-neutral.glb'
    : currentPiece.modelUrl;

  const activeModelType = showMannequin
    ? 'mannequin'
    : currentPiece.category;

  const handleCaptureSnapshot = () => {
    if (!viewerRef.current) return;
    const dataUrl = viewerRef.current.captureSnapshot();
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.download = `irisi-3d-studio-${showMannequin ? 'mannequin' : currentPiece.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
    link.href = dataUrl;
    link.click();

    setSnapshotTaken(true);
    confetti({ particleCount: 35, spread: 50, origin: { y: 0.85 } });
    setTimeout(() => setSnapshotTaken(false), 2500);
  };

  const handleAddToCart = () => {
    addToCart({
      id: currentPiece.id,
      name: currentPiece.name,
      price: currentPiece.price,
      vendorName: currentPiece.atelier,
      category: currentPiece.category,
      imageUrl: '/images/products/BlackTrapStarHoodie.jpg',
      colors: [activeColor],
    } as any);

    confetti({ particleCount: 45, spread: 60, origin: { y: 0.8 } });
    setIsCartOpen(true);
  };

  return (
    <div className="relative w-full h-[88vh] sm:h-[82vh] rounded-3xl overflow-hidden bg-gradient-to-b from-[#111116] via-[#0a0a0d] to-[#050507] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex flex-col">
      
      {/* Top Floating Bar */}
      <div className="absolute top-3 inset-x-3 z-20 flex items-center justify-between pointer-events-none">
        
        {/* Atelier Badge */}
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-black/65 backdrop-blur-xl border border-white/15 text-white shadow-xl flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--gold-accent)] animate-pulse" />
            <span className="text-[10px] font-mono-luxury font-bold uppercase tracking-wider text-white">
              3D Runway Studio
            </span>
          </div>

          {/* Model Mode Toggle: Garment vs Full Runway Mannequin */}
          <button
            type="button"
            onClick={() => setShowMannequin(!showMannequin)}
            className={`pointer-events-auto px-3 py-1.5 rounded-full backdrop-blur-xl border text-[10px] font-mono-luxury font-bold uppercase tracking-wider transition-all shadow-xl cursor-pointer ${
              showMannequin
                ? 'bg-[var(--gold-accent)] text-black border-[var(--gold-accent)] font-extrabold'
                : 'bg-black/60 text-white/80 border-white/15 hover:text-white'
            }`}
          >
            {showMannequin ? '● Runway Model' : 'Inspect Garment'}
          </button>
        </div>

        {/* Action Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          {showMannequin && (
            <div className="flex items-center gap-1 p-1 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 text-[9px] font-mono-luxury">
              <button
                type="button"
                onClick={() => setMannequinGender('female')}
                className={`px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer ${
                  mannequinGender === 'female' ? 'bg-white text-black' : 'text-white/70'
                }`}
              >
                Female
              </button>
              <button
                type="button"
                onClick={() => setMannequinGender('neutral')}
                className={`px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer ${
                  mannequinGender === 'neutral' ? 'bg-white text-black' : 'text-white/70'
                }`}
              >
                Neutral
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleCaptureSnapshot}
            className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/15 text-white shadow-xl active:scale-90 transition-transform cursor-pointer"
            title="Snap 3D Photo"
            aria-label="Take Snapshot"
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Snapshot Confirmation Toast */}
      {snapshotTaken && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/40 backdrop-blur-md text-emerald-400 font-mono-luxury text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-2xl">
          <Check className="h-3.5 w-3.5 stroke-[3]" />
          <span>Snapshot downloaded in high definition!</span>
        </div>
      )}

      {/* 3D WebGL Canvas Stage */}
      <div className="relative flex-1 w-full h-full">
        <Real3DCanvasViewer
          ref={viewerRef}
          modelUrl={activeModelUrl}
          modelType={activeModelType}
          tintColorHex={!showMannequin ? activeColor.hex : undefined}
          autoRotateDefault={true}
          showControlsBar={true}
          className="w-full h-full"
        />
      </div>

      {/* Bottom Floating Piece Selector Dock */}
      <div className="p-3 sm:p-4 bg-black/75 backdrop-blur-2xl border-t border-white/10 z-20 space-y-3">
        
        {/* Pieces Carousel Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          {STUDIO_PIECES.map((piece, idx) => {
            const isSelected = !showMannequin && activePieceIndex === idx;
            return (
              <button
                key={piece.id}
                type="button"
                onClick={() => {
                  setShowMannequin(false);
                  setActivePieceIndex(idx);
                  setSelectedColorIndex(0);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-2xl border transition-all shrink-0 cursor-pointer text-left ${
                  isSelected
                    ? 'bg-white/15 border-[var(--gold-accent)] ring-1 ring-[var(--gold-accent)] shadow-lg'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="h-8 w-8 rounded-xl bg-black/40 border border-white/15 flex items-center justify-center text-[var(--gold-accent)] shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[9px] font-mono-luxury text-[var(--gold-accent)] font-bold uppercase tracking-wider block">
                    {piece.badge}
                  </span>
                  <span className="text-xs font-editorial text-white font-medium truncate max-w-[120px] block">
                    {piece.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Piece Details & Checkout Trigger */}
        {!showMannequin && (
          <div className="flex items-center justify-between pt-1 border-t border-white/10 flex-wrap gap-2">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono-luxury uppercase text-white/50 block">
                {currentPiece.atelier}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-editorial text-xl sm:text-2xl font-bold text-[var(--gold-accent)]">
                  ₦{currentPiece.price.toLocaleString()}
                </span>
                <span className="text-[10px] font-mono-luxury text-emerald-400">
                  ● Ready for Instant Dispatch
                </span>
              </div>
            </div>

            {/* Color Swatches */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 mr-2">
                {currentPiece.colors.map((color, cIdx) => (
                  <button
                    key={`dock-color-${cIdx}`}
                    type="button"
                    onClick={() => setSelectedColorIndex(cIdx)}
                    className={`h-5 w-5 rounded-full border transition-all cursor-pointer ${
                      selectedColorIndex === cIdx
                        ? 'ring-2 ring-[var(--gold-accent)] scale-110 border-white'
                        : 'border-white/30 opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className="py-2.5 px-5 rounded-full bg-[var(--gold-accent)] hover:bg-amber-400 text-black font-mono-luxury text-xs uppercase font-bold flex items-center gap-1.5 transition-all shadow-xl active:scale-95 cursor-pointer"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>Add to Bag</span>
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
