import React from "react";
import { Select, TextField, Button } from "@shopify/polaris";
import { DeleteIcon } from "@shopify/polaris-icons";
import { CONDITION_REGISTRY } from "@/lib/rule-engine/registry/conditionRegistry";
import { ConditionDefinition, ConditionOperator } from "@/lib/rule-engine/types";

interface ConditionRowProps {
  condition: ConditionDefinition;
  onChange: (updated: ConditionDefinition) => void;
  onRemove: () => void;
}

export function ConditionRow({ condition, onChange, onRemove }: ConditionRowProps) {
  const currentSpec = CONDITION_REGISTRY[condition.field] || CONDITION_REGISTRY["cart.subtotal"];

  const fieldOptions = Object.values(CONDITION_REGISTRY).map((spec) => ({
    label: `${spec.category.toUpperCase()}: ${spec.label}`,
    value: spec.field,
  }));

  const operatorOptions = currentSpec.supportedOperators.map((op) => ({
    label: op.replace("_", " ").toUpperCase(),
    value: op,
  }));

  const handleFieldChange = (newField: string) => {
    const spec = CONDITION_REGISTRY[newField];
    const defaultOp = spec?.supportedOperators[0] || "equals";
    onChange({
      ...condition,
      field: newField,
      operator: defaultOp,
      valueType: spec?.valueType || "string",
      value: spec?.valueType === "number" ? 0 : spec?.valueType === "boolean" ? true : "",
    });
  };

  const handleOperatorChange = (newOp: string) => {
    onChange({
      ...condition,
      operator: newOp as ConditionOperator,
    });
  };

  const handleValueChange = (val: string) => {
    let finalValue: any = val;
    if (currentSpec.valueType === "number") {
      finalValue = parseFloat(val) || 0;
    } else if (currentSpec.valueType === "boolean") {
      finalValue = val.toLowerCase() === "true";
    }
    onChange({
      ...condition,
      value: finalValue,
    });
  };

  return (
    <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200">
      <div className="w-1/3">
        <Select
          label="Field"
          labelHidden
          options={fieldOptions}
          value={condition.field}
          onChange={handleFieldChange}
        />
      </div>

      <div className="w-1/4">
        <Select
          label="Operator"
          labelHidden
          options={operatorOptions}
          value={condition.operator}
          onChange={handleOperatorChange}
        />
      </div>

      <div className="flex-1">
        {currentSpec.valueType === "boolean" ? (
          <Select
            label="Value"
            labelHidden
            options={[
              { label: "True / Yes", value: "true" },
              { label: "False / No", value: "false" },
            ]}
            value={String(condition.value)}
            onChange={handleValueChange}
          />
        ) : (
          <TextField
            label="Value"
            labelHidden
            type={currentSpec.valueType === "number" ? "number" : "text"}
            value={String(condition.value ?? "")}
            onChange={handleValueChange}
            autoComplete="off"
            placeholder={
              currentSpec.valueType === "number"
                ? "e.g. 3000"
                : currentSpec.field === "customer.tags"
                ? "e.g. VIP"
                : currentSpec.field === "location.country"
                ? "e.g. IN or US"
                : "Enter value..."
            }
          />
        )}
      </div>

      <Button
        icon={DeleteIcon}
        tone="critical"
        variant="tertiary"
        onClick={onRemove}
        accessibilityLabel="Remove condition"
      />
    </div>
  );
}
