import React from "react";
import { useRouter } from "next/router";
import { Frame } from "@shopify/polaris";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const shop = router.query.shop ? String(router.query.shop) : "";
  const host = router.query.host ? String(router.query.host) : "";

  const withParams = (path: string) => {
    const params = new URLSearchParams();
    if (shop) params.append("shop", shop);
    if (host) params.append("host", host);
    const qs = params.toString();
    return qs ? `${path}?${qs}` : path;
  };

  return (
    <>
      {/* Shopify App Bridge Navigation: Moves navigation directly under 'Apps > smart discount' in Shopify Admin sidebar */}
      <ui-nav-menu>
        <a href="/app" rel="home">
          Home
        </a>
        <a href="/app/rules">Rules</a>
        <a href="/app/analytics">Analytics</a>
        <a href="/app/settings">Settings</a>
        <a href="/app/billing">Billing</a>
      </ui-nav-menu>

      <div className="min-h-screen bg-[#f6f6f7]">
        <Frame>
          <div className="pb-16">{children}</div>
        </Frame>
      </div>
    </>
  );
}
