export interface SizeRow {
  size: string;
  measurements: Record<string, string | number>; // e.g. { chest: '96-101', shoulder: '46', length: '72', sleeve: '63' }
  subLabel?: string; // e.g. "UK 10 / US 6"
}

export interface SizeChartConfig {
  categoryName: string;
  description: string;
  columns: { key: string; label: string; unitType: 'length' | 'raw' }[];
  rows: SizeRow[];
  measuringTips: { title: string; desc: string }[];
}

// Convert CM to Inches (1 decimal place)
export function cmToInchesStr(val: string | number): string {
  if (typeof val === 'number') {
    return (val / 2.54).toFixed(1) + '"';
  }
  const str = String(val).trim();
  // Handle ranges like "96-101" or "96 - 101"
  if (str.includes('-')) {
    const parts = str.split('-').map(p => parseFloat(p.trim())).filter(n => !isNaN(n));
    if (parts.length === 2) {
      const minIn = (parts[0] / 2.54).toFixed(1);
      const maxIn = (parts[1] / 2.54).toFixed(1);
      return `${minIn}" - ${maxIn}"`;
    }
  }
  const num = parseFloat(str);
  if (!isNaN(num)) {
    return (num / 2.54).toFixed(1) + '"';
  }
  return str;
}

// Format measurement based on unit ('cm' or 'inch')
export function formatMeasurement(val: string | number, unit: 'cm' | 'inch', unitType: 'length' | 'raw'): string {
  if (unitType === 'raw') return String(val);
  if (unit === 'inch') {
    return cmToInchesStr(val);
  }
  return typeof val === 'number' ? `${val} cm` : `${val} cm`;
}

