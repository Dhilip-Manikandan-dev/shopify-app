import prisma from "@/lib/prisma";
import { AnalyticsEventType } from "@prisma/client";

export interface RecordEventInput {
  storeId: string;
  ruleId?: string;
  eventType: AnalyticsEventType;
  productId?: string;
  variantId?: string;
  surface?: string;
  sessionId?: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}

export class AnalyticsRepository {
  /**
   * Records an analytics event with idempotency guarantee.
   */
  static async recordEvent(data: RecordEventInput) {
    if (data.idempotencyKey) {
      // Check if already processed
      const existing = await prisma.analyticsEvent.findUnique({
        where: { idempotencyKey: data.idempotencyKey },
      });
      if (existing) {
        return existing;
      }
    }

    return prisma.analyticsEvent.create({
      data: {
        storeId: data.storeId,
        ruleId: data.ruleId,
        eventType: data.eventType,
        productId: data.productId,
        variantId: data.variantId,
        surface: data.surface,
        sessionId: data.sessionId,
        idempotencyKey: data.idempotencyKey,
        metadata: data.metadata as any,
      },
    });
  }

  /**
   * Aggregates event counts for the analytics dashboard
   */
  static async getStoreMetrics(storeId: string, startDate?: Date) {
    const where = {
      storeId,
      ...(startDate ? { createdAt: { gte: startDate } } : {}),
    };

    const [triggered, viewed, clicked, added] = await prisma.$transaction([
      prisma.analyticsEvent.count({
        where: { ...where, eventType: "RULE_TRIGGERED" },
      }),
      prisma.analyticsEvent.count({
        where: { ...where, eventType: "UPSELL_VIEWED" },
      }),
      prisma.analyticsEvent.count({
        where: { ...where, eventType: "UPSELL_CLICKED" },
      }),
      prisma.analyticsEvent.count({
        where: { ...where, eventType: "UPSELL_ADDED" },
      }),
    ]);

    const conversionRate = viewed > 0 ? Number(((added / viewed) * 100).toFixed(1)) : 0;
    const ctr = viewed > 0 ? Number(((clicked / viewed) * 100).toFixed(1)) : 0;

    return {
      triggered,
      viewed,
      clicked,
      added,
      conversionRate,
      ctr,
    };
  }

  /**
   * Rule-by-rule conversion performance table
   */
  static async getRulePerformance(storeId: string, startDate?: Date) {
    const rules = await prisma.rule.findMany({
      where: { storeId },
      select: {
        id: true,
        name: true,
        status: true,
        priority: true,
      },
      orderBy: { priority: "asc" },
    });

    const whereBase = {
      storeId,
      ...(startDate ? { createdAt: { gte: startDate } } : {}),
    };

    const ruleStats = await Promise.all(
      rules.map(async (rule) => {
        const [triggered, viewed, clicked, added] = await Promise.all([
          prisma.analyticsEvent.count({
            where: { ...whereBase, ruleId: rule.id, eventType: "RULE_TRIGGERED" },
          }),
          prisma.analyticsEvent.count({
            where: { ...whereBase, ruleId: rule.id, eventType: "UPSELL_VIEWED" },
          }),
          prisma.analyticsEvent.count({
            where: { ...whereBase, ruleId: rule.id, eventType: "UPSELL_CLICKED" },
          }),
          prisma.analyticsEvent.count({
            where: { ...whereBase, ruleId: rule.id, eventType: "UPSELL_ADDED" },
          }),
        ]);

        const conversionRate = viewed > 0 ? Number(((added / viewed) * 100).toFixed(1)) : 0;

        return {
          id: rule.id,
          ruleId: rule.id,
          name: rule.name,
          ruleName: rule.name,
          status: rule.status,
          priority: rule.priority,
          views: viewed,
          added,
          events: {
            RULE_TRIGGERED: triggered,
            UPSELL_VIEWED: viewed,
            UPSELL_CLICKED: clicked,
            UPSELL_ADDED: added,
          },
          conversionRate,
        };
      })
    );

    return ruleStats;
  }
}
