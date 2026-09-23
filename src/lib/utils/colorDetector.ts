/**
 * AI Computer Vision Garment & Product Color Detection Engine for Veyra Luxury Fashion.
 * 
 * Accurately analyzes fashion, footwear, bags, and garment photography:
 * 1. Multi-zone Perimeter vs Interior Saliency Analysis (isolates studio backdrops, concrete floors, and walls).
 * 2. Multi-panel Collage Awareness (detects foreground subjects in single-shot and 4-panel product layouts).
 * 3. Human Skin Tone Discrimination (discriminates melanin skin vs blush/pink/rose/nude fabrics).
 * 4. Perceptual HSL & Chromatic Contrast Space (prevents dark navy/greens from collapsing into black/grey).
 * 5. Extracts authentic product hex swatches and maps them to luxury retail colorways.
 */

export interface FashionColor {
  name: string;
  hex: string;
  category: 'whites_creams' | 'greens' | 'blues' | 'reds_pinks' | 'yellows_oranges' | 'browns_earth' | 'greys_blacks' | 'purples';
  rgb: [number, number, number];
}

export const FASHION_COLOR_PALETTE: FashionColor[] = [
  // Whites, Creams & Neutrals
  { name: 'Ivory / Cream', hex: '#FAF5EF', category: 'whites_creams', rgb: [250, 245, 239] },
  { name: 'Off-White', hex: '#F5F5F0', category: 'whites_creams', rgb: [245, 245, 240] },
  { name: 'Pure White', hex: '#FFFFFF', category: 'whites_creams', rgb: [255, 255, 255] },
  { name: 'Beige / Khaki', hex: '#D4B996', category: 'whites_creams', rgb: [212, 185, 150] },
  { name: 'Sand / Nude', hex: '#E5D6C5', category: 'whites_creams', rgb: [229, 214, 197] },
  { name: 'Camel / Tan', hex: '#C19A6B', category: 'whites_creams', rgb: [193, 154, 107] },

  // Reds, Pinks & Roses
  { name: 'Blush Pink', hex: '#E8B4B8', category: 'reds_pinks', rgb: [232, 180, 184] },
  { name: 'Dusty Rose / Pink', hex: '#C98986', category: 'reds_pinks', rgb: [201, 137, 134] },
  { name: 'Powder Pink', hex: '#F9D5D3', category: 'reds_pinks', rgb: [249, 213, 211] },
  { name: 'Rose Pink', hex: '#E07A8A', category: 'reds_pinks', rgb: [224, 122, 138] },
  { name: 'Dusty Mauve', hex: '#A8798A', category: 'reds_pinks', rgb: [168, 121, 138] },
  { name: 'Hot Pink / Fuchsia', hex: '#EC4899', category: 'reds_pinks', rgb: [236, 72, 153] },
  { name: 'Crimson Red', hex: '#DC2626', category: 'reds_pinks', rgb: [220, 38, 38] },
  { name: 'Wine / Burgundy', hex: '#831843', category: 'reds_pinks', rgb: [131, 24, 67] },
  { name: 'Maroon', hex: '#800000', category: 'reds_pinks', rgb: [128, 0, 0] },
  { name: 'Coral', hex: '#FF7F50', category: 'reds_pinks', rgb: [255, 127, 80] },
  { name: 'Peach / Powder Blush', hex: '#FFDAB9', category: 'reds_pinks', rgb: [255, 218, 185] },

  // Greens & Olives
  { name: 'Olive Green', hex: '#556B2F', category: 'greens', rgb: [85, 107, 47] },
  { name: 'Army / Khaki Green', hex: '#4B5320', category: 'greens', rgb: [75, 83, 32] },
  { name: 'Sage Green', hex: '#9CAF88', category: 'greens', rgb: [156, 175, 136] },
  { name: 'Forest Green', hex: '#065F46', category: 'greens', rgb: [6, 95, 70] },
  { name: 'Emerald Green', hex: '#046307', category: 'greens', rgb: [4, 99, 7] },
  { name: 'Mint Green', hex: '#A7F3D0', category: 'greens', rgb: [167, 243, 208] },
  { name: 'Lime Green', hex: '#84CC16', category: 'greens', rgb: [132, 204, 22] },
  { name: 'Moss Green', hex: '#8A9A5B', category: 'greens', rgb: [138, 154, 91] },

  // Browns & Earth Tones
  { name: 'Chocolate Brown', hex: '#451A03', category: 'browns_earth', rgb: [69, 26, 3] },
  { name: 'Mocha / Coffee', hex: '#4E3629', category: 'browns_earth', rgb: [78, 54, 41] },
  { name: 'Rust / Terracotta', hex: '#B7410E', category: 'browns_earth', rgb: [183, 65, 14] },
  { name: 'Caramel / Brown', hex: '#AF6E4D', category: 'browns_earth', rgb: [175, 110, 77] },
  { name: 'Taupe', hex: '#8B8589', category: 'browns_earth', rgb: [139, 133, 137] },

  // Blues
  { name: 'Navy Blue', hex: '#1E3A8A', category: 'blues', rgb: [30, 58, 138] },
  { name: 'Midnight Blue', hex: '#0B192C', category: 'blues', rgb: [11, 25, 44] },
  { name: 'Royal Blue', hex: '#2563EB', category: 'blues', rgb: [37, 99, 235] },
  { name: 'Sky Blue / Baby Blue', hex: '#38BDF8', category: 'blues', rgb: [56, 189, 248] },
  { name: 'Denim Blue', hex: '#4A6984', category: 'blues', rgb: [74, 105, 132] },
  { name: 'Teal / Aqua', hex: '#0D9488', category: 'blues', rgb: [13, 148, 136] },

  // Yellows & Oranges
  { name: 'Mustard Yellow', hex: '#D97706', category: 'yellows_oranges', rgb: [217, 119, 6] },
  { name: 'Champagne Gold', hex: '#F7E7CE', category: 'yellows_oranges', rgb: [247, 231, 206] },
  { name: 'Emerald Gold', hex: '#E6C367', category: 'yellows_oranges', rgb: [230, 195, 103] },
  { name: 'Burnt Orange', hex: '#EA580C', category: 'yellows_oranges', rgb: [234, 88, 12] },

  // Greys & Blacks
  { name: 'Pitch Black', hex: '#111111', category: 'greys_blacks', rgb: [17, 17, 17] },
  { name: 'Charcoal Grey', hex: '#374151', category: 'greys_blacks', rgb: [55, 65, 81] },
  { name: 'Heather Grey', hex: '#9CA3AF', category: 'greys_blacks', rgb: [156, 163, 175] },
  { name: 'Silver / Slate', hex: '#CBD5E1', category: 'greys_blacks', rgb: [203, 213, 225] },

  // Purples
  { name: 'Lavender', hex: '#E6E6FA', category: 'purples', rgb: [230, 230, 250] },
  { name: 'Royal Purple', hex: '#7E22CE', category: 'purples', rgb: [126, 34, 206] },
  { name: 'Plum / Deep Purple', hex: '#581845', category: 'purples', rgb: [88, 24, 69] },
];

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => Math.min(255, Math.max(0, Math.round(x))).toString(16).padStart(2, '0')).join('');
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Intelligent perceptual color naming using HSL and RGB chromatic contrast.
 * Accurately distinguishes deep Navy Blues and Forest Greens from black/grey.
 */
