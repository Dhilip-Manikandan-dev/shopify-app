import { ShopifyProduct } from "./types";
import { ApiResponse } from "@/types/api";

export async function searchProducts(
  query = "",
  shop = "",
  signal?: AbortSignal
): Promise<ShopifyProduct[]> {
  const params = new URLSearchParams();
  if (query) params.append("query", query);
  if (shop) params.append("shop", shop);

  const res = await fetch(`/api/shopify/products?${params.toString()}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch products: ${res.statusText}`);
  }

  const json: ApiResponse<ShopifyProduct[]> = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message || "Failed to load products");
  }

  return json.data;
}
