import React, { useEffect, useState } from "react";
import {
  Card,
  BlockStack,
  InlineStack,
  Text,
  Grid,
  Select,
  Divider,
  ProgressBar,
  IndexTable,
  Badge,
} from "@shopify/polaris";
import { AnalyticsData } from "../types";
import { getAnalytics } from "../api";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";

interface AnalyticsOverviewProps {
  shop?: string;
}

export function AnalyticsOverview({ shop }: AnalyticsOverviewProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState("30");

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAnalytics(shop, parseInt(days, 10));
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [shop, days]);

  if (loading) {
    return <LoadingState message="Aggregating storefront performance data..." />;
  }

  if (error || !data) {
    return (
      <ErrorState
        title="Analytics Error"
        message={error || "Failed to retrieve analytics."}
        onRetry={loadData}
      />
    );
  }

  const eventsSummary = data?.eventsSummary || {};
  const triggered = eventsSummary.RULE_TRIGGERED || 0;
  const viewed = eventsSummary.UPSELL_VIEWED || 0;
  const clicked = eventsSummary.UPSELL_CLICKED || 0;
  const added = eventsSummary.UPSELL_ADDED || 0;

  const clickRate = viewed > 0 ? ((clicked / viewed) * 100).toFixed(1) : "0.0";
  const conversionRate = viewed > 0 ? ((added / viewed) * 100).toFixed(1) : "0.0";
  const rulePerformance = data?.rulePerformance || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header controls */}
      <div className="flex items-center justify-between">
        <div>
          <Text as="h1" variant="headingLg">
            Performance & Analytics
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Real-time conversion metrics and storefront engagement.
          </Text>
        </div>
        <div className="w-48">
          <Select
            label="Time Range"
            labelHidden
            options={[
              { label: "Last 7 days", value: "7" },
              { label: "Last 30 days", value: "30" },
              { label: "Last 90 days", value: "90" },
            ]}
            value={days}
            onChange={(val) => setDays(val)}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <Grid>
        <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3, lg: 3, xl: 3 }}>
          <Card>
            <BlockStack gap="100">
              <Text as="p" variant="bodySm" tone="subdued">
                Rules Triggered
              </Text>
              <span className="text-3xl font-extrabold text-gray-900">
                {triggered.toLocaleString()}
              </span>
              <Text as="p" variant="bodyXs" tone="subdued">
                Conditions successfully satisfied
              </Text>
            </BlockStack>
          </Card>
        </Grid.Cell>

        <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3, lg: 3, xl: 3 }}>
          <Card>
            <BlockStack gap="100">
              <Text as="p" variant="bodySm" tone="subdued">
                Offer Impressions
              </Text>
              <span className="text-3xl font-extrabold text-gray-900">
                {viewed.toLocaleString()}
              </span>
              <Text as="p" variant="bodyXs" tone="subdued">
                Total storefront upsell views
              </Text>
            </BlockStack>
          </Card>
        </Grid.Cell>

        <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3, lg: 3, xl: 3 }}>
          <Card>
            <BlockStack gap="100">
              <Text as="p" variant="bodySm" tone="subdued">
                Clicks & Interactions
              </Text>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-gray-900">
                  {clicked.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-indigo-600">
                  ({clickRate}%)
                </span>
              </div>
              <Text as="p" variant="bodyXs" tone="subdued">
                Shoppers engaging with offers
              </Text>
            </BlockStack>
          </Card>
        </Grid.Cell>

        <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3, lg: 3, xl: 3 }}>
          <Card>
            <BlockStack gap="100">
              <Text as="p" variant="bodySm" tone="subdued">
                Added to Cart (Converted)
              </Text>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-600">
                  {added.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-emerald-700">
                  ({conversionRate}%)
                </span>
              </div>
              <Text as="p" variant="bodyXs" tone="subdued">
                Incremental cart additions
              </Text>
            </BlockStack>
          </Card>
        </Grid.Cell>
      </Grid>

      {/* Conversion Funnel */}
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            Offer Conversion Funnel
          </Text>
          <Divider />

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1 font-medium">
                <span>1. Offer Impressions (Viewed)</span>
                <span>{viewed.toLocaleString()} (100%)</span>
              </div>
              <ProgressBar progress={100} size="small" tone="primary" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1 font-medium">
                <span>2. Offer Interactions (Clicked)</span>
                <span>
                  {clicked.toLocaleString()} ({clickRate}%)
                </span>
              </div>
              <ProgressBar
                progress={viewed > 0 ? Math.round((clicked / viewed) * 100) : 0}
                size="small"
                tone="highlight"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1 font-medium">
                <span>3. Upsell Added to Cart</span>
                <span>
                  {added.toLocaleString()} ({conversionRate}%)
                </span>
              </div>
              <ProgressBar
                progress={viewed > 0 ? Math.round((added / viewed) * 100) : 0}
                size="small"
                tone="success"
              />
            </div>
          </div>
        </BlockStack>
      </Card>

      {/* Rule Breakdown Table */}
      <Card padding="0">
        <div className="p-4 border-b border-gray-100">
          <Text as="h2" variant="headingMd">
            Rule-by-Rule Breakdown
          </Text>
        </div>
        {rulePerformance.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No storefront interactions recorded for active rules yet.
          </div>
        ) : (
          <IndexTable
            resourceName={{ singular: "rule", plural: "rules" }}
            itemCount={rulePerformance.length}
            headings={[
              { title: "Rule" },
              { title: "Triggered" },
              { title: "Impressions" },
              { title: "Converted" },
              { title: "Conversion Rate" },
            ]}
            selectable={false}
          >
            {rulePerformance.map((item, idx) => {
              const ruleTriggered = item.events?.RULE_TRIGGERED || 0;
              const ruleViewed = item.events?.UPSELL_VIEWED || 0;
              const ruleAdded = item.events?.UPSELL_ADDED || 0;
              const rate =
                ruleViewed > 0
                  ? `${((ruleAdded / ruleViewed) * 100).toFixed(1)}%`
                  : "0.0%";

              const rId = item.ruleId || (item as any).id || String(idx);
              const rName = item.ruleName || (item as any).name || "Rule";

              return (
                <IndexTable.Row id={rId} key={rId} position={idx}>
                  <IndexTable.Cell>
                    <span className="font-semibold text-gray-900">
                      {rName}
                    </span>
                  </IndexTable.Cell>
                  <IndexTable.Cell>{ruleTriggered.toLocaleString()}</IndexTable.Cell>
                  <IndexTable.Cell>{ruleViewed.toLocaleString()}</IndexTable.Cell>
                  <IndexTable.Cell>{ruleAdded.toLocaleString()}</IndexTable.Cell>
                  <IndexTable.Cell>
                    <Badge tone={ruleAdded > 0 ? "success" : undefined}>
                      {rate}
                    </Badge>
                  </IndexTable.Cell>
                </IndexTable.Row>
              );
            })}
          </IndexTable>
        )}
      </Card>
    </div>
  );
}
