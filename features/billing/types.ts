export type SubscriptionPlan = "FREE" | "STARTER" | "GROWTH";

export interface PlanDetail {
  id: SubscriptionPlan;
  name: string;
  price: number;
  features: string[];
  recommended?: boolean;
}

export interface SubscriptionStatus {
  plan: SubscriptionPlan;
  status: string;
  currentPeriodEnd?: string;
  isTrial?: boolean;
}
