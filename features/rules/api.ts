import { RuleDefinition, RuleFormData } from "./types";
import { EvaluationContext } from "@/lib/rule-engine/types";
import { ApiResponse, PaginatedResult } from "@/types/api";

export async function getRules(params: {
  shop?: string;
  status?: string;
  search?: string;
  page?: number;
}): Promise<PaginatedResult<RuleDefinition>> {
  const q = new URLSearchParams();
  if (params.shop) q.append("shop", params.shop);
  if (params.status) q.append("status", params.status);
  if (params.search) q.append("search", params.search);
  if (params.page) q.append("page", String(params.page));

  const res = await fetch(`/api/rules?${q.toString()}`);
  const json: ApiResponse<PaginatedResult<RuleDefinition>> = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message || "Failed to load rules");
  }
  return json.data;
}

export async function getRule(ruleId: string, shop?: string): Promise<RuleDefinition> {
  const q = shop ? `?shop=${encodeURIComponent(shop)}` : "";
  const res = await fetch(`/api/rules/${ruleId}${q}`);
  const json: ApiResponse<RuleDefinition> = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message || "Failed to load rule");
  }
  return json.data;
}

export async function createRule(
  data: Partial<RuleFormData>,
  shop?: string
): Promise<RuleDefinition> {
  const q = shop ? `?shop=${encodeURIComponent(shop)}` : "";
  const res = await fetch(`/api/rules${q}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json: ApiResponse<RuleDefinition> = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message || "Failed to create rule");
  }
  return json.data;
}

export async function updateRule(
  ruleId: string,
  data: Partial<RuleFormData>,
  shop?: string
): Promise<RuleDefinition> {
  const q = shop ? `?shop=${encodeURIComponent(shop)}` : "";
  const res = await fetch(`/api/rules/${ruleId}${q}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json: ApiResponse<RuleDefinition> = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message || "Failed to update rule");
  }
  return json.data;
}

export async function archiveRule(ruleId: string, shop?: string): Promise<void> {
  const q = shop ? `?shop=${encodeURIComponent(shop)}` : "";
  const res = await fetch(`/api/rules/${ruleId}${q}`, { method: "DELETE" });
  const json: ApiResponse<any> = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message || "Failed to archive rule");
  }
}

export async function testRule(
  ruleId: string,
  context: EvaluationContext,
  shop?: string
) {
  const q = shop ? `?shop=${encodeURIComponent(shop)}` : "";
  const res = await fetch(`/api/rules/${ruleId}/test${q}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(context),
  });
  const json: ApiResponse<any> = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message || "Rule test failed");
  }
  return json.data;
}

export async function testDraftRule(
  rule: Partial<RuleFormData>,
  context: EvaluationContext,
  shop?: string
) {
  const q = shop ? `?shop=${encodeURIComponent(shop)}` : "";
  const res = await fetch(`/api/rules/test-draft${q}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rule, context }),
  });
  const json: ApiResponse<any> = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message || "Draft rule test failed");
  }
  return json.data;
}
