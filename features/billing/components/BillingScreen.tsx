import React, { useEffect, useState } from "react";
import {
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Banner,
  Badge,
  Grid,
  Divider,
} from "@shopify/polaris";
import { SubscriptionStatus, SubscriptionPlan, PlanDetail } from "../types";
import { getSubscription, subscribePlan } from "../api";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";

interface BillingScreenProps {
  shop?: string;
}

const PLANS: PlanDetail[] = [
  {
    id: "FREE",
    name: "Free Tier",
    price: 0,
    features: [
      "Up to 3 active offer rules",
      "Cart & Product page upsells",
      "Free shipping progress bar",
      "Standard community support",
    ],
  },
  {
    id: "STARTER",
    name: "Starter Growth",
    price: 19,
    recommended: true,
    features: [
      "Unlimited active offer rules",
      "VIP customer tag targeting",
      "Cart Drawer, Product, & Collection offers",
      "Analytics & Conversion funnels",
      "Priority email support",
    ],
  },
  {
    id: "GROWTH",
    name: "Scale / Pro",
    price: 49,
    features: [
      "Everything in Starter",
      "Shopify Functions Checkout discounts",
      "Advanced A/B rule priorities",
      "Multi-currency & domestic auto-targeting",
      "Dedicated account manager",
    ],
  },
];

export function BillingScreen({ shop }: BillingScreenProps) {
  const [sub, setSub] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getSubscription(shop);
      setSub(res);
    } catch (err: any) {
      setError(err.message || "Failed to load subscription details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [shop]);

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (sub?.plan === plan) return;
    try {
      setSubscribing(plan);
      setError(null);
      const res = await subscribePlan(plan, shop);
      if (res.confirmationUrl) {
        window.open(res.confirmationUrl, "_top");
      }
    } catch (err: any) {
      setError(err.message || "Failed to initiate subscription upgrade");
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) {
    return <LoadingState message="Checking billing and subscription tier..." />;
  }

  if (error && !sub) {
    return (
      <ErrorState
        title="Billing Error"
        message={error}
        onRetry={loadData}
      />
    );
  }

  const currentPlan = sub?.plan || "FREE";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <Text as="h1" variant="headingLg">
          Plans & Billing
        </Text>
        <Text as="p" variant="bodySm" tone="subdued">
          Select the right plan to scale your average order value and upsell revenue.
        </Text>
      </div>

      {error && (
        <Banner title="Subscription Error" tone="critical" onDismiss={() => setError(null)}>
          <p>{error}</p>
        </Banner>
      )}

      <Grid>
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          return (
            <Grid.Cell
              key={plan.id}
              columnSpan={{ xs: 6, sm: 6, md: 4, lg: 4, xl: 4 }}
            >
              <div
                className={`h-full flex flex-col justify-between rounded-xl border p-6 transition-all shadow-sm ${
                  plan.recommended
                    ? "border-indigo-500 bg-white ring-2 ring-indigo-500/20"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-lg text-gray-900">
                      {plan.name}
                    </span>
                    {plan.recommended && (
                      <Badge tone="success">Recommended</Badge>
                    )}
                    {isCurrent && <Badge tone="info">Active Plan</Badge>}
                  </div>

                  <div className="flex items-baseline gap-1 my-4">
                    <span className="text-4xl font-extrabold text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-sm text-gray-500">/ month</span>
                  </div>

                  <Divider />

                  <ul className="mt-4 space-y-2.5 text-sm text-gray-600">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-indigo-600 font-bold">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  <Button
                    variant={plan.recommended ? "primary" : "secondary"}
                    fullWidth
                    disabled={isCurrent}
                    loading={subscribing === plan.id}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {isCurrent
                      ? "Current Plan"
                      : plan.price === 0
                      ? "Downgrade to Free"
                      : `Upgrade to ${plan.name}`}
                  </Button>
                </div>
              </div>
            </Grid.Cell>
          );
        })}
      </Grid>
    </div>
  );
}
