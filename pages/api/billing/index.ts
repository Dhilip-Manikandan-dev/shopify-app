import { NextApiResponse } from "next";
import { withAuth, AuthenticatedNextApiRequest } from "@/server/auth/withAuth";
import { BillingService } from "@/server/services/billing/billingService";
import { ApiResponse } from "@/types/api";

async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<ApiResponse<any>>
) {
  const storeId = req.store.id;

  if (req.method === "GET") {
    const subscription = await BillingService.getSubscription(storeId);
    return res.status(200).json({
      success: true,
      data: subscription,
    });
  }

  if (req.method === "POST") {
    const { plan, returnUrl } = req.body;
    if (!plan || !returnUrl) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Plan and returnUrl are required" },
      });
    }

    try {
      const charge = await BillingService.createSubscriptionCharge({
        storeId,
        shop: req.shop,
        targetPlan: plan,
        returnUrl,
      });

      return res.status(200).json({
        success: true,
        data: charge,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: "BILLING_ERROR", message: err.message },
      });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({
    success: false,
    error: { code: "METHOD_NOT_ALLOWED", message: `Method ${req.method} not allowed` },
  });
}

export default withAuth(handler);
