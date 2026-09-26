import React from "react";
import { Card, Button, Text, Divider } from "@shopify/polaris";
import { PlusIcon, DeleteIcon } from "@shopify/polaris-icons";
import { ConditionRow } from "./ConditionRow";
import { RuleGroupDefinition, ConditionDefinition } from "@/lib/rule-engine/types";

interface ConditionGroupProps {
  group: RuleGroupDefinition;
  groupIndex: number;
  totalGroups: number;
  onChange: (updated: RuleGroupDefinition) => void;
  onRemove: () => void;
}

export function ConditionGroup({
  group,
  groupIndex,
  totalGroups,
  onChange,
  onRemove,
}: ConditionGroupProps) {
  const handleAddCondition = () => {
    const newCond: ConditionDefinition = {
      field: "cart.subtotal",
      operator: "gte",
      value: 1000,
      valueType: "number",
      position: group.conditions.length,
    };
    onChange({
      ...group,
      conditions: [...group.conditions, newCond],
    });
  };

  const handleUpdateCondition = (index: number, updated: ConditionDefinition) => {
    const nextConds = [...group.conditions];
    nextConds[index] = updated;
    onChange({
      ...group,
      conditions: nextConds,
    });
  };

  const handleRemoveCondition = (index: number) => {
    const nextConds = group.conditions.filter((_, i) => i !== index);
    onChange({
      ...group,
      conditions: nextConds,
    });
  };

  return (
    <div className="space-y-3">
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-800">
                GROUP {groupIndex + 1}
              </span>
              <Text as="p" variant="bodySm" tone="subdued">
                All conditions in this group must match (AND)
              </Text>
            </div>

            {totalGroups > 1 && (
              <Button
                variant="plain"
                tone="critical"
                icon={DeleteIcon}
                onClick={onRemove}
              >
                Delete Group
              </Button>
            )}
          </div>

          <Divider />

          <div className="space-y-3">
            {group.conditions.map((cond, idx) => (
              <React.Fragment key={cond.id || idx}>
                {idx > 0 && (
                  <div className="flex items-center justify-center my-1">
                    <span className="px-2 py-0.5 text-xs font-bold uppercase rounded bg-indigo-50 text-indigo-700 tracking-wider">
                      AND
                    </span>
                  </div>
                )}
                <ConditionRow
                  condition={cond}
                  onChange={(updated) => handleUpdateCondition(idx, updated)}
                  onRemove={() => handleRemoveCondition(idx)}
                />
              </React.Fragment>
            ))}
          </div>

          <div className="pt-2">
            <Button icon={PlusIcon} onClick={handleAddCondition} variant="tertiary">
              Add Condition
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
