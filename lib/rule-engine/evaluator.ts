import {
  DiagnosticConditionStep,
  DiagnosticGroupStep,
  EvaluationContext,
  RuleDefinition,
  RuleEvaluationResult,
  StorefrontOfferResponse,
} from "./types";
import { evaluateCondition, CONDITION_REGISTRY } from "./registry/conditionRegistry";
import { ACTION_REGISTRY } from "./registry/actionRegistry";

export class RuleEvaluator {
  /**
   * Evaluates a single rule against an EvaluationContext.
   * Logic: (Group 1 [AND]) OR (Group 2 [AND]) ...
   */
  static evaluateRule(
    rule: RuleDefinition,
    context: EvaluationContext,
    now = new Date()
  ): RuleEvaluationResult {
    // 1. Status check
    if (rule.status !== "ACTIVE") {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        priority: rule.priority,
        matched: false,
        groupDiagnostics: [],
      };
    }

    // 2. Date range check
    if (rule.startAt && new Date(rule.startAt) > now) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        priority: rule.priority,
        matched: false,
        groupDiagnostics: [],
      };
    }
    if (rule.endAt && new Date(rule.endAt) < now) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        priority: rule.priority,
        matched: false,
        groupDiagnostics: [],
      };
    }

    // 3. Surface check (if surface is specified)
    if (context.surface && rule.display) {
      if (context.surface === "PRODUCT_PAGE" && !rule.display.productPage) {
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          priority: rule.priority,
          matched: false,
          groupDiagnostics: [],
        };
      }
      if (context.surface === "COLLECTION_PAGE" && !rule.display.collectionPage) {
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          priority: rule.priority,
          matched: false,
          groupDiagnostics: [],
        };
      }
      if (context.surface === "CART_PAGE" && !rule.display.cartPage) {
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          priority: rule.priority,
          matched: false,
          groupDiagnostics: [],
        };
      }
    }

    // 4. Evaluate condition groups: (G1) OR (G2)
    const groupDiagnostics: DiagnosticGroupStep[] = [];
    let ruleMatched = false;

    // If a rule has no groups, by default it doesn't match
    if (!rule.groups || rule.groups.length === 0) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        priority: rule.priority,
        matched: false,
        groupDiagnostics: [],
      };
    }

    for (const group of rule.groups) {
      const conditionSteps: DiagnosticConditionStep[] = [];
      let groupPassed = true;

      // Group conditions are evaluated with AND
      for (const cond of group.conditions) {
        const spec = CONDITION_REGISTRY[cond.field];
        const actual = spec ? spec.extractActual(context) : undefined;
        const result = evaluateCondition(cond.field, cond.operator, cond.value, actual);

        conditionSteps.push({
          field: cond.field,
          operator: cond.operator,
          expected: cond.value,
          actual,
          passed: result.passed,
          message: result.message,
        });

        if (!result.passed) {
          groupPassed = false;
        }
      }

      groupDiagnostics.push({
        groupPosition: group.position,
        passed: groupPassed,
        conditions: conditionSteps,
      });

      // (Group 1) OR (Group 2): Any group passing causes the rule to match
      if (groupPassed) {
        ruleMatched = true;
      }
    }

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      priority: rule.priority,
      matched: ruleMatched,
      groupDiagnostics,
    };
  }

  /**
   * Evaluates multiple rules, sorts by priority ASC (1 is highest),
   * resolves action conflicts, and produces the sanitized storefront payload.
   */
  static evaluateRulesForStorefront(
    rules: RuleDefinition[],
    context: EvaluationContext
  ): StorefrontOfferResponse {
    // Sort rules by priority ASC
    const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

    const matchedRules: RuleDefinition[] = [];
    for (const rule of sortedRules) {
      const result = this.evaluateRule(rule, context);
      if (result.matched) {
        matchedRules.push(rule);
      }
    }

    if (matchedRules.length === 0) {
      return { matched: false, offers: [] };
    }

    // Resolve actions:
    // Shipping: Highest priority rule with a shipping action wins
    // Discount: Highest priority rule with a discount action wins
    // Upsell: Collect top upsells from matched rules
    const allOffers: StorefrontOfferResponse["offers"] = [];
    let shippingResolved = false;
    let discountResolved = false;

    for (const rule of matchedRules) {
      for (const action of rule.actions) {
        if (action.type === "SHIPPING") {
          if (!shippingResolved) {
            const transformed = ACTION_REGISTRY.SHIPPING.transformForStorefront(
              action,
              context
            );
            if (transformed.length > 0) {
              allOffers.push(...transformed);
              shippingResolved = true;
            }
          }
        } else if (action.type === "DISCOUNT") {
          if (!discountResolved) {
            const transformed = ACTION_REGISTRY.DISCOUNT.transformForStorefront(
              action,
              context
            );
            if (transformed.length > 0) {
              allOffers.push(...transformed);
              discountResolved = true;
            }
          }
        } else if (action.type === "UPSELL") {
          const transformed = ACTION_REGISTRY.UPSELL.transformForStorefront(
            action,
            context,
            rule.upsells
          );
          allOffers.push(...transformed);
        }
      }
    }

    return {
      matched: allOffers.length > 0,
      offers: allOffers,
    };
  }
}
