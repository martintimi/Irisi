/**
 * ÌRÍSÍ Fashion Logistics - Automated Category Weight & Dimension Profiling Engine
 * 
 * Nigerian fashion designers and boutique merchants never need to buy scales or measuring tapes.
 * IRISI assigns standardized physical weights and box dimensions based on garment category,
 * material GSM, and luxury packaging requirements.
 */

export interface GarmentWeightProfile {
  category: string;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  packagingType: 'luxury_box' | 'mailer_bag' | 'flyer_pouch' | 'shoebox';
  description: string;
}

export interface CumulativePackageMetrics {
  totalWeightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  packagingType: 'luxury_box' | 'mailer_bag' | 'flyer_pouch' | 'shoebox';
  itemCount: number;
  summaryLabel: string;
}

/**
 * Standard Garment Category Profiles (Weight in kg, Dimensions in cm)
 */
export const CATEGORY_WEIGHT_PROFILES: Record<string, GarmentWeightProfile> = {
  // 1. Grand Traditional & Ceremonial
  'agbada': {
    category: 'agbada',
    weightKg: 1.80,
    lengthCm: 40,
    widthCm: 30,
    heightCm: 8,
    packagingType: 'luxury_box',
    description: '3-Piece Grand Agbada with heavy Aso-Oke / Damask embroidery in luxury branded box',
  },
  'senator': {
    category: 'senator',
    weightKg: 1.10,
    lengthCm: 35,
    widthCm: 25,
    heightCm: 6,
    packagingType: 'luxury_box',
    description: 'Tailored 2-Piece Senator / Kaftan set in luxury garment box',
  },
  'native': {
    category: 'native',
    weightKg: 1.10,
    lengthCm: 35,
    widthCm: 25,
    heightCm: 6,
    packagingType: 'luxury_box',
    description: 'Bespoke native wear set',
  },

  // 2. Footwear & Leatherworks
  'footwear': {
    category: 'footwear',
    weightKg: 1.30,
    lengthCm: 35,
    widthCm: 25,
    heightCm: 14,
    packagingType: 'shoebox',
    description: 'Handcrafted leather shoes / boots in rigid luxury shoebox with dustbag',
  },
  'shoes': {
    category: 'shoes',
    weightKg: 1.30,
    lengthCm: 35,
    widthCm: 25,
    heightCm: 14,
    packagingType: 'shoebox',
    description: 'Handcrafted shoes in rigid luxury shoebox',
  },
  'slides': {
    category: 'slides',
    weightKg: 0.80,
    lengthCm: 32,
    widthCm: 20,
    heightCm: 10,
    packagingType: 'shoebox',
    description: 'Artisan cowhide slides / mules in dustbag box',
  },

  // 3. Heavyweight Streetwear & Outerwear
  'outerwear': {
    category: 'outerwear',
    weightKg: 1.00,
    lengthCm: 35,
    widthCm: 28,
    heightCm: 8,
    packagingType: 'mailer_bag',
    description: 'Heavyweight 450GSM hoodie, varsity jacket, puffer, or fleece tracksuit',
  },
  'hoodie': {
    category: 'hoodie',
    weightKg: 1.00,
    lengthCm: 35,
    widthCm: 28,
    heightCm: 8,
    packagingType: 'mailer_bag',
    description: 'Heavyweight fleece hoodie in waterproof mailer bag',
  },
  'blazers': {
    category: 'blazers',
    weightKg: 0.90,
    lengthCm: 40,
    widthCm: 30,
    heightCm: 6,
    packagingType: 'luxury_box',
    description: 'Structured bespoke blazer or tailored suit jacket',
  },

  // 4. Bottoms & Denim
  'bottoms': {
    category: 'bottoms',
    weightKg: 0.80,
    lengthCm: 32,
    widthCm: 25,
    heightCm: 5,
    packagingType: 'mailer_bag',
    description: 'Raw denim jeans, utility cargo pants, or heavy chinos',
  },
  'denim': {
    category: 'denim',
    weightKg: 0.80,
    lengthCm: 32,
    widthCm: 25,
    heightCm: 5,
    packagingType: 'mailer_bag',
    description: '14oz heavy raw denim in branded mailer',
  },

  // 5. RTW Boutique Dresses & Co-ord Sets
  'dresses': {
    category: 'dresses',
    weightKg: 0.60,
    lengthCm: 30,
    widthCm: 22,
    heightCm: 4,
    packagingType: 'mailer_bag',
    description: 'Silk, satin, or crepe boutique dress / co-ord set',
  },

  // 6. Tops & Tees
  'tops': {
    category: 'tops',
    weightKg: 0.35,
    lengthCm: 28,
    widthCm: 20,
    heightCm: 2,
    packagingType: 'flyer_pouch',
    description: 'Boxy graphic t-shirt, polo shirt, or button-up cotton shirt',
  },
  'shirts': {
    category: 'shirts',
    weightKg: 0.35,
    lengthCm: 28,
    widthCm: 20,
    heightCm: 2,
    packagingType: 'flyer_pouch',
    description: 'Cotton poplin tailored shirt or camp-collar top',
  },
  'crop_tops': {
    category: 'crop_tops',
    weightKg: 0.30,
    lengthCm: 25,
    widthCm: 18,
    heightCm: 2,
    packagingType: 'flyer_pouch',
    description: 'Boutique corset, bodysuit, or crop top',
  },

  // 7. Accessories & Fine Jewelry
  'accessories': {
    category: 'accessories',
    weightKg: 0.25,
    lengthCm: 20,
    widthCm: 15,
    heightCm: 8,
    packagingType: 'luxury_box',
    description: 'Handwoven Aso-Oke Fila cap, leather belt, or sunglasses',
  },
  'jewelry': {
    category: 'jewelry',
    weightKg: 0.20,
    lengthCm: 15,
    widthCm: 10,
    heightCm: 4,
    packagingType: 'luxury_box',
    description: 'Cuban chain, bracelet, ring, or earrings in velvet luxury pouch',
  },
};

