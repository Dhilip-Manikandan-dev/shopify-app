import React from "react";
import { useRouter } from "next/router";
import { Page } from "@shopify/polaris";
import { RuleBuilder, createRule, RuleFormData } from "@/features/rules";

export default function NewRulePage() {
  const router = useRouter();
  const shop = router.query.shop ? String(router.query.shop) : undefined;

  const navigateBack = () => {
    const q = shop ? `?shop=${encodeURIComponent(shop)}` : "";
    router.push(`/app/rules${q}`);
  };

  const handleSave = async (data: RuleFormData) => {
    await createRule(data, shop);
    navigateBack();
  };

  return (
    <Page
      backAction={{ content: "Rules", onAction: navigateBack }}
      title="Create Offer Rule"
      subtitle="Define conditions, triggers, and multiple action outcomes (shipping, discounts, and upsells)."
    >
      <RuleBuilder
        onSave={handleSave}
        onCancel={navigateBack}
        shop={shop}
      />
    </Page>
  );
}