// Category Size Chart Configurations
export const SIZE_CHARTS: Record<string, SizeChartConfig> = {
  tops: {
    categoryName: 'Tops, Hoodies & Shirts',
    description: 'International tailored fit. If between sizes, choose larger for a comfortable drape.',
    columns: [
      { key: 'size', label: 'Size', unitType: 'raw' },
      { key: 'chest', label: 'Chest / Bust', unitType: 'length' },
      { key: 'shoulder', label: 'Shoulder', unitType: 'length' },
      { key: 'length', label: 'Length', unitType: 'length' },
      { key: 'sleeve', label: 'Sleeve', unitType: 'length' },
    ],
    rows: [
      { size: 'XS', measurements: { chest: '86 - 90', shoulder: '42', length: '68', sleeve: '60' }, subLabel: 'Slim 34' },
      { size: 'S', measurements: { chest: '91 - 96', shoulder: '44', length: '70', sleeve: '62' }, subLabel: 'Regular 36' },
      { size: 'M', measurements: { chest: '97 - 102', shoulder: '46', length: '72', sleeve: '63' }, subLabel: 'Regular 38-40' },
      { size: 'L', measurements: { chest: '103 - 108', shoulder: '48', length: '74', sleeve: '65' }, subLabel: 'Comfort 42' },
      { size: 'XL', measurements: { chest: '109 - 114', shoulder: '50', length: '76', sleeve: '66' }, subLabel: 'Relaxed 44' },
      { size: 'XXL', measurements: { chest: '115 - 122', shoulder: '52', length: '78', sleeve: '67' }, subLabel: 'Roomy 46' },
      { size: '3XL', measurements: { chest: '123 - 130', shoulder: '54', length: '80', sleeve: '68' }, subLabel: 'Extra Roomy 48' },
    ],
    measuringTips: [
      { title: 'Chest / Bust', desc: 'Measure around the fullest part of your chest under your arms, keeping the tape horizontal.' },
      { title: 'Shoulder Width', desc: 'Measure from one shoulder edge straight across to the other shoulder edge.' },
      { title: 'Garment Length', desc: 'Measured from the highest point of the shoulder collar seam down to the bottom hem.' },
    ],
  },

  dresses: {
    categoryName: 'Dresses, Gowns & Two-Pieces',
    description: 'Precision luxury contouring. Sized for natural silhouette drape.',
    columns: [
      { key: 'size', label: 'Size', unitType: 'raw' },
      { key: 'bust', label: 'Bust', unitType: 'length' },
      { key: 'waist', label: 'Waist', unitType: 'length' },
      { key: 'hips', label: 'Hips', unitType: 'length' },
      { key: 'length', label: 'Length', unitType: 'length' },
    ],
    rows: [
      { size: 'XS', measurements: { bust: '82 - 85', waist: '63 - 66', hips: '88 - 91', length: '115' }, subLabel: 'UK 6 · US 2' },
      { size: 'S', measurements: { bust: '86 - 89', waist: '67 - 70', hips: '92 - 95', length: '117' }, subLabel: 'UK 8 · US 4' },
      { size: 'M', measurements: { bust: '90 - 94', waist: '71 - 75', hips: '96 - 100', length: '119' }, subLabel: 'UK 10 · US 6' },
      { size: 'L', measurements: { bust: '95 - 100', waist: '76 - 81', hips: '101 - 106', length: '121' }, subLabel: 'UK 12 · US 8' },
      { size: 'XL', measurements: { bust: '101 - 106', waist: '82 - 87', hips: '107 - 112', length: '123' }, subLabel: 'UK 14 · US 10' },
      { size: 'XXL', measurements: { bust: '107 - 114', waist: '88 - 95', hips: '113 - 120', length: '125' }, subLabel: 'UK 16 · US 12' },
    ],
    measuringTips: [
      { title: 'Bust', desc: 'Measure around the fullest part of your bust wearing your usual undergarment.' },
      { title: 'Natural Waist', desc: 'Measure around the narrowest part of your torso, typically 2 inches above the navel.' },
      { title: 'Hips', desc: 'Stand with feet together and measure around the fullest part of your hips/derriere.' },
    ],
  },

  bottoms: {
    categoryName: 'Pants, Jeans & Trousers',
    description: 'Comfort waist contouring with standard inseam drape.',
    columns: [
      { key: 'size', label: 'Size', unitType: 'raw' },
      { key: 'waist', label: 'Waist', unitType: 'length' },
      { key: 'hip', label: 'Hip', unitType: 'length' },
      { key: 'thigh', label: 'Thigh', unitType: 'length' },
      { key: 'length', label: 'Inseam / Length', unitType: 'length' },
    ],
    rows: [
      { size: '28', measurements: { waist: '71 - 73', hip: '90', thigh: '54', length: '100' }, subLabel: 'XS · 28"' },
      { size: '30', measurements: { waist: '76 - 78', hip: '95', thigh: '56', length: '102' }, subLabel: 'S · 30"' },
      { size: '32', measurements: { waist: '81 - 83', hip: '100', thigh: '58', length: '104' }, subLabel: 'M · 32"' },
      { size: '34', measurements: { waist: '86 - 88', hip: '105', thigh: '61', length: '106' }, subLabel: 'L · 34"' },
      { size: '36', measurements: { waist: '91 - 94', hip: '110', thigh: '64', length: '108' }, subLabel: 'XL · 36"' },
      { size: '38', measurements: { waist: '96 - 99', hip: '115', thigh: '67', length: '110' }, subLabel: 'XXL · 38"' },
      { size: '40', measurements: { waist: '101 - 105', hip: '120', thigh: '70', length: '112' }, subLabel: '3XL · 40"' },
    ],
    measuringTips: [
      { title: 'Waist', desc: 'Measure around the point where your trousers normally sit with one finger room.' },
      { title: 'Hips', desc: 'Measure around the fullest part of your seat with feet placed together.' },
      { title: 'Inseam', desc: 'Measure from the lowest part of the crotch seam straight down to the ankle opening.' },
    ],
  },

  native: {
    categoryName: 'Senator, Agbada & Traditional',
    description: 'Bespoke Nigerian traditional styling with generous armhole drape and tailored trouser cut.',
    columns: [
      { key: 'size', label: 'Size', unitType: 'raw' },
      { key: 'chest', label: 'Chest', unitType: 'length' },
      { key: 'topLength', label: 'Top Length', unitType: 'length' },
      { key: 'trouserWaist', label: 'Trouser Waist', unitType: 'length' },
      { key: 'trouserLength', label: 'Trouser Length', unitType: 'length' },
    ],
    rows: [
      { size: 'S', measurements: { chest: '96 - 100', topLength: '86', trouserWaist: '76 - 80', trouserLength: '100' }, subLabel: 'Fitted 36-38' },
      { size: 'M', measurements: { chest: '101 - 106', topLength: '89', trouserWaist: '81 - 85', trouserLength: '103' }, subLabel: 'Standard 40' },
      { size: 'L', measurements: { chest: '107 - 112', topLength: '92', trouserWaist: '86 - 91', trouserLength: '105' }, subLabel: 'Tailored 42' },
      { size: 'XL', measurements: { chest: '113 - 118', topLength: '95', trouserWaist: '92 - 97', trouserLength: '107' }, subLabel: 'Regal 44' },
      { size: 'XXL', measurements: { chest: '119 - 125', topLength: '98', trouserWaist: '98 - 104', trouserLength: '109' }, subLabel: 'Grand 46' },
      { size: '3XL', measurements: { chest: '126 - 132', topLength: '101', trouserWaist: '105 - 112', trouserLength: '111' }, subLabel: 'Chief 48+' },
    ],
    measuringTips: [
      { title: 'Top Length', desc: 'Measured from top of shoulder seam down past hips to mid-thigh.' },
      { title: 'Chest Freedom', desc: 'Agbada and Senator tunics allow comfortable airflow around the chest.' },
      { title: 'Trouser Length', desc: 'Measured from waist down to the shoe instep.' },
    ],
  },

  footwear: {
    categoryName: 'Footwear & Shoes',
    description: 'European standard sizing. Matches sneakers, slides, loafers, and designer heels.',
    columns: [
      { key: 'size', label: 'EU Size', unitType: 'raw' },
      { key: 'footLength', label: 'Foot Length', unitType: 'length' },
      { key: 'ukSize', label: 'UK Size', unitType: 'raw' },
      { key: 'usMen', label: 'US Men', unitType: 'raw' },
      { key: 'usWomen', label: 'US Women', unitType: 'raw' },
    ],
    rows: [
      { size: '38', measurements: { footLength: '24.0', ukSize: '5.0', usMen: '5.5', usWomen: '7.0' }, subLabel: '24.0 cm' },
      { size: '39', measurements: { footLength: '24.5', ukSize: '5.5', usMen: '6.5', usWomen: '8.0' }, subLabel: '24.5 cm' },
      { size: '40', measurements: { footLength: '25.0', ukSize: '6.5', usMen: '7.5', usWomen: '9.0' }, subLabel: '25.0 cm' },
      { size: '41', measurements: { footLength: '25.5', ukSize: '7.0', usMen: '8.0', usWomen: '9.5' }, subLabel: '25.5 cm' },
      { size: '42', measurements: { footLength: '26.5', ukSize: '8.0', usMen: '9.0', usWomen: '10.5' }, subLabel: '26.5 cm' },
      { size: '43', measurements: { footLength: '27.5', ukSize: '9.0', usMen: '10.0', usWomen: '11.5' }, subLabel: '27.5 cm' },
      { size: '44', measurements: { footLength: '28.0', ukSize: '9.5', usMen: '10.5', usWomen: '12.0' }, subLabel: '28.0 cm' },
      { size: '45', measurements: { footLength: '28.5', ukSize: '10.5', usMen: '11.5', usWomen: '13.0' }, subLabel: '28.5 cm' },
      { size: '46', measurements: { footLength: '29.5', ukSize: '11.5', usMen: '12.5', usWomen: '14.0' }, subLabel: '29.5 cm' },
      { size: '47', measurements: { footLength: '30.5', ukSize: '12.5', usMen: '13.5', usWomen: '15.0' }, subLabel: '30.5 cm' },
    ],
    measuringTips: [
      { title: 'Foot Length', desc: 'Stand on a piece of paper with your heel against a wall. Mark the tip of your longest toe and measure the distance in cm.' },
      { title: 'Wide Feet / Thick Socks', desc: 'If you have wide feet or wear thick socks, we recommend selecting one size up.' },
    ],
  },
};

