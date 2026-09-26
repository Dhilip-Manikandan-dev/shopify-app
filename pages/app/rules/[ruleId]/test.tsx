import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Page, Card, Text, BlockStack } from "@shopify/polaris";
import { RuleTester, getRule, RuleDefinition } from "@/features/rules";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";

export default function TestRulePage() {
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

  if (loading) {
    return (
      <Page backAction={{ content: "Rules", onAction: navigateBack }} title="Test Rule">
        <LoadingState message="Loading rule for simulation..." />
      </Page>
    );
  }

  if (error || !rule) {
    return (
      <Page backAction={{ content: "Rules", onAction: navigateBack }} title="Test Rule">
        <ErrorState
          title="Rule Not Found"
          message={error || "Could not retrieve the rule to test."}
          onRetry={loadRule}
        />
      </Page>
    );
  }

  return (
    <Page
      backAction={{ content: "Rules", onAction: navigateBack }}
      title={`Simulate: ${rule.name}`}
      subtitle="Inspect condition evaluations in real-time with sample customer and cart contexts."
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <BlockStack gap="200">
            <Text as="h2" variant="headingMd">
              Rule Overview
            </Text>
            <p className="text-sm text-gray-600">
              Priority: <strong>#{rule.priority}</strong> &bull; Status:{" "}
              <strong>{rule.status}</strong> &bull; Condition Groups:{" "}
              <strong>{rule.groups.length}</strong>
            </p>
          </BlockStack>
        </Card>

        <RuleTester ruleId={rule.id} shop={shop} />
      </div>
    </Page>
  );
}
