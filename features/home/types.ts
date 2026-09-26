export interface DashboardSummary {
  activeRulesCount: number;
  totalRulesCount: number;
  eventsSummary: {
    triggeredCount: number;
    upsellViewedCount: number;
    upsellAddedCount: number;
    conversionRate: number;
  };
  checklist: {
    hasActiveRules: boolean;
    hasStorefrontExtension: boolean;
    hasTestedRule: boolean;
  };
}
