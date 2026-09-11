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
  { key: 'clothing', label: 'Clothing', description: 'Hoodies, t-shirts, jeans, trousers & jackets' },
  { key: 'native', label: 'Native & Traditional', description: 'Senator suits, 3-piece Agbadas, kaftans & boubous' },
  { key: 'footwear', label: 'Shoes & Footwear', description: 'Slides, slippers, sneakers, clogs & dress shoes' },
  { key: 'bags', label: 'Bags', description: 'Crossbody bags, backpacks, handbags & clutches' },
  { key: 'accessories', label: 'Accessories & Jewelry', description: 'Watches, sunglasses, chains & traditional caps' },
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
    subtitle: 'Heavyweight hoodies & oversized sweatshirts',
    isPopular: true,
  },
  {
    id: 'men-tshirts',
    name: 'T-Shirts & Graphic Tees',
    slug: 'tshirts',
    gender: 'men',
    department: 'clothing',
    imageUrl: '/images/uploaded/tshirtandpoloformen.jpeg',
    subtitle: 'Graphic tees & heavy cotton casual tops',
  },
  {
    id: 'men-polos',
    name: 'Polos & Casual Shirts',
    slug: 'polos',
    gender: 'men',
    department: 'clothing',
    imageUrl: '/images/uploaded/tshirtandpoloformen.jpeg',
    subtitle: 'Collar shirts & button-down short sleeves',
  },
  {
    id: 'men-jackets',
    name: 'Jackets & Outerwear',
    slug: 'jackets',
    gender: 'men',
    department: 'clothing',
    imageUrl: '/images/editorial/modern_male_streetwear.jpg',
    subtitle: 'Bomber jackets, utility vests & windbreakers',
  },
  {
    id: 'men-jeans',
    name: 'Jeans & Denim',
    slug: 'jeans',
    gender: 'men',
    department: 'clothing',
    imageUrl: '/images/products/BaggyJean.jpg',
    subtitle: 'Baggy wide-leg jeans & straight-cut denim',
    isPopular: true,
  },
  {
    id: 'men-joggers',
    name: 'Joggers & Cargo Pants',
    slug: 'cargo',
    gender: 'men',
    department: 'clothing',
    imageUrl: '/images/uploaded/pantsandcargo.jpeg',
    subtitle: 'Cargo trousers with pockets & sweatpants',
  },
  {
    id: 'men-shorts',
    name: 'Shorts & Sweatsets',
    slug: 'shorts',
    gender: 'men',
    department: 'clothing',
    imageUrl: '/images/uploaded/short.jpeg',
    subtitle: 'Casual shorts & sweat shorts',
  },
  {
    id: 'men-underwears',
    name: 'Underwear & Loungewear',
    slug: 'underwears',
    gender: 'men',
    department: 'clothing',
    imageUrl: '/images/products/men_underwear_luxury.jpg',
    subtitle: 'Boxers, trunks & ribbed singlets',
  },

  // Native & Cultural (Men)
  {
    id: 'men-senator',
    name: 'Senator & Kaftan Sets',
    slug: 'senator',
    gender: 'men',
    department: 'native',
    imageUrl: '/images/uploaded/senatorformen.jpeg',
    subtitle: 'Tailored Senator kaftan sets & suits',
    isPopular: true,
  },
  {
    id: 'men-agbada',
    name: 'Grand Agbada 3-Piece',
    slug: 'agbada',
    gender: 'men',
    department: 'native',
    imageUrl: '/images/uploaded/agbadaformen.jpeg',
    subtitle: '3-piece embroidered Agbada sets',
    isPopular: true,
  },
  {
    id: 'men-jalabiya',
    name: 'Jalabiya & Loungewear',
    slug: 'jalabiya',
    gender: 'men',
    department: 'native',
    imageUrl: '/images/uploaded/jalabmen.jpeg',
    subtitle: 'Comfortable embroidered Jalabiya robes',
  },
  {
    id: 'men-fila',
    name: 'Aso-Oke Fila & Caps',
    slug: 'fila',
    gender: 'men',
    department: 'native',
    imageUrl: '/images/products/Cap1.png',
    subtitle: 'Traditional Aso-Oke caps for Agbada & Senator',
  },

  // Shoes & Footwear (Men)
  {
    id: 'men-slides',
    name: 'Slides, Palms & Slippers',
    slug: 'slides',
    gender: 'men',
    department: 'footwear',
    imageUrl: '/images/uploaded/shoefootwareformen.jpeg',
    subtitle: 'Leather slides, sandals & casual slippers',
    isPopular: true,
  },
  {
    id: 'men-sneakers',
    name: 'Street Sneakers',
    slug: 'sneakers',
    gender: 'men',
    department: 'footwear',
    imageUrl: '/images/products/AddidasShoeUnisex.jpg',
    subtitle: 'Casual trainers & street sneakers',
  },
  {
    id: 'men-loafers',
    name: 'Loafers & Dress Shoes',
    slug: 'loafers',
    gender: 'men',
    department: 'footwear',
    imageUrl: '/images/products/BlackSmartShoes.jpg',
    subtitle: 'Formal dress shoes, loafers & office footwear',
  },
  {
    id: 'men-clogs',
    name: 'Clogs & Foam Slip-Ons',
    slug: 'clogs',
    gender: 'men',
    department: 'footwear',
    imageUrl: '/images/categories/crocs_men.jpg',
    subtitle: 'Crocs, foam clogs & comfort slip-ons',
    isPopular: true,
  },

  // Bags (Men)
  {
    id: 'men-backpacks',
    name: 'Backpacks & Travel Bags',
    slug: 'backpacks',
    gender: 'men',
    department: 'bags',
    imageUrl: '/images/uploaded/leaderBags.jpeg',
    subtitle: 'Backpacks, travel duffels & gym bags',
  },
  {
    id: 'men-crossbody',
    name: 'Crossbody & Chest Bags',
    slug: 'crossbody',
    gender: 'men',
    department: 'bags',
    imageUrl: '/images/products/men_crossbody_bag.jpg',
    subtitle: 'Chest bags & compact crossbody bags',
  },

  // Accessories & Jewelry (Men)
  {
    id: 'men-chains',
    name: 'Cuban Chains & Jewelry',
    slug: 'chains',
    gender: 'men',
    department: 'accessories',
    imageUrl: '/images/products/men_gold_chain.jpg',
    subtitle: 'Cuban links, chains & pendant necklaces',
    isPopular: true,
  },
  {
    id: 'men-watches',
    name: 'Watches',
    slug: 'watches',
    gender: 'men',
    department: 'accessories',
    imageUrl: '/images/uploaded/luxerywatches.jpeg',
    subtitle: 'Gold, silver & leather strap watches',
  },
  {
    id: 'men-sunglasses',
    name: 'Sunglasses & Eyewear',
    slug: 'sunglasses',
    gender: 'men',
    department: 'accessories',
    imageUrl: '/images/uploaded/sunglassesandeyewear.jpeg',
    subtitle: 'Designer sunglasses & tinted frames',
  },
  {
    id: 'men-caps',
    name: 'Caps, Hats & Beanies',
    slug: 'caps',
    gender: 'men',
    department: 'accessories',
    imageUrl: '/images/uploaded/capshatbeanies.jpeg',
    subtitle: 'Baseball caps, trucker hats & beanies',
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
    imageUrl: '/images/categories/dressesforwomen.jpeg',
    subtitle: 'Maxi dresses, bodycons & evening gowns',
    isPopular: true,
  },
  {
    id: 'women-coord-sets',
    name: 'Two-Piece Sets',
    slug: 'two-piece',
    gender: 'women',
    department: 'clothing',
    imageUrl: '/images/categories/women_coord.jpg',
    subtitle: 'Matching top & trousers, resort sets',
    isPopular: true,
  },
  {
    id: 'women-tops',
    name: 'Tops & Corset',
    slug: 'tops',
    gender: 'women',
    department: 'clothing',
    imageUrl: '/images/uploaded/Streetwear&topsWomen.jpeg',
    subtitle: 'Corsets, casual tops & blouses',
    isPopular: true,
  },
  {
    id: 'women-hoodies',
    name: 'Hoodies & Sweatshirts',
    slug: 'women-hoodies',
    gender: 'women',
    department: 'clothing',
    imageUrl: '/images/editorial/female_hoodie.jpg',
    subtitle: 'Oversized hoodies & cropped sweatshirts',
  },
  {
    id: 'women-jeans',
    name: 'Jeans & Cargo',
    slug: 'women-jeans',
    gender: 'women',
    department: 'clothing',
    imageUrl: '/images/categories/jeanforwomen.jpeg',
    subtitle: 'Wide-leg denim & cargo trousers',
    isPopular: true,
  },
  {
    id: 'women-skirts',
    name: 'Skirts & Mini Skirts',
    slug: 'skirts',
    gender: 'women',
    department: 'clothing',
    imageUrl: '/images/categories/skirtandminishirts.jpeg',
    subtitle: 'Pleated mini skirts & casual midi skirts',
  },
  {
    id: 'women-loungewear',
    name: 'Loungewear & Sleepwear',
    slug: 'women-loungewear',
    gender: 'women',
    department: 'clothing',
    imageUrl: '/images/products/women_loungewear_luxury.jpg',
    subtitle: 'Comfortable two-piece home sets',
    isPopular: true,
  },

  // Native & Cultural (Women)
  {
    id: 'women-boubou',
    name: 'Boubou & Kaftans',
    slug: 'boubou',
    gender: 'women',
    department: 'native',
    imageUrl: '/images/editorial/nigerian_female_couture.jpg',
    subtitle: 'Flowing Adire boubous & elegant kaftans',
    isPopular: true,
  },
  {
    id: 'women-lace',
    name: 'Lace & Ankara Sets',
    slug: 'ankara',
    gender: 'women',
    department: 'native',
    imageUrl: '/images/editorial/nigerian_female_model.jpg',
    subtitle: 'Lace styles & wedding reception outfits',
  },
  {
    id: 'women-abayas',
    name: 'Abaya & Kimonos',
    slug: 'abayas',
    gender: 'women',
    department: 'native',
    imageUrl: '/images/editorial/female_dress.jpg',
    subtitle: 'Flowing abayas, kimonos & modest drapes',
    isPopular: true,
  },

  // Shoes & Footwear (Women)
  {
    id: 'women-heels',
    name: 'Heels & Pumps',
    slug: 'heels',
    gender: 'women',
    department: 'footwear',
    imageUrl: '/images/categories/women_heels.jpg',
    subtitle: 'Stiletto heels, block heels & dress sandals',
    isPopular: true,
  },
  {
    id: 'women-slides',
    name: 'Slides & Flats',
    slug: 'women-slides',
    gender: 'women',
    department: 'footwear',
    imageUrl: '/images/uploaded/footwear&slideswomen.jpeg',
    subtitle: 'Comfortable leather slides, flats & slip-ons',
    isPopular: true,
  },
  {
    id: 'women-sneakers',
    name: 'Sneakers & Casual Shoes',
    slug: 'women-sneakers',
    gender: 'women',
    department: 'footwear',
    imageUrl: '/images/products/AddidasShoeUnisex.jpg',
    subtitle: 'Platform sneakers & everyday trainers',
  },
  {
    id: 'women-clogs',
    name: 'Crocs & Casual Slides',
    slug: 'clogs',
    gender: 'women',
    department: 'footwear',
    imageUrl: '/images/categories/crocs_women.jpg',
    subtitle: 'Platform Crocs, comfort slides & casual clogs',
    isPopular: true,
  },

  // Bags (Women)
  {
    id: 'women-handbags',
    name: 'Handbags & Totes',
    slug: 'handbags',
    gender: 'women',
    department: 'bags',
    imageUrl: '/images/uploaded/LeaderbagsWomen.jpeg',
    subtitle: 'Shoulder bags, leather totes & daily bags',
    isPopular: true,
  },
  {
    id: 'women-clutches',
    name: 'Clutches & Mini Bags',
    slug: 'clutches',
    gender: 'women',
    department: 'bags',
    imageUrl: '/images/categories/women_clutches.jpg',
    subtitle: 'Evening clutches & mini bags',
    isPopular: true,
  },

  // Accessories & Jewelry (Women)
  {
    id: 'women-jewelry',
    name: 'Jewelry',
    slug: 'jewelry',
    gender: 'women',
    department: 'accessories',
    imageUrl: '/images/uploaded/WomenJewelry.jpeg',
    subtitle: 'Earrings, necklaces, rings & bracelets',
    isPopular: true,
  },
  {
    id: 'women-watches',
    name: 'Watches',
    slug: 'women-watches',
    gender: 'women',
    department: 'accessories',
    imageUrl: '/images/categories/women_watches.jpg',
    subtitle: 'Gold, silver & leather strap watches',
  },
  {
    id: 'women-sunglasses',
    name: 'Sunglasses & Shades',
    slug: 'women-sunglasses',
    gender: 'women',
    department: 'accessories',
    imageUrl: '/images/categories/women_sunglasses.jpg',
    subtitle: 'Cat-eye frames, dark shades & sun wear',
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
