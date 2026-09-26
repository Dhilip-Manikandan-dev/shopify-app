import React from "react";
import { useRouter } from "next/router";
import { Page } from "@shopify/polaris";
import { BillingScreen } from "@/features/billing";

export default function BillingPage() {
  const router = useRouter();
  const shop = router.query.shop ? String(router.query.shop) : undefined;

  return (
    <Page fullWidth>
      <BillingScreen shop={shop} />
    </Page>
  );
}
