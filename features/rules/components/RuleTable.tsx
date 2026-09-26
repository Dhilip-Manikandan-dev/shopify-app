import React from "react";
import {
  IndexTable,
  Card,
  Text,
  Badge,
  Button,
  InlineStack,
  useIndexResourceState,
} from "@shopify/polaris";
import { EditIcon } from "@shopify/polaris-icons";
import { RuleDefinition } from "../types";
import { RuleStatusBadge } from "@/components/common/RuleStatusBadge";

interface RuleTableProps {
  rules: RuleDefinition[];
  onEdit: (rule: RuleDefinition) => void;
  onTest: (rule: RuleDefinition) => void;
  onArchive: (rule: RuleDefinition) => void;
}

export function RuleTable({ rules, onEdit, onTest, onArchive }: RuleTableProps) {
  const resourceName = {
    singular: "rule",
    plural: "rules",
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(rules as any);

  const rowMarkup = rules.map((rule, index) => {
    const actionTypes = rule.actions.map((a) => a.type);
    if (rule.upsells && rule.upsells.length > 0) {
      actionTypes.push("UPSELL");
    }
    const uniqueActionTypes = Array.from(new Set(actionTypes));

    const activeSurfaces = [];
    if (rule.display?.productPage) activeSurfaces.push("Product");
    if (rule.display?.collectionPage) activeSurfaces.push("Collection");
    if (rule.display?.cartPage) activeSurfaces.push("Cart");

    return (
      <IndexTable.Row
        id={rule.id}
        key={rule.id}
        selected={selectedResources.includes(rule.id)}
        position={index}
      >
        <IndexTable.Cell>
          <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-semibold">
            #{rule.priority}
          </span>
        </IndexTable.Cell>

        <IndexTable.Cell>
          <div className="flex flex-col">
            <span
              className="font-semibold text-gray-900 hover:text-indigo-600 cursor-pointer"
              onClick={() => onEdit(rule)}
            >
              {rule.name}
            </span>
            {rule.description && (
              <span className="text-xs text-gray-500 line-clamp-1">
                {rule.description}
              </span>
            )}
          </div>
        </IndexTable.Cell>

        <IndexTable.Cell>
          <RuleStatusBadge status={rule.status} />
        </IndexTable.Cell>

        <IndexTable.Cell>
          <InlineStack gap="100">
            {uniqueActionTypes.map((type) => {
              const tone =
                type === "SHIPPING"
                  ? "info"
                  : type === "DISCOUNT"
                  ? "success"
                  : "attention";
              return (
                <Badge key={type} tone={tone}>
                  {type}
                </Badge>
              );
            })}
          </InlineStack>
        </IndexTable.Cell>

        <IndexTable.Cell>
          <Text as="span" variant="bodySm" tone="subdued">
            {activeSurfaces.length > 0 ? activeSurfaces.join(", ") : "None"}
          </Text>
        </IndexTable.Cell>

        <IndexTable.Cell>
          <InlineStack gap="200">
            <Button
              size="micro"
              icon={EditIcon}
              onClick={() => onEdit(rule)}
              accessibilityLabel="Edit rule"
            >
              Edit
            </Button>
            <Button
              size="micro"
              variant="tertiary"
              onClick={() => onTest(rule)}
            >
              Test
            </Button>
            {rule.status !== "ARCHIVED" && (
              <Button
                size="micro"
                variant="plain"
                tone="critical"
                onClick={() => onArchive(rule)}
              >
                Archive
              </Button>
            )}
          </InlineStack>
        </IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  return (
    <Card padding="0">
      <IndexTable
        resourceName={resourceName}
        itemCount={rules.length}
        selectedItemsCount={
          allResourcesSelected ? "All" : selectedResources.length
        }
        onSelectionChange={handleSelectionChange}
        headings={[
          { title: "Priority" },
          { title: "Rule Name" },
          { title: "Status" },
          { title: "Actions" },
          { title: "Surfaces" },
          { title: "Controls" },
        ]}
        selectable={false}
      >
        {rowMarkup}
      </IndexTable>
    </Card>
  );
}