// Helper to determine the best chart key for a product
export function resolveSizeChartKey(product: any): string {
  if (!product) return 'tops';
  const cat = (product.category || '').toLowerCase();
  const text = `${product.name || ''} ${product.category || ''} ${product.department || ''} ${Array.isArray(product.tags) ? product.tags.join(' ') : ''}`.toLowerCase();

  if (cat === 'footwear' || text.includes('shoe') || text.includes('sneaker') || text.includes('heel') || text.includes('slide') || text.includes('croc') || text.includes('boot') || text.includes('loafer')) {
    return 'footwear';
  }
  if (cat === 'native' || text.includes('senator') || text.includes('agbada') || text.includes('kaftan') || text.includes('jalabiya') || text.includes('boubou') || text.includes('ankara')) {
    return 'native';
  }
  if (cat === 'bottoms' || text.includes('jean') || text.includes('trouser') || text.includes('pant') || text.includes('cargo') || text.includes('jogger') || text.includes('short') || text.includes('skirt')) {
    return 'bottoms';
  }
  if (text.includes('dress') || text.includes('gown') || text.includes('corset') || text.includes('two-piece') || text.includes('co-ord') || text.includes('blouse') || text.includes('jumpsuit')) {
    return 'dresses';
  }
  return 'tops';
}

