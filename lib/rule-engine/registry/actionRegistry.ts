import {
  ActionDefinition,
  ActionType,
  DiscountActionConfig,
  EvaluationContext,
  ShippingActionConfig,
  StorefrontOfferResponse,
  UpsellItemConfig,
} from "../types";

export interface ActionSpec<T = unknown> {
  type: ActionType;
  label: string;
  validate: (config: unknown) => { valid: boolean; errors?: string[] };
  transformForStorefront: (
    action: ActionDefinition,
    context: EvaluationContext,
    upsells?: UpsellItemConfig[]
  ) => StorefrontOfferResponse["offers"];
}

export const ACTION_REGISTRY: Record<ActionType, ActionSpec> = {
  SHIPPING: {
    type: "SHIPPING",
    label: "Shipping Offer",
    validate: (cfg) => {
      const config = cfg as ShippingActionConfig;
      if (!config || !config.subType) {
        return { valid: false, errors: ["Missing shipping subType"] };
      }
      return { valid: true };
    },
    transformForStorefront: (action, context) => {
      const config = action.configuration as ShippingActionConfig;
      const offers: StorefrontOfferResponse["offers"] = [];

      // Check regional scoping (domestic vs international)
      if (config.scope === "DOMESTIC" && !context.location?.isDomestic) {
        return offers;
      }
      if (config.scope === "INTERNATIONAL" && !context.location?.isInternational) {
        return offers;
      }

      const cartSubtotal = context.cart?.subtotal ?? 0;
      let progress = undefined;

      if (config.freeShippingThreshold && config.freeShippingThreshold > 0) {
        const target = config.freeShippingThreshold;
        const current = cartSubtotal;
        const remaining = Math.max(0, target - current);
        const percentage = Math.min(100, Math.round((current / target) * 100));

        progress = {
          current,
          target,
          remaining,
          percentage,
          message:
            remaining === 0
              ? "You unlocked Free Shipping!"
              : `Add ₹${remaining.toFixed(0)} more for Free Shipping`,
        };
      }

      offers.push({
        type: "SHIPPING",
        title: config.title ?? (config.subType === "FREE" ? "Free Shipping" : "Shipping Discount"),
        shippingSubtype: config.subType,
        discountValue: config.discountValue,
        freeShippingThreshold: config.freeShippingThreshold,
        progress,
      });

      return offers;
    },
  },

  DISCOUNT: {
    type: "DISCOUNT",
    label: "Order Discount",
    validate: (cfg) => {
      const config = cfg as DiscountActionConfig;
      if (!config || !config.discountType || typeof config.value !== "number") {
        return { valid: false, errors: ["Invalid discount configuration"] };
      }
      return { valid: true };
    },
    transformForStorefront: (action) => {
      const config = action.configuration as DiscountActionConfig;
      return [
        {
          type: "DISCOUNT",
          title: config.title ?? `${config.value}${config.discountType === "PERCENTAGE" ? "%" : " off"} Discount`,
          discountType: config.discountType,
          discountValue: config.value,
        },
      ];
    },
  },

  UPSELL: {
    type: "UPSELL",
    label: "Product Upsell",
    validate: () => ({ valid: true }),
    transformForStorefront: (action, context, upsells = []) => {
      const offers: StorefrontOfferResponse["offers"] = [];
      const cartProductIds = context.cart?.productIds ?? [];

      for (const item of upsells) {
        if (!item.enabled) continue;

        // Exclude if already in cart (default: true)
        if (item.excludeIfInCart !== false && cartProductIds.includes(item.productId)) {
          continue;
        }

        offers.push({
          type: "UPSELL",
          productId: item.productId,
          variantId: item.variantId,
          title: item.title,
          description: item.description,
          imageUrl: item.imageUrl,
          originalPrice: Number(item.originalPrice),
          price: Number(item.offerPrice),
          buttonText: item.buttonText ?? `Add for ₹${Number(item.offerPrice).toFixed(0)}`,
        });
      }

      return offers;
    },
  },
};
