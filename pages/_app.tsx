import React from "react";
import type { AppProps } from "next/app";
import { AppProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css";
import "@/styles/globals.css";
import { AppLayout } from "@/components/layout/AppLayout";

export default function MyApp({ Component, pageProps, router }: AppProps) {
  // If the path is /app or starts with /app/, wrap with AppLayout
  const isAppRoute = router.pathname.startsWith("/app");

  return (
    <AppProvider i18n={enTranslations}>
      {isAppRoute ? (
        <AppLayout>
          <Component {...pageProps} />
        </AppLayout>
      ) : (
        <Component {...pageProps} />
      )}
    </AppProvider>
  );
}