// Predict size based on height, weight, preference and product sizes
export function predictBestSize({
  heightCm,
  weightKg,
  fitPreference,
  chartKey,
  availableSizes = [],
  footLengthCm,
}: {
  heightCm: number;
  weightKg: number;
  fitPreference: 'slim' | 'regular' | 'oversized';
  chartKey: string;
  availableSizes?: string[];
  footLengthCm?: number;
}): { size: string; confidence: number; reason: string } {
  // 1. FOOTWEAR PREDICTION
  if (chartKey === 'footwear') {
    let targetEu = 42;
    if (footLengthCm && footLengthCm > 20) {
      if (footLengthCm <= 24.2) targetEu = 38;
      else if (footLengthCm <= 24.8) targetEu = 39;
      else if (footLengthCm <= 25.3) targetEu = 40;
      else if (footLengthCm <= 26.0) targetEu = 41;
      else if (footLengthCm <= 27.0) targetEu = 42;
      else if (footLengthCm <= 27.8) targetEu = 43;
      else if (footLengthCm <= 28.3) targetEu = 44;
      else if (footLengthCm <= 29.0) targetEu = 45;
      else if (footLengthCm <= 30.0) targetEu = 46;
      else targetEu = 47;
    } else {
      // Estimate shoe size from height
      if (heightCm < 160) targetEu = 38;
      else if (heightCm < 168) targetEu = 39;
      else if (heightCm < 174) targetEu = 41;
      else if (heightCm < 180) targetEu = 42;
      else if (heightCm < 186) targetEu = 43;
      else if (heightCm < 192) targetEu = 44;
      else targetEu = 45;
    }

    if (fitPreference === 'oversized') targetEu += 1;
    const targetEuStr = String(targetEu);

    const matchedSize = availableSizes.length > 0
      ? (availableSizes.includes(targetEuStr) ? targetEuStr : availableSizes[0] || targetEuStr)
      : targetEuStr;

    return {
      size: matchedSize,
      confidence: 94,
      reason: `EU ${matchedSize} matches standard foot length with comfortable toe room for walking.`,
    };
  }

  // 2. BOTTOMS / TROUSERS PREDICTION (waist sizes: 28, 30, 32, 34, 36, 38, 40)
  const isBottomNumeric = availableSizes.some(s => ['28', '30', '32', '34', '36', '38', '40'].includes(s.trim()));
  if (chartKey === 'bottoms' && isBottomNumeric) {
    let estimatedWaist = Math.round(weightKg * 0.42 + (heightCm - 170) * 0.05);
    // Snap to even numbers 28 - 40
    let snapped = Math.round(estimatedWaist / 2) * 2;
    snapped = Math.max(28, Math.min(40, snapped));

    if (fitPreference === 'oversized' && snapped < 40) snapped += 2;
    if (fitPreference === 'slim' && snapped > 28) snapped -= 2;

    const snappedStr = String(snapped);
    const matchedSize = availableSizes.includes(snappedStr) ? snappedStr : (availableSizes[0] || snappedStr);

    return {
      size: matchedSize,
      confidence: 93,
      reason: `Size ${matchedSize} matches your waist circumference with clean seat and thigh room.`,
    };
  }

  // 3. APPAREL (TOPS, DRESSES, NATIVE) (S, M, L, XL, XXL)
  let baseSize: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL' = 'M';

  if (chartKey === 'dresses') {
    // Women's contouring
    if (heightCm < 162) {
      if (weightKg < 52) baseSize = 'XS';
      else if (weightKg < 60) baseSize = 'S';
      else if (weightKg < 70) baseSize = 'M';
      else if (weightKg < 80) baseSize = 'L';
      else baseSize = 'XL';
    } else if (heightCm < 172) {
      if (weightKg < 55) baseSize = 'S';
      else if (weightKg < 65) baseSize = 'M';
      else if (weightKg < 76) baseSize = 'L';
      else if (weightKg < 88) baseSize = 'XL';
      else baseSize = 'XXL';
    } else {
      if (weightKg < 62) baseSize = 'M';
      else if (weightKg < 74) baseSize = 'L';
      else if (weightKg < 88) baseSize = 'XL';
      else baseSize = 'XXL';
    }
  } else {
    // Standard unisex / men's proportion
    if (heightCm < 168) {
      if (weightKg < 58) baseSize = 'XS';
      else if (weightKg < 66) baseSize = 'S';
      else if (weightKg < 76) baseSize = 'M';
      else if (weightKg < 88) baseSize = 'L';
      else baseSize = 'XL';
    } else if (heightCm < 182) {
      if (weightKg < 64) baseSize = 'S';
      else if (weightKg < 76) baseSize = 'M';
      else if (weightKg < 90) baseSize = 'L';
      else if (weightKg < 104) baseSize = 'XL';
      else baseSize = 'XXL';
    } else {
      if (weightKg < 72) baseSize = 'M';
      else if (weightKg < 86) baseSize = 'L';
      else if (weightKg < 102) baseSize = 'XL';
      else if (weightKg < 116) baseSize = 'XXL';
      else baseSize = '3XL';
    }
  }

  const hierarchy: ('XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL')[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
  let idx = hierarchy.indexOf(baseSize);

  if (fitPreference === 'oversized' && idx < hierarchy.length - 1) {
    idx += 1;
  } else if (fitPreference === 'slim' && idx > 0) {
    idx -= 1;
  }

  const calculatedSize = hierarchy[idx];
  const matchedSize = availableSizes.length > 0 && availableSizes.includes(calculatedSize)
    ? calculatedSize
    : (availableSizes.length > 0 ? (availableSizes.includes(baseSize) ? baseSize : availableSizes[0]) : calculatedSize);

  const confidence = Math.min(96, Math.max(88, Math.round(91 + (heightCm % 6))));

  return {
    size: matchedSize,
    confidence,
    reason: fitPreference === 'oversized'
      ? 'Sized up for a relaxed, streetwear-ready slouch with extra shoulder room.'
      : fitPreference === 'slim'
      ? 'Tailored close to your chest and torso for a sharp, modern silhouette.'
      : 'True-to-fit proportion with balanced chest drape and comfortable sleeves.',
  };
}
