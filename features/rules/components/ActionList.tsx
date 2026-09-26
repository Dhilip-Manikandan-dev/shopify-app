import React from "react";
import { Card, Select, TextField, Checkbox, Text, Divider } from "@shopify/polaris";
import { UpsellConfig } from "./UpsellConfig";
import { ActionDefinition, ShippingActionConfig, DiscountActionConfig, UpsellItemConfig } from "@/lib/rule-engine/types";

interface ActionListProps {
  actions: ActionDefinition[];
  upsells: UpsellItemConfig[];
  onActionsChange: (actions: ActionDefinition[]) => void;
  onUpsellsChange: (upsells: UpsellItemConfig[]) => void;
  shop?: string;
}

export function ActionList({
  actions,
  upsells,
  onActionsChange,
  onUpsellsChange,
  shop,
}: ActionListProps) {
  // Check active action types
  const hasShipping = actions.some((a) => a.type === "SHIPPING");
  const hasDiscount = actions.some((a) => a.type === "DISCOUNT");
  const hasUpsell = actions.some((a) => a.type === "UPSELL");

  const shippingAction = actions.find((a) => a.type === "SHIPPING");
  const shippingConfig = (shippingAction?.configuration || {
    subType: "FREE",
    scope: "ALL",
    freeShippingThreshold: 3000,
  }) as ShippingActionConfig;

  const discountAction = actions.find((a) => a.type === "DISCOUNT");
  const discountConfig = (discountAction?.configuration || {
    discountType: "PERCENTAGE",
    value: 10,
    title: "10% Order Discount",
  }) as DiscountActionConfig;

  const toggleActionType = (type: "SHIPPING" | "DISCOUNT" | "UPSELL", enabled: boolean) => {
    if (enabled) {
      if (type === "SHIPPING") {
        onActionsChange([
          ...actions,
          {
            type: "SHIPPING",
            position: actions.length,
            configuration: { subType: "FREE", scope: "ALL", freeShippingThreshold: 3000 },
          },
        ]);
      } else if (type === "DISCOUNT") {
        onActionsChange([
          ...actions,
          {
            type: "DISCOUNT",
            position: actions.length,
            configuration: { discountType: "PERCENTAGE", value: 10, title: "10% Discount" },
          },
        ]);
      } else if (type === "UPSELL") {
        onActionsChange([
          ...actions,
          {
            type: "UPSELL",
            position: actions.length,
            configuration: {},
          },
        ]);
      }
    } else {
      onActionsChange(actions.filter((a) => a.type !== type));
    }
  };

  const updateShippingConfig = (patch: Partial<ShippingActionConfig>) => {
    onActionsChange(
      actions.map((a) =>
        a.type === "SHIPPING"
          ? { ...a, configuration: { ...shippingConfig, ...patch } }
          : a
      )
    );
  };

  const updateDiscountConfig = (patch: Partial<DiscountActionConfig>) => {
    onActionsChange(
      actions.map((a) =>
        a.type === "DISCOUNT"
          ? { ...a, configuration: { ...discountConfig, ...patch } }
          : a
      )
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="space-y-4">
          <Text as="h3" variant="headingSm">
            Select Offer Actions
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Choose what happens when the rule conditions match (One Rule Engine USP)
          </Text>

          <div className="flex flex-col gap-3 pt-2">
            <Checkbox
              label="1. Shipping Offer (Free shipping / delivery discount)"
              checked={hasShipping}
              onChange={(c) => toggleActionType("SHIPPING", c)}
            />
            <Checkbox
              label="2. Discount Offer (Order-level percentage or fixed discount)"
              checked={hasDiscount}
              onChange={(c) => toggleActionType("DISCOUNT", c)}
            />
            <Checkbox
              label="3. Upsell Offer (Frequently Bought Together / Cross-sells)"
              checked={hasUpsell}
              onChange={(c) => toggleActionType("UPSELL", c)}
            />
          </div>
        </div>
      </Card>

      {/* Shipping Configuration */}
      {hasShipping && (
        <Card>
          <div className="space-y-4">
            <Text as="h3" variant="headingSm">
              Shipping Offer Configuration
            </Text>
            <Divider />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Offer Type"
                options={[
                  { label: "Free Shipping", value: "FREE" },
                  { label: "Percentage Shipping Discount", value: "PERCENTAGE_DISCOUNT" },
                  { label: "Fixed Shipping Discount", value: "FIXED_DISCOUNT" },
                ]}
                value={shippingConfig.subType || "FREE"}
                onChange={(val) => updateShippingConfig({ subType: val as any })}
              />

              <Select
                label="Eligible Region"
                options={[
                  { label: "All Orders (Global)", value: "ALL" },
                  { label: "Domestic Orders Only", value: "DOMESTIC" },
                  { label: "International Orders Only", value: "INTERNATIONAL" },
                ]}
                value={shippingConfig.scope || "ALL"}
                onChange={(val) => updateShippingConfig({ scope: val as any })}
              />

              <TextField
                label="Free Shipping Target Threshold (₹)"
                type="number"
                value={String(shippingConfig.freeShippingThreshold ?? 0)}
                onChange={(val) =>
                  updateShippingConfig({ freeShippingThreshold: parseFloat(val) || 0 })
                }
                helpText="Powers the storefront Free Shipping Progress Bar"
                autoComplete="off"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Discount Configuration */}
      {hasDiscount && (
        <Card>
          <div className="space-y-4">
            <Text as="h3" variant="headingSm">
              Order Discount Configuration
            </Text>
            <Divider />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Discount Type"
                options={[
                  { label: "Percentage Off (%)", value: "PERCENTAGE" },
                  { label: "Fixed Amount Off (₹)", value: "FIXED" },
                ]}
                value={discountConfig.discountType || "PERCENTAGE"}
                onChange={(val) => updateDiscountConfig({ discountType: val as any })}
              />

              <TextField
                label="Discount Amount"
                type="number"
                value={String(discountConfig.value || 0)}
                onChange={(val) => updateDiscountConfig({ value: parseFloat(val) || 0 })}
                autoComplete="off"
              />

              <TextField
                label="Promotional Label"
                value={discountConfig.title || ""}
                onChange={(val) => updateDiscountConfig({ title: val })}
                placeholder="e.g. VIP Member 10% Off"
                autoComplete="off"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Upsell Configuration */}
      {hasUpsell && (
        <UpsellConfig upsells={upsells} onChange={onUpsellsChange} shop={shop} />
      )}
    </div>
  );
}
