'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Users,
  ShoppingBag,
  Store,
  RefreshCw,
  Download,
  Mail,
  Phone,
  MessageCircle,
  ExternalLink,
  CheckCircle2,
  Clock,
  Loader2,
  ArrowRight,
  Send,
  Search,
  Filter,
} from 'lucide-react';

interface VendorApp {
  id: string;
  createdAt: string;
  read: boolean;
  brandName: string;
  specialty: string;
  instagramHandle: string;
  socialLinks?: Array<{ platform: string; handle: string }>;
  founderPhone: string;
  founderEmail: string;
  location: string;
  lookbookUrl?: string;
  submittedAt?: string;
}

interface MerchReserve {
  id: string;
  createdAt: string;
  email: string;
  phone: string;
  colorway: string;
  size: string;
  submittedAt?: string;
}

interface WaitlistEntry {
  id: string;
  createdAt: string;
  email: string;
  passNumber: string;
  timestamp?: string;
}

interface PrelaunchData {
  vendors: VendorApp[];
  merch: MerchReserve[];
  waitlist: WaitlistEntry[];
  metrics: {
    totalVendors: number;
    pendingVendors: number;
    totalMerch: number;
    merchSizes: Record<string, number>;
    merchColors: Record<string, number>;
    totalWaitlist: number;
  };
}

