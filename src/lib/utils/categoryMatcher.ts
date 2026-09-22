/**
 * Centralized Category Matching & Taxonomy Engine
 * Prevents fuzzy text traps (e.g., 'baggy' matching 'bag', 'skirts' matching corset descriptions)
 * and guarantees accurate categorization across all shop views, category pages, and vendor uploads.
 */

export interface ProductLike {
  id?: string;
  name?: string;
  category?: string;
  subCategory?: string;
  subcategory?: string;
  genderTarget?: string;
  gender_target?: string;
  description?: string;
  tags?: string[] | string;
  department?: string;
}

// Word boundary test helper to prevent substring false positives
function hasWordMatch(text: string, regex: RegExp): boolean {
  if (!text) return false;
  return regex.test(text);
}

function getProductSearchTokens(p: ProductLike): {
  name: string;
  category: string;
  subCategory: string;
  tags: string[];
  cleanTagsString: string;
} {
  const name = String(p.name || '').toLowerCase();
  const category = String(p.category || '').toLowerCase();
  const subCategory = String(p.subCategory || p.subcategory || '').toLowerCase();
  
  let tags: string[] = [];
  if (Array.isArray(p.tags)) {
    tags = p.tags.map(t => String(t || '').toLowerCase());
  } else if (typeof p.tags === 'string') {
    tags = p.tags.split(',').map(t => t.trim().toLowerCase());
  }

  const cleanTagsString = tags.join(' ');

  return { name, category, subCategory, tags, cleanTagsString };
}

/**
 * Detects whether a product is Native / Traditional African Couture
 */
export function isNativeProduct(p: ProductLike): boolean {
  const { name, category, subCategory, cleanTagsString } = getProductSearchTokens(p);

  if (
    category === 'native' ||
    subCategory.includes('senator') ||
    subCategory.includes('agbada') ||
    subCategory.includes('kaftan') ||
    subCategory.includes('boubou') ||
    subCategory.includes('jalabiya') ||
    subCategory.includes('lace_ankara') ||
    subCategory.includes('fila')
  ) {
    return true;
  }

  const nativeRegex = /\b(senator|agbada|kaftan|caftan|jalabiya|boubou|bubu|ankara|aso-?oke|fila|abaya|abayas|dashiki|thobe|native)\b/i;
  
  return (
    hasWordMatch(name, nativeRegex) ||
    hasWordMatch(subCategory, nativeRegex) ||
    hasWordMatch(cleanTagsString, nativeRegex)
  );
}

/**
 * Matches high-level Garment Categories ('tops' | 'bottoms' | 'outerwear' | 'footwear' | 'accessories' | 'native')
 */
export function matchesCategoryFilter(p: ProductLike, cat: string): boolean {
  if (!cat || cat === 'all') return true;

  const targetCat = cat.toLowerCase().trim();
  const isNative = isNativeProduct(p);
  const { name, category, subCategory, cleanTagsString } = getProductSearchTokens(p);

  if (targetCat === 'native') {
    return isNative;
  }

  if (targetCat === 'tops') {
    if (isNative) return false;
    if (category === 'tops') return true;
    if (category === 'bottoms' || category === 'footwear' || category === 'accessories') return false;

    const topsRegex = /\b(shirt|shirts|t-?shirt|t-?shirts|tee|tees|polo|polos|blouse|blouses|corset|corsets|top|tops|crop top|crop tops|cami|camisole|bustier|singlet|vest)\b/i;
    return hasWordMatch(name, topsRegex) || hasWordMatch(subCategory, topsRegex) || hasWordMatch(cleanTagsString, topsRegex);
  }

  if (targetCat === 'outerwear') {
    if (isNative) return false;
    if (category === 'outerwear') return true;
    if (category === 'footwear' || category === 'accessories') return false;

    const outerwearRegex = /\b(hoodie|hoodies|sweatshirt|sweatshirts|jacket|jackets|bomber|bombers|coat|coats|blazer|blazers|suit|suits|tuxedo|windbreaker|fleece|pullover)\b/i;
    return hasWordMatch(name, outerwearRegex) || hasWordMatch(subCategory, outerwearRegex) || hasWordMatch(cleanTagsString, outerwearRegex);
  }

  if (targetCat === 'bottoms') {
    if (category === 'bottoms') return true;
    if (category === 'accessories' || category === 'footwear') return false;

    const bottomsRegex = /\b(jean|jeans|denim|trouser|trousers|pant|pants|cargo|cargos|jogger|joggers|sweatpant|sweatpants|short|shorts|skirt|skirts|biker|trunks|boxers|underwears)\b/i;
    return hasWordMatch(name, bottomsRegex) || hasWordMatch(subCategory, bottomsRegex) || hasWordMatch(cleanTagsString, bottomsRegex);
  }

  if (targetCat === 'footwear') {
    if (category === 'footwear') return true;
    const footwearRegex = /\b(slide|slides|palm|palms|slipper|slippers|sneaker|sneakers|shoe|shoes|loafer|loafers|mule|mules|heel|heels|pump|pumps|clog|clogs|croc|crocs|foam|sandals?|trainers?)\b/i;
    return hasWordMatch(name, footwearRegex) || hasWordMatch(subCategory, footwearRegex) || hasWordMatch(cleanTagsString, footwearRegex);
  }

  if (targetCat === 'accessories') {
    if (category === 'accessories') return true;
    const accessoriesRegex = /\b(bag|bags|backpack|backpacks|crossbody|handbag|handbags|tote|totes|clutch|clutches|jewelry|chain|chains|necklace|necklaces|ring|rings|earring|earrings|bracelet|bracelets|watch|watches|sunglasses|glasses|eyewear|shades|cap|caps|hat|hats|beanie|beanies)\b/i;
    return hasWordMatch(name, accessoriesRegex) || hasWordMatch(subCategory, accessoriesRegex) || hasWordMatch(cleanTagsString, accessoriesRegex);
  }

  return category === targetCat;
}

