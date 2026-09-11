'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Building, User, Mail, Phone, MapPin, Check,
  ShieldCheck, ExternalLink, Sparkles, Store, Loader2,
  Clock, AlertCircle, CheckCircle2, Truck, Navigation, Save, Camera
} from 'lucide-react';
import Link from 'next/link';
import VendorLuxuryLoader from './VendorLuxuryLoader';
import { NIGERIAN_STATES, getCitiesForState } from '@/lib/data/nigeriaLocations';
import SearchableCitySelect from '@/components/common/SearchableCitySelect';

interface MobileVendorAtelierProps {
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  handleSave: (e: React.FormEvent) => Promise<void>;
  isSaving: boolean;
  isProfileSaved: boolean;
  approvalStatus: string;
  rejectionReason: string;
  isLoadingProfile: boolean;
  isBoutique: boolean;
  errorMessage?: string;
  setErrorMessage?: (msg: string) => void;
  successMessage?: string;
  setSuccessMessage?: (msg: string) => void;
  isFieldsDisabled?: boolean;
}

export default function MobileVendorAtelier({
  form,
  setForm,
  handleSave,
  isSaving,
  isProfileSaved,
  approvalStatus,
  rejectionReason,
  isLoadingProfile,
  isBoutique,
  errorMessage,
  setErrorMessage,
  successMessage,
  setSuccessMessage,
  isFieldsDisabled
}: MobileVendorAtelierProps) {
  if (isLoadingProfile) {
    return <VendorLuxuryLoader label="Loading Store Profile from Database..." />;
  }

  const isVerified = approvalStatus === 'approved';
  const isRejected = approvalStatus === 'rejected';

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage?.('Logo image exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    setIsUploadingLogo(true);
    setErrorMessage?.('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.url) {
        throw new Error(data.error || 'Failed to upload logo.');
      }

      setForm((prev: any) => ({ ...prev, logoUrl: data.url }));
      setSuccessMessage?.('Brand logo uploaded! Tap "Save Profile" below to activate on your storefront.');
    } catch (err: any) {
      console.error('Logo upload failed:', err);
      setErrorMessage?.(err.message || 'Failed to upload logo image.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4 animate-fadeIn pb-20 select-none">
      
      {/* Top Error Alert Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono-luxury flex items-center justify-between gap-2.5 animate-fadeIn">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-rose-500 shrink-0 animate-ping" />
            <span className="font-bold">{errorMessage}</span>
          </div>
          {setErrorMessage && (
            <button
              type="button"
              onClick={() => setErrorMessage('')}
              className="text-[10px] text-rose-400/70 hover:text-rose-300 uppercase font-bold cursor-pointer"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Top Success Alert Banner */}
      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono-luxury flex items-center justify-between gap-2.5 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="font-bold">{successMessage}</span>
          </div>
          {setSuccessMessage && (
            <button
              type="button"
              onClick={() => setSuccessMessage('')}
              className="text-[10px] text-emerald-400/70 hover:text-emerald-300 uppercase font-bold cursor-pointer"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* 1. Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--gold-subtle)] text-[var(--gold-accent)] text-[10px] font-mono-luxury uppercase font-bold border border-[var(--gold-accent)]/20 mb-1">
          <span>{isBoutique ? 'Boutique Store' : 'Atelier Profile'}</span>
        </div>
        <h2 className="font-editorial text-2xl font-bold text-[var(--text-primary)] leading-tight">
          Store Profile & Logistics
        </h2>
        <p className="text-[11px] font-mono-luxury text-[var(--text-secondary)]">
          Configure identity, location, and delivery zone fees.
        </p>
      </div>

      {/* 2. Live Status Banner */}
      {isVerified ? (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs font-mono-luxury">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="font-bold">Store Profile Approved & Active</span>
          </div>
          <Link
            href={`/brand/${encodeURIComponent(form.brandName || 'Atelier')}`}
            target="_blank"
            className="text-[10px] text-[var(--gold-accent)] uppercase font-bold flex items-center gap-1 shrink-0 underline"
          >
            <span>Preview</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      ) : isRejected ? (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-1 text-xs font-mono-luxury">
          <div className="flex items-center gap-2 text-rose-400 font-bold">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Profile Needs Update</span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)]">
            {rejectionReason || 'Please review contact numbers and store address.'}
          </p>
        </div>
      ) : isProfileSaved ? (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 text-xs font-mono-luxury text-amber-400">
          <Clock className="h-4 w-4 animate-pulse shrink-0" />
          <span>Pending Super Admin Verification</span>
        </div>
      ) : null}

      {/* 3. Store Identity & Contacts */}
      <div className="p-4 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-3 shadow-sm text-xs font-mono-luxury">
        <span className="text-xs uppercase font-bold text-[var(--text-primary)] block">
          1. Brand Identity &amp; Specialty
        </span>

        {/* Store Brand Logo */}
        <div>
          <label className="block text-[var(--text-secondary)] uppercase mb-1.5 font-bold">
            Store Brand Logo / Emblem
          </label>
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
            <div className="relative h-16 w-16 rounded-2xl bg-[var(--gold-subtle)] border-2 border-[var(--gold-accent)]/40 flex items-center justify-center font-editorial font-bold text-2xl text-[var(--gold-accent)] shadow-md shrink-0 overflow-hidden">
              {form.logoUrl ? (
                <Image
                  src={form.logoUrl}
                  alt={form.brandName || 'Brand Logo'}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <span>{form.brandName ? form.brandName.charAt(0).toUpperCase() : 'B'}</span>
              )}
              {isUploadingLogo && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-[var(--gold-accent)] animate-spin" />
                </div>
              )}
            </div>

            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <label
                  htmlFor="mobile-logo-upload-input"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-mono-luxury uppercase font-bold transition-all shadow-sm ${
                    isUploadingLogo
                      ? 'bg-[var(--border-subtle)] text-[var(--text-muted)] cursor-not-allowed'
                      : 'bg-[var(--text-primary)] text-[var(--bg-primary)] active:scale-95 cursor-pointer'
                  }`}
                >
                  <Camera className="h-3 w-3" />
                  <span>{form.logoUrl ? 'Change' : 'Upload Logo'}</span>
                </label>

                {form.logoUrl && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, logoUrl: '' })}
                    className="px-2.5 py-1.5 rounded-xl surface-card border border-rose-500/30 text-rose-400 text-[11px] font-mono-luxury uppercase font-bold"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                id="mobile-logo-upload-input"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                disabled={isUploadingLogo}
                onChange={handleLogoUpload}
                className="hidden"
              />
              <p className="text-[10px] text-[var(--text-muted)] leading-tight font-mono-luxury">
                Replaces first letter on your public storefront.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[var(--text-secondary)] uppercase mb-1 font-bold">
            Store Specialty &amp; Department
          </label>
          <select
            disabled={isFieldsDisabled}
            value={
              form.specialty === 'apparel' ? 'streetwear' :
              form.specialty === 'jewelry' ? 'accessories' :
              (form.specialty || 'streetwear')
            }
            onChange={(e) => {
              const spec = e.target.value;
              setForm({
                ...form,
                specialty: spec,
                vendorType: spec === 'native_tailoring' ? 'fashion_designer' : 'boutique_seller'
              });
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-bold disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <option value="native_tailoring">Bespoke Native Tailoring Atelier (Agbada, Kaftans, Senator — Made to Measure)</option>
            <option value="streetwear">Ready-to-Wear Clothing Boutique (Streetwear, Hoodies, Two-Piece Sets, Dresses)</option>
            <option value="footwear">Footwear &amp; Slides (Palms, Slides, Loafers, Sneakers)</option>
            <option value="caps">Caps, Hats &amp; Headwear (Fila, Dad Caps, Beanies, Bucket Hats)</option>
            <option value="accessories">Jewelry, Watches &amp; Luxury Accessories (Chains, Watches, Bags, Belts)</option>
            <option value="multi_department">Multi-Department Boutique (All Fashion &amp; Accessories)</option>
          </select>
        </div>

        <div>
          <label className="block text-[var(--text-secondary)] uppercase mb-1 font-bold">
            Brand / Store Name <strong className="text-rose-400">*</strong>
          </label>
          <input
            type="text"
            required
            disabled={isFieldsDisabled}
            value={form.brandName}
            onChange={(e) => setForm({ ...form, brandName: e.target.value })}
            placeholder="e.g. Moji Wears"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-bold disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-[var(--text-secondary)] uppercase mb-1 font-bold">
            {isBoutique ? 'Store Manager / Contact Person' : 'Lead Designer / Tailor'}
          </label>
          <input
            type="text"
            disabled={isFieldsDisabled}
            value={form.designerName}
            onChange={(e) => setForm({ ...form, designerName: e.target.value })}
            placeholder="e.g. Full Name"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-[var(--text-secondary)] uppercase mb-1 font-bold">
            Business Email
          </label>
          <input
            type="email"
            required
            disabled={isFieldsDisabled}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="store@example.com"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-[var(--text-secondary)] uppercase mb-1 font-bold">
            Official Phone / WhatsApp <strong className="text-rose-400">*</strong>
          </label>
          <input
            type="tel"
            required
            disabled={isFieldsDisabled}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="e.g. 08012345678"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-bold disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* 1. STATE (FIRST) */}
          <div>
            <label className="block text-[var(--text-secondary)] uppercase mb-1 font-bold">
              1. State <strong className="text-rose-400">*</strong>
            </label>
            <select
              disabled={isFieldsDisabled}
              value={form.state}
              onChange={(e) => {
                const newState = e.target.value;
                setForm({
                  ...form,
                  state: newState,
                  city: ''
                });
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-bold disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              <option value="">Select State</option>
              {NIGERIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* 2. CITY (SECOND, DYNAMIC) */}
          <div>
            <label className="block text-[var(--text-secondary)] uppercase mb-1 font-bold">
              2. City / Town <strong className="text-rose-400">*</strong>
            </label>
            <SearchableCitySelect
              state={form.state}
              value={form.city}
              onChange={(newCity) => setForm({ ...form, city: newCity })}
              disabled={isFieldsDisabled}
              placeholder={form.state ? `Search city in ${form.state}...` : 'Select state first'}
            />
          </div>
        </div>

        <div>
          <label className="block text-[var(--text-secondary)] uppercase mb-1 font-bold">
            Store Bio / Tagline
          </label>
          <textarea
            rows={2}
            disabled={isFieldsDisabled}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="e.g. Luxury bespoke tailoring and modern Nigerian streetwear."
            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none resize-none disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* 2. Social Media & Direct Concierge */}
      <div className="p-4 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-3 shadow-sm text-xs font-mono-luxury">
        <span className="text-xs uppercase font-bold text-[var(--text-primary)] block">
          2. Social Channels & WhatsApp
        </span>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[var(--text-secondary)] uppercase mb-1 font-bold text-[10px]">
              Instagram
            </label>
            <input
              type="text"
              disabled={isFieldsDisabled}
              value={form.instagram}
              onChange={(e) => setForm({ ...form, instagram: e.target.value })}
              placeholder="@brand"
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-pink-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-[var(--text-secondary)] uppercase mb-1 font-bold text-[10px]">
              TikTok
            </label>
            <input
              type="text"
              disabled={isFieldsDisabled}
              value={form.tiktok}
              onChange={(e) => setForm({ ...form, tiktok: e.target.value })}
              placeholder="@tiktok"
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-cyan-400 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-[var(--text-secondary)] uppercase mb-1 font-bold text-[10px]">
              Snapchat
            </label>
            <input
              type="text"
              disabled={isFieldsDisabled}
              value={form.snapchat}
              onChange={(e) => setForm({ ...form, snapchat: e.target.value })}
              placeholder="@snapchat"
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-amber-300 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-[var(--text-secondary)] uppercase mb-1 font-bold text-[10px]">
              WhatsApp
            </label>
            <input
              type="tel"
              disabled={isFieldsDisabled}
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              placeholder="080..."
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-emerald-500 focus:outline-none font-bold disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* 3. Dispatch Turnaround Timeline */}
      <div className="p-4 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-3.5 shadow-sm text-xs font-mono-luxury">
        <span className="text-xs uppercase font-bold text-[var(--text-primary)] block">
          3. Dispatch Turnaround Timeline
        </span>

        <div>
          <label className="block text-[var(--text-secondary)] uppercase mb-1 font-bold">
            Dispatch Turnaround Time
          </label>
          <select
            disabled={isFieldsDisabled}
            value={form.dispatchDays}
            onChange={(e) => setForm({ ...form, dispatchDays: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-bold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value="Same-day / 1 day">Same-day / 1 business day</option>
            <option value="1-2 business days">1-2 business days (In Stock / Ready)</option>
            <option value="2-3 business days">2-3 business days</option>
            <option value="3-5 business days">3-5 business days (Custom Cut)</option>
            <option value="5-7 business days">5-7 business days (Handmade Bespoke)</option>
          </select>
        </div>
      </div>

      {/* 5. Clean Luxury Save Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSaving || isFieldsDisabled}
          className="w-full py-4 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase text-xs font-bold shadow-xl hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Sparkles className="h-4 w-4 animate-spin text-[var(--gold-accent)]" />
              <span>Submitting Profile...</span>
            </>
          ) : isFieldsDisabled ? (
            approvalStatus === 'approved' ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Store Profile Verified & Active</span>
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 text-amber-400" />
                <span>Submitted & Awaiting Super Admin Review</span>
              </>
            )
          ) : approvalStatus === 'rejected' ? (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Resubmit Store Profile for Review</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4 stroke-[2.5]" />
              <span>Save & Submit Store Profile</span>
            </>
          )}
        </button>
      </div>

    </form>
  );
}
