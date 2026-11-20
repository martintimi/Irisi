'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  CheckCircle2, AlertCircle, Clock, ExternalLink, Camera,
  Loader2, MapPin, Navigation, Save, Sparkles, Trash2
} from 'lucide-react';
import VendorLuxuryLoader from './VendorLuxuryLoader';
import { NIGERIAN_STATES } from '@/lib/data/nigeriaLocations';
import SearchableCitySelect from '@/components/common/SearchableCitySelect';
import { compressImageToFile } from '@/lib/utils/imageUtils';

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
}: MobileVendorAtelierProps) {
  const [activeSection, setActiveSection] = useState<'identity' | 'dispatch' | 'socials'>('identity');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  if (isLoadingProfile) {
    return <VendorLuxuryLoader label="Loading Store Profile..." />;
  }

  const isVerified = approvalStatus === 'approved';
  const isRejected = approvalStatus === 'rejected';
  const brandInitial = (form.brandName || 'B').trim().charAt(0).toUpperCase();

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      setErrorMessage?.('Logo image exceeds 12MB limit. Please choose a smaller image.');
      return;
    }

    setIsUploadingLogo(true);
    setErrorMessage?.('');

    try {
      const compressedFile = await compressImageToFile(file, 1000, 0.88);
      const formData = new FormData();
      formData.append('file', compressedFile);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok || !data.success || !data.url) {
        throw new Error(data.error || 'Failed to upload logo.');
      }

      setForm((prev: any) => ({ ...prev, logoUrl: data.url }));
      setSuccessMessage?.('Brand logo uploaded — tap Save Store Profile below to publish.');
    } catch (err: any) {
      setErrorMessage?.(err.message || 'Failed to upload logo image.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4 animate-fadeIn pb-8 select-none">
      {/* Alerts */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs flex items-center justify-between gap-2.5">
          <span className="leading-relaxed">{errorMessage}</span>
          {setErrorMessage && (
            <button
              type="button"
              onClick={() => setErrorMessage('')}
              className="text-[10px] font-mono-luxury uppercase shrink-0 cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-xs flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
          {setSuccessMessage && (
            <button
              type="button"
              onClick={() => setSuccessMessage('')}
              className="text-[10px] font-mono-luxury uppercase shrink-0 cursor-pointer"
            >
              Done
            </button>
          )}
        </div>
      )}

      {/* 1. Native Hero Brand Avatar & Status Card */}
      <section className="p-5 rounded-[24px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col items-center text-center space-y-3">
        <div className="relative">
          <div className="relative h-20 w-20 rounded-full overflow-hidden bg-zinc-950 border-2 border-[var(--gold-accent)]/50 flex items-center justify-center shadow-md">
            {form.logoUrl ? (
              <Image
                src={form.logoUrl}
                alt={form.brandName || 'Brand Logo'}
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <span className="font-editorial text-3xl text-[var(--gold-accent)]">{brandInitial}</span>
            )}
            {isUploadingLogo && (
              <div className="absolute inset-0 bg-black/65 flex items-center justify-center">
                <Loader2 className="h-5 w-5 text-[var(--gold-accent)] animate-spin" />
              </div>
            )}
          </div>

          <label
            htmlFor="mobile-logo-upload-input"
            className="absolute -bottom-0.5 -right-0.5 h-8 w-8 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] border-2 border-[var(--bg-surface)] flex items-center justify-center shadow-sm active:scale-95 cursor-pointer"
            aria-label="Upload brand logo"
          >
            <Camera className="h-3.5 w-3.5" />
          </label>
          <input
            id="mobile-logo-upload-input"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/jpg"
            disabled={isUploadingLogo}
            onChange={handleLogoUpload}
            className="hidden"
          />
        </div>

        <div className="space-y-1">
          <h1 className="font-editorial text-2xl font-normal text-[var(--text-primary)] leading-tight">
            {form.brandName || 'Store Profile'}
          </h1>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {isVerified ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-[10px] font-mono-luxury">
                <CheckCircle2 className="h-3 w-3" /> Verified Store
              </span>
            ) : isRejected ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-500 text-[10px] font-mono-luxury">
                <AlertCircle className="h-3 w-3" /> Needs Update
              </span>
            ) : isProfileSaved ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-500 text-[10px] font-mono-luxury">
                <Clock className="h-3 w-3" /> Under Review
              </span>
            ) : null}

            <Link
              href={`/brand/${encodeURIComponent(form.brandName || 'store')}`}
              target="_blank"
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[10px] font-mono-luxury text-[var(--text-secondary)]"
            >
              <span>Preview Store</span>
              <ExternalLink className="h-2.5 w-2.5 text-[var(--gold-accent)]" />
            </Link>

            {form.logoUrl && (
              <button
                type="button"
                onClick={() => setForm({ ...form, logoUrl: '' })}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono-luxury text-rose-500 cursor-pointer"
              >
                <Trash2 className="h-2.5 w-2.5" /> Remove Logo
              </button>
            )}
          </div>
        </div>

        {isRejected && rejectionReason && (
          <p className="text-[11px] text-rose-500 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl w-full text-left">
            Admin note: &ldquo;{rejectionReason}&rdquo;
          </p>
        )}
      </section>

      {/* 2. Native iOS Segmented Tab Bar */}
      <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
        {[
          { id: 'identity', label: 'Identity' },
          { id: 'dispatch', label: 'Dispatch' },
          { id: 'socials', label: 'Socials' },
        ].map((tab) => {
          const active = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id as any)}
              className={`py-2 rounded-xl text-xs font-mono-luxury transition-all cursor-pointer ${
                active
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border-subtle)]'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* SECTION A: BRAND IDENTITY */}
      {activeSection === 'identity' && (
        <section className="space-y-3 animate-fadeIn">
          <div className="rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] overflow-hidden">
            <div className="px-4 py-3 space-y-1">
              <label className="block text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)]">
                Store Specialty
              </label>
              <select
                value={
                  form.specialty === 'apparel'
                    ? 'streetwear'
                    : form.specialty === 'jewelry'
                    ? 'accessories'
                    : form.specialty || 'streetwear'
                }
                onChange={(e) => {
                  const spec = e.target.value;
                  setForm({
                    ...form,
                    specialty: spec,
                    vendorType: spec === 'native_tailoring' ? 'fashion_designer' : 'boutique_seller',
                  });
                }}
                className="w-full bg-transparent text-sm text-[var(--text-primary)] focus:outline-none cursor-pointer py-1"
              >
                <option value="native_tailoring">Bespoke Native Tailoring Atelier</option>
                <option value="streetwear">Ready-to-Wear Clothing Boutique</option>
                <option value="footwear">Footwear &amp; Slides</option>
                <option value="caps">Caps, Hats &amp; Headwear</option>
                <option value="accessories">Jewelry, Watches &amp; Accessories</option>
                <option value="perfume">Perfumes &amp; Fragrances</option>
                <option value="wigs">Hair &amp; Wigs</option>
                <option value="multi_department">Multi-Department Boutique (All)</option>
              </select>
            </div>

            <div className="px-4 py-3 space-y-1">
              <label className="block text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)]">
                Brand / Store Name *
              </label>
              <input
                type="text"
                required
                value={form.brandName}
                onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                placeholder="e.g. Moji Wears"
                className="w-full bg-transparent text-sm text-[var(--text-primary)] focus:outline-none py-0.5"
              />
            </div>

            <div className="px-4 py-3 space-y-1">
              <label className="block text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)]">
                {isBoutique ? 'Store Manager / Founder' : 'Lead Designer / Tailor'}
              </label>
              <input
                type="text"
                value={form.designerName}
                onChange={(e) => setForm({ ...form, designerName: e.target.value })}
                placeholder="Full Name"
                className="w-full bg-transparent text-sm text-[var(--text-primary)] focus:outline-none py-0.5"
              />
            </div>

            <div className="px-4 py-3 space-y-1">
              <label className="block text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)]">
                Business Email *
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="store@example.com"
                className="w-full bg-transparent text-sm text-[var(--text-primary)] focus:outline-none py-0.5"
              />
            </div>

            <div className="px-4 py-3 space-y-1">
              <label className="block text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)]">
                Official Phone / WhatsApp *
              </label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="e.g. 08012345678"
                className="w-full bg-transparent text-sm font-mono-luxury text-[var(--text-primary)] focus:outline-none py-0.5"
              />
            </div>

            <div className="px-4 py-3 space-y-1">
              <label className="block text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)]">
                Store Bio / Tagline
              </label>
              <textarea
                rows={3}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Tell shoppers what makes your brand special..."
                className="w-full bg-transparent text-sm text-[var(--text-primary)] focus:outline-none resize-none py-0.5 leading-relaxed"
              />
            </div>
          </div>

          {/* Payout Quick Link */}
          <Link
            href="/vendor-portal/settlements"
            className="px-4 py-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between text-xs active:bg-[var(--bg-secondary)]"
          >
            <span className="text-[var(--text-secondary)]">Need to update your payout bank account?</span>
            <span className="text-[var(--gold-accent)] font-mono-luxury shrink-0">Payouts ›</span>
          </Link>
        </section>
      )}

      {/* SECTION B: DISPATCH HUBS & TURNAROUND */}
      {activeSection === 'dispatch' && (
        <section className="space-y-3 animate-fadeIn">
          <div className="p-4 rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3.5">
            <div className="flex items-center gap-2 text-xs text-[var(--text-primary)]">
              <MapPin className="h-4 w-4 text-[var(--gold-accent)]" />
              <span className="font-medium">Primary Dispatch Hub</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="block text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)]">
                  State *
                </label>
                <select
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value, city: '' })}
                  className="w-full h-11 px-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none cursor-pointer"
                >
                  <option value="">Select State</option>
                  {NIGERIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)]">
                  City / Area *
                </label>
                <SearchableCitySelect
                  state={form.state}
                  value={form.city}
                  onChange={(newCity) => setForm({ ...form, city: newCity })}
                  placeholder={form.state ? `City in ${form.state}` : 'Pick state first'}
                />
              </div>
            </div>
          </div>

          {/* Secondary Dispatch Hub Toggle */}
          <div className="p-4 rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Navigation className="h-4 w-4 text-[var(--gold-accent)] shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-[var(--text-primary)]">Second Dispatch Hub</div>
                  <p className="text-[11px] text-[var(--text-muted)] font-light">
                    Ship from a second city or branch
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={form.hasSecondaryHub}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setForm({
                      ...form,
                      hasSecondaryHub: checked,
                      secondaryState: checked ? form.secondaryState : '',
                      secondaryCity: checked ? form.secondaryCity : '',
                    });
                  }}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-[var(--border-subtle)] rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--gold-accent)]" />
              </label>
            </div>

            {form.hasSecondaryHub && (
              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[var(--border-subtle)]">
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)]">
                    2nd State *
                  </label>
                  <select
                    value={form.secondaryState}
                    onChange={(e) => setForm({ ...form, secondaryState: e.target.value, secondaryCity: '' })}
                    className="w-full h-11 px-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none cursor-pointer"
                  >
                    <option value="">Select State</option>
                    {NIGERIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)]">
                    2nd City *
                  </label>
                  <SearchableCitySelect
                    state={form.secondaryState}
                    value={form.secondaryCity}
                    onChange={(newCity) => setForm({ ...form, secondaryCity: newCity })}
                    placeholder={form.secondaryState ? `City in ${form.secondaryState}` : 'Pick state first'}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Turnaround Timeline */}
          <div className="p-4 rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2">
            <label className="block text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)]">
              Standard Dispatch Turnaround
            </label>
            <select
              value={form.dispatchDays}
              onChange={(e) => setForm({ ...form, dispatchDays: e.target.value })}
              className="w-full h-11 px-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none cursor-pointer"
            >
              <option value="Same-day / 1 day">Same-day / 1 business day</option>
              <option value="1-2 business days">1–2 business days (Ready to Ship)</option>
              <option value="2-3 business days">2–3 business days</option>
              <option value="3-5 business days">3–5 business days (Made to Order)</option>
              <option value="5-7 business days">5–7 business days (Bespoke Craft)</option>
            </select>
          </div>
        </section>
      )}

      {/* SECTION C: SOCIAL CHANNELS */}
      {activeSection === 'socials' && (
        <section className="animate-fadeIn">
          <div className="rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] overflow-hidden">
            {[
              { key: 'instagram', label: 'Instagram Handle', placeholder: '@yourbrand' },
              { key: 'tiktok', label: 'TikTok Handle', placeholder: '@yourbrand' },
              { key: 'snapchat', label: 'Snapchat Handle', placeholder: '@yourbrand' },
              { key: 'whatsapp', label: 'WhatsApp Number', placeholder: 'e.g. +23480...' },
            ].map((field) => (
              <div key={field.key} className="px-4 py-3 space-y-1">
                <label className="block text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)]">
                  {field.label}
                </label>
                <input
                  type={field.key === 'whatsapp' ? 'tel' : 'text'}
                  value={form[field.key] || ''}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full bg-transparent text-sm text-[var(--text-primary)] focus:outline-none py-0.5"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Clean Native Primary Save Action */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="w-full h-12 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Sparkles className="h-4 w-4 animate-spin text-[var(--gold-accent)]" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>{isProfileSaved ? 'Save Store Profile' : 'Save & Submit Profile'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
