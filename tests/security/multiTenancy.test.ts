import { describe, it, expect, vi, beforeEach } from "vitest";
import { StorefrontOfferRequestSchema } from "@/server/validators/storefrontValidators";
import { checkRateLimit } from "@/server/security/rateLimiter";
import { verifyShopifyWebhookHmac } from "@/server/security/webhookHmac";
import crypto from "crypto";

describe("Security & Multi-Tenancy Validation", () => {
  beforeEach(() => {
    process.env.SHOPIFY_API_SECRET = "test_shopify_secret_12345";
  });

  it("validates storefront request schemas strictly", () => {
    // Valid storefront payload
    const valid = StorefrontOfferRequestSchema.safeParse({
      shop: "demo-store.myshopify.com",
      surface: "PRODUCT_PAGE",
      productId: "gid://shopify/Product/123",
      cart: {
        subtotal: 1000,
        quantity: 1,
        productIds: ["gid://shopify/Product/123"],
        collectionIds: [],
      },
    });
    expect(valid.success).toBe(true);

    // Invalid: fake shop domain format
    const invalidShop = StorefrontOfferRequestSchema.safeParse({
      shop: "not_a_shopify_domain",
      surface: "PRODUCT_PAGE",
    });
    expect(invalidShop.success).toBe(false);

    // Invalid: invalid surface
    const invalidSurface = StorefrontOfferRequestSchema.safeParse({
      shop: "demo.myshopify.com",
      surface: "INVALID_SURFACE",
    });
    expect(invalidSurface.success).toBe(false);
  });

  it("rate limits excessive requests", () => {
    const testIp = "192.168.1.100";
    // Allowed up to 5 requests
    for (let i = 0; i < 5; i++) {
      const res = checkRateLimit(`test_${testIp}`, 5, 60);
      expect(res.allowed).toBe(true);
    }

    // 6th request is blocked
    const blocked = checkRateLimit(`test_${testIp}`, 5, 60);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("verifies webhook HMAC signatures correctly with timing safe equality", () => {
    const rawBody = JSON.stringify({ id: 12345, shop: "test.myshopify.com" });
    const validHmac = crypto
      .createHmac("sha256", process.env.SHOPIFY_API_SECRET!)
      .update(Buffer.from(rawBody, "utf8"))
      .digest("base64");

    expect(verifyShopifyWebhookHmac(rawBody, validHmac)).toBe(true);
    expect(verifyShopifyWebhookHmac(rawBody, "invalid_hmac_string")).toBe(false);
    expect(verifyShopifyWebhookHmac(rawBody, "")).toBe(false);
  });
});
