import React, { useState } from "react";
import {
  Card,
  TextField,
  Button,
  Banner,
  Text,
  Divider,
} from "@shopify/polaris";
import { PlayIcon } from "@shopify/polaris-icons";
import { testDraftRule, testRule } from "../api";
import { RuleFormData } from "../types";
import { EvaluationContext } from "@/lib/rule-engine/types";
import { RuleTesterResult } from "@/lib/rule-engine/tester";

export interface RuleTesterProps {
  rule?: RuleFormData;
  draftRule?: RuleFormData;
  ruleId?: string;
  shop?: string;
}

export function RuleTester({ rule, draftRule, ruleId, shop }: RuleTesterProps) {
  // Mock tester inputs
  const [customerTag, setCustomerTag] = useState("VIP");
  const [country, setCountry] = useState("IN");
  const [cartSubtotal, setCartSubtotal] = useState("3500");
  const [cartQuantity, setCartQuantity] = useState("2");
  const [orderCount, setOrderCount] = useState("5");
  const [lifetimeSpend, setLifetimeSpend] = useState("10000");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RuleTesterResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunTest = async () => {
    setLoading(true);
    setError(null);

    const context: EvaluationContext = {
      customer: {
        tags: customerTag
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        orderCount: parseInt(orderCount, 10) || 0,
        lifetimeSpend: parseFloat(lifetimeSpend) || 0,
        country: country.trim().toUpperCase(),
        isFirstOrder: parseInt(orderCount, 10) === 0,
        isReturningCustomer: parseInt(orderCount, 10) > 0,
      },
      cart: {
        subtotal: parseFloat(cartSubtotal) || 0,
        quantity: parseInt(cartQuantity, 10) || 0,
        productIds: [],
        collectionIds: [],
        productCount: 1,
        uniqueProductCount: 1,
      },
      location: {
        country: country.trim().toUpperCase(),
        isDomestic: country.trim().toUpperCase() === "IN",
        isInternational: country.trim().toUpperCase() !== "IN",
      },
    };

    try {
      const targetRule = draftRule || rule;
      if (targetRule) {
        const res = await testDraftRule(targetRule, context, shop);
        setResult(res);
      } else if (ruleId) {
        const res = await testRule(ruleId, context, shop);
        setResult(res);
      } else {
        throw new Error("No rule provided to test");
      }
    } catch (err: any) {
      setError(err.message || "Failed to execute rule tester");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="space-y-4">
        <div>
          <Text as="h3" variant="headingMd">
            Interactive Rule Tester
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Simulate realistic customer & cart inputs against this rule engine
          </Text>
        </div>

        <Divider />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <TextField
            label="Customer Tags"
            value={customerTag}
            onChange={(val) => setCustomerTag(val)}
            helpText="Comma-separated (e.g. VIP, Wholesale)"
            autoComplete="off"
          />

          <TextField
            label="Cart Subtotal (₹)"
            type="number"
            value={cartSubtotal}
            onChange={(val) => setCartSubtotal(val)}
            autoComplete="off"
          />

          <TextField
            label="Customer Country"
            value={country}
            onChange={(val) => setCountry(val)}
            helpText="2-letter ISO code (e.g. IN, US, UK)"
            autoComplete="off"
          />

          <TextField
            label="Cart Total Quantity"
            type="number"
            value={cartQuantity}
            onChange={(val) => setCartQuantity(val)}
            autoComplete="off"
          />

          <TextField
            label="Customer Past Orders"
            type="number"
            value={orderCount}
            onChange={(val) => setOrderCount(val)}
            autoComplete="off"
          />

          <TextField
            label="Customer Lifetime Spend (₹)"
            type="number"
            value={lifetimeSpend}
            onChange={(val) => setLifetimeSpend(val)}
            autoComplete="off"
          />
        </div>

        <div className="pt-2">
          <Button
            icon={PlayIcon}
            variant="primary"
            loading={loading}
            onClick={handleRunTest}
          >
            Test Rule Execution
          </Button>
        </div>

        {error && (
          <Banner tone="critical">
            <p>{error}</p>
          </Banner>
        )}

        {result && (
          <div className="pt-3">
            <Banner
              title={result.matched ? "RULE MATCHED" : "RULE NOT MATCHED"}
              tone={result.matched ? "success" : "warning"}
            >
              <p className="font-medium text-sm mb-3">{result.summary}</p>
              <div className="space-y-3 bg-white/70 p-3 rounded border border-black/5">
                {result.groups.map((group) => (
                  <div key={group.groupNumber} className="space-y-1">
                    <Text as="h5" variant="bodySm" fontWeight="bold">
                      Group {group.groupNumber} ({group.passed ? "PASSED" : "FAILED"}):
                    </Text>
                    <ul className="list-none space-y-1 text-xs">
                      {group.conditions.map((c, i) => (
                        <li
                          key={i}
                          className={
                            c.passed
                              ? "text-emerald-700 font-medium"
                              : "text-rose-700 font-medium"
                          }
                        >
                          {c.diagnostic}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Banner>
          </div>
        )}
      </div>
    </Card>
  );
}
