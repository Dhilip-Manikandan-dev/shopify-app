import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Page } from "@shopify/polaris";
import {
  RuleBuilder,
  getRule,
  updateRule,
  RuleFormData,
  RuleDefinition,
} from "@/features/rules";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";

export default function EditRulePage() {
  const router = useRouter();
  const { ruleId, shop: queryShop } = router.query;
  const shop = queryShop ? String(queryShop) : undefined;

  const [rule, setRule] = useState<RuleDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigateBack = () => {
    const q = shop ? `?shop=${encodeURIComponent(shop)}` : "";
    router.push(`/app/rules${q}`);
  };

  const loadRule = async () => {
    if (!ruleId || typeof ruleId !== "string") return;
    try {
      setLoading(true);
      setError(null);
      const data = await getRule(ruleId, shop);
      setRule(data);
    } catch (err: any) {
      setError(err.message || "Failed to load rule");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (router.isReady && ruleId) {
      loadRule();
    }
  }, [router.isReady, ruleId, shop]);

  const handleSave = async (data: RuleFormData) => {
    if (!ruleId || typeof ruleId !== "string") return;
    await updateRule(ruleId, data, shop);
    navigateBack();
  };

  if (loading) {
    return (
      <Page backAction={{ content: "Rules", onAction: navigateBack }} title="Edit Rule">
        <LoadingState message="Loading offer rule definition..." />
      </Page>
    );
  }

  if (error || !rule) {
    return (
      <Page backAction={{ content: "Rules", onAction: navigateBack }} title="Edit Rule">
        <ErrorState
          title="Rule Not Found"
          message={error || "Could not retrieve the specified rule."}
          onRetry={loadRule}
        />
      </Page>
    );
  }

  const initialFormData: Partial<RuleFormData> = {
    id: rule.id,
    name: rule.name,
    description: rule.description || "",
    status: rule.status,
    priority: rule.priority,
    startAt: rule.startAt ? String(rule.startAt) : undefined,
    endAt: rule.endAt ? String(rule.endAt) : undefined,
    groups: rule.groups,
    actions: rule.actions,
    upsells: rule.upsells,
    display: rule.display || {
      productPage: true,
      collectionPage: false,
      cartPage: true,
    },
  };

  return (
    <Page
      backAction={{ content: "Rules", onAction: navigateBack }}
      title={`Edit Rule: ${rule.name}`}
      subtitle="Modify triggers, conditions, and action outcomes."
    >
      <RuleBuilder
        initialData={initialFormData}
        isEditing
        onSave={handleSave}
        onCancel={navigateBack}
        shop={shop}
      />
    </Page>
  );
}
