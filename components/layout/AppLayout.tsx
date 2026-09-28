import React from "react";
import { useRouter } from "next/router";
import { Frame, Navigation } from "@shopify/polaris";
import {
  HomeIcon,
  OrderIcon,
  ChartLineIcon,
  SettingsIcon,
  PaymentIcon,
} from "@shopify/polaris-icons";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const currentPath = router.pathname;
  const shop = router.query.shop ? String(router.query.shop) : "";

  const navigateTo = (path: string) => {
    const url = shop ? `${path}?shop=${encodeURIComponent(shop)}` : path;
    router.push(url);
  };

  const navigationMarkup = (
    <Navigation location={currentPath}>
      <Navigation.Section
        items={[
          {
            label: "Home",
            icon: HomeIcon,
            selected: currentPath === "/app",
            onClick: () => navigateTo("/app"),
          },
          {
            label: "Rules",
            icon: OrderIcon,
            selected: currentPath.startsWith("/app/rules"),
            onClick: () => navigateTo("/app/rules"),
          },
          {
            label: "Analytics",
            icon: ChartLineIcon,
            selected: currentPath === "/app/analytics",
            onClick: () => navigateTo("/app/analytics"),
          },
          {
            label: "Settings",
            icon: SettingsIcon,
            selected: currentPath === "/app/settings",
            onClick: () => navigateTo("/app/settings"),
          },
          {
            label: "Billing",
            icon: PaymentIcon,
            selected: currentPath === "/app/billing",
            onClick: () => navigateTo("/app/billing"),
          },
        ]}
      />
    </Navigation>
  );

  return (
    <div className="min-h-screen bg-[#f6f6f7]">
      <Frame navigation={navigationMarkup}>
        <div className="pb-16">{children}</div>
      </Frame>
    </div>
  );
}
