export interface NormalizedProductColor {
  name: string;
  hex: string;
  imageUrl?: string;
}

export const STANDARD_FASHION_COLORS: { name: string; hex: string }[] = [
  { name: 'Pitch Black', hex: '#111111' },
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Ivory / Cream', hex: '#FAF5EF' },
  { name: 'Beige / Khaki', hex: '#D4B996' },
  { name: 'Camel / Tan', hex: '#C19A6B' },
  { name: 'Chocolate Brown', hex: '#451A03' },
  { name: 'Pink', hex: '#f472b6' },
  { name: 'Blush Pink', hex: '#E8B4B8' },
  { name: 'Hot Pink / Fuchsia', hex: '#EC4899' },
  { name: 'Crimson Red', hex: '#DC2626' },
  { name: 'Wine / Burgundy', hex: '#831843' },
  { name: 'Navy Blue', hex: '#1E3A8A' },
  { name: 'Royal Blue', hex: '#2563EB' },
  { name: 'Sky Blue', hex: '#38BDF8' },
  { name: 'Forest Green', hex: '#065F46' },
  { name: 'Emerald Green', hex: '#046307' },
  { name: 'Olive Green', hex: '#556B2F' },
  { name: 'Mint Green', hex: '#A7F3D0' },
  { name: 'Mustard Yellow', hex: '#D97706' },
  { name: 'Burnt Orange', hex: '#EA580C' },
  { name: 'Charcoal Grey', hex: '#374151' },
  { name: 'Heather Grey', hex: '#9CA3AF' },
  { name: 'Silver / Slate', hex: '#CBD5E1' },
  { name: 'Lavender', hex: '#E6E6FA' },
  { name: 'Royal Purple', hex: '#7E22CE' },
  { name: 'Gold / Champagne', hex: '#D4AF37' },
  { name: 'Multi-Color / Pattern', hex: '#6366F1' },
];

export const COLOR_HEX_MAP: Record<string, string> = {
  black: '#111111',
  'pitch black': '#111111',
  white: '#ffffff',
  'pure white': '#ffffff',
  'off-white': '#f5f5f0',
  cream: '#faf5ef',
  ivory: '#faf5ef',
  'ivory / cream': '#faf5ef',
  pink: '#f472b6',
  'blush pink': '#e8b4b8',
  'dusty rose': '#c98986',
  'hot pink': '#ec4899',
  fuchsia: '#ec4899',
  'rose pink': '#e07a8a',
  red: '#dc2626',
  'crimson red': '#dc2626',
  wine: '#831843',
  burgundy: '#831843',
  maroon: '#800000',
  blue: '#2563eb',
  'navy blue': '#1e3a8a',
  navy: '#1e3a8a',
  'royal blue': '#2563eb',
  'sky blue': '#38bdf8',
  teal: '#0d9488',
  green: '#065f46',
  'forest green': '#065f46',
  'emerald green': '#046307',
  'olive green': '#556b2f',
  olive: '#556b2f',
  mint: '#a7f3d0',
  sage: '#9caf88',
  brown: '#451a03',
  'chocolate brown': '#451a03',
  mocha: '#4e3629',
  tan: '#c19a6b',
  camel: '#c19a6b',
  beige: '#d4b996',
  khaki: '#d4b996',
  nude: '#e5d6c5',
  sand: '#e5d6c5',
  grey: '#9ca3af',
  gray: '#9ca3af',
  'heather grey': '#9ca3af',
  'charcoal grey': '#374151',
  charcoal: '#374151',
  silver: '#cbd5e1',
  gold: '#d4af37',
  champagne: '#f7e7ce',
  yellow: '#d97706',
  mustard: '#d97706',
  orange: '#ea580c',
  purple: '#7e22ce',
  lavender: '#e6e6fa',
  multi: '#6366f1',
  'multi-color': '#6366f1',
  'multi-color / pattern': '#6366f1',
};

export function resolveColorNameToHex(name: string, fallback?: string): string {
  if (!name) return fallback || '#111111';
  const lower = name.toLowerCase().trim();
  if (COLOR_HEX_MAP[lower]) return COLOR_HEX_MAP[lower];

  for (const [k, v] of Object.entries(COLOR_HEX_MAP)) {
    if (lower.includes(k)) return v;
  }
  return fallback || '#111111';
}

