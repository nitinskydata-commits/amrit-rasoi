const Product = require('../models/Product');

/**
 * Multi-Factor Loss-Proof Automated Pricing Engine for SBMI Amrit Rasoi
 * 
 * Automatically calculates and sets selling prices dynamically based on:
 *   1. MRP (Maximum Retail Price)
 *   2. minPrice (Floor price protection - strictly prevents selling at a loss)
 *   3. Stock Levels (Automated overstock discount trigger)
 *   4. Review Ratings (Trust quotient: better rated items carry higher premium value)
 *   5. Review Count (Popularity factor: viral items retain premium price, while new/cold items get discount boots)
 * 
 * Promoted high-value spices that present excellent deal scores are highlighted
 * automatically to the home page featured list!
 */
const runDiscountEngine = async () => {
  try {
    const products = await Product.find({ isActive: { $ne: false } });
    let updatedCount = 0;
    let promotedCount = 0;

    for (const product of products) {
      let isModified = false;

      // 1. Resolve MRP baseline
      const baseMRP = product.mrp && product.mrp > 0 ? product.mrp : (product.price || 199);
      if (!product.mrp || product.mrp === 0) {
        product.mrp = baseMRP;
        isModified = true;
      }

      // Resolve minPrice floor (default to 55% of MRP if not configured to prevent deep losses)
      const floorPrice = product.minPrice && product.minPrice > 0 ? product.minPrice : Math.round(baseMRP * 0.55);
      if (!product.minPrice || product.minPrice === 0) {
        product.minPrice = floorPrice;
        isModified = true;
      }

      // 2. Compute Multi-Factor Discount
      // A. Stock Factor (Clear high stock items faster)
      let stockDiscount = 5; // Default 5%
      if (product.stock > 50) {
        stockDiscount = 25; // 25% Off for heavily overstocked items
      } else if (product.stock > 20) {
        stockDiscount = 15; // 15% Off
      }

      // B. Rating Trust Factor (High trust items keep premium, low/no ratings get promotion boots)
      let ratingAdjustment = 0;
      const currentRating = Number(product.ratings) || 0;
      if (currentRating >= 4.5) {
        ratingAdjustment = -10; // 10% premium (lower discount) for top-rated spices
      } else if (currentRating >= 4.0) {
        ratingAdjustment = -5;  // 5% premium
      } else if (currentRating > 0 && currentRating < 3.5) {
        ratingAdjustment = 10;  // 10% discount boost to clear underperforming stock
      } else if (currentRating === 0) {
        ratingAdjustment = 5;   // 5% discount boost for unrated items
      }

      // C. Popularity & Sales Volume (Popular items command value, brand new products get boost)
      let volumeAdjustment = 0;
      const reviewCount = product.numOfReviews || 0;
      if (reviewCount > 30) {
        volumeAdjustment = -8; // 8% premium for viral/best-selling products
      } else if (reviewCount > 10) {
        volumeAdjustment = -4; // 4% premium
      } else if (reviewCount === 0) {
        volumeAdjustment = 5;  // 5% discount boost to launch and seed new items
      }

      // Combine factors
      let calculatedDiscountPercent = stockDiscount + ratingAdjustment + volumeAdjustment;

      // Category Specific Spices/Pantry Promotion
      if (product.category === 'Spices' || product.category === 'Organic') {
        calculatedDiscountPercent += 10; // Extra 10% promotional spice boost
      }

      // Cap discount between 10% and 60%
      calculatedDiscountPercent = Math.min(Math.max(calculatedDiscountPercent, 10), 60);

      // Compute proposed price
      let proposedPrice = Math.round(baseMRP * (1 - calculatedDiscountPercent / 100));

      // 3. Strict Loss-Proof Enforcer
      if (proposedPrice < floorPrice) {
        proposedPrice = floorPrice; // Clamp price to the floor price to guarantee zero losses!
      }

      if (product.price !== proposedPrice) {
        product.price = proposedPrice;
        isModified = true;
      }

      // 4. Propagate Pricing to Product Variants
      if (product.variants && product.variants.length > 0) {
        product.variants.forEach((variant) => {
          const varMRP = variant.mrp && variant.mrp > 0 ? variant.mrp : (variant.price || 199);
          if (!variant.mrp || variant.mrp === 0) {
            variant.mrp = varMRP;
            isModified = true;
          }

          const varFloor = variant.minPrice && variant.minPrice > 0 ? variant.minPrice : Math.round(varMRP * 0.55);
          if (!variant.minPrice || variant.minPrice === 0) {
            variant.minPrice = varFloor;
            isModified = true;
          }

          let varProposedPrice = Math.round(varMRP * (1 - calculatedDiscountPercent / 100));
          if (varProposedPrice < varFloor) {
            varProposedPrice = varFloor; // Loss-proof clamping
          }

          if (variant.price !== varProposedPrice) {
            variant.price = varProposedPrice;
            isModified = true;
          }
        });
      }

      // 5. Automated Homepage Highlighting (High trust deal products)
      // If a product is top-rated (>=4.0) AND has a significant discount, highlight it in Today's Deals!
      const finalDiscountRatio = (baseMRP - proposedPrice) / baseMRP;
      if (currentRating >= 4.0 && finalDiscountRatio >= 0.25) {
        if (!product.inTodaysDeal) {
          product.inTodaysDeal = true;
          isModified = true;
          promotedCount++;
        }
      }

      if (isModified) {
        await product.save();
        updatedCount++;
      }
    }

    console.log(`[Pricing Engine] Automated run complete.`);
    console.log(`  - Recalibrated & locked prices for ${updatedCount} products under full floor-loss protection.`);
    console.log(`  - Promoted ${promotedCount} top-deal trusted spices to the home page Deals list.`);
  } catch (error) {
    console.error('[Pricing Engine] Critical pricing calculation failure:', error);
  }
};

module.exports = {
  runDiscountEngine
};
