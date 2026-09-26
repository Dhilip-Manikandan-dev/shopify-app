export interface AnalyticsData {
  timeframe: string;
  activeRulesCount: number;
  totalRulesCount: number;
  eventsSummary: Record<string, number>;
  eventsBySurface: Record<string, number>;
  rulePerformance: Array<{
    ruleId: string;
    ruleName: string;
    events: Record<string, number>;
  }>;
  executionLogsCount: number;
}