/**
 * Matches Specific Granular Subcategories
 * (e.g. 'backpacks', 'crossbody', 'hoodies', 'tshirts', 'shorts', 'skirts', 'clogs', etc.)
 */
export function matchesSpecificCategory(p: ProductLike, specificCat: string): boolean {
  if (!specificCat || specificCat === 'all') return true;

  const sc = specificCat.toLowerCase().trim();
  const isNative = isNativeProduct(p);
  const { name, category, subCategory, cleanTagsString } = getProductSearchTokens(p);

  // 1. BACKPACKS & TRAVEL BAGS
  if (sc === 'backpacks' || sc === 'men-backpacks' || sc === 'men_bags_backpacks') {
    // Explicitly reject bottoms/clothing (like "Baggy Jeans")
    if (category === 'bottoms' || category === 'tops') return false;
    if (subCategory === 'men_bags_backpacks' || subCategory === 'backpacks') return true;

    const regex = /\b(backpack|backpacks|duffel|duffels|travel bag|travel bags|gym bag|gym bags|rucksack|luggage|carryall)\b/i;
    return hasWordMatch(name, regex) || hasWordMatch(cleanTagsString, regex);
  }

  // 2. CROSSBODY & CHEST BAGS
  if (sc === 'crossbody' || sc === 'men-crossbody' || sc === 'men_bags_crossbody') {
    if (category === 'bottoms' || category === 'tops') return false;
    if (subCategory === 'men_bags_crossbody' || subCategory === 'crossbody') return true;

    const regex = /\b(crossbody|cross-body|chest bag|chest rig|chest-rig|sling bag|messenger bag|side bag|waist bag|fanny pack)\b/i;
    return hasWordMatch(name, regex) || hasWordMatch(cleanTagsString, regex);
  }

  // 3. HANDBAGS & TOTES
  if (sc === 'handbags' || sc === 'women-handbags' || sc === 'women_bags_handbags' || sc === 'women-bags') {
    if (category === 'bottoms' || category === 'tops') return false;
    if (subCategory === 'women_bags_handbags' || subCategory === 'handbags') return true;

    const regex = /\b(handbag|handbags|tote|totes|shoulder bag|leather bag|purse)\b/i;
    return hasWordMatch(name, regex) || hasWordMatch(cleanTagsString, regex);
  }

  // 4. CLUTCHES & MINI BAGS
  if (sc === 'clutches' || sc === 'women-clutches' || sc === 'women_bags_clutches') {
    if (category === 'bottoms' || category === 'tops') return false;
    if (subCategory === 'women_bags_clutches' || subCategory === 'clutches') return true;

    const regex = /\b(clutch|clutches|mini bag|mini bags|wristlet|evening clutch|pouch)\b/i;
    return hasWordMatch(name, regex) || hasWordMatch(cleanTagsString, regex);
  }

  // 5. GENERAL BAGS BUCKET
  if (sc === 'bags' || sc === 'unisex_bags') {
    if (category === 'bottoms' || category === 'tops') return false;
    const bagRegex = /\b(bag|bags|backpack|backpacks|crossbody|handbag|handbags|tote|totes|clutch|clutches|duffel|duffels)\b/i;
    return hasWordMatch(name, bagRegex) || hasWordMatch(subCategory, bagRegex) || hasWordMatch(cleanTagsString, bagRegex);
  }

  // 6. SKIRTS & MINI SKIRTS
  if (sc === 'skirts' || sc === 'women-skirts' || sc === 'skirts_minis') {
    // Explicitly reject tops / corsets
    if (category === 'tops' && !name.includes('skirt')) return false;
    if (subCategory === 'skirts_minis' || subCategory === 'skirts') return true;

    const skirtRegex = /\b(skirt|skirts|mini-?skirt|miniskirt|midi skirt|maxi skirt|pleated skirt|wrap skirt)\b/i;
    return hasWordMatch(name, skirtRegex) || hasWordMatch(cleanTagsString, skirtRegex);
  }

  // 7. HOODIES & SWEATSHIRTS
  if (sc === 'hoodies' || sc === 'women-hoodies' || sc === 'streetwear_hoodie' || sc === 'unisex_hoodie' || sc === 'female_streetwear' || sc === 'streetwear') {
    if (isNative) return false;
    if (subCategory.includes('hoodie') || subCategory === 'female_streetwear') return true;

    const hoodieRegex = /\b(hoodie|hoodies|sweatshirt|sweatshirts|pullover|sweats|hooded)\b/i;
    return hasWordMatch(name, hoodieRegex) || hasWordMatch(cleanTagsString, hoodieRegex);
  }

  // 8. T-SHIRTS & GRAPHIC TEES
  if (sc === 'tshirts' || sc === 'men-tshirts' || sc === 'tshirts_tees' || sc === 'unisex_tees') {
    if (isNative) return false;
    if (category === 'bottoms' || category === 'footwear' || category === 'accessories') return false;
    if (subCategory === 'tshirts_tees' || subCategory === 'unisex_tees') return true;

    const teeRegex = /\b(t-?shirt|t-?shirts|tee|tees|graphic tee|graphic tees|crewneck tee|oversized tee)\b/i;
    return hasWordMatch(name, teeRegex) || hasWordMatch(cleanTagsString, teeRegex);
  }

  // 9. POLOS & CASUAL SHIRTS
  if (sc === 'polos' || sc === 'men-polos' || sc === 'shirts_polos' || sc === 'shirts') {
    if (isNative) return false;
    if (category === 'bottoms' || category === 'footwear' || category === 'accessories') return false;
    if (subCategory === 'shirts_polos') return true;

    const poloRegex = /\b(polo|polos|collar shirt|button-?down|buttondown|oxford shirt|casual shirt)\b/i;
    return hasWordMatch(name, poloRegex) || hasWordMatch(cleanTagsString, poloRegex);
  }

  // 10. SHORTS & CASUAL
  if (sc === 'shorts' || sc === 'men-shorts' || sc === 'women-shorts' || sc === 'shorts_sets') {
    if (category === 'accessories' || category === 'tops') return false;
    if (subCategory === 'shorts_sets' || subCategory === 'women_shorts') return true;

    const shortRegex = /\b(short|shorts|biker short|biker shorts|sweat shorts|cargo shorts|trunks)\b/i;
    return hasWordMatch(name, shortRegex) || hasWordMatch(cleanTagsString, shortRegex);
  }

  // 11. JEANS & DENIM
  if (sc === 'jeans' || sc === 'men-jeans' || sc === 'women-jeans' || sc === 'jeans_trousers' || sc === 'unisex_denim' || sc === 'women_jeans_trousers') {
    if (category === 'accessories') return false;
    if (subCategory === 'jeans_trousers' || subCategory === 'unisex_denim' || subCategory === 'women_jeans_trousers') return true;

    const jeanRegex = /\b(jean|jeans|denim|baggy jean|baggy jeans|selvedge|wide-leg denim|straight-leg denim)\b/i;
    return hasWordMatch(name, jeanRegex) || hasWordMatch(cleanTagsString, jeanRegex);
  }

  // 12. CARGO & JOGGERS / SWEATPANTS
  if (sc === 'cargo' || sc === 'men-joggers' || sc === 'joggers_sweats' || sc === 'joggers' || sc === 'trousers') {
    if (category === 'accessories') return false;
    if (subCategory === 'joggers_sweats') return true;

    const cargoRegex = /\b(cargo|cargos|jogger|joggers|sweatpant|sweatpants|trackpant|trackpants|trouser|trousers|pant|pants)\b/i;
    return hasWordMatch(name, cargoRegex) || hasWordMatch(cleanTagsString, cargoRegex);
  }

  // 13. UNDERWEAR & LOUNGEWEAR
  if (sc === 'underwears' || sc === 'men-underwears' || sc === 'women-loungewear' || sc === 'women_underwears') {
    const underRegex = /\b(underwear|underwears|boxer|boxers|brief|briefs|singlet|singlets|loungewear|sleepwear|shapewear|robe|pyjama|pajama)\b/i;
    return hasWordMatch(name, underRegex) || hasWordMatch(subCategory, underRegex) || hasWordMatch(cleanTagsString, underRegex);
  }

  // 14. SENATOR & KAFTAN SETS
  if (sc === 'senator' || sc === 'men-senator' || sc === 'senator_kaftan') {
    if (subCategory === 'senator_kaftan') return true;
    const senatorRegex = /\b(senator|kaftan|caftan)\b/i;
    return hasWordMatch(name, senatorRegex) || hasWordMatch(cleanTagsString, senatorRegex);
  }

  // 15. GRAND AGBADA
  if (sc === 'agbada' || sc === 'men-agbada' || sc === 'agbada_robes') {
    if (subCategory === 'agbada_robes') return true;
    const agbadaRegex = /\b(agbada)\b/i;
    return hasWordMatch(name, agbadaRegex) || hasWordMatch(cleanTagsString, agbadaRegex);
  }

  // 16. JALABIYA
  if (sc === 'jalabiya' || sc === 'men-jalabiya' || sc === 'jalabiya_tunics') {
    const jalabiyaRegex = /\b(jalabiya|jalab|thobe|tunic)\b/i;
    return hasWordMatch(name, jalabiyaRegex) || hasWordMatch(cleanTagsString, jalabiyaRegex);
  }

  // 17. FILA & TRADITIONAL CAPS
  if (sc === 'fila' || sc === 'men-fila' || sc === 'men_caps_fila') {
    const filaRegex = /\b(fila|aso-?oke cap|traditional cap|abeti aja|gobi)\b/i;
    return hasWordMatch(name, filaRegex) || hasWordMatch(cleanTagsString, filaRegex);
  }

  // 18. SLIDES, PALMS & SLIPPERS
  if (sc === 'slides' || sc === 'men-slides' || sc === 'women-slides' || sc === 'men_slides_palms' || sc === 'women_slides_palms' || sc === 'unisex_slides_palms') {
    if (subCategory.includes('slides_palms')) return true;
    const slideRegex = /\b(slide|slides|palm|palms|slipper|slippers|sandals?|flat|flats)\b/i;
    return hasWordMatch(name, slideRegex) || hasWordMatch(cleanTagsString, slideRegex);
  }

  // 19. CROCS & FOAM CLOGS
  if (sc === 'clogs' || sc === 'men-clogs' || sc === 'women-clogs' || sc === 'unisex-clogs' || sc === 'men_shoes_clogs' || sc === 'women_shoes_clogs' || sc === 'unisex_shoes_clogs' || sc === 'crocs') {
    if (subCategory.includes('clogs')) return true;
    const clogRegex = /\b(clog|clogs|croc|crocs|foam|foam clog|platform clog)\b/i;
    return hasWordMatch(name, clogRegex) || hasWordMatch(cleanTagsString, clogRegex);
  }

  // 20. SNEAKERS
  if (sc === 'sneakers' || sc === 'men-sneakers' || sc === 'women-sneakers' || sc === 'men_shoes_sneakers' || sc === 'women_sneakers' || sc === 'unisex_sneakers') {
    if (subCategory.includes('sneakers')) return true;
    const sneakerRegex = /\b(sneaker|sneakers|trainer|trainers|kicks|running shoes|court shoes)\b/i;
    return hasWordMatch(name, sneakerRegex) || hasWordMatch(cleanTagsString, sneakerRegex);
  }

  // 21. LOAFERS & DRESS SHOES
  if (sc === 'loafers' || sc === 'men-loafers' || sc === 'men_shoes_loafers') {
    if (subCategory === 'men_shoes_loafers') return true;
    const loaferRegex = /\b(loafer|loafers|dress shoe|dress shoes|oxford|oxfords|brogue|brogues|derby|derbies|monk strap)\b/i;
    return hasWordMatch(name, loaferRegex) || hasWordMatch(cleanTagsString, loaferRegex);
  }

  // 22. HEELS & PUMPS
  if (sc === 'heels' || sc === 'women-heels' || sc === 'women_heels_mules') {
    if (subCategory === 'women_heels_mules') return true;
    const heelRegex = /\b(heel|heels|pump|pumps|stiletto|stilettos|block heel|mule|mules|kitten heel)\b/i;
    return hasWordMatch(name, heelRegex) || hasWordMatch(cleanTagsString, heelRegex);
  }

  // 23. DRESSES & GOWNS
  if (sc === 'dresses' || sc === 'women-dresses' || sc === 'dresses_gowns') {
    if (subCategory === 'dresses_gowns') return true;
    const dressRegex = /\b(dress|dresses|gown|gowns|maxi dress|midi dress|bodycon|evening dress|cocktail dress)\b/i;
    return hasWordMatch(name, dressRegex) || hasWordMatch(cleanTagsString, dressRegex);
  }

  // 24. TWO-PIECE SETS
  if (sc === 'two-piece' || sc === 'two_piece' || sc === 'women-coord-sets' || sc === 'two_piece_sets') {
    if (subCategory === 'two_piece_sets') return true;
    const twoPieceRegex = /\b(two-?piece|co-?ord|matching set|resort set|pant set|skirt set)\b/i;
    return hasWordMatch(name, twoPieceRegex) || hasWordMatch(cleanTagsString, twoPieceRegex);
  }

  // 25. TOPS & CORSETS (WOMEN)
  if (sc === 'tops' || sc === 'women-tops' || sc === 'corsets_tops' || sc === 'corset') {
    if (category === 'bottoms' || category === 'accessories') return false;
    if (subCategory === 'corsets_tops') return true;
    const topRegex = /\b(corset|corsets|blouse|blouses|crop top|crop tops|cami|camisole|bustier|tube top)\b/i;
    return hasWordMatch(name, topRegex) || hasWordMatch(cleanTagsString, topRegex);
  }

  // 26. BOUBOU & KAFTANS (WOMEN)
  if (sc === 'boubou' || sc === 'women-boubou' || sc === 'boubou_kaftans') {
    if (subCategory === 'boubou_kaftans') return true;
    const boubouRegex = /\b(boubou|bubu|adire boubou|silk boubou|kaftan)\b/i;
    return hasWordMatch(name, boubouRegex) || hasWordMatch(cleanTagsString, boubouRegex);
  }

  // 27. LACE & ANKARA (WOMEN)
  if (sc === 'ankara' || sc === 'lace' || sc === 'lace_ankara' || sc === 'women-lace') {
    if (subCategory === 'lace_ankara') return true;
    const ankaraRegex = /\b(lace|ankara|aso ebi|aso-ebi|african print)\b/i;
    return hasWordMatch(name, ankaraRegex) || hasWordMatch(cleanTagsString, ankaraRegex);
  }

  // 28. ABAYAS & KIMONOS
  if (sc === 'abayas' || sc === 'women-abayas') {
    const abayaRegex = /\b(abaya|abayas|kimono|kimonos|modest drape)\b/i;
    return hasWordMatch(name, abayaRegex) || hasWordMatch(cleanTagsString, abayaRegex);
  }

  // 29. CHAINS & JEWELRY
  if (sc === 'chains' || sc === 'men-chains' || sc === 'men_jewelry_chains') {
    if (subCategory === 'men_jewelry_chains') return true;
    const chainRegex = /\b(chain|chains|cuban|necklace|necklaces|pendant|pendants|choker)\b/i;
    return hasWordMatch(name, chainRegex) || hasWordMatch(cleanTagsString, chainRegex);
  }

  // 30. JEWELRY (WOMEN / UNISEX)
  if (sc === 'jewelry' || sc === 'women-jewelry' || sc === 'unisex_jewelry' || sc === 'women_jewelry') {
    if (subCategory.includes('jewelry')) return true;
    const jewRegex = /\b(jewelry|jewellery|earring|earrings|ring|rings|bracelet|bracelets|bangle|bangles|necklace|necklaces|chain|pendant)\b/i;
    return hasWordMatch(name, jewRegex) || hasWordMatch(cleanTagsString, jewRegex);
  }

  // 31. WATCHES
  if (sc === 'watches' || sc === 'men-watches' || sc === 'women-watches' || sc === 'men_watches' || sc === 'women_watches' || sc === 'unisex_watches') {
    if (subCategory.includes('watches')) return true;
    const watchRegex = /\b(watch|watches|timepiece|timepieces|wrist ?watch)\b/i;
    return hasWordMatch(name, watchRegex) || hasWordMatch(cleanTagsString, watchRegex);
  }

  // 32. SUNGLASSES & EYEWEAR
  if (sc === 'sunglasses' || sc === 'men-sunglasses' || sc === 'women-sunglasses' || sc === 'men_eyewear' || sc === 'women_sunglasses' || sc === 'unisex_sunglasses') {
    if (subCategory.includes('eyewear') || subCategory.includes('sunglasses')) return true;
    const sunRegex = /\b(sunglass|sunglasses|shades|eyewear|tinted frames|glasses)\b/i;
    return hasWordMatch(name, sunRegex) || hasWordMatch(cleanTagsString, sunRegex);
  }

  // 33. CAPS & HATS
  if (sc === 'caps' || sc === 'men-caps' || sc === 'men_caps_hats' || sc === 'unisex_caps_hats' || sc === 'women_caps_scarves') {
    if (subCategory.includes('caps') || subCategory.includes('hats')) return true;
    const capRegex = /\b(cap|caps|hat|hats|beanie|beanies|trucker hat|baseball cap|bucket hat|headband|scarf|scarves)\b/i;
    return hasWordMatch(name, capRegex) || hasWordMatch(cleanTagsString, capRegex);
  }

  // 34. JACKETS & WIND BREAKERS
  if (sc === 'jackets' || sc === 'men-jackets' || sc === 'jackets_coats' || sc === 'unisex_jackets') {
    if (subCategory.includes('jackets')) return true;
    const jacketRegex = /\b(jacket|jackets|bomber|bombers|coat|coats|windbreaker|blazer|blazers|vest)\b/i;
    return hasWordMatch(name, jacketRegex) || hasWordMatch(cleanTagsString, jacketRegex);
  }

  // Fallback: match subcategory ID directly or whole word match
  if (subCategory === sc) return true;
  const genericRegex = new RegExp(`\\b${sc.replace(/[-_]/g, '[-_ ]?')}\\b`, 'i');
  return hasWordMatch(name, genericRegex) || hasWordMatch(cleanTagsString, genericRegex);
}

