export type DepartmentKey = 'clothing' | 'native' | 'footwear' | 'bags' | 'accessories';
export type GenderKey = 'men' | 'women' | 'unisex';

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  gender: GenderKey;
  department: DepartmentKey;
  imageUrl: string;
  subtitle: string;
  itemCount?: number;
  isPopular?: boolean;
}

export interface DepartmentConfig {
  key: DepartmentKey;
  label: string;
  icon?: string;
  description: string;
}

export const DEPARTMENTS: DepartmentConfig[] = [
  { key: 'clothing', label: 'Clothing', description: 'Hoodies, tees, denim, jackets & daily essentials' },
  { key: 'native', label: 'Native & Traditional', description: 'Bespoke Senators, grand Agbadas, kaftans & boubous' },
  { key: 'footwear', label: 'Shoes & Footwear', description: 'Handcrafted slides, palms, sneakers & formal dress shoes' },
  { key: 'bags', label: 'Bags & Luggage', description: 'Crossbody bags, backpacks, luxury totes & clutches' },
  { key: 'accessories', label: 'Accessories & Jewelry', description: 'Chains, watches, caps, fila & statement eyewear' },
];

export const INITIAL_CATEGORIES: CategoryItem[] = [
  // ──────────────────────────────────────────
  // 1. MEN'S CATEGORIES
  // ──────────────────────────────────────────
  // Clothing
  {
    id: 'men-hoodies',
    name: 'Hoodies & Sweatshirts',
    slug: 'hoodies',
    gender: 'men',
    department: 'clothing',
    imageUrl: '/images/products/BlackTrapStarHoodie.jpg',
    subtitle: '480GSM heavyweight fleece & boxy fits',
    isPopular: true,
  },
  {
    id: 'men-tshirts',
    name: 'T-Shirts & Graphic Tees',
    slug: 'tshirts',
    gender: 'men',
    department: 'clothing',
    imageUrl: '/images/editorial/male_shirt.jpg',
    subtitle: 'Heavy cotton luxury tees & wash drop prints',
  },
  {
    id: 'men-polos',
    name: 'Luxury Polos & Shirts',
    slug: 'polos',
    gender: 'men',
    department: 'clothing',
    imageUrl: '/images/editorial/male_shirt.jpg',
    subtitle: 'Tailored knit polos & silk button-downs',
  },
  {
    id: 'men-jackets',
    name: 'Jackets & Outerwear',
    slug: 'jackets',
    gender: 'men',
    department: 'clothing',
    imageUrl: '/images/editorial/modern_male_streetwear.jpg',
    subtitle: 'Varsity bombers, utility vests & windbreakers',
  },
  {
    id: 'men-jeans',
    name: 'Jeans & Denim',
    slug: 'jeans',
    gender: 'men',
    department: 'clothing',
    imageUrl: '/images/products/BaggyJean.jpg',
    subtitle: 'Raw selvedge & relaxed wide-leg denim',
    isPopular: true,
  },
  {
    id: 'men-joggers',
    name: 'Joggers & Cargo Pants',
    slug: 'cargo',
    gender: 'men',
    department: 'clothing',
    imageUrl: '/images/products/GreyCargoPantsHollister.jpg',
    subtitle: 'Tactical cargo pockets & heavyweight sweats',
  },
  {
    id: 'men-shorts',
    name: 'Shorts & Sweatsets',
    slug: 'shorts',
    gender: 'men',
    department: 'clothing',
    imageUrl: '/images/products/MenCasualJoggers.jpg',
    subtitle: 'Mesh court shorts & tailored linen sets',
  },
  {
    id: 'men-underwears',
    name: 'Underwear & Loungewear',
    slug: 'underwears',
    gender: 'men',
    department: 'clothing',
    imageUrl: '/images/products/men_underwear_luxury.jpg',
    subtitle: 'Modal stretch trunks & ribbed essentials',
  },

  // Native & Cultural (Men)
  {
    id: 'men-senator',
    name: 'Senator & Kaftan Sets',
    slug: 'senator',
    gender: 'men',
    department: 'native',
    imageUrl: '/images/products/BlackSenator.jpg',
    subtitle: 'Sharp geometric cuts & wool kaftans',
    isPopular: true,
  },
  {
    id: 'men-agbada',
    name: 'Grand Agbada 3-Piece',
    slug: 'agbada',
    gender: 'men',
    department: 'native',
    imageUrl: '/images/products/BlackAgbada.jpg',
    subtitle: 'Ceremonial embroidery & flowing silk robes',
    isPopular: true,
  },
  {
    id: 'men-jalabiya',
    name: 'Jalabiya & Loungewear',
    slug: 'jalabiya',
    gender: 'men',
    department: 'native',
    imageUrl: '/images/editorial/nigerian_male_couture.jpg',
    subtitle: 'Lightweight breathable embroidered tunics',
  },
  {
    id: 'men-fila',
    name: 'Aso-Oke Fila & Caps',
    slug: 'fila',
    gender: 'men',
    department: 'native',
    imageUrl: '/images/products/Cap1.png',
    subtitle: 'Hand-loomed royal headwear & velvet caps',
  },

  // Shoes & Footwear (Men)
  {
    id: 'men-slides',
    name: 'Slides, Palms & Slippers',
    slug: 'slides',
    gender: 'men',
    department: 'footwear',
    imageUrl: '/images/products/UnisexSlides.jpg',
    subtitle: 'Full-grain Kano calfskin & ergonomic footbeds',
    isPopular: true,
  },
  {
    id: 'men-sneakers',
    name: 'Street Sneakers',
    slug: 'sneakers',
    gender: 'men',
    department: 'footwear',
    imageUrl: '/images/products/AddidasShoeUnisex.jpg',
    subtitle: 'Limited release low-tops & chunky trainers',
  },
  {
    id: 'men-loafers',
    name: 'Loafers & Dress Shoes',
    slug: 'loafers',
    gender: 'men',
    department: 'footwear',
    imageUrl: '/images/products/BlackSmartShoes.jpg',
    subtitle: 'Hand-burnished leather & horsebit accents',
  },

  // Bags (Men)
  {
    id: 'men-backpacks',
    name: 'Backpacks & Travel Bags',
    slug: 'backpacks',
    gender: 'men',
    department: 'bags',
    imageUrl: '/images/uploaded/leaderBags.jpeg',
    subtitle: 'Structured leather carry-ons & durable bags',
  },
  {
    id: 'men-crossbody',
    name: 'Crossbody & Chest Bags',
    slug: 'crossbody',
    gender: 'men',
    department: 'bags',
    imageUrl: '/images/uploaded/leaderBags.jpeg',
    subtitle: 'Urban chest rigs & compact daily carriers',
  },

  // Accessories & Jewelry (Men)
  {
    id: 'men-chains',
    name: 'Chains & Cuban Necklaces',
    slug: 'chains',
    gender: 'men',
    department: 'accessories',
    imageUrl: '/images/products/men_gold_chain.jpg',
    subtitle: 'Solid stainless steel & 18K gold plated links',
    isPopular: true,
  },
  {
    id: 'men-watches',
    name: 'Luxury Wristwatches',
    slug: 'watches',
    gender: 'men',
    department: 'accessories',
    imageUrl: '/images/editorial/male_senator.jpg',
    subtitle: 'Precision automatic dials & steel bracelets',
  },
  {
    id: 'men-glasses',
    name: 'Sunglasses & Eyewear',
    slug: 'sunglasses',
    gender: 'men',
    department: 'accessories',
    imageUrl: '/images/editorial/modern_male_streetwear.jpg',
    subtitle: 'UV400 polarized shades & vintage acetate',
  },
  {
    id: 'men-caps',
    name: 'Caps, Hats & Beanies',
    slug: 'caps',
    gender: 'men',
    department: 'accessories',
    imageUrl: '/images/products/CarmoCap.jpg',
    subtitle: 'Structured trucker hats & embroidered caps',
  },

  // ──────────────────────────────────────────
  // 2. WOMEN'S CATEGORIES
  // ──────────────────────────────────────────
  // Clothing
  {
    id: 'women-dresses',
    name: 'Dresses & Evening Gowns',
    slug: 'dresses',
    gender: 'women',
    department: 'clothing',
    imageUrl: '/images/editorial/female_dress.jpg',
    subtitle: 'Cocktail maxis, corseted bodycons & slips',
    isPopular: true,
  },
  {
    id: 'women-coord-sets',
    name: 'Two-Piece Co-ord Sets',
    slug: 'two-piece',
    gender: 'women',
    department: 'clothing',
    imageUrl: '/images/editorial/nigerian_female_couture.jpg',
    subtitle: 'Matching pantsuits, resort sets & knit sets',
    isPopular: true,
  },
  {
    id: 'women-tops',
    name: 'Tops, Corsets & Blouses',
    slug: 'tops',
    gender: 'women',
    department: 'clothing',
    imageUrl: '/images/uploaded/Streetwear&topsWomen.jpeg',
    subtitle: 'Silk tie-front blouses & sculpted bustiers',
  },
  {
    id: 'women-hoodies',
    name: 'Hoodies & Cropped Sweats',
    slug: 'women-hoodies',
    gender: 'women',
    department: 'clothing',
    imageUrl: '/images/uploaded/Streetwear&topsWomen.jpeg',
    subtitle: 'Oversized fleece & cropped aesthetic fits',
  },
  {
    id: 'women-jeans',
    name: 'Jeans & Cargo Trousers',
    slug: 'women-jeans',
    gender: 'women',
    department: 'clothing',
    imageUrl: '/images/editorial/modern_female_streetwear.jpg',
    subtitle: 'High-waisted wide leg & straight cut denim',
  },
  {
    id: 'women-skirts',
    name: 'Skirts & Mini Skirts',
    slug: 'skirts',
    gender: 'women',
    department: 'clothing',
    imageUrl: '/images/editorial/female_dress.jpg',
    subtitle: 'Pleated midi skirts & asymmetric cutouts',
  },
  {
    id: 'women-loungewear',
    name: 'Silk Loungewear & Sets',
    slug: 'women-loungewear',
    gender: 'women',
    department: 'clothing',
    imageUrl: '/images/products/women_loungewear_luxury.jpg',
    subtitle: 'Mulberry silk camisoles & relaxed sleep sets',
    isPopular: true,
  },

  // Native & Cultural (Women)
  {
    id: 'women-boubou',
    name: 'Silk Boubou & Rich Kaftans',
    slug: 'boubou',
    gender: 'women',
    department: 'native',
    imageUrl: '/images/editorial/nigerian_female_couture.jpg',
    subtitle: 'Flowing Adire silk & hand-stoned neckline robes',
    isPopular: true,
  },
  {
    id: 'women-lace',
    name: 'Lace & Ankara Tailored Sets',
    slug: 'ankara',
    gender: 'women',
    department: 'native',
    imageUrl: '/images/editorial/nigerian_female_model.jpg',
    subtitle: 'Celebration cord lace & peplum styles',
  },
  {
    id: 'women-abayas',
    name: 'Modern Abayas & Kimonos',
    slug: 'abayas',
    gender: 'women',
    department: 'native',
    imageUrl: '/images/editorial/female_dress.jpg',
    subtitle: 'Modest velvet trim & embellished drapes',
  },

  // Shoes & Footwear (Women)
  {
    id: 'women-heels',
    name: 'Heels, Pumps & Mules',
    slug: 'heels',
    gender: 'women',
    department: 'footwear',
    imageUrl: '/images/uploaded/footwear&slideswomen.jpeg',
    subtitle: 'Stiletto pumps, strappy sandals & block mules',
    isPopular: true,
  },
  {
    id: 'women-slides',
    name: 'Slides, Palms & Flats',
    slug: 'women-slides',
    gender: 'women',
    department: 'footwear',
    imageUrl: '/images/uploaded/footwear&slideswomen.jpeg',
    subtitle: 'Cushioned leather slides & casual comfort',
    isPopular: true,
  },
  {
    id: 'women-sneakers',
    name: 'Designer Sneakers',
    slug: 'women-sneakers',
    gender: 'women',
    department: 'footwear',
    imageUrl: '/images/products/AddidasShoeUnisex.jpg',
    subtitle: 'Retro runners & minimalist street platforms',
  },

  // Bags (Women)
  {
    id: 'women-handbags',
    name: 'Handbags & Shoulder Totes',
    slug: 'handbags',
    gender: 'women',
    department: 'bags',
    imageUrl: '/images/uploaded/LeaderbagsWomen.jpeg',
    subtitle: 'Structured flap bags & monogram leather totes',
    isPopular: true,
  },
  {
    id: 'women-clutches',
    name: 'Clutches & Crossbody Minis',
    slug: 'clutches',
    gender: 'women',
    department: 'bags',
    imageUrl: '/images/uploaded/LeaderbagsWomen.jpeg',
    subtitle: 'Metallic evening clutches & micro bags',
  },

  // Accessories & Jewelry (Women)
  {
    id: 'women-jewelry',
    name: 'Jewelry, Necklaces & Bangles',
    slug: 'jewelry',
    gender: 'women',
    department: 'accessories',
    imageUrl: '/images/uploaded/WomenJewelry.jpeg',
    subtitle: 'Layered chains, gold hoops & statement cuffs',
    isPopular: true,
  },
  {
    id: 'women-watches',
    name: 'Women’s Luxury Watches',
    slug: 'women-watches',
    gender: 'women',
    department: 'accessories',
    imageUrl: '/images/editorial/nigerian_female_couture.jpg',
    subtitle: 'Emerald bezel dials & gold mesh straps',
  },
  {
    id: 'women-sunglasses',
    name: 'Sunglasses & Shades',
    slug: 'women-sunglasses',
    gender: 'women',
    department: 'accessories',
    imageUrl: '/images/editorial/modern_female_streetwear.jpg',
    subtitle: 'Cat-eye frames, oversized squares & shields',
  },
];

// Helper: Get categories for specific gender
export function getCategoriesByGender(gender: GenderKey = 'men'): CategoryItem[] {
  if (gender === 'unisex') return INITIAL_CATEGORIES;
  return INITIAL_CATEGORIES.filter((c) => c.gender === gender || c.gender === 'unisex');
}

// Helper: Get categories grouped by department for a specific gender
export function getCategoriesGroupedByDepartment(gender: GenderKey = 'men'): Record<DepartmentKey, CategoryItem[]> {
  const items = getCategoriesByGender(gender);
  const grouped: Record<DepartmentKey, CategoryItem[]> = {
    clothing: [],
    native: [],
    footwear: [],
    bags: [],
    accessories: [],
  };

  items.forEach((item) => {
    if (grouped[item.department]) {
      grouped[item.department].push(item);
    }
  });

  return grouped;
}

// Helper: Find by slug
export function getCategoryBySlug(slug: string): CategoryItem | undefined {
  const clean = slug.toLowerCase().trim();
  return INITIAL_CATEGORIES.find((c) => c.slug.toLowerCase() === clean || c.id.toLowerCase() === clean);
}
