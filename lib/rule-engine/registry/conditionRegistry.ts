import { ConditionOperator, EvaluationContext, ValueType } from "../types";

export interface ConditionFieldSpec {
  field: string;
  label: string;
  category: "customer" | "cart" | "product" | "location";
  valueType: ValueType;
  supportedOperators: ConditionOperator[];
  extractActual: (context: EvaluationContext) => unknown;
}

export const CONDITION_REGISTRY: Record<string, ConditionFieldSpec> = {
  // Customer conditions
  "customer.tags": {
    field: "customer.tags",
    label: "Customer Tag",
    category: "customer",
    valueType: "array",
    supportedOperators: ["contains", "not_contains"],
    extractActual: (ctx) => ctx.customer?.tags ?? [],
  },
  "customer.isFirstOrder": {
    field: "customer.isFirstOrder",
    label: "Is First Order",
    category: "customer",
    valueType: "boolean",
    supportedOperators: ["equals"],
    extractActual: (ctx) => ctx.customer?.isFirstOrder ?? false,
  },
  "customer.isReturningCustomer": {
    field: "customer.isReturningCustomer",
    label: "Is Returning Customer",
    category: "customer",
    valueType: "boolean",
    supportedOperators: ["equals"],
    extractActual: (ctx) => ctx.customer?.isReturningCustomer ?? false,
  },
  "customer.orderCount": {
    field: "customer.orderCount",
    label: "Total Orders Count",
    category: "customer",
    valueType: "number",
    supportedOperators: ["equals", "gt", "gte", "lt", "lte"],
    extractActual: (ctx) => ctx.customer?.orderCount ?? 0,
  },
  "customer.lifetimeSpend": {
    field: "customer.lifetimeSpend",
    label: "Customer Lifetime Spend",
    category: "customer",
    valueType: "number",
    supportedOperators: ["gt", "gte", "lt", "lte"],
    extractActual: (ctx) => ctx.customer?.lifetimeSpend ?? 0,
  },

  // Cart conditions
  "cart.subtotal": {
    field: "cart.subtotal",
    label: "Cart Subtotal",
    category: "cart",
    valueType: "number",
    supportedOperators: ["equals", "gt", "gte", "lt", "lte"],
    extractActual: (ctx) => ctx.cart?.subtotal ?? 0,
  },
  "cart.quantity": {
    field: "cart.quantity",
    label: "Cart Total Quantity",
    category: "cart",
    valueType: "number",
    supportedOperators: ["equals", "gt", "gte", "lt", "lte"],
    extractActual: (ctx) => ctx.cart?.quantity ?? 0,
  },
  "cart.productIds": {
    field: "cart.productIds",
    label: "Product in Cart",
    category: "cart",
    valueType: "array",
    supportedOperators: ["contains", "not_contains"],
    extractActual: (ctx) => ctx.cart?.productIds ?? [],
  },
  "cart.collectionIds": {
    field: "cart.collectionIds",
    label: "Collection in Cart",
    category: "cart",
    valueType: "array",
    supportedOperators: ["contains", "not_contains"],
    extractActual: (ctx) => ctx.cart?.collectionIds ?? [],
  },
  "cart.productCount": {
    field: "cart.productCount",
    label: "Unique Product Count in Cart",
    category: "cart",
    valueType: "number",
    supportedOperators: ["equals", "gt", "gte", "lt", "lte"],
    extractActual: (ctx) => ctx.cart?.uniqueProductCount ?? ctx.cart?.productCount ?? 0,
  },

  // Product page conditions
  "product.id": {
    field: "product.id",
    label: "Product ID",
    category: "product",
    valueType: "string",
    supportedOperators: ["equals", "not_equals", "in"],
    extractActual: (ctx) => ctx.product?.id ?? "",
  },
  "product.tags": {
    field: "product.tags",
    label: "Product Tags",
    category: "product",
    valueType: "array",
    supportedOperators: ["contains", "not_contains"],
    extractActual: (ctx) => ctx.product?.tags ?? [],
  },
  "product.vendor": {
    field: "product.vendor",
    label: "Product Vendor",
    category: "product",
    valueType: "string",
    supportedOperators: ["equals", "not_equals"],
    extractActual: (ctx) => ctx.product?.vendor ?? "",
  },
  "product.productType": {
    field: "product.productType",
    label: "Product Type",
    category: "product",
    valueType: "string",
    supportedOperators: ["equals", "not_equals"],
    extractActual: (ctx) => ctx.product?.productType ?? "",
  },
  "product.collectionIds": {
    field: "product.collectionIds",
    label: "Product Collection",
    category: "product",
    valueType: "array",
    supportedOperators: ["contains", "not_contains"],
    extractActual: (ctx) => ctx.product?.collectionIds ?? [],
  },

  // Location conditions
  "location.country": {
    field: "location.country",
    label: "Customer Country Code",
    category: "location",
    valueType: "string",
    supportedOperators: ["equals", "not_equals", "in"],
    extractActual: (ctx) =>
      ctx.location?.country ?? ctx.customer?.country ?? "",
  },
  "location.isDomestic": {
    field: "location.isDomestic",
    label: "Is Domestic Order",
    category: "location",
    valueType: "boolean",
    supportedOperators: ["equals"],
    extractActual: (ctx) => ctx.location?.isDomestic ?? false,
  },
  "location.isInternational": {
    field: "location.isInternational",
    label: "Is International Order",
    category: "location",
    valueType: "boolean",
    supportedOperators: ["equals"],
    extractActual: (ctx) => ctx.location?.isInternational ?? false,
  },
};

