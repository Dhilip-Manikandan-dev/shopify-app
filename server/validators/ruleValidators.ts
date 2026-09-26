import { z } from "zod";
import { CONDITION_REGISTRY } from "@/lib/rule-engine/registry/conditionRegistry";

export const ConditionSchema = z.object({
  id: z.string().optional(),
  field: z.string().refine((f) => !!CONDITION_REGISTRY[f], {
    message: "Invalid or unsupported condition field",
  }),
  operator: z.enum([
    "equals",
    "not_equals",
    "contains",
    "not_contains",
    "gt",
    "gte",
    "lt",
    "lte",
    "in",
  ]),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
  ]),
  valueType: z.enum(["string", "number", "boolean", "array"]).optional(),
  position: z.number().int().default(0),
});

export const RuleGroupSchema = z.object({
  id: z.string().optional(),
  position: z.number().int().default(0),
  conditions: z.array(ConditionSchema).min(1, "Each group must have at least one condition"),
});

export const ActionSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["SHIPPING", "DISCOUNT", "UPSELL"]),
  configuration: z.record(z.unknown()),
  position: z.number().int().default(0),
});

export const UpsellItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1, "Product ID is required"),
  variantId: z.string().optional(),
  title: z.string().min(1, "Upsell title is required"),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  originalPrice: z.number().nonnegative(),
  offerPrice: z.number().nonnegative(),
  discountType: z.enum(["PERCENTAGE", "FIXED", "FREE"]).default("PERCENTAGE"),
  discountValue: z.number().default(0),
  buttonText: z.string().default("Add to Cart"),
  maxProducts: z.number().int().default(1),
  enabled: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
  excludeIfInCart: z.boolean().default(true),
});

export const RuleDisplaySchema = z.object({
  productPage: z.boolean().default(true),
  collectionPage: z.boolean().default(true),
  cartPage: z.boolean().default(true),
});

export const CreateRuleSchema = z.object({
  name: z.string().min(1, "Rule name is required").max(100),
  description: z.string().max(500).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"]).default("DRAFT"),
  priority: z.number().int().min(1).default(10),
  startAt: z.string().datetime().nullable().optional(),
  endAt: z.string().datetime().nullable().optional(),
  groups: z.array(RuleGroupSchema).min(1, "Rule must have at least one condition group"),
  actions: z.array(ActionSchema).min(1, "Rule must have at least one action"),
  upsells: z.array(UpsellItemSchema).optional().default([]),
  display: RuleDisplaySchema.optional().default({
    productPage: true,
    collectionPage: true,
    cartPage: true,
  }),
});

export const UpdateRuleSchema = CreateRuleSchema.partial();
