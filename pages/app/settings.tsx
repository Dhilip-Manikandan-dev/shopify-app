import React from "react";
import { useRouter } from "next/router";
import { Page } from "@shopify/polaris";
import { SettingsScreen } from "@/features/settings";

export default function SettingsPage() {
  const router = useRouter();
  const shop = router.query.shop ? String(router.query.shop) : undefined;

  return (
    <Page fullWidth>
      <SettingsScreen shop={shop} />
    </Page>
  );
}
