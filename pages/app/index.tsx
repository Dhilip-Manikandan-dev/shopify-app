import React from "react";
import { useRouter } from "next/router";
import { Page } from "@shopify/polaris";
import { HomeScreen } from "@/features/home";

export default function AppPage() {
  const router = useRouter();
  const shop = router.query.shop ? String(router.query.shop) : undefined;

  const navigateWithShop = (path: string) => {
    const q = shop ? `?shop=${encodeURIComponent(shop)}` : "";
    router.push(`${path}${q}`);
  };

  return (
    <Page fullWidth>
      <HomeScreen
        shop={shop}
        onNavigateRules={() => navigateWithShop("/app/rules")}
        onNavigateCreateRule={() => navigateWithShop("/app/rules/new")}
        onNavigateAnalytics={() => navigateWithShop("/app/analytics")}
        onNavigateSettings={() => navigateWithShop("/app/settings")}
      />
    </Page>
  );
}
