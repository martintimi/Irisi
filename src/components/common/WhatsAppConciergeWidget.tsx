'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Send, CreditCard, ShieldAlert, Clock, 
  Truck, Edit3, ShieldCheck, PackageCheck, Store,
  MessageCircle, AlertCircle
} from 'lucide-react';
import { getConciergeConfig, generateWhatsAppUrl } from '@/lib/config/concierge';
import { useStore } from '@/lib/store/useStore';

export default function WhatsAppConciergeWidget() {
  const pathname = usePathname();
  const { cart, bodyProfile, vendorProfile, userAuth } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState(getConciergeConfig());
  const isDraggingRef = useRef(false);

  // Check if current page is in Vendor Portal
  const isVendorMode = pathname.startsWith('/vendor');

  // Customer support accessible to shoppers; vendor support accessible to vendors
  const isCustomerLoggedIn = !!userAuth?.isLoggedIn;
  const isVendorLoggedIn = !!vendorProfile?.email || !!vendorProfile?.brandName;
  const isAuthorized = isVendorMode ? (isVendorLoggedIn || isCustomerLoggedIn) : true;

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [isOpen]);

  // Reload config when changed in Super Admin or storage, and fetch live from server API / Supabase
  useEffect(() => {
    const handleStorage = () => setConfig(getConciergeConfig());
    window.addEventListener('storage', handleStorage);

    // Fetch live config from server API (reads directly from Supabase database)
    fetch('/api/concierge', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.config?.whatsappNumber) {
          setConfig((prev) => ({ ...prev, ...data.config }));
        }
      })
      .catch(() => {});

    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // 1. Simple, Everyday English Customer Issues
  const customerTopics = [
    {
      id: 'debit',
      title: 'Money deducted but no order showing',
      icon: CreditCard,
      template: 'Hello Ìrísí, my account was debited for payment, but my order is not showing on the app. Please help me confirm it.'
    },
    {
      id: 'wrong_fit',
      title: 'Wrong size or cloth arrived damaged',
      icon: ShieldAlert,
      template: 'Hello Ìrísí, my clothes arrived but the size does not fit / item is damaged. Please hold the escrow payment so we can arrange an exchange or return.'
    },
    {
      id: 'delayed',
      title: 'Order is delayed / vendor has not sent it',
      icon: Clock,
      template: 'Hello Ìrísí, my order is delayed and the designer has not dispatched it yet. Can you please check on this for me?'
    },
    {
      id: 'rush',
      title: 'I need urgent / rush delivery for an event',
      icon: Truck,
      template: `Hello Ìrísí, I have an upcoming event and I need this delivered urgently${bodyProfile?.state ? ` to ${bodyProfile.state}` : ''}. How fast can it get to me?`
    },
    {
      id: 'custom',
      title: 'Type my own question',
      icon: Edit3,
      template: ''
    }
  ];

  // 2. Simple, Everyday English Vendor Issues
  const brandName = vendorProfile?.brandName || 'My Brand';
  const vendorTopics = [
    {
      id: 'account_approval',
      title: 'My brand account is not yet approved',
      icon: ShieldCheck,
      template: `Hello Ìrísí Team, I registered my fashion brand (${brandName}) and my account is still waiting for approval. Please when will it be approved?`
    },
    {
      id: 'payout',
      title: 'When will I receive my money / payout?',
      icon: CreditCard,
      template: `Hello Ìrísí Finance, I have delivered orders and want to confirm when the payment will enter my bank account.`
    },
    {
      id: 'pickup',
      title: 'Delivery rider has not picked up the order',
      icon: Truck,
      template: `Hello Ìrísí Logistics, the package is ready for dispatch but the delivery rider has not come to pick it up.`
    },
    {
      id: 'declined',
      title: 'My product was rejected / not approved',
      icon: PackageCheck,
      template: `Hello Ìrísí, one of the products I uploaded was not approved. What do I need to fix so it can be approved?`
    },
    {
      id: 'custom_vendor',
      title: 'Type my own question',
      icon: Edit3,
      template: ''
    }
  ];

  const activeTopics = isVendorMode ? vendorTopics : customerTopics;
  const [selectedTopicId, setSelectedTopicId] = useState(activeTopics[0].id);
  const [customMessage, setCustomMessage] = useState(activeTopics[0].template);

  // Sync default topic when switching between customer and vendor portal
  useEffect(() => {
    const defaultTopic = isVendorMode ? vendorTopics[0] : customerTopics[0];
    setSelectedTopicId(defaultTopic.id);
    setCustomMessage(defaultTopic.template);
  }, [isVendorMode]);

  const handleSelectTopic = (topic: typeof customerTopics[0]) => {
    setSelectedTopicId(topic.id);
    setCustomMessage(topic.template);
  };

  const handleOpenWhatsApp = () => {
    const selected = activeTopics.find(t => t.id === selectedTopicId);
    const title = selected ? selected.title : 'Support';
    const textToSend = customMessage.trim() || title;
    const finalMsg = `*${title.toUpperCase()}*\n\n${textToSend}`;
    const url = generateWhatsAppUrl(config.whatsappNumber, finalMsg);
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  // Only show if enabled, logged in, and not on Super Admin
  if (!config.isEnabled || !isAuthorized || pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      {/* 1. FLOATING DRAGGABLE WHATSAPP BUTTON (FREELY DRAGGABLE ANYWHERE) */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.08}
        whileDrag={{ scale: 1.08 }}
        onDragStart={() => {
          isDraggingRef.current = true;
        }}
        onDragEnd={() => {
          setTimeout(() => {
            isDraggingRef.current = false;
          }, 120);
        }}
        className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-40 touch-none cursor-grab active:cursor-grabbing select-none"
      >
        <button
          type="button"
          onClick={() => {
            if (isDraggingRef.current) return;
            setIsOpen(!isOpen);
          }}
          className="group relative flex items-center justify-center h-12 w-12 md:h-auto md:w-auto md:px-4 md:py-3 rounded-full bg-[#128C7E] hover:bg-[#075E54] text-white shadow-[0_10px_25px_rgba(18,140,126,0.4)] border border-white/20 transition-transform cursor-pointer"
          title={isVendorMode ? 'Vendor Support' : 'Ìrísí Support'}
          aria-label={isVendorMode ? 'Vendor Support' : 'Ìrísí Support'}
        >
          {/* Active online pulse (desktop only) */}
          <span className="relative hidden md:inline-flex h-2.5 w-2.5 shrink-0 mr-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-200" />
          </span>

          {/* Official WhatsApp Glyph */}
          <svg className="h-6 w-6 md:h-4 md:w-4 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>

          {/* Desktop Only Text Label */}
          <span className="font-mono-luxury text-xs uppercase font-bold tracking-wider hidden md:inline-block">
            {isVendorMode ? 'Vendor Support' : 'Ìrísí Support'}
          </span>

          <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold-accent)] hidden md:inline-block" />

          <span className="text-[10px] font-mono-luxury text-emerald-100 hidden md:inline-block">
            Online
          </span>
        </button>
      </motion.div>

      {/* 2. THEME-AWARE MODAL (PERFECT IN LIGHT & DARK MODE, NON-LEAKING SCROLL) */}
      <AnimatePresence>
        {isOpen && (
          <div 
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              data-lenis-prevent="true"
              className="w-full max-w-md max-h-[92vh] flex flex-col bg-white dark:bg-[#121216] text-zinc-900 dark:text-zinc-100 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden text-left my-auto"
            >
              {/* 1. Clean Fixed Top Header */}
              <div className="shrink-0 p-4 sm:p-5 bg-gradient-to-r from-[#075E54] to-[#128C7E] text-white flex items-center justify-between shadow-sm">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                    <h3 className="font-editorial text-lg sm:text-xl font-bold tracking-wide">
                      {isVendorMode ? 'Vendor Help Desk' : 'Ìrísí Customer Support'}
                    </h3>
                  </div>
                  <p className="text-[11px] sm:text-xs font-mono-luxury text-emerald-100">
                    Chat with us on WhatsApp · We typically reply in minutes
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* 2. Scrollable Middle Body (Smoothly scrollable, Lenis-isolated, never scrolls background) */}
              <div 
                data-lenis-prevent="true"
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 overscroll-contain"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {/* Select topic */}
                <div className="space-y-2">
                  <label className="text-xs font-mono-luxury font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider block">
                    What can we help you with?
                  </label>

                  <div className="space-y-1.5">
                    {activeTopics.map((t) => {
                      const Icon = t.icon;
                      const isSelected = selectedTopicId === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleSelectTopic(t)}
                          className={`w-full p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-[#128C7E] text-[#075E54] dark:text-emerald-300 font-bold shadow-sm'
                              : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-800 dark:text-zinc-200'
                          }`}
                        >
                          <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected 
                              ? 'bg-[#128C7E] text-white' 
                              : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                          }`}>
                            <Icon className="h-4 w-4" />
                          </div>

                          <span className="text-xs font-medium leading-snug">
                            {t.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Message input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono-luxury font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider block">
                    Your Message:
                  </label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={3}
                    placeholder="Type your message here..."
                    className="w-full p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-[#128C7E] resize-none"
                  />
                  <p className="text-[11px] text-zinc-400">
                    You can edit or add more details directly in WhatsApp before sending.
                  </p>
                </div>
              </div>

              {/* 3. Fixed Bottom Action Footer (ALWAYS 100% VISIBLE, NEVER CUT OFF!) */}
              <div className="shrink-0 p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#121216] space-y-2">
                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="w-full py-3.5 rounded-2xl bg-[#128C7E] hover:bg-[#075E54] text-white font-mono-luxury uppercase text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <Send className="h-4 w-4" />
                  <span>Open WhatsApp Chat</span>
                </button>

                <div className="text-center text-[11px] text-zinc-500 dark:text-zinc-400 font-mono-luxury">
                  Support Line: +{config.whatsappNumber}
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
