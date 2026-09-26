import { NextApiRequest, NextApiResponse } from "next";
import { checkRateLimit } from "@/server/security/rateLimiter";
import { StorefrontOfferRequestSchema } from "@/server/validators/storefrontValidators";
import { StorefrontService } from "@/server/services/storefront/storefrontService";
import { ApiResponse } from "@/types/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<any>>
) {
  // CORS configuration for Shopify Storefront Theme App Extension
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST", "OPTIONS"]);
    return res.status(405).json({
      success: false,
      error: { code: "METHOD_NOT_ALLOWED", message: `Method ${req.method} not allowed` },
    });
  }

  // Rate Limiting (60 requests per minute per IP)
  const clientIp =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
    req.socket.remoteAddress ||
    "storefront_unknown";

  const rateCheck = checkRateLimit(clientIp, 60, 60);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: `Too many storefront requests. Please try again in ${rateCheck.resetInSeconds} seconds.`,
      },
    });
  }

  // Validate storefront payload
  const validation = StorefrontOfferRequestSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid storefront offer request context",
        details: validation.error.flatten(),
      },
    });
  }

  try {
    const result = await StorefrontService.evaluateOffers(validation.data);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("[Storefront Offers Error]:", err.message || err);
    return res.status(500).json({
      success: false,
      error: {
        code: "STOREFRONT_EVALUATION_ERROR",
        message: "Unable to evaluate storefront offers",
      },
    });
  }
}
