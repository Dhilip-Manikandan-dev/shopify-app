/**
 * Shopify Function — Checkout Order Discount Execution
 * Applies conditional order discounts dynamically configured by Smart Offer Rules.
 */

interface RunInput {
  cart: {
    buyerIdentity?: {
      customer?: {
        id: string;
        metafield?: { value: string };
      };
    };
    cost: {
      subtotalAmount: {
        amount: string;
        currencyCode: string;
      };
    };
    lines: Array<{
      id: string;
      quantity: number;
    }>;
  };
  discountNode: {
    metafield?: {
      value: string;
    };
  };
}

interface FunctionResult {
  discountApplicationStrategy: "FIRST" | "MAXIMUM";
  discounts: Array<{
    value: {
      percentage?: { value: string };
      fixedAmount?: { amount: string; currencyCode: string };
    };
    targets: Array<{
      orderSubtotal: {
        excludedVariantIds: string[];
      };
    }>;
    message?: string;
  }>;
}

const EMPTY_DISCOUNT: FunctionResult = {
  discountApplicationStrategy: "FIRST",
  discounts: [],
};

export function run(input: RunInput): FunctionResult {
  const configRaw = input.discountNode?.metafield?.value;
  if (!configRaw) {
    return EMPTY_DISCOUNT;
  }

  try {
    const config = JSON.parse(configRaw);
    const subtotal = parseFloat(input.cart.cost.subtotalAmount.amount);

    // If minimum threshold required
    if (config.minSubtotal && subtotal < config.minSubtotal) {
      return EMPTY_DISCOUNT;
    }

    if (config.discountType === "PERCENTAGE" && config.value > 0) {
      return {
        discountApplicationStrategy: "FIRST",
        discounts: [
          {
            value: {
              percentage: {
                value: String(config.value),
              },
            },
            targets: [
              {
                orderSubtotal: {
                  excludedVariantIds: [],
                },
              },
            ],
            message: config.title || "Smart Offer Order Discount",
          },
        ],
      };
    }

    if (config.discountType === "FIXED_AMOUNT" && config.value > 0) {
      return {
        discountApplicationStrategy: "FIRST",
        discounts: [
          {
            value: {
              fixedAmount: {
                amount: String(config.value),
                currencyCode: input.cart.cost.subtotalAmount.currencyCode,
              },
            },
            targets: [
              {
                orderSubtotal: {
                  excludedVariantIds: [],
                },
              },
            ],
            message: config.title || "Smart Offer Order Discount",
          },
        ],
      };
    }

    return EMPTY_DISCOUNT;
  } catch (err) {
    return EMPTY_DISCOUNT;
  }
}
