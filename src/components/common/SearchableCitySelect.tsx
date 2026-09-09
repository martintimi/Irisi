'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, MapPin, Check, ChevronDown, Plus, X } from 'lucide-react';
import { getCitiesForState } from '@/lib/data/nigeriaLocations';

interface SearchableCitySelectProps {
  state: string;
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export default function SearchableCitySelect({
  state,
  value,
  onChange,
  placeholder = 'Select or search city / area',
  disabled = false,
  required = false,
  className = '',
}: SearchableCitySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const availableCities = useMemo(() => {
    if (!state) return [];
    return getCitiesForState(state);
  }, [state]);

  const filteredCities = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return availableCities;
    return availableCities.filter((c) => c.toLowerCase().includes(q));
  }, [availableCities, searchQuery]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  const handleSelectCity = (city: string) => {
    onChange(city);
    setIsOpen(false);
    setSearchQuery('');
  };

  if (!state) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] cursor-not-allowed flex items-center justify-between">
          <span>Select state first</span>
          <ChevronDown className="h-4 w-4 opacity-40" />
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border ${
          isOpen ? 'border-[var(--gold-accent)] ring-1 ring-[var(--gold-accent)]/30' : 'border-[var(--border-subtle)]'
        } text-xs text-[var(--text-primary)] font-bold flex items-center justify-between gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span className="truncate text-left font-sans">
          {value ? value : <span className="text-[var(--text-muted)] font-normal">{placeholder}</span>}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-2xl bg-white dark:bg-[#121216] border border-[var(--border-subtle)] shadow-2xl overflow-hidden animate-fadeIn backdrop-blur-xl">
          
          {/* Search Box */}
          <div className="p-2 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--gold-accent)]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search city or area in ${state}...`}
                className="w-full pl-8 pr-7 py-2 text-xs rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick "Use Custom Area" if typed query is not in list */}
          {searchQuery.trim() && !availableCities.some(c => c.toLowerCase() === searchQuery.toLowerCase().trim()) && (
            <div className="px-2 pt-2 pb-1 border-b border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => handleSelectCity(searchQuery.trim())}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--gold-subtle)] text-[var(--gold-accent)] border border-[var(--gold-accent)]/20 hover:bg-[var(--gold-accent)] hover:text-black font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Use &quot;{searchQuery.trim()}&quot; as my area</span>
              </button>
            </div>
          )}

          {/* City List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-[var(--border-subtle)]/40 p-1">
            {filteredCities.length > 0 ? (
              filteredCities.map((city) => {
                const isSelected = value === city;
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => handleSelectCity(city)}
                    className={`w-full px-3 py-2 text-xs rounded-xl text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--gold-subtle)] text-[var(--gold-accent)] font-bold'
                        : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className={`h-3 w-3 shrink-0 ${isSelected ? 'text-[var(--gold-accent)]' : 'text-[var(--text-muted)]'}`} />
                      <span className="truncate font-sans">{city}</span>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-[var(--gold-accent)]" />}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center space-y-2">
                <p className="text-xs text-[var(--text-muted)]">No predefined match for &quot;{searchQuery}&quot;</p>
                <button
                  type="button"
                  onClick={() => handleSelectCity(searchQuery.trim())}
                  className="px-4 py-1.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-bold shadow-md hover:opacity-90 inline-flex items-center gap-1.5"
                >
                  <Plus className="h-3 w-3" />
                  <span>Use &quot;{searchQuery.trim()}&quot;</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer: Manual Custom Entry Toggle */}
          <div className="p-2 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)] flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-muted)]">
              {availableCities.length} areas in {state}
            </span>
            <button
              type="button"
              onClick={() => {
                const manual = prompt('Enter your specific city, town, or neighborhood:');
                if (manual && manual.trim()) {
                  handleSelectCity(manual.trim());
                }
              }}
              className="text-[10px] font-bold text-[var(--gold-accent)] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
            >
              <span>+ Custom Area</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
