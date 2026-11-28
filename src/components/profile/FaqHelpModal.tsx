'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, ChevronDown, Phone, ExternalLink } from 'lucide-react';
import { useBodyScrollLock } from '@/lib/utils/useBodyScrollLock';
import { getConciergeConfig, generateWhatsAppUrl } from '@/lib/config/concierge';

interface FaqHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FaqItem {
  id: string;
  category: 'shopping' | 'sizing' | 'escrow' | 'delivery' | 'returns';
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'escrow',
    question: 'How does ÌRÍSÍ Escrow Protection keep my money safe?',
    answer:
      'Every payment you make at checkout stays locked in ÌRÍSÍ Escrow — brands are never paid upfront. Funds are only released after your parcel arrives and you confirm everything matches your order (or after the 48-hour inspection window).',
  },
  {
    id: 'faq-2',
    category: 'delivery',
    question: 'How do I track my delivery and courier waybill?',
    answer:
      'Open Me → Orders and tap Track on any order. You will see live animated updates as the brand packs, dispatches, and hands off your package — complete with your courier waybill number, rider phone contact, and pre-dispatch photo proof.',
  },
  {
    id: 'faq-3',
    category: 'returns',
    question: 'What if an item arrives damaged, wrong size, or different from photos?',
    answer:
      'You have a full 48-hour inspection window after delivery. Open Track Delivery and tap Report an Issue to immediately freeze escrow and attach photo evidence. Our support desk resolves every dispute within 24–48 business hours.',
  },
  {
    id: 'faq-4',
    category: 'shopping',
    question: 'Are brands and items on ÌRÍSÍ verified?',
    answer:
      'Yes. Every independent clothing brand, native wear tailor, footwear maker, bag studio, jewelry label, and fragrance house passes verification before publishing live drops on ÌRÍSÍ.',
  },
  {
    id: 'faq-5',
    category: 'sizing',
    question: 'How does sizing work across clothing, shoes, and accessories?',
    answer:
      'Apparel uses standard XS–3XL guides (with bespoke notes where applicable), footwear uses EU shoe sizes (38–47), and jewelry, bags, caps, and fragrances list clear dimensions or One Size details directly on each product page.',
  },
  {
    id: 'faq-6',
    category: 'delivery',
    question: 'What is the difference between Doorstep Delivery and Motor Park Waybill?',
    answer:
      'Doorstep Delivery routes your parcel directly to your address via partner couriers with live waybill tracking. Motor Park Waybill sends interstate parcels via trusted transport hubs where you collect from the driver and pay the driver transport fee on arrival.',
  },
  {
    id: 'faq-7',
    category: 'shopping',
    question: 'How do 24h Brand Stories and Follow Alerts work?',
    answer:
      'Follow your favorite brands on Shop to get notified immediately when they publish new drops or 24-hour Lookbook Stories. Unviewed stories appear first with a bright gold ring; viewed stories fade to a subtle grey ring.',
  },
];

const TOPIC_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'escrow', label: 'Escrow' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'returns', label: 'Returns' },
  { id: 'sizing', label: 'Sizing' },
  { id: 'shopping', label: 'Brands' },
];

export default function FaqHelpModal({ isOpen, onClose }: FaqHelpModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredFaqs = useMemo(() => {
    const cleanSearch = searchQuery.toLowerCase().trim();
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        !cleanSearch ||
        item.question.toLowerCase().includes(cleanSearch) ||
        item.answer.toLowerCase().includes(cleanSearch);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const openWhatsAppSupport = () => {
    const cfg = getConciergeConfig();
    const url = generateWhatsAppUrl(
      cfg.whatsappNumber,
      'Hello ÌRÍSÍ Concierge, I have a question about my order.'
    );
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 bg-black/70 backdrop-blur-md animate-fadeIn overscroll-contain"
      onClick={onClose}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div
        className="w-full max-w-xl max-h-[88dvh] bg-[var(--bg-surface)] border-t sm:border border-[var(--border-subtle)] rounded-t-[28px] sm:rounded-[28px] flex flex-col shadow-2xl relative overflow-hidden overscroll-contain animate-slideUp"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* Mobile Native Drag Handle */}
        <div className="pt-3 pb-1 flex justify-center sm:hidden shrink-0">
          <div className="h-1 w-10 rounded-full bg-[var(--border-subtle)]" />
        </div>

        {/* Header */}
        <div className="px-6 pt-4 sm:pt-6 pb-4 border-b border-[var(--border-subtle)] flex items-center justify-between gap-3 shrink-0">
          <div>
            <span className="text-[10px] font-mono-luxury uppercase tracking-[0.18em] text-[var(--gold-accent)] block">
              Help Center
            </span>
            <h3 className="font-editorial text-xl font-normal text-[var(--text-primary)] leading-tight mt-0.5">
              Frequently Asked Questions
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search + Filter Strip */}
        <div className="px-6 pt-4 pb-3 space-y-3 border-b border-[var(--border-subtle)] shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search escrow, delivery, sizing, returns..."
              className="w-full h-10 pl-10 pr-14 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold-accent)] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {TOPIC_FILTERS.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`h-8 px-3.5 rounded-full text-[11px] whitespace-nowrap border transition-colors cursor-pointer shrink-0 ${
                    active
                      ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)]'
                      : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--gold-accent)]/50'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Accordion List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2.5">
          {filteredFaqs.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <p className="text-xs text-[var(--text-muted)] font-light">
                No topics matched &ldquo;{searchQuery}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="text-xs font-mono-luxury text-[var(--gold-accent)] underline cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="rounded-[20px] bg-[var(--bg-primary)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] overflow-hidden">
              {filteredFaqs.map((faq) => {
                const isExpanded = openFaqId === faq.id;
                return (
                  <div key={faq.id}>
                    <button
                      type="button"
                      onClick={() => setOpenFaqId(isExpanded ? null : faq.id)}
                      className="w-full px-4 py-3.5 text-left flex items-center justify-between gap-3 active:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                    >
                      <span className="text-[13px] text-[var(--text-primary)] leading-snug">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-[var(--text-muted)] shrink-0 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 text-[var(--gold-accent)]' : ''
                        }`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 text-xs text-[var(--text-secondary)] font-light leading-relaxed animate-fadeIn">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Concierge Action */}
        <div className="px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]/50 flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="text-xs text-[var(--text-primary)]">Still need help?</div>
            <p className="text-[11px] text-[var(--text-muted)] font-light truncate">
              Chat directly with our concierge team
            </p>
          </div>
          <button
            type="button"
            onClick={openWhatsAppSupport}
            className="h-10 px-4 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-[11px] font-mono-luxury uppercase tracking-wider inline-flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <Phone className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
            <span>WhatsApp</span>
            <ExternalLink className="h-3 w-3 opacity-70" />
          </button>
        </div>

        <div className="h-safe-area-bottom sm:hidden" />
      </div>
    </div>
  );
}
