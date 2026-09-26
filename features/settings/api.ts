import { StoreSettings } from "./types";
import { ApiResponse } from "@/types/api";

export async function getSettings(shop?: string): Promise<StoreSettings> {
  const q = shop ? `?shop=${encodeURIComponent(shop)}` : "";
  const res = await fetch(`/api/settings${q}`);
  const json: ApiResponse<StoreSettings> = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message || "Failed to load store settings");
  }
  return json.data;
}

export async function updateSettings(
  data: Partial<StoreSettings>,
  shop?: string
): Promise<StoreSettings> {
  const q = shop ? `?shop=${encodeURIComponent(shop)}` : "";
  const res = await fetch(`/api/settings${q}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json: ApiResponse<StoreSettings> = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message || "Failed to update settings");
  }
  return json.data;
}
