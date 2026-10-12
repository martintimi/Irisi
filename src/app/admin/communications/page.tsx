'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Send, Sparkles, CheckCircle2, AlertCircle, Mail,
  Users, User, ExternalLink, RefreshCw, Eye, MessageSquare,
  ShieldCheck, HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SHOPPER_EMAIL_PRESETS } from '@/lib/data/shopperEmailPresets';

export default function AdminCommunicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialMode = (searchParams.get('mode') === 'single' ? 'single' : 'broadcast') as 'broadcast' | 'single';
  const queryEmail = searchParams.get('email') || '';
  const queryName = searchParams.get('name') || '';

  const [mode, setMode] = useState<'broadcast' | 'single'>(initialMode);
  const [recipientEmail, setRecipientEmail] = useState(queryEmail);
  const [recipientName, setRecipientName] = useState(queryName);

  // Active Preset & Email Content State
  const [selectedPresetId, setSelectedPresetId] = useState<string>('weekend_vibes');
  const [subject, setSubject] = useState(SHOPPER_EMAIL_PRESETS[0].subject);
  const [headline, setHeadline] = useState(SHOPPER_EMAIL_PRESETS[0].headline);
  const [badgeText, setBadgeText] = useState(SHOPPER_EMAIL_PRESETS[0].badgeText);
  const [bodyText, setBodyText] = useState(SHOPPER_EMAIL_PRESETS[0].bodyText);
  const [buttonLabel, setButtonLabel] = useState(SHOPPER_EMAIL_PRESETS[0].buttonLabel);
  const [buttonUrl, setButtonUrl] = useState(SHOPPER_EMAIL_PRESETS[0].buttonUrl);

  // Status & UI State
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (queryEmail) {
      setMode('single');
      setRecipientEmail(queryEmail);
      if (queryName) setRecipientName(queryName);
    }
  }, [queryEmail, queryName]);

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = SHOPPER_EMAIL_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setSubject(preset.subject);
      setHeadline(preset.headline);
      setBadgeText(preset.badgeText);
      setBodyText(preset.bodyText);
      setButtonLabel(preset.buttonLabel);
      setButtonUrl(preset.buttonUrl);
    }
  };

  const handleSend = async () => {
    if (mode === 'single' && (!recipientEmail || !recipientEmail.includes('@'))) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid recipient email address.' });
      return;
    }
    if (!subject.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter an email subject line.' });
      return;
    }
    if (!bodyText.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter the email body message.' });
      return;
    }

    setIsSending(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/admin/shopper-communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: mode,
          customerEmail: mode === 'single' ? recipientEmail.trim() : undefined,
          customerName: mode === 'single' ? recipientName.trim() : undefined,
          subject: subject.trim(),
          headline: headline.trim(),
          badgeText: badgeText.trim(),
          bodyText: bodyText.trim(),
          buttonLabel: buttonLabel.trim(),
          buttonUrl: buttonUrl.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMessage({
          type: 'success',
          text: mode === 'broadcast'
            ? `🎉 Successfully dispatched broadcast to ${data.count || 'all'} registered shoppers across Nigeria!`
            : `🎉 Message successfully sent to ${recipientEmail}!`,
        });

        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Failed to dispatch email. Please check server logs.',
        });
      }
    } catch (err: any) {
      console.error('Email dispatch error:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Network connection error while sending email.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors pb-24">
      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 backdrop-blur-md px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/customers"
            className="p-2 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-center gap-1.5 cursor-pointer text-xs font-mono-luxury font-bold"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Shoppers</span>
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-editorial text-xl sm:text-2xl font-bold tracking-[0.2em] text-[var(--text-primary)]">
                Ì R Í S Í
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-mono-luxury uppercase font-bold tracking-widest">
                COMMUNICATIONS HUB
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-mono-luxury mt-0.5 hidden sm:block">
              Send Nigerian lifestyle updates, weekend drops, or VIP notes directly to shoppers.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={isSending}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--gold-accent)] via-amber-300 to-[var(--gold-accent)] text-black font-mono-luxury font-bold text-xs uppercase tracking-wider shadow-lg hover:brightness-105 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {isSending ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin text-black" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4 text-black" />
              <span>{mode === 'broadcast' ? 'Dispatch Broadcast' : 'Send Direct Email'}</span>
            </>
          )}
        </button>
      </header>

      {/* MAIN BODY CONTAINER - FULL NATURAL PAGE SCROLL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Status Message Banner */}
        {statusMessage && (
          <div className={`p-4 rounded-2xl flex items-start gap-3 border animate-fadeIn ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            )}
            <div className="text-xs font-mono-luxury font-medium">
              {statusMessage.text}
            </div>
          </div>
        )}

        {/* Mode Switcher Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl surface-card border border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode('broadcast')}
              className={`px-4 py-2.5 rounded-xl text-xs font-mono-luxury font-bold transition-all flex items-center gap-2 cursor-pointer ${
                mode === 'broadcast'
                  ? 'bg-[var(--gold-accent)] text-black shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>📢 Platform Broadcast (All Shoppers)</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('single')}
              className={`px-4 py-2.5 rounded-xl text-xs font-mono-luxury font-bold transition-all flex items-center gap-2 cursor-pointer ${
                mode === 'single'
                  ? 'bg-[var(--gold-accent)] text-black shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
              }`}
            >
              <User className="h-4 w-4" />
              <span>✉️ Direct Message (1-on-1)</span>
            </button>
          </div>

          <div className="text-xs font-mono-luxury text-[var(--text-muted)] flex items-center gap-1.5 px-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>
              {mode === 'broadcast'
                ? 'Delivers to all registered shoppers in database'
                : recipientEmail
                ? `Target: ${recipientEmail}`
                : 'Enter shopper details below'}
            </span>
          </div>
        </div>

        {/* Single Shopper Recipient Fields */}
        {mode === 'single' && (
          <div className="p-5 rounded-2xl surface-card border border-[var(--border-subtle)] grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold">
                Shopper Name
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g. Babatunde or Leticia"
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-mono-luxury"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold">
                Shopper Email Address <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="e.g. customer@gmail.com"
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-mono-luxury"
              />
            </div>
          </div>
        )}

        {/* Preset Template Selector */}
        <div className="space-y-2 surface-card p-5 rounded-2xl border border-[var(--border-subtle)]">
          <label className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold flex items-center justify-between">
            <span>Choose a Preset Template (Fun Nigerian Lifestyle)</span>
            <span className="text-[10px] text-amber-400 font-bold">1-Click Auto-Fill</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
            {SHOPPER_EMAIL_PRESETS.map((preset) => {
              const isActive = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`p-3 rounded-xl text-left border transition-all text-xs font-mono-luxury cursor-pointer ${
                    isActive
                      ? 'border-[var(--gold-accent)] bg-amber-500/10 text-[var(--gold-accent)] font-bold shadow-sm'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--border-highlight)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <div className="truncate">{preset.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Two-Column Editor & Live Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* LEFT COLUMN: Input Fields */}
          <div className="space-y-5 surface-card p-6 rounded-3xl border border-[var(--border-subtle)] shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <span className="text-xs font-mono-luxury uppercase text-[var(--gold-accent)] font-bold">
                Email Content Customization
              </span>
              <span className="text-[10px] font-mono-luxury text-[var(--text-muted)]">
                Subject: {subject.length}/90 chars
              </span>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold">
                Subject Line <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Weekend Drip Alert! Fresh Senator Sets & Boutique Drops on ÌRÍSÍ 🔥"
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-mono-luxury font-medium"
              />
            </div>

            {/* Luxury Top Badge */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold">
                Luxury Top Badge
              </label>
              <input
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                placeholder="e.g. ✨ WEEKEND LOOKBOOK & DRIP"
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-mono-luxury"
              />
            </div>

            {/* Headline */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold">
                Headline Title
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Your Weekend Look Is Waiting For You! 🙌"
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-mono-luxury"
              />
            </div>

            {/* Body Text */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold">
                Message Body <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={8}
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder="Write message here. Multi-paragraph line breaks are preserved..."
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-mono-luxury resize-y leading-relaxed"
              />
            </div>

            {/* Call-to-Action Button Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--border-subtle)]">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold">
                  Button Label
                </label>
                <input
                  type="text"
                  value={buttonLabel}
                  onChange={(e) => setButtonLabel(e.target.value)}
                  placeholder="e.g. Shop Weekend Drip Now"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-mono-luxury"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold">
                  Button Destination URL
                </label>
                <input
                  type="url"
                  value={buttonUrl}
                  onChange={(e) => setButtonUrl(e.target.value)}
                  placeholder="https://irisimi-nig.vercel.app/shop"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-mono-luxury"
                />
              </div>
            </div>

            {/* Dispatch Action */}
            <div className="pt-4 flex items-center justify-end">
              <button
                type="button"
                onClick={handleSend}
                disabled={isSending}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[var(--gold-accent)] via-amber-300 to-[var(--gold-accent)] text-black font-mono-luxury font-bold text-xs uppercase tracking-wider shadow-lg hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-black" />
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 text-black" />
                    <span>{mode === 'broadcast' ? 'Dispatch Broadcast to All Shoppers' : `Send Message to ${recipientName || 'Shopper'}`}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Realistic Live Email Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono-luxury uppercase text-[var(--gold-accent)] font-bold flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                <span>Real-Time Customer Inbox Preview</span>
              </span>
              <span className="text-[10px] font-mono-luxury text-[var(--text-muted)]">
                Simulated Customer Mail View
              </span>
            </div>

            {/* Simulated Email Container */}
            <div className="rounded-3xl border border-[var(--border-subtle)] bg-[#050505] p-6 sm:p-8 text-zinc-100 font-sans shadow-2xl space-y-6">
              {/* Brand Header */}
              <div className="text-center border-b border-zinc-800 pb-5">
                <div className="text-amber-400 font-serif text-2xl tracking-[0.25em] font-bold">
                  Ì R Í S Í
                </div>
                <div className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest mt-1">
                  The Art of Nigerian Luxury • Verified Escrow
                </div>
              </div>

              {/* Badge & Headline */}
              <div className="space-y-2 text-center pt-2">
                {badgeText && (
                  <span className="inline-block px-3.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                    {badgeText}
                  </span>
                )}
                <h4 className="font-serif text-xl sm:text-2xl font-bold text-zinc-50 leading-snug">
                  {headline || 'A Special Message For You'}
                </h4>
              </div>

              {/* Body Content Card */}
              <div className="rounded-2xl bg-[#0d0d0d] border border-zinc-800/80 p-5 space-y-3.5 text-xs text-zinc-300 leading-relaxed font-sans">
                <p className="text-zinc-400 font-medium">
                  Hello {mode === 'single' ? (recipientName || 'there') : '[Shopper Name]'},
                </p>
                <div className="space-y-2 whitespace-pre-line text-sm">
                  {bodyText || 'Your message preview will appear here...'}
                </div>
              </div>

              {/* Call to Action Button */}
              {buttonLabel && (
                <div className="text-center pt-2">
                  <span className="inline-block px-7 py-3 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-black shadow-lg">
                    {buttonLabel} →
                  </span>
                </div>
              )}

              {/* Escrow Guarantee Pill */}
              <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3.5 text-center">
                <div className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                  🛡️ 100% Escrow Protection Guaranteed
                </div>
                <div className="text-[10px] text-zinc-400 font-sans mt-0.5">
                  Your money stays safe until your parcel arrives and you confirm satisfaction.
                </div>
              </div>

              {/* Simulated Footer */}
              <div className="border-t border-zinc-800/60 pt-4 text-center text-[10px] text-zinc-500 font-mono space-y-1">
                <div>ÌRÍSÍ Fashion Technologies · Lagos, Nigeria</div>
                <div>VIP Concierge WhatsApp: +234 907 033 2145</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