/**
 * Intelligent Weight & Dimension Matcher for any product
 */
export function getProductWeightProfile(item: {
  name?: string;
  category?: string;
  weightKg?: number;
}): GarmentWeightProfile {
  if (!item) {
    return {
      category: 'standard',
      weightKg: 0.50,
      lengthCm: 30,
      widthCm: 22,
      heightCm: 4,
      packagingType: 'mailer_bag',
      description: 'Standard garment packaging',
    };
  }

  // 1. If explicit vendor weight was specified, honor it with calculated dimensions
  if (typeof item.weightKg === 'number' && item.weightKg > 0) {
    const w = item.weightKg;
    return {
      category: item.category || 'custom',
      weightKg: w,
      lengthCm: w > 1.2 ? 38 : 30,
      widthCm: w > 1.2 ? 28 : 22,
      heightCm: w > 1.2 ? 8 : 4,
      packagingType: w > 1.2 ? 'luxury_box' : 'mailer_bag',
      description: `Exact atelier measurement: ${w}kg`,
    };
  }

  const n = (item.name || '').toLowerCase();
  const c = (item.category || '').toLowerCase();

  // Grand Agbada / Ceremonial
  if (n.includes('agbada') || c.includes('agbada') || c.includes('ceremonial') || n.includes('boubou')) {
    return CATEGORY_WEIGHT_PROFILES['agbada'];
  }

  // Senator / Kaftan
  if (n.includes('senator') || c.includes('senator') || n.includes('kaftan') || c.includes('kaftan')) {
    return CATEGORY_WEIGHT_PROFILES['senator'];
  }

  // Slides / Sandals
  if (n.includes('slide') || n.includes('sandal') || n.includes('slipper') || c === 'slides') {
    return CATEGORY_WEIGHT_PROFILES['slides'];
  }

  // Shoes / Boots / Loafers
  if (c.includes('footwear') || c.includes('shoe') || n.includes('shoe') || n.includes('loafer') || n.includes('boot') || n.includes('sneaker') || n.includes('mule') || n.includes('heel')) {
    return CATEGORY_WEIGHT_PROFILES['footwear'];
  }

  // Heavy Outerwear / Hoodies
  if (n.includes('hoodie') || n.includes('jacket') || c.includes('outerwear') || n.includes('tracksuit') || n.includes('puffer') || n.includes('fleece')) {
    return CATEGORY_WEIGHT_PROFILES['outerwear'];
  }

  // Blazers / Suits
  if (n.includes('blazer') || n.includes('suit') || c.includes('blazer')) {
    return CATEGORY_WEIGHT_PROFILES['blazers'];
  }

  // Denim & Bottoms
  if (n.includes('jean') || n.includes('cargo') || c.includes('bottoms') || c.includes('denim') || n.includes('trouser') || n.includes('pant')) {
    return CATEGORY_WEIGHT_PROFILES['bottoms'];
  }

  // Dresses
  if (n.includes('dress') || c.includes('dresses') || n.includes('co-ord') || n.includes('gown') || n.includes('jumpsuit')) {
    return CATEGORY_WEIGHT_PROFILES['dresses'];
  }

  // Jewelry
  if (c.includes('jewelry') || n.includes('chain') || n.includes('ring') || n.includes('necklace') || n.includes('bracelet') || n.includes('pendant')) {
    return CATEGORY_WEIGHT_PROFILES['jewelry'];
  }

  // Accessories
  if (c.includes('accessories') || n.includes('cap') || n.includes('hat') || n.includes('fila') || n.includes('belt') || n.includes('sunglass')) {
    return CATEGORY_WEIGHT_PROFILES['accessories'];
  }

  // Tops / Tees
  if (n.includes('tee') || n.includes('shirt') || n.includes('polo') || c.includes('tops') || c.includes('shirts')) {
    return CATEGORY_WEIGHT_PROFILES['tops'];
  }

  // Default standard fashion garment
  return {
    category: c || 'apparel',
    weightKg: 0.50,
    lengthCm: 30,
    widthCm: 22,
    heightCm: 4,
    packagingType: 'mailer_bag',
    description: 'Standard apparel mailer',
  };
}

