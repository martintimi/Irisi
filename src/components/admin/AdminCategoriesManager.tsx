'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Plus, Search, Trash2, ExternalLink, RefreshCw, CheckCircle2,
  AlertCircle, Tag, Layers, X, Sparkles, Filter
} from 'lucide-react';
import { INITIAL_CATEGORIES, CategoryItem, DEPARTMENTS, DepartmentKey, GenderKey } from '@/lib/data/categories';

export default function AdminCategoriesManager() {
  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGender, setSelectedGender] = useState<'all' | GenderKey>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<'all' | DepartmentKey>('all');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newGender, setNewGender] = useState<GenderKey>('men');
  const [newDepartment, setNewDepartment] = useState<DepartmentKey>('clothing');
  const [newImageUrl, setNewImageUrl] = useState('/images/products/BlackTrapStarHoodie.jpg');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch categories
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      if (data?.success && data?.categories) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        cat.name.toLowerCase().includes(q) ||
        cat.slug.toLowerCase().includes(q) ||
        cat.subtitle?.toLowerCase().includes(q);

      const matchesGender = selectedGender === 'all' || cat.gender === selectedGender || cat.gender === 'unisex';
      const matchesDept = selectedDepartment === 'all' || cat.department === selectedDepartment;

      return matchesSearch && matchesGender && matchesDept;
    });
  }, [categories, search, selectedGender, selectedDepartment]);

  // Handle Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          slug: newSlug.trim() || undefined,
          gender: newGender,
          department: newDepartment,
          imageUrl: newImageUrl,
          subtitle: newSubtitle.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: `Created category: ${newName}` });
        setCategories((prev) => [data.category, ...prev]);
        setIsAddModalOpen(false);
        // Reset form
        setNewName('');
        setNewSlug('');
        setNewSubtitle('');
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to create category' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Network error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the category "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/categories?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        setStatusMessage({ type: 'success', text: `Deleted category: ${name}` });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to delete' });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-luxury uppercase tracking-widest text-[var(--gold-accent)] font-bold mb-1">
            <Layers className="h-4 w-4" />
            <span>Retail Taxonomy Governance</span>
          </div>
          <h2 className="text-2xl font-bold font-editorial text-[var(--text-primary)]">
            Categories & Subcategories Manager
          </h2>
          <p className="text-xs text-[var(--text-secondary)] font-light mt-1">
            Manage active categories, subcategories, and departments for both Men and Women. Changes reflect instantly across the mobile storefront and vendor portal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCategories}
            className="p-2.5 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] transition-colors cursor-pointer"
            title="Refresh Categories"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-mono-luxury uppercase font-bold tracking-wider hover:opacity-90 transition-all cursor-pointer shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Category</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-xs font-mono-luxury border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-current opacity-70 hover:opacity-100">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Filter Controls Bar */}
      <div className="space-y-3 p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
        {/* Search & Gender Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search category name, slug, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-accent)]"
            />
          </div>

          {/* Gender Filter Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] shrink-0 overflow-x-auto">
            {(['all', 'men', 'women', 'unisex'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGender(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono-luxury uppercase tracking-wider transition-all cursor-pointer ${
                  selectedGender === g
                    ? 'bg-black dark:bg-white text-white dark:text-black font-bold shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Department Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-[var(--border-subtle)] no-scrollbar">
          <span className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] shrink-0 mr-1 font-bold">
            Department:
          </span>
          <button
            onClick={() => setSelectedDepartment('all')}
            className={`px-3 py-1 rounded-full text-[11px] font-mono-luxury uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
              selectedDepartment === 'all'
                ? 'bg-[var(--gold-accent)] text-black font-bold'
                : 'bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            All Departments ({categories.length})
          </button>
          {DEPARTMENTS.map((dept) => {
            const count = categories.filter((c) => c.department === dept.key).length;
            return (
              <button
                key={dept.key}
                onClick={() => setSelectedDepartment(dept.key)}
                className={`px-3 py-1 rounded-full text-[11px] font-mono-luxury uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
                  selectedDepartment === dept.key
                    ? 'bg-[var(--gold-accent)] text-black font-bold'
                    : 'bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {dept.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCategories.map((cat) => (
          <div
            key={cat.id}
            className="group p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--gold-accent)]/50 transition-all duration-300 flex flex-col justify-between gap-3 relative shadow-sm"
          >
            <div className="space-y-3">
              {/* Image Preview & Badges */}
              <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-black/50 border border-[var(--border-subtle)]">
                <Image
                  src={cat.imageUrl || '/images/products/BlackTrapStarHoodie.jpg'}
                  alt={cat.name}
                  fill
                  unoptimized
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Gender & Dept Badges */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-[9px] font-mono-luxury uppercase tracking-widest text-amber-300 border border-amber-300/30 font-bold">
                    {cat.gender}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-[9px] font-mono-luxury uppercase tracking-widest text-white border border-white/20">
                    {cat.department}
                  </span>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteCategory(cat.id, cat.name)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-rose-500 text-white/80 hover:text-white transition-colors cursor-pointer"
                  title="Delete category"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                {/* Title overlay */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5">
                  <h3 className="font-bold text-sm text-white drop-shadow-md truncate">
                    {cat.name}
                  </h3>
                  <p className="text-[10px] text-neutral-300 truncate font-light">
                    {cat.subtitle}
                  </p>
                </div>
              </div>

              {/* Meta details */}
              <div className="space-y-1 text-[11px] font-mono-luxury">
                <div className="flex items-center justify-between text-[var(--text-muted)]">
                  <span>URL Slug:</span>
                  <span className="font-bold text-[var(--text-primary)]">/{cat.slug}</span>
                </div>
                <div className="flex items-center justify-between text-[var(--text-muted)]">
                  <span>Target Filter:</span>
                  <span className="text-[var(--text-secondary)] truncate">
                    gender={cat.gender}&cat={cat.slug}
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Link to View in Shop */}
            <Link
              href={`/shop?gender=${cat.gender}&category=${cat.slug}`}
              target="_blank"
              className="w-full py-2 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center text-[10px] font-mono-luxury uppercase tracking-wider font-bold text-[var(--text-primary)] hover:text-[var(--gold-accent)] transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Test Filter in Shop</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3">
          <Layers className="h-8 w-8 text-[var(--text-muted)] mx-auto" />
          <p className="text-sm text-[var(--text-secondary)]">No categories found matching your filters.</p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedGender('all');
              setSelectedDepartment('all');
            }}
            className="text-xs font-mono-luxury uppercase text-[var(--gold-accent)] underline underline-offset-4"
          >
            Reset all filters
          </button>
        </div>
      )}

      {/* ADD CATEGORY MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xl overflow-hidden animate-scaleIn">
            <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-[var(--gold-accent)]" />
                <h3 className="font-bold font-editorial text-lg text-[var(--text-primary)]">
                  Add New Storefront Category
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-mono-luxury uppercase text-[var(--text-secondary)] mb-1 font-bold">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Chelsea Boots, Silk Adire, Varsity Jackets"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (!newSlug) {
                      setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-accent)]"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-mono-luxury uppercase text-[var(--text-secondary)] mb-1 font-bold">
                  URL Slug
                </label>
                <input
                  type="text"
                  placeholder="e.g., chelsea-boots"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-accent)]"
                />
              </div>

              {/* Gender & Department Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono-luxury uppercase text-[var(--text-secondary)] mb-1 font-bold">
                    Gender Target *
                  </label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as GenderKey)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-accent)] cursor-pointer"
                  >
                    <option value="men">Men</option>
                    <option value="women">Women</option>
                    <option value="unisex">Unisex</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono-luxury uppercase text-[var(--text-secondary)] mb-1 font-bold">
                    Department *
                  </label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value as DepartmentKey)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-accent)] cursor-pointer"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d.key} value={d.key}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Image URL with quick presets */}
              <div>
                <label className="block text-xs font-mono-luxury uppercase text-[var(--text-secondary)] mb-1 font-bold">
                  Thumbnail Image URL
                </label>
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="/images/products/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-accent)]"
                />
                <div className="flex items-center gap-2 overflow-x-auto pt-2 no-scrollbar">
                  <span className="text-[10px] text-[var(--text-muted)] shrink-0">Presets:</span>
                  {[
                    { label: 'Hoodie', url: '/images/products/BlackTrapStarHoodie.jpg' },
                    { label: 'Senator', url: '/images/products/BlackSenator.jpg' },
                    { label: 'Agbada', url: '/images/products/BlackAgbada.jpg' },
                    { label: 'Denim', url: '/images/products/BaggyJean.jpg' },
                    { label: 'Slides', url: '/images/products/UnisexSlides.jpg' },
                    { label: 'Pants & Cargo', url: '/images/uploaded/pantsandcargo.jpeg' },
                    { label: 'Graphic Tees', url: '/images/uploaded/t-shirtsandgraphic.jpeg' },
                    { label: 'Polos & Shirts', url: '/images/uploaded/poloandshirt.jpeg' },
                    { label: 'Shorts', url: '/images/uploaded/short.jpeg' },
                    { label: 'Men Bag', url: '/images/uploaded/leaderBags.jpeg' },
                    { label: 'Crossbody', url: '/images/products/men_crossbody_bag.jpg' },
                    { label: 'Women Bag', url: '/images/uploaded/LeaderbagsWomen.jpeg' },
                    { label: 'Jewelry', url: '/images/uploaded/WomenJewelry.jpeg' },
                    { label: 'Women Street', url: '/images/uploaded/Streetwear&topsWomen.jpeg' },
                    { label: 'Women Footwear', url: '/images/uploaded/footwear&slideswomen.jpeg' },
                    { label: 'Dress', url: '/images/editorial/female_dress.jpg' },
                    { label: 'Couture', url: '/images/editorial/nigerian_female_couture.jpg' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setNewImageUrl(preset.url)}
                      className="px-2 py-0.5 rounded text-[9px] font-mono-luxury bg-[var(--bg-primary)] border border-[var(--border-subtle)] hover:border-[var(--gold-accent)] shrink-0 text-[var(--text-secondary)]"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subtitle / Description */}
              <div>
                <label className="block text-xs font-mono-luxury uppercase text-[var(--text-secondary)] mb-1 font-bold">
                  Subtitle / Editorial Note
                </label>
                <input
                  type="text"
                  placeholder="e.g., Handcrafted calfskin with ergonomic footbed"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-accent)]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--border-subtle)] text-xs font-mono-luxury text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black font-mono-luxury uppercase font-bold text-xs hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 shadow-md"
                >
                  {isSubmitting ? 'Saving...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
