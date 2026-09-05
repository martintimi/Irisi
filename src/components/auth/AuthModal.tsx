'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useStore } from '@/lib/store/useStore';
import { X, Sparkles, User, Store, Check, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { signUpCustomer, signInCustomer, signUpVendor, signInVendor } from '@/lib/services/auth';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    setUserAuth,
    userAuth,
    setSelectedGender,
    setBodyProfile,
    setIsVendorLoggedIn,
    setVendorProfile,
  } = useStore();

  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [accountType, setAccountType] = useState<'shopper' | 'vendor'>('shopper');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [preferredSize, setPreferredSize] = useState<'S' | 'M' | 'L' | 'XL' | 'XXL'>('M');
  const [heightCm, setHeightCm] = useState(178);
  const [weightKg, setWeightKg] = useState(74);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const userName = name || (email.split('@')[0] || 'Fashion Patron');
    const twinId = `IR-NIG-${Math.floor(100 + Math.random() * 900)}`;

    try {
      if (accountType === 'shopper') {
        if (mode === 'signup') {
          await signUpCustomer({
            email,
            password: password || 'Irisi2026!',
            fullName: userName,
            gender,
            heightCm,
            weightKg,
          });
        } else {
          await signInCustomer(email, password || 'Irisi2026!');
        }

        setUserAuth({
          isLoggedIn: true,
          name: userName,
          email: email || '',
          gender,
          userType: 'shopper',
        });

        setSelectedGender(gender);

        setBodyProfile({
          name: userName,
          email,
          gender,
          preferredSize,
          heightCm,
          weightKg,
          chestCm: gender === 'male' ? 102 : 88,
          waistCm: gender === 'male' ? 84 : 68,
          hipsCm: gender === 'male' ? 100 : 96,
          twinId,
          isInitialized: true,
        });
      } else {
        // Vendor Account
        if (mode === 'signup') {
          await signUpVendor({
            email,
            password: password || 'Irisi2026!',
            brandName: userName,
            designerName: userName,
            phone: '+234 802 345 6789',
            location: 'Lagos, Nigeria',
            vendorType: 'fashion_designer',
          });
        } else {
          await signInVendor(email, password || 'Irisi2026!');
        }

        setIsVendorLoggedIn(true);
        setVendorProfile({
          brandName: userName,
          designerName: userName,
          email,
        });
      }

      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#e6c367', '#10b981', '#ffffff']
      });

      setIsAuthModalOpen(false);
    } catch (err) {
      console.error('Auth error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-black/15 dark:border-white/15 shadow-sm">
              <Image
                src="/images/logo/irisi-icon.png"
                alt="ÌRÍSÍ Logo"
                width={40}
                height={40}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div>
              <h3 className="font-editorial text-xl font-bold text-[var(--text-primary)]">
                {mode === 'signup' ? 'Create Ìrísí Account' : 'Welcome Back'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-mono-luxury">
                {mode === 'signup' ? 'Join the verified fashion collective' : 'Sign in to your patron account'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 border-b border-[var(--border-subtle)] text-xs font-mono-luxury uppercase tracking-wider">
          <button
            onClick={() => setMode('signup')}
            className={`py-3 text-center transition-colors ${
              mode === 'signup' ? 'bg-[var(--gold-subtle)] text-[var(--gold-accent)] font-bold border-b-2 border-[var(--gold-accent)]' : 'text-[var(--text-muted)]'
            }`}
          >
            New Account
          </button>
          <button
            onClick={() => setMode('login')}
            className={`py-3 text-center transition-colors ${
              mode === 'login' ? 'bg-[var(--gold-subtle)] text-[var(--gold-accent)] font-bold border-b-2 border-[var(--gold-accent)]' : 'text-[var(--text-muted)]'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Account Type Selector (Shopper vs Vendor) */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setAccountType('shopper')}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-mono-luxury transition-all ${
                accountType === 'shopper'
                  ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>Shopper</span>
            </button>
            <button
              type="button"
              onClick={() => setAccountType('vendor')}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-mono-luxury transition-all ${
                accountType === 'vendor'
                  ? 'bg-[var(--gold-accent)] text-black font-bold shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Store className="h-3.5 w-3.5" />
              <span>Designer / Vendor</span>
            </button>
          </div>

          {/* Name & Email */}
          <div>
            <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              {accountType === 'vendor' ? 'Brand / Designer Name' : 'Your Full Name'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={accountType === 'vendor' ? 'e.g. Kolawole Bespoke' : 'e.g. Chidinma Okafor'}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:border-[var(--gold-accent)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:border-[var(--gold-accent)] focus:outline-none"
            />
          </div>

          {/* Gender Preference */}
          <div>
            <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Fashion Fitting Profile
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-mono-luxury font-bold transition-all ${
                  gender === 'male'
                    ? 'bg-[var(--gold-subtle)] border-[var(--gold-accent)] text-[var(--gold-accent)]'
                    : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                }`}
              >
                Men&apos;s Wear (Senator/Suits)
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-mono-luxury font-bold transition-all ${
                  gender === 'female'
                    ? 'bg-[var(--gold-subtle)] border-[var(--gold-accent)] text-[var(--gold-accent)]'
                    : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                }`}
              >
                Women&apos;s Wear (Ankara/Boubou)
              </button>
            </div>
          </div>

          {/* Preferred Clothing Size for Shoppers */}
          {mode === 'signup' && accountType === 'shopper' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)]">
                  Preferred Clothing Size
                </label>
                <span className="text-[11px] font-mono-luxury font-bold text-[var(--gold-accent)]">
                  {preferredSize}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {(['S', 'M', 'L', 'XL', 'XXL'] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setPreferredSize(sz)}
                    className={`py-2 px-1 rounded-xl border text-xs font-mono-luxury font-bold transition-all text-center cursor-pointer ${
                      preferredSize === sz
                        ? 'bg-[var(--gold-accent)] text-black border-[var(--gold-accent)] shadow-md font-extrabold'
                        : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Height & Weight for Shoppers */}
          {mode === 'signup' && accountType === 'shopper' && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs focus:border-[var(--gold-accent)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-1">Weight (kg)</label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs focus:border-[var(--gold-accent)] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 mt-2 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase tracking-widest font-bold text-xs hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Sparkles className="h-4 w-4 animate-spin text-[var(--gold-accent)]" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>{mode === 'signup' ? 'Create Account & Digital Twin' : 'Sign In'}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
