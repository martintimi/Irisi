import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface BrandWordmarkProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withSubtitle?: boolean;
  withIcon?: boolean;
  iconPosition?: 'left' | 'top';
  isLink?: boolean;
  className?: string;
  themeInvert?: boolean;
}

export default function BrandWordmark({
  size = 'md',
  withSubtitle = true,
  withIcon = true,
  iconPosition = 'left',
  isLink = true,
  className = '',
  themeInvert = false,
}: BrandWordmarkProps) {
  // Dimension presets
  const sizeStyles = {
    sm: {
      icon: 28,
      text: 'text-lg sm:text-xl tracking-[0.22em]',
      sub: 'text-[7px] tracking-[0.28em]',
      gap: 'gap-2.5',
    },
    md: {
      icon: 38,
      text: 'text-2xl sm:text-3xl tracking-[0.25em]',
      sub: 'text-[8px] sm:text-[9px] tracking-[0.35em]',
      gap: 'gap-3',
    },
    lg: {
      icon: 48,
      text: 'text-3xl sm:text-4xl tracking-[0.28em]',
      sub: 'text-[9px] sm:text-[10px] tracking-[0.4em]',
      gap: 'gap-3.5',
    },
    xl: {
      icon: 60,
      text: 'text-4xl sm:text-5xl tracking-[0.32em]',
      sub: 'text-[11px] tracking-[0.45em]',
      gap: 'gap-4',
    },
  };

  const current = sizeStyles[size];

  const content = (
    <div
      className={`flex items-center justify-center select-none group transition-transform duration-300 ${
        iconPosition === 'top' ? 'flex-col gap-1.5 text-center' : `${current.gap} text-left`
      } ${className}`}
    >
      {/* Official App Logo Emblem */}
      {withIcon && (
        <div
          className="relative shrink-0 overflow-hidden rounded-xl shadow-md border border-black/15 dark:border-white/15 group-hover:scale-105 transition-transform duration-300"
          style={{ width: current.icon, height: current.icon }}
        >
          <Image
            src="/images/logo/irisi-icon.png"
            alt="ÌRÍSÍ Logo"
            width={current.icon}
            height={current.icon}
            className="w-full h-full object-cover"
            priority
          />
        </div>
      )}

      {/* Editorial Typographic Wordmark */}
      <div className={`flex flex-col ${iconPosition === 'top' ? 'items-center text-center' : 'text-left'}`}>
        <span
          className={`font-editorial font-bold uppercase transition-colors duration-300 leading-tight ${current.text} ${
            themeInvert
              ? 'text-white'
              : 'text-zinc-950 dark:text-white group-hover:text-[var(--gold-accent)]'
          }`}
          style={{ fontFeatureSettings: '"liga" 1, "kern" 1' }}
        >
          Ì R Í S Í
        </span>

        {/* Cultural Nigerian Luxury Subtitle */}
        {withSubtitle && (
          <span
            className={`font-mono-luxury font-bold uppercase text-[var(--gold-accent)] mt-0.5 ${current.sub}`}
          >
            Nigeria · Luxury Marketplace
          </span>
        )}
      </div>
    </div>
  );

  if (isLink) {
    return (
      <Link href="/" className="inline-flex items-center justify-center focus:outline-none" aria-label="Ìrísí Home">
        {content}
      </Link>
    );
  }

  return content;
}
