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

  static async getDashboardMetrics(storeId: string) {
    const [overview, rules] = await Promise.all([
      AnalyticsRepository.getStoreMetrics(storeId),
      AnalyticsRepository.getRulePerformance(storeId),
    ]);

    return {
      overview,
      rules,
    };
  }
}
