import { DashboardSummary } from "./types";
import { ApiResponse } from "@/types/api";

export async function getDashboardSummary(shop?: string): Promise<DashboardSummary> {
  const q = shop ? `?shop=${encodeURIComponent(shop)}` : "";
  const res = await fetch(`/api/analytics${q}`);
  const json: ApiResponse<any> = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message || "Failed to load dashboard data");
  }

  const analytics = json.data;
  const triggered = analytics.eventsSummary?.RULE_TRIGGERED || 0;
  const viewed = analytics.eventsSummary?.UPSELL_VIEWED || 0;
  const added = analytics.eventsSummary?.UPSELL_ADDED || 0;
  const conversionRate = viewed > 0 ? Number(((added / viewed) * 100).toFixed(1)) : 0;

  return {
    activeRulesCount: analytics.activeRulesCount || 0,
    totalRulesCount: analytics.totalRulesCount || 0,
    eventsSummary: {
      triggeredCount: triggered,
      upsellViewedCount: viewed,
      upsellAddedCount: added,
      conversionRate,
    },
    checklist: {
      hasActiveRules: (analytics.activeRulesCount || 0) > 0,
      hasStorefrontExtension: true,
      hasTestedRule: (analytics.executionLogsCount || 0) > 0,
    },
  };
}