export function resolveHexToColorName(hex: string): string {
  if (!hex) return 'Standard';
  const cleanHex = hex.toLowerCase().trim();
  for (const [name, h] of Object.entries(COLOR_HEX_MAP)) {
    if (h === cleanHex) {
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
  }
  return cleanHex.toUpperCase();
}

/**
 * Universal color sanitizer and normalizer.
 * Safely parses stringified JSON objects, deduplicates colors case-insensitively,
 * resolves hex swatches, and ensures no raw JSON strings ever leak to the UI.
 */
export function parseAndNormalizeColors(rawColors: any): NormalizedProductColor[] {
  if (!rawColors) return [{ name: 'Standard', hex: '#111111' }];

  let list: any[] = [];
  if (Array.isArray(rawColors)) {
    list = rawColors;
  } else if (typeof rawColors === 'string') {
    const trimmed = rawColors.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) list = parsed;
        else list = [trimmed];
      } catch {
        list = [trimmed];
      }
    } else {
      list = [trimmed];
    }
  } else if (typeof rawColors === 'object') {
    list = [rawColors];
  }

  const result: NormalizedProductColor[] = [];
  const seenNames = new Set<string>();

  for (const item of list) {
    if (!item) continue;

    let parsedName = '';
    let parsedHex = '';
    let parsedImg: string | undefined = undefined;

    if (typeof item === 'string') {
      const trimmed = item.trim();
      // Handle stringified JSON e.g. '{"name":"White","hex":"#ffffff"}'
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          const obj = JSON.parse(trimmed);
          parsedName = obj.name || obj.label || '';
          parsedHex = obj.hex || obj.color || '';
          parsedImg = obj.imageUrl || obj.url;
        } catch {
          parsedName = trimmed.replace(/[{}"']/g, '').replace(/name:|hex:/gi, '').trim();
        }
      } else if (trimmed.startsWith('#')) {
        parsedHex = trimmed;
        parsedName = resolveHexToColorName(trimmed);
      } else if (trimmed.includes(',')) {
        // e.g. "Black, White"
        const parts = trimmed.split(',').map((s: string) => s.trim()).filter(Boolean);
        for (const p of parts) {
          const subRes = parseAndNormalizeColors([p]);
          for (const sr of subRes) {
            const key = sr.name.toLowerCase().trim();
            if (key && !seenNames.has(key)) {
              seenNames.add(key);
              result.push(sr);
            }
          }
        }
        continue;
      } else {
        parsedName = trimmed;
        parsedHex = resolveColorNameToHex(trimmed);
      }
    } else if (typeof item === 'object' && item !== null) {
      let rawName = String(item.name || item.label || '').trim();
      // Handle nested stringified JSON in name property
      if (rawName.startsWith('{') && rawName.endsWith('}')) {
        try {
          const inner = JSON.parse(rawName);
          rawName = inner.name || inner.label || rawName;
          parsedHex = inner.hex || item.hex || '';
          parsedImg = inner.imageUrl || item.imageUrl;
        } catch {}
      }
      parsedName = rawName;
      parsedHex = item.hex || resolveColorNameToHex(rawName);
      parsedImg = item.imageUrl || item.image_url || item.url;
    }

    // Strip any residual formatting or JSON punctuation
    parsedName = parsedName
      .replace(/^[\{\[\"\']+|[\}\]\"\']+$/g, '')
      .replace(/^(name|hex):\s*/i, '')
      .replace(/\\"/g, '')
      .trim();

    if (!parsedName || parsedName.toLowerCase() === 'none' || parsedName.toLowerCase() === 'undefined') continue;

    // Capitalize each word cleanly
    const cleanName = parsedName
      .split(' ')
      .map((w: string) => w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : '')
      .join(' ')
      .trim();

    const cleanHex = (parsedHex && parsedHex.startsWith('#')) ? parsedHex : resolveColorNameToHex(cleanName);

    const key = cleanName.toLowerCase();
    if (!seenNames.has(key)) {
      seenNames.add(key);
      result.push({
        name: cleanName,
        hex: cleanHex,
        imageUrl: parsedImg,
      });
    }
  }

  if (result.length === 0) {
    return [{ name: 'Standard', hex: '#111111' }];
  }

  return result;
}
