import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta
          name="shopify-api-key"
          content={
            process.env.NEXT_PUBLIC_SHOPIFY_API_KEY ||
            process.env.SHOPIFY_API_KEY ||
            "7e85134af63924377475a90a3d0924cd"
          }
        />
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body className="antialiased bg-gray-50 text-gray-900 font-sans">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
