import { ShopifyProduct, ShopifyVariant } from "@/types/shopify";

export type { ShopifyProduct, ShopifyVariant };

export interface SelectedProductVariant {
  productId: string;
  variantId?: string;
  title: string;
  price: number;
  imageUrl?: string;
}