export default function AdminPrelaunchManager() {
  const [data, setData] = useState<PrelaunchData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'vendors' | 'merch' | 'waitlist'>('vendors');
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/admin/prelaunch');
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (e) {
      console.error('Failed to load prelaunch data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSendVendorInvite = async (vendor: VendorApp) => {
    setInvitingId(vendor.id);
    setActionMessage(null);
    try {
      const res = await fetch('/api/admin/prelaunch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'invite_vendor',
          id: vendor.id,
          email: vendor.founderEmail,
          brandName: vendor.brandName,
          specialty: vendor.specialty,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to dispatch invitation');

      setActionMessage(`✨ Invitation email successfully sent to ${vendor.brandName} (${vendor.founderEmail})`);
      // Update local state to marked as read
      if (data) {
        setData({
          ...data,
          vendors: data.vendors.map((v) => (v.id === vendor.id ? { ...v, read: true } : v)),
          metrics: {
            ...data.metrics,
            pendingVendors: Math.max(0, data.metrics.pendingVendors - 1),
          },
        });
      }
    } catch (err: any) {
      setActionMessage(`Error: ${err.message || 'Could not send invitation'}`);
    } finally {
      setInvitingId(null);
    }
  };

  // CSV Export utility
  const exportCsv = (type: 'vendors' | 'merch' | 'waitlist') => {
    if (!data) return;

    let headers = '';
    let rows = '';
    let filename = '';

    if (type === 'vendors') {
      filename = `irisi_founding_vendors_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = 'Brand Name,Department,Location,WhatsApp,Email,Instagram,Lookbook,Date Applied,Status\n';
      rows = data.vendors
        .map((v) =>
          [
            `"${v.brandName}"`,
            `"${v.specialty || ''}"`,
            `"${v.location || ''}"`,
            `"${v.founderPhone}"`,
            `"${v.founderEmail}"`,
            `"${v.instagramHandle || ''}"`,
            `"${v.lookbookUrl || ''}"`,
            `"${v.submittedAt || v.createdAt}"`,
            `"${v.read ? 'Contacted/Invited' : 'Pending'}"`,
          ].join(',')
        )
        .join('\n');
    } else if (type === 'merch') {
      filename = `irisi_merch_reservations_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = 'Email,WhatsApp,Colorway,Size,Product,Date Reserved\n';
      rows = data.merch
        .map((m) =>
          [
            `"${m.email}"`,
            `"${m.phone}"`,
            `"${m.colorway}"`,
            `"${m.size}"`,
            '"ÌRÍSÍ Sovereign Heavyweight Tee"',
            `"${m.submittedAt || m.createdAt}"`,
          ].join(',')
        )
        .join('\n');
    } else {
      filename = `irisi_vip_waitlist_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = 'Pass Number,Email,Date Joined\n';
      rows = data.waitlist
        .map((w) => [`"#${w.passNumber}"`, `"${w.email}"`, `"${w.timestamp || w.createdAt}"`].join(','))
        .join('\n');
    }

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cleanPhone = (phone: string) => {
    const raw = (phone || '').replace(/\D/g, '');
    if (raw.startsWith('234')) return raw;
    if (raw.startsWith('0')) return `234${raw.slice(1)}`;
    return raw;
  };

  return (
    <div className="space-y-6 animate-fadeIn text-[var(--text-primary)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono-luxury uppercase text-[var(--gold-accent)] font-bold tracking-widest">
              LAUNCH DROP 001 PIPELINE
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Live Gateway
            </span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold">
            Pre-Launch &amp; Waitlist Intelligence
          </h1>
          <p className="text-xs text-[var(--text-secondary)] font-mono-luxury mt-1">
            Monitor founding designer applications, tee pre-reservations, and VIP insider early access passes.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => exportCsv(activeSubTab)}
            className="px-3.5 py-2 rounded-xl surface-card border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase font-bold text-[var(--text-primary)] hover:border-[var(--gold-accent)] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[var(--gold-accent)]" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchData}
            className="px-3.5 py-2 rounded-xl surface-card border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase font-bold text-[var(--text-primary)] hover:border-[var(--gold-accent)] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-2xl bg-[var(--gold-accent)]/10 border border-[var(--gold-accent)]/30 text-xs font-mono text-[var(--gold-accent)] flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-zinc-400 hover:text-white ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: VIP Passes */}
        <div className="p-5 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold">
              VIP Insiders (Passes)
            </span>
            <Users className="w-4 h-4 text-[var(--gold-accent)]" />
          </div>
          <strong className="font-editorial text-3xl font-bold">
            {data?.metrics.totalWaitlist || 0}
          </strong>
          <span className="text-[11px] text-[var(--text-secondary)] font-mono block">
            Early Runway Access
          </span>
        </div>

        {/* Card 2: Merch Reservations */}
        <div className="p-5 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold">
              Sovereign Tee Pre-Orders
            </span>
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
          </div>
          <strong className="font-editorial text-3xl font-bold text-emerald-400">
            {data?.metrics.totalMerch || 0}
          </strong>
          <span className="text-[11px] text-[var(--text-secondary)] font-mono block">
            {data?.metrics.merchColors['Onyx Black'] || 0} Black · {data?.metrics.merchColors['Bone White'] || 0} White
          </span>
        </div>

        {/* Card 3: Founding Brands */}
        <div className="p-5 rounded-3xl surface-card border border-amber-500/30 bg-amber-500/5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono-luxury uppercase text-amber-400 font-bold">
              Founding Brand Apps
            </span>
            <Store className="w-4 h-4 text-amber-400" />
          </div>
          <strong className="font-editorial text-3xl font-bold text-amber-400">
            {data?.metrics.totalVendors || 0}
          </strong>
          <span className="text-[11px] text-amber-300 font-mono block">
            {data?.metrics.pendingVendors || 0} Pending Review
          </span>
        </div>

        {/* Card 4: Factory Sizing Demand */}
        <div className="p-5 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold">
              Merch Sizing Demand
            </span>
            <Sparkles className="w-4 h-4 text-[var(--gold-accent)]" />
          </div>
          <div className="text-xs font-mono space-y-0.5 pt-1 text-[var(--text-secondary)]">
            <div className="flex justify-between">
              <span>S: {data?.metrics.merchSizes['S'] || 0}</span>
              <span>M: {data?.metrics.merchSizes['M'] || 0}</span>
              <span>L: {data?.metrics.merchSizes['L'] || 0}</span>
              <span>XL: {data?.metrics.merchSizes['XL'] || 0}</span>
              <span>XXL: {data?.metrics.merchSizes['XXL'] || 0}</span>
            </div>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] font-mono block pt-0.5">
            Real Factory Batch Sizing
          </span>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 rounded-2xl surface-card border border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('vendors')}
            className={`px-4 py-2 rounded-xl text-xs font-mono-luxury uppercase font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeSubTab === 'vendors'
                ? 'bg-[var(--gold-accent)] text-black shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Founding Brands</span>
            {(data?.metrics.pendingVendors || 0) > 0 && (
              <span className="px-1.5 py-0.2 bg-black text-white rounded-full text-[10px] font-mono">
                {data?.metrics.pendingVendors}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('merch')}
            className={`px-4 py-2 rounded-xl text-xs font-mono-luxury uppercase font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeSubTab === 'merch'
                ? 'bg-[var(--gold-accent)] text-black shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Merch Pre-Orders</span>
            {(data?.metrics.totalMerch || 0) > 0 && (
              <span className="px-1.5 py-0.2 bg-black text-white rounded-full text-[10px] font-mono">
                {data?.metrics.totalMerch}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('waitlist')}
            className={`px-4 py-2 rounded-xl text-xs font-mono-luxury uppercase font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeSubTab === 'waitlist'
                ? 'bg-[var(--gold-accent)] text-black shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>VIP Pass Holders</span>
            {(data?.metrics.totalWaitlist || 0) > 0 && (
              <span className="px-1.5 py-0.2 bg-black text-white rounded-full text-[10px] font-mono">
                {data?.metrics.totalWaitlist}
              </span>
            )}
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeSubTab}...`}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-accent)] font-sans"
          />
        </div>
      </div>

      {/* Sub-Tab 1: Founding Brand Applications */}
      {activeSubTab === 'vendors' && (
        <div className="surface-card rounded-3xl border border-[var(--border-subtle)] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 text-[10px] font-mono-luxury uppercase text-[var(--text-muted)]">
                  <th className="py-3.5 px-4 font-bold">Brand &amp; Specialty</th>
                  <th className="py-3.5 px-4 font-bold">Location</th>
                  <th className="py-3.5 px-4 font-bold">Direct Contacts</th>
                  <th className="py-3.5 px-4 font-bold">Portfolio / Lookbook</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Founder Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[var(--text-muted)]">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[var(--gold-accent)]" />
                      Loading designer roster...
                    </td>
                  </tr>
                ) : !data?.vendors.length ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[var(--text-muted)]">
                      No brand applications received yet.
                    </td>
                  </tr>
                ) : (
                  data.vendors
                    .filter((v) => {
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        v.brandName?.toLowerCase().includes(q) ||
                        v.founderEmail?.toLowerCase().includes(q) ||
                        v.founderPhone?.toLowerCase().includes(q) ||
                        v.specialty?.toLowerCase().includes(q)
                      );
                    })
                    .map((vendor) => {
                      const waNumber = cleanPhone(vendor.founderPhone);
                      const waText = encodeURIComponent(
                        `Hello ${vendor.brandName}! Thank you for applying as an ÌRÍSÍ Founding Designer for Drop 001. We would love to discuss your collection!`
                      );
                      const waLink = `https://wa.me/${waNumber}?text=${waText}`;

                      return (
                        <tr key={vendor.id} className="hover:bg-[var(--bg-secondary)]/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-sm text-[var(--text-primary)] block">
                              {vendor.brandName}
                            </span>
                            <span className="text-[11px] text-[var(--gold-accent)] font-mono block">
                              {vendor.specialty || 'streetwear'}
                            </span>
                            {vendor.socialLinks && vendor.socialLinks.length > 0 ? (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {vendor.socialLinks.map((s, sIdx) => {
                                  const clean = s.handle.replace(/^@/, '');
                                  const url = s.handle.startsWith('http')
                                    ? s.handle
                                    : s.platform === 'tiktok'
                                    ? `https://tiktok.com/@${clean}`
                                    : s.platform === 'x'
                                    ? `https://x.com/${clean}`
                                    : s.platform === 'facebook'
                                    ? `https://facebook.com/${clean}`
                                    : `https://instagram.com/${clean}`;
                                  const prefix =
                                    s.platform === 'instagram'
                                      ? 'IG'
                                      : s.platform === 'tiktok'
                                      ? 'TT'
                                      : s.platform === 'x'
                                      ? 'X'
                                      : s.platform.slice(0, 3).toUpperCase();
                                  return (
                                    <a
                                      key={sIdx}
                                      href={url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[9px] text-sky-400 hover:underline inline-flex items-center gap-0.5 font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/5"
                                    >
                                      <span className="text-[var(--gold-accent)] font-bold">{prefix}:</span>
                                      <span>@{clean}</span>
                                    </a>
                                  );
                                })}
                              </div>
                            ) : vendor.instagramHandle ? (
                              <a
                                href={`https://instagram.com/${vendor.instagramHandle.replace('@', '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-sky-400 hover:underline inline-flex items-center gap-1 font-mono mt-0.5"
                              >
                                <span>@{vendor.instagramHandle.replace('@', '')}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ) : null}
                          </td>

                          <td className="py-3.5 px-4 font-mono text-[11px] text-[var(--text-secondary)]">
                            {vendor.location || 'Nigeria'}
                          </td>

                          <td className="py-3.5 px-4 space-y-1">
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-mono font-bold text-emerald-400 hover:underline flex items-center gap-1.5"
                            >
                              <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span>{vendor.founderPhone}</span>
                            </a>
                            <a
                              href={`mailto:${vendor.founderEmail}`}
                              className="text-[11px] font-mono text-[var(--text-muted)] hover:text-white flex items-center gap-1.5"
                            >
                              <Mail className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[160px]">{vendor.founderEmail}</span>
                            </a>
                          </td>

                          <td className="py-3.5 px-4">
                            {vendor.lookbookUrl ? (
                              <a
                                href={vendor.lookbookUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[11px] text-[var(--gold-accent)] hover:underline inline-flex items-center gap-1 font-mono"
                              >
                                <span>View Catalog</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-[11px] text-[var(--text-muted)] font-mono italic">
                                Not provided
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            {vendor.read ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Invited</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Pending</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono text-[10px] font-bold hover:bg-emerald-500 hover:text-black transition-all flex items-center gap-1"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>WhatsApp</span>
                              </a>

                              <button
                                onClick={() => handleSendVendorInvite(vendor)}
                                disabled={invitingId === vendor.id}
                                className="px-3 py-1.5 rounded-xl bg-[var(--gold-accent)] text-black font-mono text-[10px] font-bold hover:bg-[#d6af4b] transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                {invitingId === vendor.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Send className="w-3 h-3" />
                                )}
                                <span>{vendor.read ? 'Resend Invite' : 'Grant Invite'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Merch Reservations (Tee Demand) */}
      {activeSubTab === 'merch' && (
        <div className="space-y-4">
          {/* Demand Summary Bar */}
          <div className="p-5 rounded-3xl surface-card border border-[var(--border-subtle)] flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono-luxury uppercase text-[var(--gold-accent)] font-bold block mb-0.5">
                FACTORY PRODUCTION BATCH
              </span>
              <h3 className="font-editorial text-xl font-bold">
                ÌRÍSÍ Sovereign Heavyweight Tee (320 GSM)
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-mono">
                Total Pre-Orders: <strong className="text-white">{data?.metrics.totalMerch || 0}</strong> Pieces
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="px-4 py-2 rounded-2xl bg-black border border-white/20 text-center">
                <span className="text-[9px] font-mono text-zinc-400 uppercase block">Onyx Black</span>
                <span className="text-lg font-bold font-mono text-white">
                  {data?.metrics.merchColors['Onyx Black'] || 0}
                </span>
              </div>
              <div className="px-4 py-2 rounded-2xl bg-white/10 border border-white/20 text-center">
                <span className="text-[9px] font-mono text-zinc-300 uppercase block">Bone White</span>
                <span className="text-lg font-bold font-mono text-white">
                  {data?.metrics.merchColors['Bone White'] || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="surface-card rounded-3xl border border-[var(--border-subtle)] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 text-[10px] font-mono-luxury uppercase text-[var(--text-muted)]">
                    <th className="py-3.5 px-4 font-bold">Customer Contact</th>
                    <th className="py-3.5 px-4 font-bold">Colorway</th>
                    <th className="py-3.5 px-4 font-bold">Requested Size</th>
                    <th className="py-3.5 px-4 font-bold">Date Reserved</th>
                    <th className="py-3.5 px-4 font-bold text-right">Direct Ping</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-[var(--text-muted)]">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[var(--gold-accent)]" />
                        Loading merch reservations...
                      </td>
                    </tr>
                  ) : !data?.merch.length ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-[var(--text-muted)]">
                        No merch pre-reservations yet.
                      </td>
                    </tr>
                  ) : (
                    data.merch
                      .filter((m) => {
                        if (!searchQuery) return true;
                        const q = searchQuery.toLowerCase();
                        return (
                          m.email?.toLowerCase().includes(q) ||
                          m.phone?.toLowerCase().includes(q) ||
                          m.size?.toLowerCase().includes(q) ||
                          m.colorway?.toLowerCase().includes(q)
                        );
                      })
                      .map((merch) => {
                        const waNumber = cleanPhone(merch.phone);
                        const waText = encodeURIComponent(
                          `Hello! Your ÌRÍSÍ Sovereign Heavyweight Tee (${merch.colorway}, Size ${merch.size}) reservation is ready for Drop 001!`
                        );
                        const waLink = `https://wa.me/${waNumber}?text=${waText}`;

                        return (
                          <tr key={merch.id} className="hover:bg-[var(--bg-secondary)]/30 transition-colors">
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-sm text-[var(--text-primary)] block">
                                {merch.email}
                              </span>
                              <span className="text-[11px] text-[var(--text-secondary)] font-mono block">
                                WhatsApp: {merch.phone}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 font-mono font-bold">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] ${
                                  merch.colorway === 'Bone White'
                                    ? 'bg-zinc-200 text-zinc-950 font-bold'
                                    : 'bg-zinc-900 text-white border border-white/20'
                                }`}
                              >
                                {merch.colorway}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 font-mono">
                              <span className="px-2 py-0.5 rounded-lg bg-[var(--gold-accent)]/15 text-[var(--gold-accent)] border border-[var(--gold-accent)]/30 font-bold">
                                Size {merch.size}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 font-mono text-[11px] text-[var(--text-secondary)]">
                              {new Date(merch.submittedAt || merch.createdAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono text-[10px] font-bold hover:bg-emerald-500 hover:text-black transition-all inline-flex items-center gap-1"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>WhatsApp Drop Ping</span>
                              </a>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: General VIP Waitlist */}
      {activeSubTab === 'waitlist' && (
        <div className="surface-card rounded-3xl border border-[var(--border-subtle)] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 text-[10px] font-mono-luxury uppercase text-[var(--text-muted)]">
                  <th className="py-3.5 px-4 font-bold">Sovereign Pass #</th>
                  <th className="py-3.5 px-4 font-bold">Shopper Email</th>
                  <th className="py-3.5 px-4 font-bold">Access Tier</th>
                  <th className="py-3.5 px-4 font-bold">Date Secured</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-[var(--text-muted)]">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[var(--gold-accent)]" />
                      Loading VIP roster...
                    </td>
                  </tr>
                ) : !data?.waitlist.length ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-[var(--text-muted)]">
                      No waitlist subscribers yet.
                    </td>
                  </tr>
                ) : (
                  data.waitlist
                    .filter((w) => {
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return w.email?.toLowerCase().includes(q) || w.passNumber?.toString().includes(q);
                    })
                    .map((w) => (
                      <tr key={w.id} className="hover:bg-[var(--bg-secondary)]/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[var(--gold-accent)]">
                          #{w.passNumber}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-sm text-[var(--text-primary)]">
                          {w.email}
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 text-white">
                            Early Runway Access
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-[var(--text-secondary)]">
                          {new Date(w.timestamp || w.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
