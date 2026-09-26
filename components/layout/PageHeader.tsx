import React from "react";
import { Page, Action } from "@shopify/polaris";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backAction?: {
    content?: string;
    onAction: () => void;
  };
  primaryAction?: Action;
  secondaryActions?: Action[];
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  backAction,
  primaryAction,
  secondaryActions,
  children,
}: PageHeaderProps) {
  return (
    <Page
      title={title}
      subtitle={subtitle}
      backAction={backAction}
      primaryAction={primaryAction}
      secondaryActions={secondaryActions}
    >
      {children}
    </Page>
  );
}
