import { AnalyticsData } from "./types";
import { ApiResponse } from "@/types/api";

export async function getAnalytics(shop?: string, days = 30): Promise<AnalyticsData> {
  const q = new URLSearchParams();
  if (shop) q.append("shop", shop);
  if (days) q.append("days", String(days));

  const res = await fetch(`/api/analytics?${q.toString()}`);
  const json: ApiResponse<AnalyticsData> = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message || "Failed to load analytics");
  }
  return json.data;
}
