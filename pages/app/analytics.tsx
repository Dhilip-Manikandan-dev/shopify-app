import React from "react";
import { useRouter } from "next/router";
import { Page } from "@shopify/polaris";
import { AnalyticsOverview } from "@/features/analytics";

export default function AnalyticsPage() {
  const router = useRouter();
  const shop = router.query.shop ? String(router.query.shop) : undefined;

  return (
    <Page fullWidth>
      <AnalyticsOverview shop={shop} />
    </Page>
  );
}