/**
 * Matches high-level Department Key ('clothing' | 'native' | 'footwear' | 'bags' | 'accessories')
 */
export function matchesDepartment(p: ProductLike, dept: string): boolean {
  if (!dept || dept === 'all') return true;

  const targetDept = dept.toLowerCase().trim();
  const isNative = isNativeProduct(p);
  const { name, category, subCategory, cleanTagsString } = getProductSearchTokens(p);

  if (targetDept === 'native') {
    return isNative;
  }

  if (targetDept === 'clothing') {
    if (isNative) return false;
    return category === 'tops' || category === 'bottoms' || category === 'outerwear';
  }

  if (targetDept === 'footwear') {
    return category === 'footwear' || matchesCategoryFilter(p, 'footwear');
  }

  if (targetDept === 'bags') {
    if (category === 'bottoms' || category === 'tops') return false;
    const bagRegex = /\b(bag|bags|backpack|backpacks|crossbody|handbag|handbags|tote|totes|clutch|clutches|duffel|duffels)\b/i;
    return (
      category === 'accessories' && (
        hasWordMatch(name, bagRegex) ||
        hasWordMatch(subCategory, bagRegex) ||
        hasWordMatch(cleanTagsString, bagRegex)
      )
    );
  }

  if (targetDept === 'accessories') {
    if (category !== 'accessories') return false;
    const accRegex = /\b(chain|chains|jewelry|watch|watches|sunglasses|cap|caps|hat|hats|ring|necklace)\b/i;
    return hasWordMatch(name, accRegex) || hasWordMatch(subCategory, accRegex) || hasWordMatch(cleanTagsString, accRegex);
  }

  return true;
}
