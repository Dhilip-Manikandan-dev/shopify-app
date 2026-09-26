import { z } from "zod";

export const StorefrontOfferRequestSchema = z.object({
  shop: z
    .string()
    .min(1, "Shop domain is required")
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/, "Invalid Shopify store domain"),
  surface: z.enum(["PRODUCT_PAGE", "COLLECTION_PAGE", "CART_PAGE"]),
  productId: z.string().optional(),
  collectionIds: z.array(z.string()).optional().default([]),
  country: z.string().max(3).optional(),
  cart: z
    .object({
      subtotal: z.number().nonnegative().default(0),
      quantity: z.number().int().nonnegative().default(0),
      productIds: z.array(z.string()).default([]),
      collectionIds: z.array(z.string()).default([]),
      productCount: z.number().int().nonnegative().optional(),
      uniqueProductCount: z.number().int().nonnegative().optional(),
    })
    .optional(),
});

export type StorefrontOfferRequest = z.infer<typeof StorefrontOfferRequestSchema>;
