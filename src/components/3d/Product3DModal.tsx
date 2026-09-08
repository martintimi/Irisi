'use client';

import React, { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { X, Sparkles, ShoppingBag, Share2, Camera, Check, ShieldCheck, ZoomIn } from 'lucide-react';
import { useStore } from '@/lib/store/useStore';
import confetti from 'canvas-confetti';
import type { Real3DCanvasViewerHandle } from './Real3DCanvasViewer';

// Dynamic import with SSR false for Three.js WebGL canvas
const Real3DCanvasViewer = dynamic(() => import('./Real3DCanvasViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black/90">
      <div className="h-10 w-10 rounded-full border-2 border-[var(--gold-accent)] border-t-transparent animate-spin mb-2" />
      <span className="text-[10px] font-mono-luxury uppercase tracking-widest text-white/70">
        Initializing WebGL Engine...
      </span>
    </div>
  ),
});

interface Product3DModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    price: number;
    vendorName?: string;
    category?: string;
    modelUrl?: string;
    colors?: Array<{ name: string; hex: string }>;
  };
}

export default function Product3DModal({ isOpen, onClose, product }: Product3DModalProps) {
  const viewerRef = useRef<Real3DCanvasViewerHandle>(null);
  const { addToCart, setIsCartOpen } = useStore();

  const [selectedColor, setSelectedColor] = useState<{ name: string; hex: string }>(
    product.colors?.[0] || { name: 'Noir Black', hex: '#111111' }
  );
  const [snapshotTaken, setSnapshotTaken] = useState(false);

  if (!isOpen) return null;

  // Resolve 3D asset URL based on product category or explicit modelUrl
  const resolvedModelUrl =
    product.modelUrl ||
    (product.category === 'footwear'
      ? '/models/luxury-shoe.glb'
      : product.category === 'accessories'
      ? '/models/luxury-watch.glb'
      : product.name.toLowerCase().includes('jacket') || product.name.toLowerCase().includes('blazer')
      ? '/models/jacket.glb'
      : '/models/hoodie.glb');

  const modelType =
    product.category === 'footwear'
      ? 'shoe'
      : product.category === 'accessories'
      ? 'accessory'
      : 'garment';

  const handleCaptureSnapshot = () => {
    if (!viewerRef.current) return;
    const dataUrl = viewerRef.current.captureSnapshot();
    if (!dataUrl) return;

    // Create download link
    const link = document.createElement('a');
    link.download = `irisi-3d-${product.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
    link.href = dataUrl;
    link.click();

    setSnapshotTaken(true);
    confetti({ particleCount: 30, spread: 45, origin: { y: 0.85 } });
    setTimeout(() => setSnapshotTaken(false), 2500);
  };

  const handleAdd = () => {
    addToCart(product as any);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl animate-fadeIn p-2 sm:p-4">
      <div className="relative w-full max-w-4xl h-[92vh] sm:h-[86vh] bg-[#0c0c0e] rounded-3xl border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between p-4 px-5 border-b border-white/10 bg-black/40 backdrop-blur-md z-10">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-[var(--gold-accent)]/15 border border-[var(--gold-accent)]/30 text-[9px] font-mono-luxury font-bold uppercase text-[var(--gold-accent)] flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5" />
                <span>Real 3D Interactive WebGL</span>
              </span>
              <span className="text-[10px] font-mono-luxury text-white/50 uppercase tracking-widest hidden sm:inline">
                {product.vendorName || 'Ìrísí Atelier'}
              </span>
            </div>
            <h2 className="font-editorial text-lg sm:text-xl font-normal text-white truncate max-w-[280px] sm:max-w-md">
              {product.name}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCaptureSnapshot}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white/90 transition-all cursor-pointer shadow-md"
              title="Save 3D Snapshot"
              aria-label="Save 3D Snapshot"
            >
              <Camera className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all cursor-pointer shadow-md active:scale-90"
              aria-label="Close 3D View"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 3D WebGL Viewport Container */}
        <div className="relative flex-1 w-full overflow-hidden bg-gradient-to-b from-[#0e0e12] to-[#08080a]">
          <Real3DCanvasViewer
            ref={viewerRef}
            modelUrl={resolvedModelUrl}
            modelType={modelType}
            tintColorHex={selectedColor.hex}
            autoRotateDefault={true}
            showControlsBar={true}
            className="w-full h-full"
          />

          {/* Snapshot Toast */}
          {snapshotTaken && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/40 backdrop-blur-md text-emerald-400 font-mono-luxury text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <Check className="h-3.5 w-3.5 stroke-[3]" />
              <span>3D Snapshot Saved to Downloads!</span>
            </div>
          )}
        </div>

        {/* Bottom Interactive Controls Drawer */}
        <div className="p-4 px-5 bg-black/60 border-t border-white/10 backdrop-blur-md z-10 space-y-3">
          
          {/* Colorway Switcher (If options available) */}
          {product.colors && product.colors.length > 1 && (
            <div className="flex items-center justify-between text-xs font-mono-luxury">
              <span className="text-white/60 text-[11px] uppercase font-bold">
                Finish: <strong className="text-white">{selectedColor.name}</strong>
              </span>

              <div className="flex items-center gap-2">
                {product.colors.map((c, i) => (
                  <button
                    key={`3d-color-${i}`}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`h-6 w-6 rounded-full border transition-all cursor-pointer ${
                      selectedColor.hex === c.hex
                        ? 'ring-2 ring-[var(--gold-accent)] scale-110 border-white'
                        : 'border-white/30 opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Bottom Row: Price & Action */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div>
              <span className="text-[9px] font-mono-luxury uppercase tracking-widest text-white/50 block">
                Atelier Direct
              </span>
              <div className="font-editorial text-2xl font-bold text-[var(--gold-accent)]">
                ₦{Number(product.price || 0).toLocaleString()}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCaptureSnapshot}
                className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-white/20 hover:border-white/40 text-white text-xs font-mono-luxury uppercase font-bold transition-all cursor-pointer"
              >
                <Camera className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
                <span>Snap Look</span>
              </button>

              <button
                type="button"
                onClick={handleAdd}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-mono-luxury uppercase font-bold transition-all shadow-xl active:scale-95 cursor-pointer"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Add to Bag</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
