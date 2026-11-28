'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users, Crown, Sparkles, RefreshCw, ShoppingBag, Heart,
  Mail, MessageCircle, Lock, ArrowRight, Star, Eye, UserPlus, Award
} from 'lucide-react';
import { useStore } from '@/lib/store/useStore';
import { getActiveVendorId } from '@/lib/services/apiClient';
import VendorLuxuryLoader from '@/components/vendor/VendorLuxuryLoader';

interface TopBuyer {
  rank: number;
  key: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  ordersCount: number;
  itemsBought: number;
  totalSpent: number;
  lastOrderDate: string;
  isFollower: boolean;
  favoritePieces: string[];
}

interface FollowerItem {
  email: string;
  name: string;
  followedAt: string;
  hasPurchased: boolean;
  ordersCount: number;
  totalSpent: number;
  city: string;
  phone: string;
}

interface InteractionItem {
  id: string;
  type: 'reaction' | 'story_view' | 'follow' | 'review';
  actorName: string;
  detail: string;
  emoji?: string;
  rating?: number;
  timestamp: string;
}

function formatShortDate(iso?: string): string {
  if (!iso) return 'Recent';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Recent';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function VendorAudiencePage() {
  const { vendorProfile } = useStore();
  const [activeTab, setActiveTab] = useState<'buyers' | 'followers' | 'interactions'>('buyers');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [plan, setPlan] = useState<{
    isPlus: boolean;
    hasPaidPlus: boolean;
    freeLaunchMode: boolean;
    plusMonthlyPriceNgn: number;
    isLockedByPlan: boolean;
  } | null>(null);

  const [summary, setSummary] = useState({
    totalFollowers: 0,
    totalUniqueBuyers: 0,
    repeatBuyersCount: 0,
    followersWhoBought: 0,
    followerConversionPercent: 0,
    storyViewsTotal: 0,
    storyReactionsTotal: 0,
    activeStoriesCount: 0,
  });

  const [topBuyers, setTopBuyers] = useState<TopBuyer[]>([]);
  const [followers, setFollowers] = useState<FollowerItem[]>([]);
  const [interactions, setInteractions] = useState<InteractionItem[]>([]);

  const loadAudience = useCallback(async (isRefresh = false) => {
    const vid = getActiveVendorId() || vendorProfile.id || vendorProfile.email || '';
    if (!vid) {
      setLoading(false);
      return;
    }
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setErrorMsg('');

      const res = await fetch(`/api/vendor/audience?vendorId=${encodeURIComponent(vid)}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not load audience insights.');
      }

      setPlan(data.plan || null);
      if (data.summary) setSummary(data.summary);
      setTopBuyers(Array.isArray(data.topBuyers) ? data.topBuyers : []);
      setFollowers(Array.isArray(data.followers) ? data.followers : []);
      setInteractions(Array.isArray(data.interactions) ? data.interactions : []);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error loading audience data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [vendorProfile.id, vendorProfile.email]);

  useEffect(() => {
    loadAudience(false);
  }, [loadAudience]);

  if (loading) {
    return <VendorLuxuryLoader label="Loading Followers, VIP Buyers & Interactions..." />;
  }

  const isLocked = Boolean(plan?.isLockedByPlan);
  const plusPrice = plan?.plusMonthlyPriceNgn ?? 5000;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-fadeIn">
      {/* 1. Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono-luxury uppercase tracking-[0.2em] text-[var(--gold-accent)]">
            <Crown className="h-3 w-3" />
            <span>Audience &amp; VIP Intelligence</span>
          </span>
          <h1 className="font-editorial text-2xl sm:text-4xl font-normal text-[var(--text-primary)] leading-tight mt-0.5">
            Followers &amp; Top Buyers
          </h1>
          <p className="text-xs text-[var(--text-muted)] font-light mt-0.5">
            Track everyone following your brand, your highest-spending VIP shoppers, and live story interactions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadAudience(true)}
          disabled={refreshing}
          className="h-9 w-9 sm:w-auto sm:px-4 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--gold-accent)] flex items-center justify-center gap-1.5 text-xs font-mono-luxury active:scale-95 transition-all cursor-pointer shrink-0"
          aria-label="Refresh audience"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-500">
          {errorMsg}
        </div>
      )}

      {/* 2. Signature Obsidian Audience KPI Hero Card */}
      <section className="rounded-[26px] bg-[#0D0D10] text-white p-5 sm:p-6 space-y-5 border border-white/10 shadow-[0_18px_45px_rgba(0,0,0,0.16)]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono-luxury uppercase tracking-[0.18em] text-[#E6C367]">
            Community Overview
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] font-mono-luxury text-zinc-200">
            {isLocked ? (
              <>
                <Lock className="h-3 w-3 text-[#E6C367]" />
                <span>Free Preview</span>
              </>
            ) : (
              <>
                <Crown className="h-3 w-3 text-[#E6C367]" />
                <span>ÌRÍSÍ Plus Unlocked</span>
              </>
            )}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 divide-x divide-white/10">
          <div className="pr-2">
            <span className="text-[10px] font-mono-luxury uppercase tracking-wider text-zinc-400 block">
              Followers
            </span>
            <div className="font-editorial text-3xl font-normal text-white mt-1 leading-none">
              {summary.totalFollowers}
            </div>
            <span className="text-[10px] text-zinc-400 font-light mt-1.5 block">
              {summary.followersWhoBought} bought from you
            </span>
          </div>

          <div className="pl-3 sm:pl-4">
            <span className="text-[10px] font-mono-luxury uppercase tracking-wider text-zinc-400 block">
              Unique Buyers
            </span>
            <div className="font-editorial text-3xl font-normal text-[#E6C367] mt-1 leading-none">
              {summary.totalUniqueBuyers}
            </div>
            <span className="text-[10px] text-zinc-400 font-light mt-1.5 block">
              {summary.repeatBuyersCount} repeat VIP{summary.repeatBuyersCount === 1 ? '' : 's'}
            </span>
          </div>

          <div className="pr-2 sm:pl-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/10">
            <span className="text-[10px] font-mono-luxury uppercase tracking-wider text-zinc-400 block">
              Story Reactions
            </span>
            <div className="font-editorial text-3xl font-normal text-white mt-1 leading-none">
              {summary.storyReactionsTotal}
            </div>
            <span className="text-[10px] text-zinc-400 font-light mt-1.5 block">
              {summary.storyViewsTotal} live story views
            </span>
          </div>

          <div className="pl-3 sm:pl-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/10">
            <span className="text-[10px] font-mono-luxury uppercase tracking-wider text-zinc-400 block">
              Follower Conv.
            </span>
            <div className="font-editorial text-3xl font-normal text-emerald-400 mt-1 leading-none">
              {summary.followerConversionPercent}%
            </div>
            <span className="text-[10px] text-zinc-400 font-light mt-1.5 block">
              Followers who ordered
            </span>
          </div>
        </div>
      </section>

      {/* 3. Free Plan Smart Upgrade Gate Banner (When Free Trial Is Off & Vendor Is Not Plus) */}
      {isLocked && (
        <div className="p-5 sm:p-6 rounded-3xl surface-card border border-[var(--gold-accent)]/40 bg-[var(--gold-subtle)]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-mono-luxury uppercase tracking-widest text-[var(--gold-accent)]">
              <Crown className="h-3.5 w-3.5" />
              <span>ÌRÍSÍ Plus Feature</span>
            </div>
            <h2 className="font-editorial text-xl font-normal text-[var(--text-primary)]">
              Unlock Your Full Follower List, VIP Buyers &amp; Drop Alerts
            </h2>
            <p className="text-xs text-[var(--text-secondary)] font-light max-w-xl leading-relaxed">
              Shoppers can always follow your brand on the Free plan so your audience keeps growing. Upgrade to ÌRÍSÍ Plus (₦{plusPrice.toLocaleString()}/month — or pay from Escrow earnings) to reveal every follower, see who spends the most, track live story reactions, and send automatic new-drop alerts.
            </p>
          </div>
          <Link
            href="/vendor-portal/plus"
            className="inline-flex items-center justify-center gap-2 px-5 h-11 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase tracking-wider hover:opacity-90 transition-all shrink-0"
          >
            <span>Unlock with Plus</span>
            <ArrowRight className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
          </Link>
        </div>
      )}

      {/* 4. Native Segmented Tabs */}
      <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
        {[
          { id: 'buyers', label: `Top Buyers (${summary.totalUniqueBuyers})` },
          { id: 'followers', label: `Followers (${summary.totalFollowers})` },
          { id: 'interactions', label: `Interactions (${interactions.length})` },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2.5 rounded-xl text-[11px] font-mono-luxury transition-all cursor-pointer ${
                active
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border-subtle)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 5A. TOP BUYERS / VIP CUSTOMERS TAB */}
      {activeTab === 'buyers' && (
        <section className="space-y-3">
          {topBuyers.length === 0 ? (
            <div className="p-10 rounded-3xl surface-card border border-[var(--border-subtle)] text-center space-y-2.5">
              <Award className="h-8 w-8 text-[var(--gold-accent)] mx-auto opacity-70" strokeWidth={1.5} />
              <h3 className="font-editorial text-xl font-normal text-[var(--text-primary)]">
                No Completed Orders Yet
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-light max-w-sm mx-auto">
                Once shoppers start ordering from your brand, your highest-spending repeat clients will automatically rank here.
              </p>
            </div>
          ) : (
            <div className={`rounded-3xl surface-card border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] overflow-hidden ${isLocked ? 'relative' : ''}`}>
              {topBuyers.map((buyer) => {
                const isTop3 = buyer.rank <= 3;
                const cleanWa = buyer.phone ? buyer.phone.replace(/[^0-9]/g, '') : '';
                return (
                  <div
                    key={buyer.key}
                    className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isLocked ? 'blur-[3px] select-none pointer-events-none opacity-75' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center font-mono-luxury text-xs shrink-0 border ${
                          isTop3
                            ? 'bg-[var(--gold-subtle)] border-[var(--gold-accent)]/50 text-[var(--gold-accent)]'
                            : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-muted)]'
                        }`}
                      >
                        #{buyer.rank}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                            {buyer.name}
                          </span>
                          {buyer.ordersCount >= 2 && (
                            <span className="px-2 py-0.5 rounded-full bg-[var(--gold-subtle)] text-[var(--gold-accent)] text-[9px] font-mono-luxury uppercase">
                              VIP Repeat
                            </span>
                          )}
                          {buyer.isFollower && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-mono-luxury uppercase">
                              Follower
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-[var(--text-muted)] font-light flex items-center gap-2 flex-wrap">
                          <span>{buyer.ordersCount} order{buyer.ordersCount === 1 ? '' : 's'}</span>
                          <span>·</span>
                          <span>{buyer.itemsBought} piece{buyer.itemsBought === 1 ? '' : 's'}</span>
                          {buyer.city && (
                            <>
                              <span>·</span>
                              <span>{buyer.city}</span>
                            </>
                          )}
                          <span>·</span>
                          <span>Last: {formatShortDate(buyer.lastOrderDate)}</span>
                        </div>

                        {buyer.favoritePieces.length > 0 && (
                          <p className="text-[11px] text-[var(--text-secondary)] truncate max-w-md font-light">
                            Bought: {buyer.favoritePieces.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pl-12 sm:pl-0 shrink-0">
                      <div className="text-left sm:text-right">
                        <div className="font-editorial text-xl font-normal text-[var(--text-primary)]">
                          ₦{buyer.totalSpent.toLocaleString()}
                        </div>
                        <span className="text-[10px] font-mono-luxury text-[var(--text-muted)] uppercase">
                          Lifetime Spend
                        </span>
                      </div>

                      {!isLocked && (cleanWa || buyer.email) && (
                        <div className="flex items-center gap-1.5">
                          {cleanWa && (
                            <a
                              href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(
                                `Hi ${buyer.name}, thank you for supporting ${vendorProfile.brandName || 'our brand'} on ÌRÍSÍ! We appreciate you.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-9 w-9 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] hover:border-emerald-500 text-emerald-500 flex items-center justify-center transition-colors"
                              title="Send VIP thank-you on WhatsApp"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </a>
                          )}
                          {buyer.email && (
                            <a
                              href={`mailto:${buyer.email}?subject=${encodeURIComponent(
                                `Thank you from ${vendorProfile.brandName || 'our brand'}`
                              )}`}
                              className="h-9 w-9 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] hover:border-[var(--gold-accent)] text-[var(--text-secondary)] hover:text-[var(--gold-accent)] flex items-center justify-center transition-colors"
                              title="Email VIP client"
                            >
                              <Mail className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* 5B. FOLLOWERS DIRECTORY TAB */}
      {activeTab === 'followers' && (
        <section className="space-y-3">
          {followers.length === 0 ? (
            <div className="p-10 rounded-3xl surface-card border border-[var(--border-subtle)] text-center space-y-2.5">
              <Users className="h-8 w-8 text-[var(--gold-accent)] mx-auto opacity-70" strokeWidth={1.5} />
              <h3 className="font-editorial text-xl font-normal text-[var(--text-primary)]">
                No Followers Yet
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-light max-w-sm mx-auto">
                Share your storefront link and post 24h Lookbook Stories so shoppers follow your brand for drop alerts.
              </p>
            </div>
          ) : (
            <div className="rounded-3xl surface-card border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] overflow-hidden">
              {followers.map((f) => {
                const initial = (f.name || 'S').trim().charAt(0).toUpperCase();
                return (
                  <div
                    key={f.email + f.followedAt}
                    className={`p-4 flex items-center justify-between gap-3 ${
                      isLocked ? 'blur-[3px] select-none pointer-events-none opacity-75' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center font-editorial text-base text-[var(--gold-accent)] shrink-0">
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                            {f.name}
                          </span>
                          {f.hasPurchased && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-mono-luxury uppercase">
                              Buyer · {f.ordersCount}x
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] font-light truncate">
                          {f.email} · Followed {formatShortDate(f.followedAt)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {f.hasPurchased ? (
                        <div>
                          <div className="font-editorial text-base text-[var(--text-primary)]">
                            ₦{f.totalSpent.toLocaleString()}
                          </div>
                          <span className="text-[9px] font-mono-luxury uppercase text-emerald-500">
                            Verified Spend
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono-luxury text-[var(--text-muted)] uppercase">
                          Watching Drops
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* 5C. LIVE INTERACTIONS FEED TAB */}
      {activeTab === 'interactions' && (
        <section className="space-y-3">
          {interactions.length === 0 ? (
            <div className="p-10 rounded-3xl surface-card border border-[var(--border-subtle)] text-center space-y-2.5">
              <Sparkles className="h-8 w-8 text-[var(--gold-accent)] mx-auto opacity-70" strokeWidth={1.5} />
              <h3 className="font-editorial text-xl font-normal text-[var(--text-primary)]">
                No Recent Interactions Yet
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-light max-w-sm mx-auto">
                Story reactions, story views, new follows, and verified reviews will stream live right here.
              </p>
            </div>
          ) : (
            <div className="rounded-3xl surface-card border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] overflow-hidden">
              {interactions.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 flex items-center justify-between gap-3 ${
                    isLocked ? 'blur-[3px] select-none pointer-events-none opacity-75' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
                      {item.type === 'reaction' ? (
                        <span className="text-base">{item.emoji || '🔥'}</span>
                      ) : item.type === 'story_view' ? (
                        <Eye className="h-4 w-4 text-[var(--text-secondary)]" />
                      ) : item.type === 'review' ? (
                        <Star className="h-4 w-4 text-[var(--gold-accent)] fill-current" />
                      ) : (
                        <UserPlus className="h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-[var(--text-primary)] truncate">
                        {item.actorName}
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] font-light line-clamp-1 mt-0.5">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono-luxury text-[var(--text-muted)] shrink-0">
                    {formatShortDate(item.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
