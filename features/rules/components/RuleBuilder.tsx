import React, { useState } from "react";
import {
  Card,
  TextField,
  Select,
  Button,
  Banner,
  InlineStack,
  BlockStack,
  Text,
  Divider,
  Checkbox,
  Grid,
} from "@shopify/polaris";
import { PlusIcon } from "@shopify/polaris-icons";
import { RuleFormData } from "../types";
import { ConditionGroup } from "./ConditionGroup";
import { ActionList } from "./ActionList";
import { RuleTester } from "./RuleTester";
import { RuleGroupDefinition, ActionDefinition, UpsellItemConfig, RuleStatus } from "@/lib/rule-engine/types";

interface RuleBuilderProps {
  initialData?: Partial<RuleFormData>;
  isEditing?: boolean;
  onSave: (data: RuleFormData) => Promise<void>;
  onCancel: () => void;
  shop?: string;
}

const DEFAULT_RULE_DATA: RuleFormData = {
  name: "",
  description: "",
  status: "DRAFT",
  priority: 10,
  groups: [
    {
      position: 0,
      conditions: [
        {
          field: "cart.subtotal",
          operator: "gte",
          value: 1000,
          valueType: "number",
          position: 0,
        },
      ],
    },
  ],
  actions: [
    {
      type: "SHIPPING",
      position: 0,
      configuration: {
        type: "FREE_SHIPPING",
        rateName: "Standard Free Shipping",
      },
    },
  ],
  upsells: [],
  display: {
    productPage: true,
    collectionPage: false,
    cartPage: true,
  },
};