/**
 * Evaluates a condition against the extracted actual value.
 */
export function evaluateCondition(
  field: string,
  operator: ConditionOperator,
  expected: unknown,
  actual: unknown
): { passed: boolean; message: string } {
  const spec = CONDITION_REGISTRY[field];
  if (!spec) {
    return {
      passed: false,
      message: `Unknown condition field: "${field}"`,
    };
  }

  // Type coercion if expected value is formatted as string from DB
  let parsedExpected = expected;
  if (spec.valueType === "number" && typeof expected === "string") {
    parsedExpected = parseFloat(expected) || 0;
  } else if (spec.valueType === "boolean" && typeof expected === "string") {
    parsedExpected = expected.toLowerCase() === "true";
  } else if (spec.valueType === "array" && typeof expected === "string") {
    try {
      parsedExpected = JSON.parse(expected);
    } catch {
      parsedExpected = [expected];
    }
  }

  switch (operator) {
    case "equals": {
      const match =
        String(actual).trim().toLowerCase() ===
        String(parsedExpected).trim().toLowerCase();
      return {
        passed: match,
        message: match
          ? `Actual "${actual}" equals "${parsedExpected}"`
          : `Expected "${parsedExpected}", but got "${actual}"`,
      };
    }
    case "not_equals": {
      const match =
        String(actual).trim().toLowerCase() !==
        String(parsedExpected).trim().toLowerCase();
      return {
        passed: match,
        message: match
          ? `Actual "${actual}" is not equal to "${parsedExpected}"`
          : `Actual "${actual}" matches disallowed "${parsedExpected}"`,
      };
    }
    case "gt": {
      const numAct = Number(actual) || 0;
      const numExp = Number(parsedExpected) || 0;
      const match = numAct > numExp;
      return {
        passed: match,
        message: match
          ? `${numAct} is greater than ${numExp}`
          : `Expected > ${numExp}, but actual is ${numAct}`,
      };
    }
    case "gte": {
      const numAct = Number(actual) || 0;
      const numExp = Number(parsedExpected) || 0;
      const match = numAct >= numExp;
      return {
        passed: match,
        message: match
          ? `${numAct} is greater than or equal to ${numExp}`
          : `Expected >= ${numExp}, but actual is ${numAct}`,
      };
    }
    case "lt": {
      const numAct = Number(actual) || 0;
      const numExp = Number(parsedExpected) || 0;
      const match = numAct < numExp;
      return {
        passed: match,
        message: match
          ? `${numAct} is less than ${numExp}`
          : `Expected < ${numExp}, but actual is ${numAct}`,
      };
    }
    case "lte": {
      const numAct = Number(actual) || 0;
      const numExp = Number(parsedExpected) || 0;
      const match = numAct <= numExp;
      return {
        passed: match,
        message: match
          ? `${numAct} is less than or equal to ${numExp}`
          : `Expected <= ${numExp}, but actual is ${numAct}`,
      };
    }
    case "contains": {
      const list = Array.isArray(actual)
        ? actual.map((s) => String(s).toLowerCase().trim())
        : [String(actual).toLowerCase().trim()];
      const target = String(parsedExpected).toLowerCase().trim();
      const match = list.includes(target);
      return {
        passed: match,
        message: match
          ? `List contains "${target}"`
          : `Expected list to contain "${target}", found [${list.join(", ")}]`,
      };
    }
    case "not_contains": {
      const list = Array.isArray(actual)
        ? actual.map((s) => String(s).toLowerCase().trim())
        : [String(actual).toLowerCase().trim()];
      const target = String(parsedExpected).toLowerCase().trim();
      const match = !list.includes(target);
      return {
        passed: match,
        message: match
          ? `List does not contain "${target}"`
          : `List should not contain "${target}"`,
      };
    }
    case "in": {
      const targetList = Array.isArray(parsedExpected)
        ? parsedExpected.map((s) => String(s).toLowerCase().trim())
        : String(parsedExpected)
            .split(",")
            .map((s) => s.toLowerCase().trim());
      const act = String(actual).toLowerCase().trim();
      const match = targetList.includes(act);
      return {
        passed: match,
        message: match
          ? `"${act}" is in [${targetList.join(", ")}]`
          : `Expected "${act}" to be in [${targetList.join(", ")}]`,
      };
    }
    default:
      return {
        passed: false,
        message: `Unsupported operator: ${operator}`,
      };
  }
}