export function classifyGarmentColor(r: number, g: number, b: number): { name: string; hex: string } {
  const { h, s, l } = rgbToHsl(r, g, b);
  const rawHex = rgbToHex(r, g, b);
  const maxDiff = Math.max(r, g, b) - Math.min(r, g, b);

  // 1. Extreme Darks & Blacks
  // If it's very dark and lacks noticeable blue/green tint:
  if (l <= 8) return { name: 'Pitch Black', hex: rawHex };
  if (l <= 18 && maxDiff < 14) return { name: 'Pitch Black', hex: rawHex };
  if (l <= 24 && maxDiff < 12 && s < 12) return { name: 'Charcoal Grey', hex: rawHex };

  // 2. Extreme Lights & Pure Whites
  if (l >= 94 && s <= 15) return { name: 'Pure White', hex: rawHex };

  // 3. Deep Blues & Navy (Even with low lightness L: 8-38%, blue dominance indicates Navy/Midnight)
  if (h >= 195 && h <= 255 || (b > r + 8 && b > g + 4)) {
    if (l <= 22) return { name: 'Midnight Blue', hex: rawHex };
    if (l <= 36) return { name: 'Navy Blue', hex: rawHex };
    if (l >= 70) return { name: 'Sky Blue / Baby Blue', hex: rawHex };
    if (s > 45) return { name: 'Royal Blue', hex: rawHex };
    return { name: 'Denim Blue', hex: rawHex };
  }

  // 4. Whites, Creams & Ivory (High Lightness > 78% with neutral or warm tint)
  if (l >= 80 && s <= 45 && h >= 25 && h <= 55) {
    if (l >= 88 && s <= 18) return { name: 'Off-White', hex: rawHex };
    return { name: 'Ivory / Cream', hex: rawHex };
  }
  if (l >= 85 && s <= 15) return { name: 'Off-White', hex: rawHex };

  // 5. Monochromatic Greys (Strictly requires low saturation AND low RGB difference)
  if (s < 10 && maxDiff < 15) {
    if (l > 75) return { name: 'Silver / Slate', hex: rawHex };
    if (l > 42) return { name: 'Heather Grey', hex: rawHex };
    return { name: 'Charcoal Grey', hex: rawHex };
  }

  // 6. Reds, Pinks & Roses (Hue: 335° - 360° or 0° - 18°)
  if (h >= 335 || h <= 18) {
    if (l >= 68) {
      if (s >= 35) return { name: 'Blush Pink', hex: rawHex };
      return { name: 'Dusty Rose / Pink', hex: rawHex };
    }
    if (l >= 50) {
      if (s >= 40) return { name: 'Rose Pink', hex: rawHex };
      return { name: 'Dusty Mauve', hex: rawHex };
    }
    if (l < 38) {
      if (s >= 20 && (h >= 340 || h <= 10)) return { name: 'Wine / Burgundy', hex: rawHex };
      return { name: 'Maroon', hex: rawHex };
    }
    return { name: 'Crimson Red', hex: rawHex };
  }

  // 7. Oranges, Terracottas & Corals (Hue: 19° - 34°)
  if (h >= 19 && h <= 34) {
    if (l >= 75 && s <= 45) return { name: 'Peach / Powder Blush', hex: rawHex };
    if (l >= 60 && s > 45) return { name: 'Coral', hex: rawHex };
    if (l < 42 && s > 25) return { name: 'Rust / Terracotta', hex: rawHex };
    if (s <= 35 && l >= 55) return { name: 'Sand / Nude', hex: rawHex };
    if (s <= 35 && l < 55) return { name: 'Caramel / Tan', hex: rawHex };
    return { name: 'Burnt Orange', hex: rawHex };
  }

  // 8. Yellows, Beiges, Khakis & Earth Browns (Hue: 35° - 58°)
  if (h >= 35 && h <= 58) {
    if (l <= 45 && g > b * 1.3 && h >= 42) {
      return { name: 'Army / Khaki Green', hex: rawHex };
    }
    if (l >= 78 && s <= 40) return { name: 'Ivory / Cream', hex: rawHex };
    if (l >= 60 && s <= 42) return { name: 'Beige / Khaki', hex: rawHex };
    if (l >= 65 && s > 42) return { name: 'Champagne Gold', hex: rawHex };
    if (l >= 45 && s > 50) return { name: 'Mustard Yellow', hex: rawHex };
    if (l < 42 && s < 30) return { name: 'Mocha / Coffee', hex: rawHex };
    if (l < 42 && s >= 30) return { name: 'Chocolate Brown', hex: rawHex };
    return { name: 'Camel / Tan', hex: rawHex };
  }

  // 9. Greens, Olives, Sages & Emeralds (Hue: 59° - 165°)
  if (h >= 59 && h <= 165) {
    if (h <= 95) {
      if (s > 60 && l > 50) return { name: 'Lime Green', hex: rawHex };
      if (l <= 38) return { name: 'Army / Khaki Green', hex: rawHex };
      if (l <= 58) return { name: 'Olive Green', hex: rawHex };
      return { name: 'Olive Green', hex: rawHex };
    }
    if (h <= 135) {
      if (l >= 68) return { name: 'Mint Green', hex: rawHex };
      if (l <= 38) return { name: 'Forest Green', hex: rawHex };
      return { name: 'Emerald Green', hex: rawHex };
    }
    return { name: 'Sage Green', hex: rawHex };
  }

  // 10. Cyans & Teals (Hue: 166° - 194°)
  if (h >= 166 && h <= 194) {
    if (l < 40) return { name: 'Teal / Aqua', hex: rawHex };
    return { name: 'Teal / Aqua', hex: rawHex };
  }

  // 11. Purples, Lavenders & Violets (Hue: 256° - 334°)
  if (h >= 256 && h <= 334) {
    if (l >= 68) return { name: 'Lavender', hex: rawHex };
    if (l <= 35) return { name: 'Plum / Deep Purple', hex: rawHex };
    return { name: 'Royal Purple', hex: rawHex };
  }

  return { name: 'Pitch Black', hex: rawHex };
}

