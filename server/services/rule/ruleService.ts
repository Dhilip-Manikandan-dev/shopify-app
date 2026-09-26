import { RuleRepository } from "@/server/repositories/ruleRepository";
import { RuleTester } from "@/lib/rule-engine/tester";
import { EvaluationContext, RuleDefinition } from "@/lib/rule-engine/types";
import { RuleStatus } from "@prisma/client";

export class RuleService {
  static async getRules(params: {
    storeId: string;
    status?: RuleStatus;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    return RuleRepository.findRulesByStore(params);
  }

  static async getRuleById(storeId: string, ruleId: string) {
    const rule = await RuleRepository.findRuleById(storeId, ruleId);
    if (!rule) {
      throw new Error("Rule not found or unauthorized");
    }
    return rule;
  }

  static async createRule(storeId: string, data: any) {
    return RuleRepository.createRule(storeId, {
      ...data,
      startAt: data.startAt ? new Date(data.startAt) : null,
      endAt: data.endAt ? new Date(data.endAt) : null,
    });
  }

  static async updateRule(storeId: string, ruleId: string, data: any) {
    const updated = await RuleRepository.updateRule(storeId, ruleId, {
      ...data,
      startAt: data.startAt ? new Date(data.startAt) : undefined,
      endAt: data.endAt ? new Date(data.endAt) : undefined,
    });
    if (!updated) {
      throw new Error("Rule not found or unauthorized");
    }
    return updated;
  }

  static async archiveRule(storeId: string, ruleId: string) {
    const archived = await RuleRepository.archiveRule(storeId, ruleId);
    if (!archived) {
      throw new Error("Rule not found or unauthorized");
    }
    return { success: true, ruleId };
  }

  static async duplicateRule(storeId: string, ruleId: string) {
    const existing = await this.getRuleById(storeId, ruleId);
    return RuleRepository.createRule(storeId, {
      name: `${existing.name} (Copy)`,
      description: existing.description ?? undefined,
      status: "DRAFT",
      priority: existing.priority + 1,
      startAt: existing.startAt ? new Date(existing.startAt) : null,
      endAt: existing.endAt ? new Date(existing.endAt) : null,
      groups: existing.groups.map((g) => ({
        position: g.position,
        conditions: g.conditions.map((c) => ({
          field: c.field,
          operator: c.operator,
          value: c.value,
          valueType: c.valueType,
          position: c.position ?? 0,
        })),
      })),
      actions: existing.actions.map((a) => ({
        type: a.type,
        configuration: a.configuration as Record<string, unknown>,
        position: a.position,
      })),
      upsells: existing.upsells,
      display: existing.display,
    });
  }

  static async testRule(storeId: string, ruleId: string, context: EvaluationContext) {
    const rule = await this.getRuleById(storeId, ruleId);
    return RuleTester.testRule(rule, context);
  }

  static testDraftRule(ruleDefinition: RuleDefinition, context: EvaluationContext) {
    return RuleTester.testRule(ruleDefinition, context);
  }
}
