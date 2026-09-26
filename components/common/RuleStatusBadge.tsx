import React from "react";
import { Badge } from "@shopify/polaris";
import { RuleStatus } from "@/lib/rule-engine/types";

interface RuleStatusBadgeProps {
  status: RuleStatus;
}

export function RuleStatusBadge({ status }: RuleStatusBadgeProps) {
  switch (status) {
    case "ACTIVE":
      return <Badge tone="success">Active</Badge>;
    case "DRAFT":
      return <Badge tone="info">Draft</Badge>;
    case "PAUSED":
      return <Badge tone="warning">Paused</Badge>;
    case "ARCHIVED":
      return <Badge tone="attention">Archived</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}
