import { EvaluationContext, RuleDefinition, RuleEvaluationResult } from "./types";
import { RuleEvaluator } from "./evaluator";

export interface RuleTesterResult {
  ruleId: string;
  ruleName: string;
  matched: boolean;
  summary: string;
  groups: Array<{
    groupNumber: number;
    passed: boolean;
    conditions: Array<{
      field: string;
      operator: string;
      expected: unknown;
      actual: unknown;
      passed: boolean;
      diagnostic: string;
    }>;
  }>;
}

export class RuleTester {
  /**
   * Tests a rule with mock context data using the exact production evaluator.
   */
  static testRule(rule: RuleDefinition, context: EvaluationContext): RuleTesterResult {
    // For testing, evaluate even if in DRAFT mode so the merchant can preview before activation
    const testableRule: RuleDefinition = {
      ...rule,
      status: "ACTIVE", // Force active flag for evaluation test run
    };

    const evalResult: RuleEvaluationResult = RuleEvaluator.evaluateRule(
      testableRule,
      context
    );

    const formattedGroups = evalResult.groupDiagnostics.map((g, idx) => ({
      groupNumber: idx + 1,
      passed: g.passed,
      conditions: g.conditions.map((c) => ({
        field: c.field,
        operator: c.operator,
        expected: c.expected,
        actual: c.actual,
        passed: c.passed,
        diagnostic: c.passed ? `✓ ${c.message}` : `✕ ${c.message}`,
      })),
    }));

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      matched: evalResult.matched,
      summary: evalResult.matched
        ? `RULE MATCHED: Conditions in at least one condition group were satisfied.`
        : `RULE NOT MATCHED: None of the condition groups were satisfied.`,
      groups: formattedGroups,
    };
  }
}
