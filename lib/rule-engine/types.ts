export type RuleStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";

export type Surface = "PRODUCT_PAGE" | "COLLECTION_PAGE" | "CART_PAGE";

export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in";

export type ValueType = "string" | "number" | "boolean" | "array";

export interface ConditionDefinition {
  id?: string;
  field: string;
  operator: ConditionOperator;
  value: string | number | boolean | string[];
  valueType?: ValueType;
  position?: number;
}

export interface RuleGroupDefinition {
  id?: string;
  position: number;
  conditions: ConditionDefinition[];
}

export type ActionType = "SHIPPING" | "DISCOUNT" | "UPSELL";

export interface ShippingActionConfig {
  subType: "FREE" | "PERCENTAGE_DISCOUNT" | "FIXED_DISCOUNT";
  discountValue?: number;
  scope?: "ALL" | "DOMESTIC" | "INTERNATIONAL";
  title?: string;
  freeShippingThreshold?: number; // e.g. ₹3000
}

export interface DiscountActionConfig {
  discountType: "PERCENTAGE" | "FIXED";
  value: number;
  title: string;
}

export interface UpsellItemConfig {
  id?: string;
  productId: string;
  variantId?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  originalPrice: number;
  offerPrice: number;
  discountType?: "PERCENTAGE" | "FIXED" | "FREE";
  discountValue?: number;
  buttonText?: string;
  maxProducts?: number;
  enabled?: boolean;
  displayOrder?: number;
  excludeIfInCart?: boolean;
}

export interface ActionDefinition {
  id?: string;
  type: ActionType;
  configuration: ShippingActionConfig | DiscountActionConfig | UpsellItemConfig | Record<string, unknown>;
  position: number;
}

export interface RuleDisplayConfig {
  productPage: boolean;
  collectionPage: boolean;
  cartPage: boolean;
}

export interface RuleDefinition {
  id: string;
  storeId: string;
  name: string;
  description?: string | null;
  status: RuleStatus;
  priority: number;
  startAt?: Date | string | null;
  endAt?: Date | string | null;
  groups: RuleGroupDefinition[];
  actions: ActionDefinition[];
  upsells?: UpsellItemConfig[];
  display?: RuleDisplayConfig;
}

export interface EvaluationContext {
  customer?: {
    id?: string;
    tags: string[];
    orderCount: number;
    lifetimeSpend: number;
    country?: string;
    isFirstOrder?: boolean;
    isReturningCustomer?: boolean;
  };
  cart?: {
    subtotal: number;
    quantity: number;
    productIds: string[];
    collectionIds: string[];
    productCount: number;
    uniqueProductCount: number;
  };
  product?: {
    id: string;
    tags: string[];
    vendor: string;
    productType: string;
    collectionIds: string[];
  };
  location?: {
    country: string;
    isDomestic: boolean;
    isInternational: boolean;
  };
  surface?: Surface;
}

export interface DiagnosticConditionStep {
  field: string;
  operator: string;
  expected: unknown;
  actual: unknown;
  passed: boolean;
  message: string;
}

export interface DiagnosticGroupStep {
  groupPosition: number;
  passed: boolean;
  conditions: DiagnosticConditionStep[];
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  priority: number;
  matched: boolean;
  groupDiagnostics: DiagnosticGroupStep[];
}

export interface StorefrontOfferResponse {
  matched: boolean;
  offers: Array<{
    type: ActionType;
    productId?: string;
    variantId?: string;
    title: string;
    description?: string;
    originalPrice?: number;
    price?: number;
    imageUrl?: string;
    buttonText?: string;
    shippingSubtype?: string;
    discountType?: string;
    discountValue?: number;
    freeShippingThreshold?: number;
    progress?: {
      current: number;
      target: number;
      remaining: number;
      percentage: number;
      message: string;
    };
  }>;
}
