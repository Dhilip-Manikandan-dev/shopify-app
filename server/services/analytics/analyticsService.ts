import prisma from "@/lib/prisma";
import { AnalyticsRepository, RecordEventInput } from "@/server/repositories/analyticsRepository";
import { StoreRepository } from "@/server/repositories/storeRepository";

export class AnalyticsService {
  static async recordStorefrontEvent(params: {
    shop: string;
    ruleId?: string;
    eventType: "RULE_TRIGGERED" | "UPSELL_VIEWED" | "UPSELL_CLICKED" | "UPSELL_ADDED";
    productId?: string;
    variantId?: string;
    surface?: string;
    sessionId?: string;
    idempotencyKey?: string;
    metadata?: Record<string, unknown>;
  }) {
    const store = await StoreRepository.findByShop(params.shop);
    if (!store) return null;

    const data: RecordEventInput = {
      storeId: store.id,
      ruleId: params.ruleId,
      eventType: params.eventType,
      productId: params.productId,
      variantId: params.variantId,
      surface: params.surface,
      sessionId: params.sessionId,
      idempotencyKey: params.idempotencyKey,
      metadata: params.metadata,
    };

    return AnalyticsRepository.recordEvent(data);
  }

  static async getDashboardMetrics(storeId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      activeRulesCount,
      totalRulesCount,
      metrics,
      rulePerformance,
      executionLogsCount,
      surfaceEvents,
    ] = await Promise.all([
      prisma.rule.count({
        where: { storeId, status: "ACTIVE" },
      }),
      prisma.rule.count({
        where: { storeId },
      }),
      AnalyticsRepository.getStoreMetrics(storeId, startDate),
      AnalyticsRepository.getRulePerformance(storeId, startDate),
      prisma.executionLog.count({
        where: { storeId, createdAt: { gte: startDate } },
      }),
      prisma.analyticsEvent.groupBy({
        by: ["surface"],
        where: { storeId, createdAt: { gte: startDate } },
        _count: { _all: true },
      }),
    ]);

    const eventsBySurface: Record<string, number> = {};
    for (const item of surfaceEvents) {
      if (item.surface) {
        eventsBySurface[item.surface] = item._count._all;
      }
    }

    const eventsSummary = {
      RULE_TRIGGERED: metrics.triggered,
      UPSELL_VIEWED: metrics.viewed,
      UPSELL_CLICKED: metrics.clicked,
      UPSELL_ADDED: metrics.added,
    };

    return {
      timeframe: `Last ${days} days`,
      activeRulesCount,
      totalRulesCount,
      eventsSummary,
      eventsBySurface,
      rulePerformance,
      executionLogsCount,
      // For backwards compatibility:
      overview: metrics,
      rules: rulePerformance,
    };
  }
}
