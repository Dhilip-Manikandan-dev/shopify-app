import React from "react";
import { useRouter } from "next/router";
import { Page, Button } from "@shopify/polaris";
import { PlusIcon } from "@shopify/polaris-icons";
import { RuleList } from "@/features/rules";

export default function RulesPage() {
  const router = useRouter();
  const shop = router.query.shop ? String(router.query.shop) : undefined;

  const navigateWithShop = (path: string) => {
    const q = shop ? `?shop=${encodeURIComponent(shop)}` : "";
    router.push(`${path}${q}`);
  };

  return (
    <Page
      title="Offer Rules"
      subtitle="Manage intelligent condition rules for free shipping, discounts, and upsells."
      primaryAction={{
        content: "Create Rule",
        icon: PlusIcon,
        onAction: () => navigateWithShop("/app/rules/new"),
      }}
    >
      <RuleList
        shop={shop}
        onNavigateCreate={() => navigateWithShop("/app/rules/new")}
        onNavigateEdit={(ruleId) => navigateWithShop(`/app/rules/${ruleId}`)}
        onNavigateTest={(ruleId) => navigateWithShop(`/app/rules/${ruleId}/test`)}
      />
    </Page>
  );
}
