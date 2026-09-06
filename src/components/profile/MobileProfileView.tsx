'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/lib/store/useStore';
import {
  User, Sparkles, Bookmark, Package, Store, MapPin,
  Phone, ShieldCheck, LogOut, Check, ChevronRight,
  ArrowRight, ShoppingBag, ArrowLeft, Ruler, Truck, Loader2,
  Settings, KeyRound, HelpCircle, Star, Lightbulb, ExternalLink, Eye
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MobileQuickBuyDrawer from '@/components/mobile/MobileQuickBuyDrawer';
import LuxuryLoader from '@/components/common/LuxuryLoader';
import ChangePasswordModal from '@/components/profile/ChangePasswordModal';
import FaqHelpModal from '@/components/profile/FaqHelpModal';
import RateAppModal from '@/components/profile/RateAppModal';
import HelpImproveModal from '@/components/profile/HelpImproveModal';

export default function MobileProfileView() {
  const router = useRouter();
  const {
    userAuth,
    setUserAuth,
    bodyProfile,
    setBodyProfile,
    vault,
    userOrders,
    followedVendors,
    toggleVaultItem,
    setOutfitItem,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'vault' | 'orders' | 'brands' | 'settings'>('profile');
  const [quickBuyProduct, setQuickBuyProduct] = useState<any>(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState(bodyProfile.deliveryAddress || '');
  const [city, setCity] = useState(bodyProfile.city || '');
  const [state, setState] = useState(bodyProfile.state || 'Lagos');
  const [phone, setPhone] = useState(bodyProfile.phone || userAuth.phone || '');

  // Settings & Patron Support Modals State
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [isRateAppOpen, setIsRateAppOpen] = useState(false);
  const [isHelpImproveOpen, setIsHelpImproveOpen] = useState(false);

  const [liveOrders, setLiveOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Fetch live orders from PostgreSQL database
  useEffect(() => {
    async function loadOrders() {
      setIsLoadingOrders(true);
      try {
        const userEmail = userAuth?.email || bodyProfile?.email || '';
        const userPhone = userAuth?.phone || bodyProfile?.phone || '';
        
        let fetched: any[] = [];
        if (userEmail) {
          const res = await fetch(`/api/orders?email=${encodeURIComponent(userEmail)}`);
          const data = await res.json();
          if (data.success && Array.isArray(data.orders)) {
            fetched = data.orders;
          }
        }
        
        // If 0 orders found with email query or no email, fetch recent orders and filter by phone or email
        if (fetched.length === 0) {
          const resAll = await fetch('/api/orders');
          const dataAll = await resAll.json();
          if (dataAll.success && Array.isArray(dataAll.orders)) {
            if (userEmail || userPhone) {
              const matched = dataAll.orders.filter((o: any) => {
                const oEmail = (o.customerEmail || '').toLowerCase();
                const oPhone = (o.customerPhone || '').replace(/\D/g, '');
                const cleanPhone = userPhone.replace(/\D/g, '');
                return (userEmail && oEmail.includes(userEmail.toLowerCase())) ||
                       (cleanPhone && cleanPhone.length > 5 && oPhone.includes(cleanPhone));
              });
              fetched = matched.length > 0 ? matched : dataAll.orders.slice(0, 10);
            } else {
              fetched = dataAll.orders.slice(0, 10);
            }
          }
        }

        setLiveOrders(fetched);
      } catch (err) {
        console.error('Failed to load orders on mobile profile:', err);
      } finally {
        setIsLoadingOrders(false);
      }
    }

    loadOrders();
  }, [userAuth?.email, userAuth?.phone, bodyProfile?.email, bodyProfile?.phone]);

  // Combine live orders with store orders (deduplicated)
  const effectiveOrders = useMemo(() => {
    const map = new Map<string, any>();
    userOrders.forEach((o) => {
      if (o.orderNumber || o.id) map.set(o.orderNumber || o.id, o);
    });
    liveOrders.forEach((o) => {
      if (o.orderNumber || o.id) map.set(o.orderNumber || o.id, o);
    });
    return Array.from(map.values());
  }, [userOrders, liveOrders]);

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setBodyProfile({
      deliveryAddress,
      city,
      state,
      phone,
    });
    setIsEditingAddress(false);
  };

  const handleLogout = () => {
    setUserAuth({
      isLoggedIn: false,
      email: '',
      name: '',
      phone: '',
      gender: 'male',
      userType: 'shopper',
    });
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pb-36 select-none animate-fadeIn">
      {/* 1. TOP APP BAR */}
      <div className="sticky top-0 z-30 bg-[var(--bg-primary)]/90 backdrop-blur-xl border-b border-[var(--border-subtle)] p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-full surface-card border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="font-editorial text-xl font-bold text-[var(--text-primary)] leading-tight">
              Patron Profile
            </h1>
            <span className="text-[10px] font-mono-luxury text-[var(--gold-accent)] font-bold">
              Account & Sizing Profile
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`p-2 rounded-full surface-card border transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'border-[var(--gold-accent)] text-[var(--gold-accent)] bg-[var(--gold-subtle)]'
                : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white'
            }`}
            title="Settings & Support"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-full surface-card border border-[var(--border-subtle)] text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-5">
        
        {/* 2. PATRON IDENTITY CARD */}
        <div className="p-5 rounded-3xl surface-card border border-[var(--border-subtle)] shadow-sm space-y-4">
          <div className="flex items-center gap-3.5">
            <div className="relative h-16 w-16 rounded-full overflow-hidden bg-[var(--gold-subtle)] border-2 border-[var(--gold-accent)] flex items-center justify-center text-xl font-bold text-[var(--gold-accent)] font-mono-luxury shrink-0">
              {userAuth.name ? userAuth.name.charAt(0).toUpperCase() : 'Ì'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="font-editorial text-xl font-bold text-[var(--text-primary)] truncate">
                  {userAuth.name || bodyProfile.name || 'Ìrísí Patron'}
                </h2>
                <ShieldCheck className="h-4 w-4 text-[var(--gold-accent)] shrink-0" />
              </div>
              <p className="text-[11px] font-mono-luxury text-[var(--text-secondary)] truncate">
                {userAuth.email || 'Verified Patron'}
              </p>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-[var(--gold-subtle)] text-[var(--gold-accent)] border border-[var(--gold-accent)]/30 text-[9px] font-mono-luxury font-bold uppercase">
                Ìrísí Black Patron
              </span>
            </div>
          </div>

          {/* Sizing Profile Status Pill */}
          <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-[var(--gold-subtle)] text-[var(--gold-accent)] flex items-center justify-center">
                <Ruler className="h-4 w-4" />
              </div>
              <div>
                <span className="font-bold text-xs font-mono-luxury text-[var(--text-primary)] block">
                  Saved Sizing Profile
                </span>
                <span className="text-[10px] font-mono-luxury text-[var(--text-secondary)]">
                  Preferred Size: {bodyProfile.preferredSize || 'M'} · {bodyProfile.gender || 'Men'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className="px-3.5 py-1.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase text-[10px] font-bold shadow-md active:scale-95 transition-transform cursor-pointer"
            >
              View Sizes
            </button>
          </div>
        </div>

        {/* 3. NAVIGATION PILLS */}
        <div className="grid grid-cols-5 gap-1 p-1 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs font-mono-luxury">
          {[
            { id: 'profile', label: 'My Sizes', icon: Ruler },
            { id: 'vault', label: `Vault (${vault.length})`, icon: Bookmark },
            { id: 'orders', label: `Orders (${effectiveOrders.length})`, icon: Package },
            { id: 'brands', label: 'Ateliers', icon: Store },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isChosen = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 rounded-xl font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  isChosen
                    ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-md'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="text-[9px] uppercase tracking-wider truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 4. TAB CONTENTS */}
        
        {/* Tab 1: Sizing Profile & Address */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            
            {/* Preferred Size & Measurements */}
            <div className="p-4 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-3">
              <span className="text-xs font-mono-luxury uppercase font-bold text-[var(--text-primary)] block">
                Preferred Garment Size:
              </span>
              <div className="grid grid-cols-5 gap-2">
                {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => {
                  const isSel = (bodyProfile.preferredSize || 'M') === sz;
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setBodyProfile({ preferredSize: sz as 'S' | 'M' | 'L' | 'XL' | 'XXL' })}
                      className={`py-2.5 rounded-2xl text-xs font-mono-luxury font-bold uppercase transition-all cursor-pointer ${
                        isSel
                          ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-md'
                          : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Delivery Address Card */}
            <div className="p-5 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono-luxury uppercase text-[var(--gold-accent)] font-bold">
                  Default Delivery Location:
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingAddress(!isEditingAddress)}
                  className="text-xs font-mono-luxury text-[var(--gold-accent)] font-bold uppercase underline"
                >
                  {isEditingAddress ? 'Cancel' : 'Edit Address'}
                </button>
              </div>

              {isEditingAddress ? (
                <form onSubmit={handleSaveAddress} className="space-y-3 text-xs font-mono-luxury">
                  <div>
                    <label className="block text-[var(--text-secondary)] uppercase mb-1 font-bold">
                      Phone Number (For Courier)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="08012345678"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--text-secondary)] uppercase mb-1 font-bold">
                      City / Area
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City or Town"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--text-secondary)] uppercase mb-1 font-bold">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="House / flat number, street name, and landmark"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-[var(--gold-accent)] text-black font-mono-luxury uppercase text-xs font-bold shadow-md"
                  >
                    Save Delivery Details
                  </button>
                </form>
              ) : (
                <div className="space-y-1.5 text-xs font-mono-luxury text-[var(--text-secondary)]">
                  <div className="flex items-center gap-1.5 text-[var(--text-primary)] font-bold">
                    <MapPin className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
                    <span>{bodyProfile.deliveryAddress || 'No default street address saved.'}</span>
                  </div>
                  <div className="text-[11px] pl-5">
                    {bodyProfile.city ? `${bodyProfile.city}, ` : ''}{bodyProfile.state || 'Lagos State'}
                  </div>
                  {bodyProfile.phone && (
                    <div className="flex items-center gap-1.5 text-[11px] pl-5 text-[var(--text-muted)]">
                      <Phone className="h-3 w-3" />
                      <span>{bodyProfile.phone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Vendor Portal Link if user is vendor */}
            {userAuth.userType === 'vendor' && (
              <Link
                href="/vendor"
                className="block p-4 rounded-3xl bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/50 text-[var(--gold-accent)] font-mono-luxury uppercase text-xs font-bold text-center shadow-lg"
              >
                <span>Go to Designer Vendor Portal →</span>
              </Link>
            )}

          </div>
        )}

        {/* Tab 2: Vault Saved Items */}
        {activeTab === 'vault' && (
          <div className="space-y-4">
            {vault.length === 0 ? (
              <div className="p-10 rounded-3xl surface-card text-center space-y-3 border border-[var(--border-subtle)]">
                <Bookmark className="h-8 w-8 mx-auto text-[var(--gold-accent)] opacity-60" />
                <h3 className="font-editorial text-lg font-bold text-[var(--text-primary)]">Your Vault is Empty</h3>
                <p className="text-xs font-mono-luxury text-[var(--text-secondary)]">
                  Save pieces from the feed or boutique drops to preview them here anytime.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {vault.map((product) => (
                  <div
                    key={product.id}
                    className="p-3 rounded-2xl surface-card border border-[var(--border-subtle)] space-y-2 shadow-sm"
                  >
                    <div className="relative aspect-[4/5] w-full rounded-xl overflow-hidden bg-black/40">
                      <Image
                        src={product.imageUrl || '/images/products/BlackTrapStarHoodie.jpg'}
                        alt={product.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[var(--text-primary)] truncate">{product.name}</h4>
                      <div className="font-mono-luxury text-xs font-bold text-[var(--gold-accent)]">
                        ₦{Number(product.price || 0).toLocaleString()}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <Link
                        href={`/shop/${product.id}`}
                        className="py-1.5 px-1 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[9px] font-mono-luxury uppercase font-bold text-[var(--text-primary)] hover:text-[var(--gold-accent)] flex items-center justify-center gap-0.5 transition-colors"
                      >
                        <Eye className="h-2.5 w-2.5" />
                        <span>View</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => setQuickBuyProduct(product)}
                        className="py-1.5 px-1 rounded-lg bg-[var(--gold-accent)] text-black text-[9px] font-mono-luxury uppercase font-bold flex items-center justify-center gap-0.5"
                      >
                        <span>Buy</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Order History */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {isLoadingOrders && effectiveOrders.length === 0 ? (
              <LuxuryLoader
                fullScreen={false}
                label="Ì R Í S Í"
                sublabel="Loading Your Live Orders..."
              />
            ) : effectiveOrders.length === 0 ? (
              <div className="p-10 rounded-3xl surface-card text-center space-y-3 border border-[var(--border-subtle)]">
                <Package className="h-8 w-8 mx-auto text-[var(--gold-accent)] opacity-60" />
                <h3 className="font-editorial text-lg font-bold text-[var(--text-primary)]">No Active Orders</h3>
                <p className="text-xs font-mono-luxury text-[var(--text-secondary)]">
                  Once you order from Nigerian ateliers, track live waybills and courier dispatch here.
                </p>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase font-bold shadow-md mt-1"
                >
                  <span>Shop Catalog</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {effectiveOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-3xl surface-card border border-[var(--border-subtle)] hover:border-[var(--gold-accent)]/50 transition-all shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
                      <div>
                        <span className="font-editorial text-sm font-bold text-[var(--gold-accent)] block">
                          {order.orderNumber || order.id}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono-luxury">
                          {order.date || (order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent')}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono-luxury font-bold uppercase capitalize">
                        {(order.status || 'Escrow Secured').replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Order items preview */}
                    {order.items && order.items.length > 0 && (
                      <div className="space-y-2 py-1">
                        {order.items.slice(0, 3).map((item: any, itemIdx: number) => (
                          <div key={itemIdx} className="flex items-center gap-2.5">
                            <div className="relative h-11 w-11 rounded-lg overflow-hidden bg-black shrink-0 border border-[var(--border-subtle)]">
                              <Image
                                src={item.imageUrl || '/images/products/BlackTrapStarHoodie.jpg'}
                                alt={item.productName || 'Garment'}
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h5 className="text-xs font-bold text-[var(--text-primary)] truncate">
                                {item.productName || item.name || 'Garment Piece'}
                              </h5>
                              <span className="text-[10px] font-mono-luxury text-[var(--text-secondary)]">
                                {item.size ? `Size: ${item.size} · ` : ''}Qty: {item.quantity || 1} · ₦{Number(item.price || 0).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)] text-xs font-mono-luxury">
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] uppercase block">Total</span>
                        <span className="font-bold text-[var(--text-primary)]">₦{Number(order.totalAmount || 0).toLocaleString()}</span>
                      </div>

                      {order.status?.toLowerCase() !== 'delivered' && (order.trackingStage ?? 1) < 4 ? (
                        <Link
                          href={`/track-order?orderNumber=${encodeURIComponent(order.orderNumber || order.id)}`}
                          className="px-3 py-1.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-[10px] font-mono-luxury uppercase font-bold flex items-center gap-1 shadow-md active:scale-95 transition-transform"
                        >
                          <Truck className="h-3 w-3" />
                          <span>Track Order</span>
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono-luxury font-bold uppercase flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          <span>Delivered</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Followed Ateliers */}
        {activeTab === 'brands' && (
          <div className="space-y-4">
            {followedVendors.length === 0 ? (
              <div className="p-10 rounded-3xl surface-card text-center space-y-3 border border-[var(--border-subtle)]">
                <Store className="h-8 w-8 mx-auto text-[var(--gold-accent)] opacity-60" />
                <h3 className="font-editorial text-lg font-bold text-[var(--text-primary)]">No Followed Brands</h3>
                <p className="text-xs font-mono-luxury text-[var(--text-secondary)]">
                  Follow designers from the home feed or lookbooks to get notified of new ready-to-wear drops.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {followedVendors.map((vId) => (
                  <Link
                    key={vId}
                    href={`/brand/${encodeURIComponent(vId)}`}
                    className="flex items-center justify-between p-3.5 rounded-2xl surface-card border border-[var(--border-subtle)] hover:border-[var(--gold-accent)] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/40 text-[var(--gold-accent)] flex items-center justify-center font-bold text-xs font-mono-luxury">
                        <Store className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-bold text-xs font-mono-luxury text-[var(--text-primary)] block capitalize">
                          {vId.replace(/-/g, ' ')}
                        </span>
                        <span className="text-[9px] font-mono-luxury text-emerald-400 font-bold uppercase">
                          Verified Atelier
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Settings & Support */}
        {activeTab === 'settings' && (
          <div className="space-y-4 animate-fadeIn">
            
            {/* Patron Security & Auth Card */}
            <div className="p-4 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-3">
              <span className="text-[10px] font-mono-luxury uppercase text-[var(--gold-accent)] font-bold block tracking-wider">
                Security & Authentication
              </span>

              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(true)}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--gold-accent)]/50 active:scale-[0.99] transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/30 text-[var(--gold-accent)] flex items-center justify-center shrink-0">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[var(--text-primary)]">
                      Change Password
                    </h4>
                    <p className="text-[10px] font-mono-luxury text-[var(--text-secondary)]">
                      Update your Supabase authentication password
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
              </button>
            </div>

            {/* Help & Support Card */}
            <div className="p-4 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-3">
              <span className="text-[10px] font-mono-luxury uppercase text-[var(--gold-accent)] font-bold block tracking-wider">
                Patron Care & Knowledge Base
              </span>

              <button
                type="button"
                onClick={() => setIsFaqOpen(true)}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--gold-accent)]/50 active:scale-[0.99] transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                    <HelpCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[var(--text-primary)]">
                      Need Help / FAQ Topics
                    </h4>
                    <p className="text-[10px] font-mono-luxury text-[var(--text-secondary)]">
                      Escrow protection, nationwide dispatch & verified sizing
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
              </button>

              <a
                href="https://wa.me/2348120000000?text=Hello%20%C3%8Cr%C3%ADs%C3%AD%20Concierge,%20I%20need%20assistance%20with%20my%20order"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-emerald-500/50 active:scale-[0.99] transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[var(--text-primary)]">
                      WhatsApp Luxury Concierge
                    </h4>
                    <p className="text-[10px] font-mono-luxury text-[var(--text-secondary)]">
                      Instant direct chat with bespoke fashion specialists
                    </p>
                  </div>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
              </a>
            </div>

            {/* App Experience & Feedback Card */}
            <div className="p-4 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-3">
              <span className="text-[10px] font-mono-luxury uppercase text-[var(--gold-accent)] font-bold block tracking-wider">
                Feedback & Community
              </span>

              <button
                type="button"
                onClick={() => setIsRateAppOpen(true)}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--gold-accent)]/50 active:scale-[0.99] transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[var(--gold-accent)] flex items-center justify-center shrink-0">
                    <Star className="h-4 w-4 fill-current" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[var(--text-primary)]">
                      Rate This App
                    </h4>
                    <p className="text-[10px] font-mono-luxury text-[var(--text-secondary)]">
                      Give 5 stars & help spotlight Nigerian designers
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setIsHelpImproveOpen(true)}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--gold-accent)]/50 active:scale-[0.99] transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                    <Lightbulb className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[var(--text-primary)]">
                      Help Improve This App
                    </h4>
                    <p className="text-[10px] font-mono-luxury text-[var(--text-secondary)]">
                      Report bugs or share feature ideas with our team
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
              </button>
            </div>

            {/* Quick Delivery Address Review */}
            <div className="p-4 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono-luxury uppercase text-[var(--text-secondary)] font-bold">
                  Saved Delivery Address
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('profile');
                    setIsEditingAddress(true);
                  }}
                  className="text-[10px] font-mono-luxury text-[var(--gold-accent)] font-bold uppercase underline"
                >
                  Edit Sizing & Address
                </button>
              </div>
              <p className="text-xs font-mono-luxury text-[var(--text-primary)]">
                {bodyProfile.deliveryAddress || 'No default delivery address set yet.'}
              </p>
              <p className="text-[11px] font-mono-luxury text-[var(--text-muted)]">
                {bodyProfile.city || 'Lagos'}, {bodyProfile.state || 'Lagos State'} {bodyProfile.phone ? `· ${bodyProfile.phone}` : ''}
              </p>
            </div>

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono-luxury text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-rose-500/20 transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out of Ìrísí Account</span>
            </button>

            {/* App version footer */}
            <div className="text-center pt-2 pb-4">
              <p className="text-[10px] font-mono-luxury text-[var(--text-muted)] uppercase tracking-widest">
                Ìrísí Platform v2.4.0
              </p>
            </div>

          </div>
        )}

      </div>

      {/* Settings & Support Modals */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        userEmail={userAuth.email}
      />
      <FaqHelpModal
        isOpen={isFaqOpen}
        onClose={() => setIsFaqOpen(false)}
      />
      <RateAppModal
        isOpen={isRateAppOpen}
        onClose={() => setIsRateAppOpen(false)}
        userEmail={userAuth.email}
        userName={userAuth.name}
      />
      <HelpImproveModal
        isOpen={isHelpImproveOpen}
        onClose={() => setIsHelpImproveOpen(false)}
        userEmail={userAuth.email}
        userName={userAuth.name}
      />

      {/* Quick Buy Drawer */}
      {quickBuyProduct && (
        <MobileQuickBuyDrawer
          product={quickBuyProduct}
          onClose={() => setQuickBuyProduct(null)}
        />
      )}

    </div>
  );
}
