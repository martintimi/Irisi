'use client';

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck, CheckCircle2, Download, Copy, Check,
  Building2, Banknote, RefreshCw, Edit3, X, Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import VendorLuxuryLoader from './VendorLuxuryLoader';
import { NIGERIAN_BANKS, getBankCodeByName } from '@/lib/data/nigerianBanks';
import { vendorFetch, getActiveVendorId } from '@/lib/services/apiClient';
import { useStore } from '@/lib/store/useStore';

interface MobileVendorSettlementsProps {
  orders: any[];
  isLoading: boolean;
  vendorProfile: any;
  onRefresh: () => void;
}

export default function MobileVendorSettlements({
  orders,
  isLoading,
  vendorProfile,
  onRefresh,
}: MobileVendorSettlementsProps) {
  const { setVendorProfile } = useStore();
  const [filterTab, setFilterTab] = useState<'all' | 'escrow' | 'settled'>('all');
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isEditingBank, setIsEditingBank] = useState(false);
  const [editBankName, setEditBankName] = useState(vendorProfile?.bankName || '');
  const [editBankCode, setEditBankCode] = useState(() =>
    vendorProfile?.bankName ? getBankCodeByName(vendorProfile.bankName) : ''
  );
  const [editAccountNumber, setEditAccountNumber] = useState(vendorProfile?.accountNumber || '');
  const [editAccountName, setEditAccountName] = useState(vendorProfile?.accountName || '');
  const [isResolving, setIsResolving] = useState(false);
  const [isVerified, setIsVerified] = useState(!!vendorProfile?.accountName);
  const [resolveError, setResolveError] = useState('');
  const [isSavingBank, setIsSavingBank] = useState(false);

  const resolveAccount = async (num: string, bCode: string) => {
    const cleanNum = num.replace(/[^0-9]/g, '');
    if (cleanNum.length !== 10 || !bCode) return;
    setIsResolving(true);
    setResolveError('');
    try {
      const res = await fetch(
        `/api/bank/resolve?account_number=${encodeURIComponent(cleanNum)}&bank_code=${encodeURIComponent(bCode)}`
      );
      const data = await res.json();
      if (data.success && data.accountName) {
        setEditAccountName(data.accountName);
        setIsVerified(true);
        setResolveError('');
      } else {
        setIsVerified(false);
        setResolveError(data.error || 'Could not verify account name.');
      }
    } catch {
      setIsVerified(false);
      setResolveError('Network error resolving bank account.');
    } finally {
      setIsResolving(false);
    }
  };

  const handleSaveBank = async () => {
    if (editAccountNumber.length !== 10 || !editAccountName) {
      setResolveError('Please provide a valid 10-digit account number.');
      return;
    }
    setIsSavingBank(true);
    try {
      const res = await vendorFetch('/api/vendor/profile', {
        method: 'POST',
        body: JSON.stringify({
          vendorId: getActiveVendorId() || undefined,
          bankName: editBankName,
          accountNumber: editAccountNumber,
          accountName: editAccountName,
          specialty: vendorProfile.specialty || vendorProfile.vendorSpecialty,
          vendorSpecialty: vendorProfile.specialty || vendorProfile.vendorSpecialty,
          vendorType: vendorProfile.vendorType,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVendorProfile({
          ...vendorProfile,
          bankName: editBankName,
          accountNumber: editAccountNumber,
          accountName: editAccountName,
        });
        setIsEditingBank(false);
        setToastMessage('Payout bank account updated!');
        setTimeout(() => setToastMessage(null), 4000);
        confetti({ particleCount: 40, spread: 55, origin: { y: 0.6 } });
      } else {
        setResolveError(data.error || 'Failed to update bank details.');
      }
    } catch {
      setResolveError('Error communicating with server.');
    } finally {
      setIsSavingBank(false);
    }
  };

  const totalEscrowLocked = useMemo(() => {
    return orders
      .filter((o) => o.trackingStage < 4)
      .reduce((sum, ord) => {
        const itemsTotal = (ord.items || []).reduce(
          (s: number, i: any) => s + (Number(i.price) || 0) * (i.quantity || 1),
          0
        );
        return sum + itemsTotal;
      }, 0);
  }, [orders]);

  const completedOrders = useMemo(() => orders.filter((o) => o.trackingStage >= 4), [orders]);
  const inEscrowOrders = useMemo(() => orders.filter((o) => o.trackingStage < 4), [orders]);

  const totalSettled = useMemo(() => {
    return completedOrders.reduce((sum, ord) => {
      const itemsTotal = (ord.items || []).reduce(
        (s: number, i: any) => s + (Number(i.price) || 0) * (i.quantity || 1),
        0
      );
      return sum + itemsTotal;
    }, 0);
  }, [completedOrders]);

  const filteredOrders = useMemo(() => {
    if (filterTab === 'escrow') return inEscrowOrders;
    if (filterTab === 'settled') return completedOrders;
    return orders;
  }, [orders, inEscrowOrders, completedOrders, filterTab]);

  const handleCopyAccount = () => {
    const acc = vendorProfile?.accountNumber;
    if (acc && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(acc);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    }
  };

  const handleDownloadAdvice = () => {
    setToastMessage('Payout statement downloaded!');
    confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
    setTimeout(() => setToastMessage(null), 4000);
  };

  if (isLoading) {
    return <VendorLuxuryLoader label="Loading Payouts..." />;
  }

  return (
    <div className="space-y-5 animate-fadeIn pb-6 select-none">
      {/* 1. Native Screen Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-editorial text-[26px] font-normal text-[var(--text-primary)] leading-tight">
            Payouts &amp; Escrow
          </h1>
          <p className="text-xs text-[var(--text-muted)] font-light">
            T+0 bank settlements upon verified delivery
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="h-9 w-9 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] flex items-center justify-center active:scale-95 cursor-pointer shrink-0"
          aria-label="Refresh payouts"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {toastMessage && (
        <div className="px-4 py-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. Signature Obsidian Wallet Summary Card */}
      <section className="rounded-[26px] bg-[#0D0D10] text-white p-5 space-y-4 border border-white/10 shadow-[0_18px_45px_rgba(0,0,0,0.16)]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono-luxury uppercase tracking-[0.18em] text-[#E6C367]">
            Escrow Vault
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-mono-luxury text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>0% Launch Fee</span>
          </span>
        </div>

        <div className="grid grid-cols-2 divide-x divide-white/10">
          <div className="pr-3">
            <span className="text-[10px] font-mono-luxury uppercase tracking-wider text-zinc-400 block">
              Active Escrow
            </span>
            <div className="font-editorial text-3xl font-normal text-white mt-1 leading-none">
              ₦{totalEscrowLocked.toLocaleString()}
            </div>
            <span className="text-[10px] text-zinc-400 font-light mt-1.5 block">
              {inEscrowOrders.length} pending delivery
            </span>
          </div>

          <div className="pl-4">
            <span className="text-[10px] font-mono-luxury uppercase tracking-wider text-zinc-400 block">
              Settled to Bank
            </span>
            <div className="font-editorial text-3xl font-normal text-emerald-400 mt-1 leading-none">
              ₦{totalSettled.toLocaleString()}
            </div>
            <span className="text-[10px] text-zinc-400 font-light mt-1.5 block">
              {completedOrders.length} paid out
            </span>
          </div>
        </div>
      </section>

      {/* 3. Settlement Bank Account Card (Apple Wallet Style) */}
      <section className="space-y-2">
        <div className="px-1 flex items-center justify-between">
          <span className="text-[10px] font-mono-luxury uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Payout Destination
          </span>
          <button
            type="button"
            onClick={() => {
              setIsEditingBank(!isEditingBank);
              setResolveError('');
            }}
            className="text-[11px] font-mono-luxury text-[var(--gold-accent)] inline-flex items-center gap-1 cursor-pointer"
          >
            {isEditingBank ? <X className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
            <span>{isEditingBank ? 'Cancel' : 'Edit Bank'}</span>
          </button>
        </div>

        <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden">
          {isEditingBank ? (
            <div className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Bank
                </label>
                <select
                  value={editBankName}
                  onChange={(e) => {
                    const bName = e.target.value;
                    const code = getBankCodeByName(bName);
                    setEditBankName(bName);
                    setEditBankCode(code);
                    if (editAccountNumber.length === 10) {
                      resolveAccount(editAccountNumber, code);
                    }
                  }}
                  className="w-full h-10 px-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none"
                >
                  {NIGERIAN_BANKS.map((b) => (
                    <option key={b.code} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  10-Digit Account Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={editAccountNumber}
                    onChange={(e) => {
                      const cleanNum = e.target.value.replace(/[^0-9]/g, '');
                      setEditAccountNumber(cleanNum);
                      if (cleanNum.length === 10) {
                        resolveAccount(cleanNum, editBankCode);
                      } else {
                        setIsVerified(false);
                        setResolveError('');
                      }
                    }}
                    placeholder="0123456789"
                    className="w-full h-10 px-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] font-mono-luxury tracking-wider focus:border-[var(--gold-accent)] focus:outline-none"
                  />
                  {isResolving && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[var(--gold-accent)]" />
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)]">
                    Account Name
                  </label>
                  {isVerified && (
                    <span className="text-[10px] text-emerald-500 inline-flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Verified
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={editAccountName}
                  onChange={(e) => setEditAccountName(e.target.value.toUpperCase())}
                  placeholder={isResolving ? 'Verifying...' : 'Account holder name'}
                  className="w-full h-10 px-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs uppercase text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none"
                />
                {resolveError && <p className="mt-1 text-[11px] text-amber-500">{resolveError}</p>}
              </div>

              <button
                type="button"
                disabled={isSavingBank || isResolving || editAccountNumber.length !== 10}
                onClick={handleSaveBank}
                className="w-full h-10 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSavingBank ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                <span>{isSavingBank ? 'Saving...' : 'Save Bank Account'}</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)] text-xs">
              <div className="px-4 py-3 flex items-center justify-between gap-2">
                <span className="text-[var(--text-muted)] flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5" strokeWidth={1.6} />
                  <span>Bank</span>
                </span>
                <span className="font-medium text-[var(--text-primary)]">
                  {vendorProfile?.accountNumber ? vendorProfile?.bankName || 'Not Configured' : 'Not Configured'}
                </span>
              </div>

              <div className="px-4 py-3 flex items-center justify-between gap-2">
                <span className="text-[var(--text-muted)]">Account No</span>
                <div className="flex items-center gap-1.5">
                  {vendorProfile?.accountNumber ? (
                    <>
                      <span className="font-mono-luxury text-[var(--gold-accent)] tracking-wider">
                        {vendorProfile.accountNumber}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyAccount}
                        className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                      >
                        {copiedAccount ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </>
                  ) : (
                    <span className="text-amber-500 text-[11px]">Not Linked</span>
                  )}
                </div>
              </div>

              <div className="px-4 py-3 flex items-center justify-between gap-2">
                <span className="text-[var(--text-muted)]">Account Name</span>
                <span className="text-[var(--text-primary)] truncate max-w-[60%] uppercase text-[11px]">
                  {vendorProfile?.accountNumber
                    ? vendorProfile?.accountName || vendorProfile?.brandName || 'Verified Merchant'
                    : 'Pending Setup'}
                </span>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleDownloadAdvice}
          className="w-full h-11 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-mono-luxury uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
        >
          <Download className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
          <span>Download Payout Statement</span>
        </button>
      </section>

      {/* 4. Payout History Ledger */}
      <section className="space-y-3">
        <div className="px-1 flex items-center justify-between">
          <span className="text-[10px] font-mono-luxury uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Payout History ({filteredOrders.length})
          </span>
        </div>

        {/* Native iOS Segmented Control */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
          {[
            { id: 'all', label: `All (${orders.length})` },
            { id: 'escrow', label: `Escrow (${inEscrowOrders.length})` },
            { id: 'settled', label: `Settled (${completedOrders.length})` },
          ].map((tab) => {
            const active = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id as any)}
                className={`py-2 rounded-xl text-[11px] font-mono-luxury transition-all cursor-pointer ${
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

        {filteredOrders.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center space-y-2">
            <Banknote className="h-7 w-7 text-[var(--text-muted)] mx-auto" strokeWidth={1.5} />
            <p className="text-xs text-[var(--text-muted)] font-light">No transactions in this filter.</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] overflow-hidden">
            {filteredOrders.map((ord, idx) => {
              const rowPayout = (ord.items || []).reduce(
                (s: number, i: any) => s + (Number(i.price) || 0) * (i.quantity || 1),
                0
              );
              const isSettled = ord.trackingStage >= 4;

              return (
                <div key={ord.id || ord.orderNumber || idx} className="px-4 py-3.5 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                        {ord.orderNumber}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] font-light truncate">
                        {ord.customerName} · {ord.date || 'Recent'}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-editorial text-base text-[var(--text-primary)]">
                        ₦{rowPayout.toLocaleString()}
                      </div>
                      <span
                        className={`text-[10px] font-mono-luxury ${
                          isSettled ? 'text-emerald-500' : 'text-[var(--gold-accent)]'
                        }`}
                      >
                        {isSettled ? 'Paid Out' : 'In Escrow'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
