import React from "react";
import { Banner, Button } from "@shopify/polaris";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Error",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="p-4">
      <Banner title={title} tone="critical">
        <p className="mb-3">{message}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="plain">
            Try Again
          </Button>
        )}
      </Banner>
    </div>
  );
}
