import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { title, category, vendorType, genderTarget, brandName, imageUrl } = await request.json();

    const cleanTitle = (title || '').trim();
    const lower = cleanTitle.toLowerCase();
    const isBoutique = vendorType === 'boutique_seller' || vendorType === 'boutique_merchant';
    const brand = brandName || 'Ìrísí Partner';
    const cat = (category || '').toLowerCase();
    const gender = (genderTarget || 'unisex').toLowerCase();

    // 0. Optional Gemini Vision integration if API Key is configured in environment
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (geminiApiKey && imageUrl) {
      try {
        let imagePart: any = null;
        if (imageUrl.startsWith('data:image')) {
          const [mimeTypePart, base64Data] = imageUrl.split(';base64,');
          const mimeType = mimeTypePart.replace('data:', '');
          imagePart = { inlineData: { mimeType, data: base64Data } };
        } else if (imageUrl.startsWith('http')) {
          const imgRes = await fetch(imageUrl);
          const buf = await imgRes.arrayBuffer();
          const base64 = Buffer.from(buf).toString('base64');
          const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
          imagePart = { inlineData: { mimeType: contentType, data: base64 } };
        }

        if (imagePart) {
          const prompt = `You are a luxury Nigerian fashion and merchandise copywriter for Ìrísí.
Analyze this product photo and details:
Piece Title: "${cleanTitle || 'Product'}"
Category: "${category || 'Ready-to-Wear'}"
Department: "${genderTarget || 'Unisex'}"
Brand: "${brand}"
Vendor Type: "${vendorType || 'boutique_merchant'}"

RULES:
1. Write a concise, punchy 2-sentence luxury product description matching the exact item type (e.g. if it's jewelry, write about chains/metals/finish; if footwear, write about leather/soles; if apparel, write about fabric/cut).
2. If vendorType is boutique or ready-to-wear, NEVER use the words "tailored" or "tailoring". Use words like "designed by", "styled by", "crafted with", "features".
3. Append two short bullet points for "• Material: ..." (or "• Fabric: ...") and "• Care: ...".
4. Provide 5-6 relevant hashtags (without #).
5. Provide a realistic suggested retail price in Nigerian Naira (e.g. 15000, 35000, 65000).

Return ONLY valid JSON matching this schema:
{
  "description": "2-sentence description\\n\\n• Material: ...\\n• Care: ...",
  "tags": ["tag1", "tag2", "tag3"],
  "suggestedPrice": 35000
}`;

          const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: prompt },
                  imagePart
                ]
              }],
              generationConfig: {
                responseMimeType: 'application/json'
              }
            })
          });

          if (geminiRes.ok) {
            const geminiData = await geminiRes.json();
            const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const parsed = JSON.parse(rawText);
              return NextResponse.json({
                success: true,
                description: parsed.description,
                tags: parsed.tags || [],
                suggestedPrice: parsed.suggestedPrice || 25000,
                category: category || 'accessories'
              });
            }
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini vision generation fallback to high-precision rules:', geminiErr);
      }
    }

    // High-Precision Rule Synthesis Engine (Contextual by Piece, Category, and Gender)
    let description = '';
    let tags: string[] = [];
    let suggestedPrice = 25000;

    // Helper regex matcher for whole words
    const hasWord = (word: string) => new RegExp(`\\b${word}\\b`, 'i').test(lower);

    // PERFUMES & FRAGRANCES
    if (
      lower.includes('perfume') ||
      lower.includes('fragrance') ||
      lower.includes('oud') ||
      lower.includes('cologne') ||
      lower.includes('attar') ||
      lower.includes('scent') ||
      lower.includes('body mist') ||
      lower.includes('eau de parfum') ||
      lower.includes('edp') ||
      cat.includes('perfume') ||
      cat.includes('oud')
    ) {
      const isOud = lower.includes('oud') || lower.includes('attar') || lower.includes('oil');
      if (isOud) {
        description = `Rich oriental Arabian fragrance curated by ${brand}, crafted with notes of aged Cambodian agarwood, warm amber, and velvety musk. Delivers remarkable projection and long-lasting sillage that lasts all day.\n\n• Scent Profile: Cambodian Oud, Warm Amber & Spiced Musk\n• Longevity: 24+ Hours (Oil-Rich Formulation)`;
        tags = ['ArabianOud', 'PerfumeOil', 'LongLastingScent', 'OudPerfume', 'LagosFragrance'];
        suggestedPrice = 35000;
      } else {
        description = `Signature Eau de Parfum curated by ${brand} blending crisp citrus top notes with warm woody amber and subtle florals. Engineered for daily elegance and magnetic evening appeal.\n\n• Notes: Bergamot, Pink Pepper, Amberwood & Cedar\n• Concentration: Eau de Parfum (EDP) with 12-16 hour wear`;
        tags = ['Perfume', 'EauDeParfum', 'Fragrance', 'SignatureScent', 'LagosScents'];
        suggestedPrice = 30000;
      }
    }
    // HAIR & WIGS
    else if (
      lower.includes('wig') ||
      lower.includes('hair') ||
      lower.includes('frontal') ||
      lower.includes('closure') ||
      lower.includes('bone straight') ||
      lower.includes('curly wig') ||
      lower.includes('braided wig') ||
      cat.includes('wig') ||
      cat.includes('hair')
    ) {
      const isBoneStraight = lower.includes('bone straight') || lower.includes('straight');
      const isBraided = lower.includes('braid') || lower.includes('braided');
      const isCurly = lower.includes('curly') || lower.includes('wave') || lower.includes('curl');

      if (isBraided) {
        description = `Neatly hand-crafted braided lace wig styled by ${brand} featuring natural baby hairs, lightweight breathable cap, and durable hand-tied synthetic braiding for effortless glam without salon hours.\n\n• Cap Construction: Full HD Lace / Frontal Base\n• Care: Hang on wig stand when not in use. Wash with warm water & mild shampoo.`;
        tags = ['BraidedWig', 'KnotlessWig', 'LaceWig', 'ProtectiveStyle', 'LagosHair'];
        suggestedPrice = 45000;
      } else if (isCurly) {
        description = `Lustrous raw human hair curly wig curated by ${brand} with full 200% density, pre-plucked hairline, and soft bouncy curls that hold their spring even in humid weather.\n\n• Hair Grade: 100% Raw Virgin Human Hair & Invisible HD Lace\n• Care: Detangle with wide-tooth comb. Define curls with leave-in conditioner and mousse.`;
        tags = ['CurlyWig', 'DeepWave', 'HumanHairWig', 'HDLaceWig', 'LagosHairVendor'];
        suggestedPrice = 75000;
      } else if (isBoneStraight) {
        description = `Authentic single-donor Vietnamese bone straight hair unit styled by ${brand}. Features natural silky sheen, tangle-free alignment from root to tip, and takes heat effortlessly.\n\n• Hair Grade: 100% Raw Vietnamese Bone Straight Human Hair\n• Care: Wash with sulfate-free shampoo. Apply lightweight argan serum and heat protectant.`;
        tags = ['BoneStraight', 'VietnameseHair', 'RawHair', 'HumanHair', 'LagosWigVendor'];
        suggestedPrice = 90000;
      } else {
        description = `Premium human hair wig unit crafted by ${brand} with natural pre-plucked hairline, transparent HD lace, and healthy full-body movement.\n\n• Material: 100% Virgin Human Hair & Swiss HD Lace\n• Care: Store on a wig stand. Wash gently with lukewarm water and moisture-rich conditioner.`;
        tags = ['HumanHairWig', 'FrontalWig', 'WigVendor', 'VirginHair', 'LagosHair'];
        suggestedPrice = 65000;
      }
    }
    // 1. JEWELRY / CHAINS / NECKLACES / PENDANTS / RINGS / WATCHES / BANGLES / BRACELETS
    else if (
      lower.includes('chain') ||
      lower.includes('necklace') ||
      lower.includes('neckless') ||
      lower.includes('pendant') ||
      lower.includes('cuban') ||
      lower.includes('jewelry') ||
      lower.includes('jewel') ||
      lower.includes('watch') ||
      lower.includes('ring') ||
      lower.includes('bracelet') ||
      lower.includes('bangle') ||
      lower.includes('earring') ||
      cat.includes('jewelry') ||
      cat.includes('chains') ||
      (cat === 'accessories' && !cat.includes('bag') && !cat.includes('cap'))
    ) {
      const isCrossOrPendant = lower.includes('cross') || lower.includes('pendant');
      const isWatch = lower.includes('watch');
      const isRing = lower.includes('ring');
      const isBracelet = lower.includes('bracelet') || lower.includes('bangle');

      if (isWatch) {
        description = `Precision quartz timepiece curated by ${brand} featuring a scratch-resistant mineral crystal dial, stainless steel casing, and water-resistant construction. Designed for timeless sophistication across boardroom meetings and upscale evening events.\n\n• Material: High-Grade Stainless Steel & Mineral Hardlex Glass\n• Care: Wipe with microfibre cloth. Avoid prolonged water submersion.`;
        tags = ['LuxuryWatch', 'Timepiece', 'MensWatch', 'WomensWatch', 'AccessoriesDrop', 'LagosLuxury'];
        suggestedPrice = 45000;
      } else if (isRing) {
        description = `Statement signet ring crafted from premium tarnish-free stainless steel with high-polished bevelled edging. Engineered for bold everyday wear, resistant to sweat and daily friction.\n\n• Material: 316L Surgical Grade Stainless Steel\n• Care: Polish occasionally with a soft jewelry cloth.`;
        tags = ['StatementRing', 'MensJewelry', 'StainlessSteelRing', 'StreetwearJewelry', 'Accessories'];
        suggestedPrice = 12000;
      } else if (isBracelet) {
        description = `Luxury link bracelet styled by ${brand} with interlocking solid links and a heavy-duty reinforced clasp. Perfect for standalone elegance or stacked luxury layering.\n\n• Material: PVD Coated Stainless Steel / Brass\n• Care: Keep dry and clean with a microfibre jewelry wipe.`;
        tags = ['CubanBracelet', 'LinkBracelet', 'Wristwear', 'LuxuryJewelry', 'Accessories'];
        suggestedPrice = 18000;
      } else if (isCrossOrPendant) {
        description = `Iconic cross pendant necklace styled by ${brand} from tarnish-resistant stainless steel with a high-polished mirror finish and reinforced link chain. Engineered for waterproof daily wear, sweat resistance, and striking luxury layering.\n\n• Material: Premium 316L Stainless Steel (Waterproof & Hypoallergenic)\n• Care: Wipe clean with a soft microfibre cloth. Store in jewelry pouch when not in use.`;
        tags = ['CrossChain', 'PendantNecklace', 'StainlessSteel', 'WaterproofJewelry', 'StreetwearJewelry', 'LagosDrip'];
        suggestedPrice = 15000;
      } else {
        description = `High-polished statement chain necklace styled by ${brand} with interlocking links, durable lobster clasp, and tarnish-resistant PVD coating for lasting lustre.\n\n• Material: Premium 316L Stainless Steel & PVD Lustre Coating\n• Care: Wipe with dry jewelry cloth. Avoid direct contact with harsh chemical perfumes.`;
        tags = ['ChainNecklace', 'CubanLink', 'StainlessSteelJewelry', 'UrbanAccessories', 'DripJewelry'];
        suggestedPrice = 20000;
      }
    }
    // 2. CAPS / FILA / HEADWEAR / HATS / BEANIES
    else if (
      lower.includes('cap') ||
      lower.includes('fila') ||
      lower.includes('hat') ||
      lower.includes('beanie') ||
      lower.includes('bucket hat') ||
      lower.includes('headband') ||
      lower.includes('scarf') ||
      cat.includes('cap') ||
      cat.includes('fila') ||
      cat.includes('headwear')
    ) {
      const isFila = lower.includes('fila') || lower.includes('native cap');
      if (isFila) {
        description = `Handcrafted luxury ceremonial Fila cap designed by ${brand} with rich velvet texture and crisp architectural structuring. Tailored to complement Agbada and Senator ensembles for weddings and milestone celebrations.\n\n• Material: Premium Velvet & Stiffened Cotton Core\n• Care: Spot clean only with a soft brush. Store in a dry hat box.`;
        tags = ['FilaCap', 'TraditionalCap', 'OwambeHeadwear', 'NativeCap', 'YorubaDemon', 'BespokeNative'];
        suggestedPrice = 18000;
      } else {
        description = `Structured premium headwear styled by ${brand} featuring 3D archival embroidery, breathable brass eyelets, and an adjustable metal buckle closure for an all-day custom fit.\n\n• Material: 100% Heavyweight Cotton Twill\n• Care: Hand wash cold. Air dry only. Do not machine wash.`;
        tags = ['StreetwearCap', 'Snapback', 'DadHat', 'AccessoriesDrop', 'LagosStreetwear'];
        suggestedPrice = 12000;
      }
    }
    // 3. BAGS / WALLETS / TOTES / BACKPACKS / CLUTCHES
    else if (
      lower.includes('bag') ||
      lower.includes('wallet') ||
      lower.includes('tote') ||
      lower.includes('clutch') ||
      lower.includes('backpack') ||
      lower.includes('crossbody') ||
      lower.includes('purse') ||
      cat.includes('bag') ||
      cat.includes('wallet')
    ) {
      description = `Architectural luxury carryall designed by ${brand} featuring reinforced structural seams, smooth glide hardware zippers, and a modular strap system for effortless city transit.\n\n• Material: Premium Full-Grain PU Leather & Water-Repellent Twill\n• Care: Wipe clean with a soft damp cloth. Keep away from direct excessive heat.`;
      tags = ['LuxuryBag', 'CrossbodyBag', 'ToteBag', 'Handbag', 'LeatherAccessories', 'LagosDrop'];
      suggestedPrice = 35000;
    }
    // 4. FOOTWEAR / SLIDES / PALMS / CROCS / SHOES / SNEAKERS / LOAFERS / HEELS
    else if (
      lower.includes('slide') ||
      lower.includes('palm') ||
      lower.includes('slipper') ||
      lower.includes('croc') ||
      lower.includes('shoe') ||
      lower.includes('heel') ||
      lower.includes('mule') ||
      lower.includes('loafer') ||
      lower.includes('sneaker') ||
      lower.includes('boot') ||
      cat.includes('footwear') ||
      cat.includes('slides') ||
      cat.includes('palms')
    ) {
      const isSlide = lower.includes('slide') || lower.includes('palm') || lower.includes('slipper');
      const isHeel = lower.includes('heel') || lower.includes('mule');

      if (isHeel) {
        description = `Sophisticated stiletto silhouette heels crafted by ${brand} with ergonomic arch support, cushioned memory insole, and sleek non-slip heel tips for all-night gala comfort.\n\n• Material: Patent Sheen Vegan Leather & Padded Insole\n• Care: Wipe clean with dry soft cloth.`;
        tags = ['HighHeels', 'Mules', 'WomensFootwear', 'GalaStyle', 'LagosLuxury'];
        suggestedPrice = 45000;
      } else if (isSlide) {
        description = `Handcrafted genuine full-grain leather slides engineered by ${brand} with an anatomical cushioned footbed and durable anti-skid rubber outsole for casual street luxury.\n\n• Material: 100% Genuine Leather & Ergonomic EVA Rubber\n• Care: Wipe clean with a damp cloth. Condition leather periodically.`;
        tags = ['LeatherPalms', 'LuxurySlides', 'HandcraftedFootwear', 'SlipOnShoes', 'LagosDrip'];
        suggestedPrice = 28000;
      } else {
        description = `Luxury handcrafted footwear engineered by ${brand} with premium leather upper, reinforced stitching, and a durable shock-absorbing rubber outsole.\n\n• Material: Genuine Leather & Vulcanized Rubber\n• Care: Wipe clean with damp cloth. Store with shoe trees.`;
        tags = ['LuxuryShoes', 'Loafers', 'Sneakers', 'FootwearDrop', 'StreetwearShoes'];
        suggestedPrice = 42000;
      }
    }
    // 5. LACE / CORSET / HALTER / CROP TOPS / BRALETTES (WOMEN)
    else if (
      lower.includes('lace') ||
      lower.includes('corset') ||
      lower.includes('halter') ||
      lower.includes('crop') ||
      lower.includes('bralette') ||
      lower.includes('bustier') ||
      lower.includes('ruched') ||
      cat.includes('corset')
    ) {
      description = `Statement ${lower.includes('lace') ? 'lace ' : ''}${lower.includes('corset') ? 'corset ' : 'crop '}top styled by ${brand} with a flattering sweetheart neckline, intricate textured overlay, and a figure-sculpting ruched silhouette. Designed for standout nightlife glamour, festival aesthetics, and effortless elevated layering.\n\n• Fabric: Floral Embroidered Lace & Breathable Stretch Spandex\n• Care: Gentle cold hand wash. Lay flat to dry. Do not tumble dry.`;
      tags = ['LaceTop', 'CorsetTop', 'HalterTop', 'NightlifeGlam', 'WomensFashion', 'BoutiqueDrop'];
      suggestedPrice = 22000;
    }
    // 6. DRESSES / GOWNS / MAXIS / BODYCON (WOMEN)
    else if (
      lower.includes('gown') ||
      lower.includes('dress') ||
      lower.includes('maxi') ||
      lower.includes('bodycon') ||
      lower.includes('mini dress') ||
      cat.includes('dresses') ||
      cat.includes('gowns')
    ) {
      description = `Alluring feminine silhouette dress styled by ${brand} featuring fluid contour lines, flattering drape, and sophisticated finishing. Perfect for cocktail evenings, festive galas, and VIP celebrations.\n\n• Fabric: Lustrous Silk Crepe & Stretch Satin Sheen\n• Care: Hand wash cold or dry clean. Cool iron inside out.`;
      tags = ['MaxiDress', 'CocktailDress', 'EveningGown', 'OccasionWear', 'Womenswear', 'LagosLuxury'];
      suggestedPrice = 45000;
    }
    // 7. SILK BOUBOU / KAFTANS / ABAYAS
    else if (lower.includes('boubou') || lower.includes('bubu') || lower.includes('abaya') || cat.includes('boubou')) {
      description = `Regal flowing Boubou gown crafted by ${brand} from lustrous pure silk crepe, accentuated by hand-embellished neckline detailing and a graceful silhouette for festive celebrations.\n\n• Fabric: 100% Pure Silk Crepe\n• Care: Gentle hand wash in cold water with mild soap. Cool iron.`;
      tags = ['SilkBoubou', 'Abaya', 'OwambeStyle', 'RegalNative', 'LagosLuxury', 'WomenFashion'];
      suggestedPrice = 55000;
    }
    // 8. SKIRTS & CO-ORD SETS
    else if (lower.includes('skirt') || lower.includes('co-ord') || lower.includes('two piece') || lower.includes('2 piece') || cat.includes('skirts') || cat.includes('two_piece')) {
      description = `Chic modern two-piece coordinate set crafted by ${brand} featuring clean contour lines and effortless comfort, styled seamlessly from daytime brunch to evening cocktails.\n\n• Fabric: Premium Structured Cotton-Spandex Blend\n• Care: Machine wash cold with like colors. Line dry.`;
      tags = ['CoordSet', 'TwoPiece', 'ChicStyle', 'Womenswear', 'BoutiqueDrop'];
      suggestedPrice = 32000;
    }
    // 9. AGBADA (ROYAL CEREMONIAL BESPOKE)
    else if (lower.includes('agbada') || cat.includes('agbada')) {
      description = `Signature 3-piece ceremonial Agbada tailored from premium high-density fabric, featuring precision-embroidered geometric chest paneling and a majestic royal drape for landmark celebrations.\n\n• Fabric: Super 160s Poly-Wool & Silk Thread\n• Care: Professional dry clean only. Steam iron on reverse.`;
      tags = ['Agbada', 'Ceremonial', 'Owambe', 'BespokeNative', 'RoyalWear', 'NigerianFashion'];
      suggestedPrice = 95000;
    }
    // 10. SENATOR WEAR & MALE KAFTAN SETS
    else if (lower.includes('senator') || lower.includes('kaftan') || lower.includes('dashiki') || cat.includes('senator')) {
      description = `Sharp 2-piece modern Senator suit tailored from breathable, wrinkle-resistant cashmere wool blend with a minimalist concealed placket and tapered slim-fit trousers.\n\n• Fabric: Premium Cashmere Wool Blend\n• Care: Dry clean or gentle hand wash. Medium iron with pressing cloth.`;
      tags = ['SenatorSuit', 'BespokeKaftan', 'ModernNative', 'OwambeStyle', 'NigerianFashion'];
      suggestedPrice = 65000;
    }
    // 11. STREETWEAR HOODIES & SWEATSHIRTS
    else if (lower.includes('hoodie') || lower.includes('sweat') || lower.includes('fleece') || cat.includes('hoodie')) {
      description = `Heavyweight 450 GSM luxury brushed French terry cotton hoodie by ${brand} featuring a structured double-layer hood, relaxed drop-shoulder cut, and snug ribbed cuffs.\n\n• Fabric: 100% Organic Heavyweight French Terry (450 GSM)\n• Care: Machine wash cold inside out. Tumble dry low or air dry.`;
      tags = ['Streetwear', 'HeavyweightHoodie', '450GSM', 'OversizedFit', 'LagosDrop'];
      suggestedPrice = 45000;
    }
    // 12. DENIM JEANS & CARGO PANTS
    else if (lower.includes('denim') || lower.includes('jean') || lower.includes('cargo') || cat.includes('denim') || cat.includes('jeans')) {
      description = `Heavy-duty 14.5oz raw rigid denim pants engineered by ${brand} with multi-pocket utility detailing and a relaxed wide-leg profile.\n\n• Fabric: 100% Raw Selvedge Cotton Denim (14.5oz)\n• Care: Wash sparingly inside out in cold water. Hang dry.`;
      tags = ['RawDenim', 'CargoPants', 'WideLeg', 'StreetwearJeans', 'UrbanDrop'];
      suggestedPrice = 42000;
    }
    // 13. GRAPHIC TEES & OVERSIZED TOPS (EXACT WORD BOUNDARY CHECKS ONLY)
    else if (hasWord('tee') || hasWord('tees') || hasWord('t-shirt') || hasWord('tshirt') || hasWord('shirt') || hasWord('polo') || hasWord('jersey') || cat.includes('tees')) {
      description = `Premium 300 GSM combed cotton t-shirt styled by ${brand} with high-density archival screen printing and a signature boxy drop-shoulder cut.\n\n• Fabric: 100% Combed Compact Cotton (300 GSM)\n• Care: Machine wash cold inside out. Iron print inside out.`;
      tags = ['GraphicTee', 'HeavyweightTee', 'BoxyFit', 'StreetwearDrop', 'LagosStyle'];
      suggestedPrice = 28000;
    }
    // 14. GENERAL FALLBACK (STRICTLY NO "TAILORING" FOR BOUTIQUE)
    else {
      if (isBoutique) {
        description = `Contemporary ready-to-wear piece styled by ${brand} from lightweight breathable textiles, designed for effortless elegance and versatile day-to-night wear.\n\n• Fabric: Premium Natural Textile Blend\n• Care: Machine wash cold on gentle cycle or hand wash. Cool iron.`;
        tags = ['ReadyToWear', 'ContemporaryFashion', 'BoutiqueDrop', 'LagosStyle', 'UrbanLuxury'];
        suggestedPrice = 30000;
      } else {
        description = `Handcrafted bespoke garment custom-tailored by ${brand} with precision seamwork, internal structuring, and clean hand-finished hems.\n\n• Fabric: Premium Imported Textile Blend\n• Care: Dry clean or delicate cold hand wash. Medium iron with pressing cloth.`;
        tags = ['BespokeTailoring', 'CustomGarment', 'NigerianFashion', 'TraditionalElegance'];
        suggestedPrice = 60000;
      }
    }

    return NextResponse.json({
      success: true,
      description,
      tags,
      suggestedPrice,
      category: category || (lower.includes('chain') || lower.includes('jewelry') ? 'accessories' : lower.includes('hoodie') ? 'outerwear' : lower.includes('jean') ? 'bottoms' : 'tops')
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'AI generation failed' }, { status: 500 });
  }
}
