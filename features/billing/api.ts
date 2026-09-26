import { SubscriptionStatus, SubscriptionPlan } from "./types";
import { ApiResponse } from "@/types/api";

export async function getSubscription(shop?: string): Promise<SubscriptionStatus> {
  const q = shop ? `?shop=${encodeURIComponent(shop)}` : "";
  const res = await fetch(`/api/billing${q}`);
  const json: ApiResponse<SubscriptionStatus> = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message || "Failed to load billing status");
  }
  return json.data;
}

export async function subscribePlan(
  plan: SubscriptionPlan,
  shop?: string
): Promise<{ confirmationUrl: string }> {
  const q = shop ? `?shop=${encodeURIComponent(shop)}` : "";
  const res = await fetch(`/api/billing${q}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan }),
  });
  const json: ApiResponse<{ confirmationUrl: string }> = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message || "Failed to process plan subscription");
  }
  return json.data;
}
