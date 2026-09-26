import { describe, it, expect } from "vitest";
import { RuleEvaluator } from "@/lib/rule-engine/evaluator";
import { RuleTester } from "@/lib/rule-engine/tester";
import { EvaluationContext, RuleDefinition } from "@/lib/rule-engine/types";

describe("Rule Engine & Evaluator", () => {
  const baseRule: RuleDefinition = {
    id: "rule_1",
    storeId: "store_1",
    name: "VIP Free Shipping + 10% Discount",
    status: "ACTIVE",
    priority: 1,
    groups: [
      {
        position: 0,
        conditions: [
          {
            field: "customer.tags",
            operator: "contains",
            value: "VIP",
          },
          {
            field: "cart.subtotal",
            operator: "gte",
            value: 3000,
          },
          {
            field: "location.country",
            operator: "equals",
            value: "IN",
          },
        ],
      },
    ],
    actions: [
      {
        type: "SHIPPING",
        position: 0,
        configuration: { subType: "FREE", freeShippingThreshold: 3000 },
      },
      {
        type: "DISCOUNT",
        position: 1,
        configuration: { discountType: "PERCENTAGE", value: 10, title: "10% VIP Discount" },
      },
    ],
    upsells: [],
  };

  it("matches when Customer Tag is VIP, Subtotal >= 3000, and Country is IN", () => {
    const context: EvaluationContext = {
      customer: {
        tags: ["VIP", "Newsletter"],
        orderCount: 5,
        lifetimeSpend: 15000,
        country: "IN",
      },
      cart: {
        subtotal: 3500,
        quantity: 3,
        productIds: ["prod_1"],
        collectionIds: ["col_1"],
        productCount: 1,
        uniqueProductCount: 1,
      },
      location: {
        country: "IN",
        isDomestic: true,
        isInternational: false,
      },
    };

    const result = RuleEvaluator.evaluateRule(baseRule, context);
    expect(result.matched).toBe(true);
    expect(result.groupDiagnostics[0].passed).toBe(true);
    expect(result.groupDiagnostics[0].conditions.every((c) => c.passed)).toBe(true);
  });

  it("fails when cart subtotal is below 3000 (e.g. 2000)", () => {
    const context: EvaluationContext = {
      customer: {
        tags: ["VIP"],
        orderCount: 1,
        lifetimeSpend: 2000,
      },
      cart: {
        subtotal: 2000,
        quantity: 1,
        productIds: ["prod_1"],
        collectionIds: [],
        productCount: 1,
        uniqueProductCount: 1,
      },
      location: {
        country: "IN",
        isDomestic: true,
        isInternational: false,
      },
    };

    const result = RuleEvaluator.evaluateRule(baseRule, context);
    expect(result.matched).toBe(false);
    expect(result.groupDiagnostics[0].passed).toBe(false);

    // Specifically cart.subtotal condition should have failed
    const subtotalCheck = result.groupDiagnostics[0].conditions.find(
      (c) => c.field === "cart.subtotal"
    );
    expect(subtotalCheck?.passed).toBe(false);
  });

  it("evaluates Group A OR Group B correctly", () => {
    const multiGroupRule: RuleDefinition = {
      ...baseRule,
      groups: [
        {
          position: 0,
          conditions: [
            { field: "customer.tags", operator: "contains", value: "VIP" },
            { field: "cart.subtotal", operator: "gte", value: 3000 },
          ],
        },
        {
          position: 1,
          conditions: [
            { field: "customer.lifetimeSpend", operator: "gte", value: 10000 },
          ],
        },
      ],
    };

    // Customer is NOT VIP and cart is only 500, but lifetimeSpend is 12000 -> Group 2 passes!
    const context: EvaluationContext = {
      customer: {
        tags: ["Regular"],
        orderCount: 4,
        lifetimeSpend: 12000,
      },
      cart: {
        subtotal: 500,
        quantity: 1,
        productIds: [],
        collectionIds: [],
        productCount: 0,
        uniqueProductCount: 0,
      },
    };

    const result = RuleEvaluator.evaluateRule(multiGroupRule, context);
    expect(result.matched).toBe(true);
    expect(result.groupDiagnostics[0].passed).toBe(false); // Group 1 failed
    expect(result.groupDiagnostics[1].passed).toBe(true); // Group 2 passed
  });

  it("ignores PAUSED and expired rules", () => {
    const pausedRule: RuleDefinition = {
      ...baseRule,
      status: "PAUSED",
    };

    const context: EvaluationContext = {
      customer: { tags: ["VIP"], orderCount: 1, lifetimeSpend: 5000 },
      cart: { subtotal: 4000, quantity: 2, productIds: [], collectionIds: [], productCount: 1, uniqueProductCount: 1 },
      location: { country: "IN", isDomestic: true, isInternational: false },
    };

    const pausedResult = RuleEvaluator.evaluateRule(pausedRule, context);
    expect(pausedResult.matched).toBe(false);

    const expiredRule: RuleDefinition = {
      ...baseRule,
      endAt: new Date(Date.now() - 10000), // ended in the past
    };
    const expiredResult = RuleEvaluator.evaluateRule(expiredRule, context);
    expect(expiredResult.matched).toBe(false);
  });

  it("resolves priority correctly (Priority 1 shipping wins over Priority 10 shipping)", () => {
    const ruleHighPriority: RuleDefinition = {
      ...baseRule,
      id: "rule_high",
      priority: 1,
      actions: [
        {
          type: "SHIPPING",
          position: 0,
          configuration: { subType: "FREE", title: "VIP Free Shipping" },
        },
      ],
    };

    const ruleLowPriority: RuleDefinition = {
      ...baseRule,
      id: "rule_low",
      priority: 10,
      actions: [
        {
          type: "SHIPPING",
          position: 0,
          configuration: { subType: "FIXED_DISCOUNT", discountValue: 50, title: "Standard 50 Off" },
        },
      ],
    };

    const context: EvaluationContext = {
      customer: { tags: ["VIP"], orderCount: 2, lifetimeSpend: 5000 },
      cart: { subtotal: 5000, quantity: 2, productIds: [], collectionIds: [], productCount: 1, uniqueProductCount: 1 },
      location: { country: "IN", isDomestic: true, isInternational: false },
    };

    const storefrontOffers = RuleEvaluator.evaluateRulesForStorefront(
      [ruleLowPriority, ruleHighPriority], // passed in reverse order
      context
    );

    expect(storefrontOffers.matched).toBe(true);
    const shippingOffer = storefrontOffers.offers.find((o) => o.type === "SHIPPING");
    expect(shippingOffer?.title).toBe("VIP Free Shipping");
    expect(shippingOffer?.shippingSubtype).toBe("FREE");
  });

  it("excludes upsell product if already in cart", () => {
    const upsellRule: RuleDefinition = {
      ...baseRule,
      actions: [{ type: "UPSELL", position: 0, configuration: {} }],
      upsells: [
        {
          productId: "gid://shopify/Product/999",
          title: "Shoe Cleaner",
          originalPrice: 299,
          offerPrice: 199,
          buttonText: "Add for ₹199",
          enabled: true,
          excludeIfInCart: true,
        },
      ],
    };

    const contextWithUpsellInCart: EvaluationContext = {
      customer: { tags: ["VIP"], orderCount: 1, lifetimeSpend: 4000 },
      cart: {
        subtotal: 3500,
        quantity: 2,
        productIds: ["gid://shopify/Product/999"], // already in cart
        collectionIds: [],
        productCount: 1,
        uniqueProductCount: 1,
      },
      location: { country: "IN", isDomestic: true, isInternational: false },
    };

    const offers = RuleEvaluator.evaluateRulesForStorefront([upsellRule], contextWithUpsellInCart);
    const upsellOffer = offers.offers.find((o) => o.type === "UPSELL");
    expect(upsellOffer).toBeUndefined(); // Should be excluded!
  });

  it("RuleTester provides step-by-step diagnostic breakdown", () => {
    const context: EvaluationContext = {
      customer: { tags: ["VIP"], orderCount: 1, lifetimeSpend: 1000 },
      cart: { subtotal: 2500, quantity: 1, productIds: [], collectionIds: [], productCount: 1, uniqueProductCount: 1 },
      location: { country: "IN", isDomestic: true, isInternational: false },
    };

    const testResult = RuleTester.testRule(baseRule, context);
    expect(testResult.matched).toBe(false);
    expect(testResult.groups.length).toBe(1);
    expect(testResult.groups[0].conditions[0].diagnostic).toContain("✓"); // VIP passed
    expect(testResult.groups[0].conditions[1].diagnostic).toContain("✕"); // Cart subtotal failed
  });
});
