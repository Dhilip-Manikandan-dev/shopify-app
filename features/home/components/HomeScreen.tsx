import React, { useEffect, useState } from "react";
import {
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Banner,
  Divider,
  Grid,
  Badge,
} from "@shopify/polaris";
import { PlusIcon } from "@shopify/polaris-icons";
import { DashboardSummary } from "../types";
import { getDashboardSummary } from "../api";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";

interface HomeScreenProps {
  shop?: string;
  onNavigateRules: () => void;
  onNavigateCreateRule: () => void;
  onNavigateAnalytics: () => void;
  onNavigateSettings: () => void;
}

export function HomeScreen({
  shop,
  onNavigateRules,
  onNavigateCreateRule,
  onNavigateAnalytics,
  onNavigateSettings,
}: HomeScreenProps) {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const summary = await getDashboardSummary(shop);
      setData(summary);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard overview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [shop]);

  if (loading) {
    return <LoadingState message="Loading Smart Offer Rules overview..." />;
  }

  if (error || !data) {
    return (
      <ErrorState
        title="Dashboard Error"
        message={error || "Could not retrieve summary metrics."}
        onRetry={loadData}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Welcome Banner */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs uppercase tracking-widest text-indigo-300 font-bold">
            Smart Offer Rules Engine
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Drive More Sales with Automated Smart Offers
          </h1>
          <p className="text-sm text-indigo-200 max-w-xl">
            Trigger dynamic free shipping bars, order-level discounts, and one-click upsells across product, collection, and cart surfaces.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="primary"
            icon={PlusIcon}
            onClick={onNavigateCreateRule}
          >
            Create Rule
          </Button>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <Grid>
        <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3, lg: 3, xl: 3 }}>
          <Card>
            <BlockStack gap="200">
              <Text as="p" variant="bodySm" tone="subdued">
                Active Offer Rules
              </Text>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-gray-900">
                  {data.activeRulesCount}
                </span>
                <span className="text-xs text-gray-500">
                  / {data.totalRulesCount} total
                </span>
              </div>
              <Badge tone={data.activeRulesCount > 0 ? "success" : "attention"}>
                {data.activeRulesCount > 0 ? "Live on Store" : "No Active Rules"}
              </Badge>
            </BlockStack>
          </Card>
        </Grid.Cell>

        <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3, lg: 3, xl: 3 }}>
          <Card>
            <BlockStack gap="200">
              <Text as="p" variant="bodySm" tone="subdued">
                Rules Triggered (Storefront)
              </Text>
              <span className="text-3xl font-extrabold text-gray-900">
                {data.eventsSummary.triggeredCount.toLocaleString()}
              </span>
              <Text as="p" variant="bodyXs" tone="subdued">
                Evaluated across active shopper sessions
              </Text>
            </BlockStack>
          </Card>
        </Grid.Cell>

        <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3, lg: 3, xl: 3 }}>
          <Card>
            <BlockStack gap="200">
              <Text as="p" variant="bodySm" tone="subdued">
                Upsell Impressions
              </Text>
              <span className="text-3xl font-extrabold text-gray-900">
                {data.eventsSummary.upsellViewedCount.toLocaleString()}
              </span>
              <Text as="p" variant="bodyXs" tone="subdued">
                Seen on product & cart drawers
              </Text>
            </BlockStack>
          </Card>
        </Grid.Cell>

        <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3, lg: 3, xl: 3 }}>
          <Card>
            <BlockStack gap="200">
              <Text as="p" variant="bodySm" tone="subdued">
                Upsell Conversion Rate
              </Text>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-indigo-600">
                  {data.eventsSummary.conversionRate}%
                </span>
                <span className="text-xs text-gray-500">
                  ({data.eventsSummary.upsellAddedCount} converted)
                </span>
              </div>
              <Text as="p" variant="bodyXs" tone="subdued">
                Offers accepted into cart
              </Text>
            </BlockStack>
          </Card>
        </Grid.Cell>
      </Grid>

      {/* Setup Checklist */}
      <Card>
        <BlockStack gap="400">
          <InlineStack align="space-between">
            <div>
              <Text as="h2" variant="headingMd">
                Quick Setup Checklist
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Ensure your store is primed to maximize average order value (AOV).
              </Text>
            </div>
            <Button variant="plain" onClick={onNavigateSettings}>
              Store Settings
            </Button>
          </InlineStack>
          <Divider />

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-3">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    data.checklist.hasActiveRules
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {data.checklist.hasActiveRules ? "✓" : "1"}
                </span>
                <div>
                  <div className="font-semibold text-sm text-gray-900">
                    Create and activate your first offer rule
                  </div>
                  <div className="text-xs text-gray-500">
                    Set conditions such as minimum cart subtotal or customer VIP tags.
                  </div>
                </div>
              </div>
              {!data.checklist.hasActiveRules && (
                <Button size="micro" variant="primary" onClick={onNavigateCreateRule}>
                  Add Rule
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-emerald-100 text-emerald-700">
                  ✓
                </span>
                <div>
                  <div className="font-semibold text-sm text-gray-900">
                    Theme App Extension Blocks
                  </div>
                  <div className="text-xs text-gray-500">
                    Liquid blocks (Product Upsell, Cart Upsell, Free Shipping) are ready for theme embedding.
                  </div>
                </div>
              </div>
              <Badge tone="success">Ready</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-indigo-100 text-indigo-700">
                  →
                </span>
                <div>
                  <div className="font-semibold text-sm text-gray-900">
                    Monitor performance & conversions
                  </div>
                  <div className="text-xs text-gray-500">
                    Review impression funnels and incremental revenue in Analytics.
                  </div>
                </div>
              </div>
              <Button size="micro" onClick={onNavigateAnalytics}>
                View Analytics
              </Button>
            </div>
          </div>
        </BlockStack>
      </Card>

      {/* Quick Navigation Footer */}
      <div className="flex justify-end gap-3">
        <Button onClick={onNavigateRules}>View All Rules</Button>
        <Button variant="primary" onClick={onNavigateCreateRule}>
          Create New Rule
        </Button>
      </div>
    </div>
  );
}
