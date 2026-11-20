import { VendorSpecialty } from '@/types';

export interface PublishCategoryItem {
  id: string;
  label: string;
  generalCat: any;
  group: string;
}

const CAP_IDS = new Set([
  'men_caps_hats',
  'men_caps_fila',
  'women_caps_scarves',
  'unisex_caps_hats',
]);

const JEWELRY_IDS = new Set([
  'men_jewelry_chains',
  'men_watches',
  'women_jewelry',
  'women_watches',
  'unisex_jewelry',
  'unisex_watches',
]);

/**
 * Smart Specialty-First filter:
 * Matches categories tightly to a vendor's store specialty by default
 * (e.g., Cap sellers only see Caps/Headwear/Fila, Shoe makers only see Footwear),
 * while allowing them to toggle "Show all departments" if they ever expand their catalog.
 */
export function matchesVendorSpecialtyCategory(
  cat: PublishCategoryItem,
  specialty: VendorSpecialty
): boolean {
  switch (specialty) {
    case 'caps':
      return CAP_IDS.has(cat.id) || cat.id.includes('cap') || cat.id.includes('fila') || cat.id.includes('hat');
    case 'footwear':
      return cat.group === 'footwear';
    case 'perfume':
      return cat.group === 'perfume';
    case 'wigs':
      return cat.group === 'wigs';
    case 'jewelry':
      return JEWELRY_IDS.has(cat.id) || cat.id.includes('jewelry') || cat.id.includes('watch');
    case 'accessories':
      return cat.group === 'accessories' || cat.group === 'bags';
    case 'native_tailoring':
      return cat.group === 'native' || cat.id === 'men_caps_fila';
    case 'streetwear':
    case 'apparel':
      return cat.group === 'clothing' || cat.group === 'apparel';
    case 'multi_department':
    default:
      return true;
  }
}

export function getSpecialtyFocusLabel(specialty: VendorSpecialty): string {
  switch (specialty) {
    case 'caps':
      return 'Caps & Headwear';
    case 'footwear':
      return 'Footwear & Slides';
    case 'perfume':
      return 'Perfumes & Scents';
    case 'wigs':
      return 'Hair & Wigs';
    case 'jewelry':
      return 'Jewelry & Watches';
    case 'accessories':
      return 'Accessories & Bags';
    case 'native_tailoring':
      return 'Native & Cultural Tailoring';
    case 'streetwear':
    case 'apparel':
      return 'Clothing & Streetwear';
    case 'multi_department':
    default:
      return 'All Departments';
  }
}
