'use client';

import React from 'react';

interface EmailDomainSuggestionsProps {
  email: string;
  onSelectDomain: (fullEmail: string) => void;
  className?: string;
}

const COMMON_DOMAINS = ['@gmail.com', '@yahoo.com', '@outlook.com', '@icloud.com'];

export default function EmailDomainSuggestions({
  email,
  onSelectDomain,
  className = '',
}: EmailDomainSuggestionsProps) {
  const clean = (email || '').trim();

  // Only show suggestions if user has started typing, but hasn't finished entering a top-level domain (.com, .net, etc.)
  const shouldShow =
    clean.length >= 2 &&
    !/\.(com|net|org|co|ng|edu|io|gov|me|app)($|\s)/i.test(clean);

  if (!shouldShow) return null;

  // Extract prefix before any '@'
  const username = clean.includes('@') ? clean.split('@')[0] : clean;
  if (!username) return null;

  const handleDomainClick = (domain: string) => {
    onSelectDomain(`${username}${domain}`);
  };

  return (
    <div className={`flex items-center gap-1.5 pt-1.5 flex-wrap animate-fadeIn ${className}`}>
      <span className="text-[10px] text-[var(--text-muted)] font-mono-luxury select-none">
        Quick fill:
      </span>
      {COMMON_DOMAINS.map((dom) => (
        <button
          key={dom}
          type="button"
          onClick={() => handleDomainClick(dom)}
          className="px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[10px] text-[var(--text-secondary)] font-mono-luxury font-bold hover:text-[var(--gold-accent)] hover:border-[var(--gold-accent)] active:scale-95 transition-all cursor-pointer shadow-xs"
        >
          {dom}
        </button>
      ))}
    </div>
  );
}
