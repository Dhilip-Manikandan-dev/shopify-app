import React, { useEffect, useState } from "react";
import {
  Card,
  BlockStack,
  InlineStack,
  TextField,
  Select,
  Button,
  Banner,
  Text,
  Divider,
} from "@shopify/polaris";
import { StoreSettings } from "../types";
import { getSettings, updateSettings } from "../api";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";

interface SettingsScreenProps {
  shop?: string;
}

const COUNTRY_OPTIONS = [
  { label: "India (IN)", value: "IN" },
  { label: "United States (US)", value: "US" },
  { label: "United Kingdom (GB)", value: "GB" },
  { label: "Canada (CA)", value: "CA" },
  { label: "Australia (AU)", value: "AU" },
  { label: "Germany (DE)", value: "DE" },
  { label: "France (FR)", value: "FR" },
];

export function SettingsScreen({ shop }: SettingsScreenProps) {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getSettings(shop);
      setSettings(res);
    } catch (err: any) {
      setError(err.message || "Failed to load store settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [shop]);

  const handleSave = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      const updated = await updateSettings(
        {
          domesticCountry: settings.domesticCountry,
          currency: settings.currency,
        },
        shop
      );
      setSettings(updated);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading store configuration..." />;
  }

  if (error && !settings) {
    return (
      <ErrorState
        title="Settings Error"
        message={error}
        onRetry={loadData}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <Text as="h1" variant="headingLg">
          Store Settings
        </Text>
        <Text as="p" variant="bodySm" tone="subdued">
          Manage localization and domestic region targeting for Smart Offer Rules.
        </Text>
      </div>

      {success && (
        <Banner title="Settings saved successfully" tone="success" onDismiss={() => setSuccess(false)}>
          <p>Your store rules configuration has been updated.</p>
        </Banner>
      )}

      {error && (
        <Banner title="Error" tone="critical" onDismiss={() => setError(null)}>
          <p>{error}</p>
        </Banner>
      )}

      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            Localization & Domestic Classification
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            When rule conditions evaluate <code>location.isDomestic</code> or <code>location.isInternational</code>,
            this country code defines your domestic market.
          </Text>
          <Divider />

          <Select
            label="Domestic Country"
            options={COUNTRY_OPTIONS}
            value={settings?.domesticCountry || "IN"}
            onChange={(val) =>
              setSettings((prev) => (prev ? { ...prev, domesticCountry: val } : null))
            }
            helpText="Orders originating from this country will match domestic location conditions."
          />

          <TextField
            label="Default Currency Code"
            value={settings?.currency || "INR"}
            onChange={(val) =>
              setSettings((prev) =>
                prev ? { ...prev, currency: val.toUpperCase() } : null
              )
            }
            helpText="ISO currency symbol used for pricing display (e.g., INR, USD, EUR)."
            autoComplete="off"
          />

          <TextField
            label="Connected Shop Domain"
            value={settings?.shop || ""}
            disabled
            helpText="Your primary myshopify.com domain."
            autoComplete="off"
          />
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            Theme App Extension Setup
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Smart Offer Rules includes 4 pre-built Liquid blocks in the Shopify Theme Editor:
          </Text>
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
            <li><strong>Smart Product Upsell:</strong> Recommended for the Main Product template.</li>
            <li><strong>Smart Collection Offer:</strong> Recommended for Collection banner sections.</li>
            <li><strong>Smart Cart Upsell:</strong> Recommended for Cart Drawer / Cart page.</li>
            <li><strong>Free Shipping Progress:</strong> Dynamic live shipping threshold bar.</li>
          </ul>
        </BlockStack>
      </Card>

      <div className="flex justify-end">
        <Button variant="primary" loading={saving} onClick={handleSave}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}