/**
 * Computes consolidated cumulative weight & box dimensions for an entire package
 * containing 1 or more items from a single vendor.
 */
export function computeVendorPackageMetrics(items: Array<{
  product: { name?: string; category?: string; weightKg?: number };
  quantity?: number;
}>): CumulativePackageMetrics {
  if (!items || items.length === 0) {
    return {
      totalWeightKg: 0.5,
      lengthCm: 30,
      widthCm: 22,
      heightCm: 4,
      packagingType: 'mailer_bag',
      itemCount: 0,
      summaryLabel: '0.50kg (Standard Mailer)',
    };
  }

  let totalWeight = 0;
  let maxL = 28;
  let maxW = 20;
  let totalH = 0;
  let hasShoebox = false;
  let hasLuxuryBox = false;

  items.forEach((item) => {
    const qty = Math.max(1, Number(item.quantity || 1));
    const profile = getProductWeightProfile(item.product);

    totalWeight += profile.weightKg * qty;
    maxL = Math.max(maxL, profile.lengthCm);
    maxW = Math.max(maxW, profile.widthCm);
    totalH += profile.heightCm * qty;

    if (profile.packagingType === 'shoebox') hasShoebox = true;
    if (profile.packagingType === 'luxury_box') hasLuxuryBox = true;
  });

  // Clamp minimum weight to 0.4kg to prevent zero-rate issues with couriers
  const finalWeight = Math.max(0.4, Number(totalWeight.toFixed(2)));
  const finalHeight = Math.min(45, Math.max(4, totalH)); // stack height clamped sensibly

  const packagingType: 'luxury_box' | 'mailer_bag' | 'flyer_pouch' | 'shoebox' =
    hasShoebox
      ? 'shoebox'
      : hasLuxuryBox || finalWeight > 1.2
      ? 'luxury_box'
      : finalWeight > 0.6
      ? 'mailer_bag'
      : 'flyer_pouch';

  const typeLabel =
    packagingType === 'shoebox'
      ? 'Artisan Shoebox'
      : packagingType === 'luxury_box'
      ? 'Luxury Box'
      : packagingType === 'mailer_bag'
      ? 'Waterproof Mailer'
      : 'Flyer Pouch';

  return {
    totalWeightKg: finalWeight,
    lengthCm: maxL,
    widthCm: maxW,
    heightCm: finalHeight,
    packagingType,
    itemCount: items.reduce((s, i) => s + (i.quantity || 1), 0),
    summaryLabel: `${finalWeight}kg (${typeLabel} · ${maxL}×${maxW}×${finalHeight}cm)`,
  };
}
