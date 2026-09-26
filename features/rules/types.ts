import {
  RuleDefinition,
  RuleGroupDefinition,
  ConditionDefinition,
  ActionDefinition,
  UpsellItemConfig,
  RuleStatus,
  Surface,
  RuleDisplayConfig,
} from "@/lib/rule-engine/types";

export type {
  RuleDefinition,
  RuleGroupDefinition,
  ConditionDefinition,
  ActionDefinition,
  UpsellItemConfig,
  RuleStatus,
  Surface,
  RuleDisplayConfig,
};

export interface RuleFormData {
  id?: string;
  name: string;
  description: string;
  status: RuleStatus;
  priority: number;
  startAt?: string;
  endAt?: string;
  groups: RuleGroupDefinition[];
  actions: ActionDefinition[];
  upsells: UpsellItemConfig[];
  display: RuleDisplayConfig;
}