export function RuleBuilder({
  initialData,
  isEditing = false,
  onSave,
  onCancel,
  shop,
}: RuleBuilderProps) {
  const [formData, setFormData] = useState<RuleFormData>({
    ...DEFAULT_RULE_DATA,
    ...initialData,
    display: {
      ...DEFAULT_RULE_DATA.display,
      ...(initialData?.display || {}),
    },
    groups:
      initialData?.groups && initialData.groups.length > 0
        ? initialData.groups
        : DEFAULT_RULE_DATA.groups,
    actions:
      initialData?.actions && initialData.actions.length > 0
        ? initialData.actions
        : DEFAULT_RULE_DATA.actions,
    upsells: initialData?.upsells || [],
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTester, setShowTester] = useState(false);

  const statusOptions = [
    { label: "Draft", value: "DRAFT" },
    { label: "Active", value: "ACTIVE" },
    { label: "Paused", value: "PAUSED" },
  ];

  // Group Handlers
  const handleAddGroup = () => {
    const newGroup: RuleGroupDefinition = {
      position: formData.groups.length,
      conditions: [
        {
          field: "customer.tags",
          operator: "contains",
          value: "VIP",
          valueType: "string",
          position: 0,
        },
      ],
    };
    setFormData((prev) => ({
      ...prev,
      groups: [...prev.groups, newGroup],
    }));
  };

  const handleUpdateGroup = (index: number, updated: RuleGroupDefinition) => {
    const nextGroups = [...formData.groups];
    nextGroups[index] = updated;
    setFormData((prev) => ({ ...prev, groups: nextGroups }));
  };

  const handleRemoveGroup = (index: number) => {
    const nextGroups = formData.groups.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, groups: nextGroups }));
  };

  // Actions and Upsells Handlers
  const handleActionsChange = (actions: ActionDefinition[]) => {
    setFormData((prev) => ({ ...prev, actions }));
  };

  const handleUpsellsChange = (upsells: UpsellItemConfig[]) => {
    setFormData((prev) => ({ ...prev, upsells }));
  };

  const handleSave = async () => {
    setError(null);
    if (!formData.name.trim()) {
      setError("Please provide a name for this rule.");
      return;
    }

    if (formData.groups.length === 0) {
      setError("At least one condition group is required.");
      return;
    }

    const emptyGroup = formData.groups.find((g) => g.conditions.length === 0);
    if (emptyGroup) {
      setError("Each condition group must have at least one condition.");
      return;
    }

    if (formData.actions.length === 0 && formData.upsells.length === 0) {
      setError("At least one action (Shipping/Discount) or Upsell offer is required.");
      return;
    }

    try {
      setSaving(true);
      await onSave(formData);
    } catch (err: any) {
      setError(err.message || "An error occurred while saving the rule.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {error && (
        <Banner title="Validation Error" tone="critical" onDismiss={() => setError(null)}>
          <p>{error}</p>
        </Banner>
      )}

      {/* Basic Settings */}
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            Rule Details
          </Text>
          <Divider />
          <Grid>
            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 8, xl: 8 }}>
              <TextField
                label="Rule Name"
                value={formData.name}
                onChange={(val) => setFormData((prev) => ({ ...prev, name: val }))}
                placeholder="e.g., Free Shipping & VIP Upsell on Orders Over ₹1,000"
                autoComplete="off"
              />
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3, lg: 2, xl: 2 }}>
              <Select
                label="Status"
                options={statusOptions}
                value={formData.status}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, status: val as RuleStatus }))
                }
              />
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3, lg: 2, xl: 2 }}>
              <TextField
                label="Priority"
                type="number"
                value={String(formData.priority)}
                onChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    priority: parseInt(val, 10) || 1,
                  }))
                }
                helpText="1 is highest"
                autoComplete="off"
              />
            </Grid.Cell>
          </Grid>

          <TextField
            label="Internal Description / Note"
            value={formData.description}
            onChange={(val) => setFormData((prev) => ({ ...prev, description: val }))}
            placeholder="Optional internal notes for staff"
            multiline={2}
            autoComplete="off"
          />

          <InlineStack gap="400">
            <TextField
              label="Start Date (Optional)"
              type="date"
              value={formData.startAt ? formData.startAt.slice(0, 10) : ""}
              onChange={(val) =>
                setFormData((prev) => ({
                  ...prev,
                  startAt: val ? new Date(val).toISOString() : undefined,
                }))
              }
              autoComplete="off"
            />
            <TextField
              label="End Date (Optional)"
              type="date"
              value={formData.endAt ? formData.endAt.slice(0, 10) : ""}
              onChange={(val) =>
                setFormData((prev) => ({
                  ...prev,
                  endAt: val ? new Date(val).toISOString() : undefined,
                }))
              }
              autoComplete="off"
            />
          </InlineStack>
        </BlockStack>
      </Card>

      {/* Surface Display Settings */}
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            Display Surfaces
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Choose where eligible upsell widgets and offer badges appear in your storefront.
          </Text>
          <Divider />
          <InlineStack gap="600">
            <Checkbox
              label="Product Page"
              checked={formData.display.productPage}
              onChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  display: { ...prev.display, productPage: checked },
                }))
              }
            />
            <Checkbox
              label="Collection Page"
              checked={formData.display.collectionPage}
              onChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  display: { ...prev.display, collectionPage: checked },
                }))
              }
            />
            <Checkbox
              label="Cart Page / Drawer"
              checked={formData.display.cartPage}
              onChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  display: { ...prev.display, cartPage: checked },
                }))
              }
            />
          </InlineStack>
        </BlockStack>
      </Card>

      {/* Condition Groups (OR logic between groups, AND within) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Text as="h2" variant="headingMd">
              Condition Groups
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              Conditions inside a group evaluate with <strong>AND</strong>. Multiple groups evaluate with <strong>OR</strong>.
            </Text>
          </div>
          <Button icon={PlusIcon} onClick={handleAddGroup}>
            Add Condition Group (OR)
          </Button>
        </div>

        {formData.groups.map((group, idx) => (
          <React.Fragment key={group.id || idx}>
            {idx > 0 && (
              <div className="flex items-center justify-center my-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200 shadow-xs">
                  OR
                </span>
              </div>
            )}
            <ConditionGroup
              group={group}
              groupIndex={idx}
              totalGroups={formData.groups.length}
              onChange={(updated) => handleUpdateGroup(idx, updated)}
              onRemove={() => handleRemoveGroup(idx)}
            />
          </React.Fragment>
        ))}
      </div>

      {/* Actions & Upsells */}
      <ActionList
        actions={formData.actions}
        upsells={formData.upsells}
        onActionsChange={handleActionsChange}
        onUpsellsChange={handleUpsellsChange}
        shop={shop}
      />

      {/* Interactive Rule Tester */}
      <Card>
        <BlockStack gap="400">
          <div className="flex items-center justify-between">
            <div>
              <Text as="h2" variant="headingMd">
                Interactive Rule Simulation
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Simulate cart subtotal, customer VIP status, and customer country to test your conditions live.
              </Text>
            </div>
            <Button onClick={() => setShowTester(!showTester)}>
              {showTester ? "Hide Simulator" : "Test This Rule"}
            </Button>
          </div>

          {showTester && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <RuleTester
                ruleId={formData.id}
                draftRule={formData}
                shop={shop}
              />
            </div>
          )}
        </BlockStack>
      </Card>

      {/* Sticky Bottom Actions */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 py-4 px-6 rounded-b shadow-lg flex items-center justify-between z-10">
        <Button onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <InlineStack gap="300">
          <Button
            variant="primary"
            onClick={handleSave}
            loading={saving}
          >
            {isEditing ? "Update Rule" : "Create Rule"}
          </Button>
        </InlineStack>
      </div>
    </div>
  );
}
