import crypto from "crypto";
import prisma from "@/lib/prisma";
import { StoreRepository } from "@/server/repositories/storeRepository";
import { RuleRepository } from "@/server/repositories/ruleRepository";
import { RuleEvaluator } from "@/lib/rule-engine/evaluator";
import { EvaluationContext, StorefrontOfferResponse } from "@/lib/rule-engine/types";
import { StorefrontOfferRequest } from "@/server/validators/storefrontValidators";

export class StorefrontService {
  /**
   * Fast evaluation endpoint called by Storefront SDK
   */
  static async evaluateOffers(
    request: StorefrontOfferRequest
  ): Promise<StorefrontOfferResponse> {
    // 1. Resolve store by shop domain
    const store = await StoreRepository.findByShop(request.shop);
    if (!store || !store.isActive) {
      return { matched: false, offers: [] };
    }

    // 2. Build EvaluationContext
    const domesticCountry = store.domesticCountry || "IN";
    const currentCountry = (request.country || "IN").toUpperCase();
    const isDomestic = currentCountry === domesticCountry;
    const isInternational = !isDomestic;

    const evaluationContext: EvaluationContext = {
      surface: request.surface,
      location: {
        country: currentCountry,
        isDomestic,
        isInternational,
      },
      cart: request.cart
        ? {
            subtotal: request.cart.subtotal,
            quantity: request.cart.quantity,
            productIds: request.cart.productIds,
            collectionIds: request.cart.collectionIds,
            productCount: request.cart.productCount ?? request.cart.productIds.length,
            uniqueProductCount:
              request.cart.uniqueProductCount ??
              new Set(request.cart.productIds).size,
          }
        : undefined,
      product: request.productId
        ? {
            id: request.productId,
            tags: [],
            vendor: "",
            productType: "",
            collectionIds: request.collectionIds ?? [],
          }
        : undefined,
    };

    // 3. Load ACTIVE rules within valid date range
    const activeRules = await RuleRepository.findActiveRulesForStorefront(store.id);
    if (activeRules.length === 0) {
      return { matched: false, offers: [] };
    }

    // 4. Evaluate rules with conflict resolution
    const result = RuleEvaluator.evaluateRulesForStorefront(activeRules, evaluationContext);

    // 5. Asynchronously log execution (Zero customer PII)
    const contextHash = crypto
      .createHash("sha256")
      .update(
        JSON.stringify({
          surface: request.surface,
          productId: request.productId,
          subtotal: request.cart?.subtotal,
          country: currentCountry,
        })
      )
      .digest("hex")
      .slice(0, 16);

    prisma.executionLog
      .create({
        data: {
          storeId: store.id,
          contextHash,
          matched: result.matched,
          surface: request.surface,
          diagnostics: {
            offersCount: result.offers.length,
            subtotal: request.cart?.subtotal,
          },
        },
      })
      .catch(() => {
        // Non-blocking background log failure
      });

    return result;
  }
}
