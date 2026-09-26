import React from "react";
import { EmptyState as PolarisEmptyState } from "@shopify/polaris";

interface EmptyStateProps {
  heading: string;
  action?: {
    content: string;
    onAction: () => void;
  };
  image?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  heading,
  action,
  image = "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png",
  children,
}: EmptyStateProps) {
  return (
    <PolarisEmptyState heading={heading} action={action} image={image}>
      {children}
    </PolarisEmptyState>
  );
}