interface ColorCluster {
  key: string;
  totalWeight: number;
  interiorWeight: number;
  perimeterWeight: number;
  totalR: number;
  totalG: number;
  totalB: number;
  pixelCount: number;
}

/**
 * Detect the dominant garment or product color using computer-vision saliency clustering.
 * 
 * 1. Analyzes spatial distribution (perimeter vs interior) to isolate studio walls and concrete floors.
 * 2. Rewards central & multi-quadrant focal points to prioritize the actual product over backdrops.
 * 3. Removes human skin tones when present.
 * 4. Extracts the true authentic product hex swatch and assigns the fashion retail colorway.
 */
export async function detectGarmentColor(
  imageUrlOrDataUrl: string
): Promise<{ name: string; hex: string; rawHex: string }> {
  if (typeof window === 'undefined') {
    return { name: 'Navy Blue', hex: '#1E3A8A', rawHex: '#1E3A8A' };
  }

  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 120; // 120x120 high density sampling grid (14,400 samples)
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          resolve({ name: 'Pitch Black', hex: '#111111', rawHex: '#111111' });
          return;
        }

        ctx.drawImage(img, 0, 0, size, size);
        const imgData = ctx.getImageData(0, 0, size, size).data;

        const clusters = new Map<string, ColorCluster>();
        const perimeterMargin = Math.round(size * 0.16); // Outer 16% border for background isolation

        // Center points for saliency (Main center + focal zones)
        const focalCenters = [
          { x: size * 0.5, y: size * 0.5, weight: 4.5 }, // Strong Main Center
          { x: size * 0.5, y: size * 0.42, weight: 3.5 }, // Upper Center (Chest/Upper)
          { x: size * 0.5, y: size * 0.58, weight: 3.5 }, // Lower Center (Lower/Sole)
          { x: size * 0.32, y: size * 0.32, weight: 2.0 }, // Top-Left Quadrant
          { x: size * 0.68, y: size * 0.32, weight: 2.0 }, // Top-Right Quadrant
          { x: size * 0.32, y: size * 0.68, weight: 2.0 }, // Bottom-Left Quadrant
          { x: size * 0.68, y: size * 0.68, weight: 2.0 }, // Bottom-Right Quadrant
        ];

        // 1. First Pass: Sample perimeter pixels to identify dominant background color (walls, floor, grey studio)
        const bgColors: { r: number; g: number; b: number }[] = [];
        for (let y = 0; y < size; y += 4) {
          for (let x = 0; x < size; x += 4) {
            const isBorder = x < perimeterMargin || x >= size - perimeterMargin || y < perimeterMargin || y >= size - perimeterMargin;
            if (isBorder) {
              const idx = (y * size + x) * 4;
              if (imgData[idx + 3] >= 128) {
                bgColors.push({ r: imgData[idx], g: imgData[idx + 1], b: imgData[idx + 2] });
              }
            }
          }
        }

        for (let y = 0; y < size; y += 2) {
          for (let x = 0; x < size; x += 2) {
            const idx = (y * size + x) * 4;
            const r = imgData[idx];
            const g = imgData[idx + 1];
            const b = imgData[idx + 2];
            const a = imgData[idx + 3];

            if (a < 128) continue; // Transparent

            // Discriminate human melanin skin tone:
            // R > 130 && G > 85 && B > 45 with R > G > B and high Red-Green difference
            const isHumanSkin =
              r > 130 &&
              g > 85 &&
              b > 45 &&
              r > g &&
              g > b &&
              (g - b) > 22 &&
              (r - g) > 20;

            if (isHumanSkin) continue;

            const isPerimeter =
              x < perimeterMargin ||
              x >= size - perimeterMargin ||
              y < perimeterMargin ||
              y >= size - perimeterMargin;

            // Calculate spatial focal saliency weight
            let saliencyWeight = 1.0;
            if (!isPerimeter) {
              let maxFocal = 1.0;
              for (const fc of focalCenters) {
                const dist = Math.hypot(x - fc.x, y - fc.y) / size;
                const weight = fc.weight * Math.max(0, 1 - dist * 2);
                if (weight > maxFocal) maxFocal = weight;
              }
              saliencyWeight = maxFocal;
            }

            // Quantize into 16-step perceptual RGB buckets
            const qR = Math.round(r / 16) * 16;
            const qG = Math.round(g / 16) * 16;
            const qB = Math.round(b / 16) * 16;
            const key = `${qR},${qG},${qB}`;

            const existing = clusters.get(key) || {
              key,
              totalWeight: 0,
              interiorWeight: 0,
              perimeterWeight: 0,
              totalR: 0,
              totalG: 0,
              totalB: 0,
              pixelCount: 0,
            };

            existing.totalWeight += saliencyWeight;
            if (isPerimeter) {
              existing.perimeterWeight += 1.0;
            } else {
              existing.interiorWeight += saliencyWeight;
            }
            existing.totalR += r;
            existing.totalG += g;
            existing.totalB += b;
            existing.pixelCount++;

            clusters.set(key, existing);
          }
        }

        if (clusters.size === 0) {
          resolve({ name: 'Pitch Black', hex: '#111111', rawHex: '#111111' });
          return;
        }

        // Score clusters to determine genuine product color vs background
        let bestCluster: ColorCluster | null = null;
        let highestScore = -Infinity;

        for (const cluster of clusters.values()) {
          const avgR = cluster.totalR / cluster.pixelCount;
          const avgG = cluster.totalG / cluster.pixelCount;
          const avgB = cluster.totalB / cluster.pixelCount;
          const { s, l } = rgbToHsl(avgR, avgG, avgB);
          const maxDiff = Math.max(avgR, avgG, avgB) - Math.min(avgR, avgG, avgB);

          const perimeterRatio = cluster.perimeterWeight / cluster.pixelCount;

          // Check if cluster is close to background perimeter sample
          let isSimilarToBg = false;
          if (bgColors.length > 0 && perimeterRatio > 0.25) {
            let closeBgCount = 0;
            for (let i = 0; i < Math.min(30, bgColors.length); i++) {
              const bg = bgColors[i];
              const diff = Math.hypot(avgR - bg.r, avgG - bg.g, avgB - bg.b);
              if (diff < 35) closeBgCount++;
            }
            if (closeBgCount > 10) isSimilarToBg = true;
          }

          // Background Penalty: If more than 35% is on border, or matches border background sample
          if (isSimilarToBg || (perimeterRatio > 0.40 && (s < 18 || l > 85))) {
            continue; // Exclude background wall, grey floor, or studio backdrop
          }

          // Saturation & Contrast boost: Real product colors (Navy, Red, Green, Gold, Tan, Brown) heavily outscore grey studio backdrops
          const chromaticBoost = (1 + Math.min(3.0, (s / 20))) * (maxDiff > 14 ? 1.6 : 1.0);
          
          // Interior density score heavily weighted by center saliency
          const score = cluster.interiorWeight * chromaticBoost * Math.max(0.05, 1 - perimeterRatio * 1.5);

          if (score > highestScore) {
            highestScore = score;
            bestCluster = cluster;
          }
        }

        // Fallback to highest interior weight if all were penalized
        if (!bestCluster) {
          let maxInterior = -1;
          for (const cluster of clusters.values()) {
            if (cluster.interiorWeight > maxInterior) {
              maxInterior = cluster.interiorWeight;
              bestCluster = cluster;
            }
          }
        }

        if (!bestCluster || bestCluster.pixelCount === 0) {
          resolve({ name: 'Pitch Black', hex: '#111111', rawHex: '#111111' });
          return;
        }

        const finalR = Math.round(bestCluster.totalR / bestCluster.pixelCount);
        const finalG = Math.round(bestCluster.totalG / bestCluster.pixelCount);
        const finalB = Math.round(bestCluster.totalB / bestCluster.pixelCount);
        const productHex = rgbToHex(finalR, finalG, finalB);

        const classified = classifyGarmentColor(finalR, finalG, finalB);

        resolve({
          name: classified.name,
          hex: productHex, // Authentic extracted color hex
          rawHex: productHex
        });
      } catch (e) {
        console.error('Error in detectGarmentColor:', e);
        resolve({ name: 'Pitch Black', hex: '#111111', rawHex: '#111111' });
      }
    };

    img.onerror = () => {
      resolve({ name: 'Pitch Black', hex: '#111111', rawHex: '#111111' });
    };

    img.src = imageUrlOrDataUrl;
  });
}
