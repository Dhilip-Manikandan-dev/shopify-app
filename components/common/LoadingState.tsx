import React from "react";
import { Spinner, Text } from "@shopify/polaris";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <Spinner accessibilityLabel="Loading" size="large" />
      <Text as="p" variant="bodyMd" tone="subdued">
        {message}
      </Text>
    </div>
  );
}
