import { NextApiRequest, NextApiResponse } from "next";
import { checkRateLimit } from "@/server/security/rateLimiter";
import { AnalyticsService } from "@/server/services/analytics/analyticsService";
import { ApiResponse } from "@/types/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<any>>
) {
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

  const clientIp =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
    req.socket.remoteAddress ||
    "analytics_unknown";

  const rateCheck = checkRateLimit(`analytics_${clientIp}`, 120, 60);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      success: false,
      error: { code: "RATE_LIMITED", message: "Rate limit exceeded" },
    });
  }

  const { shop, eventType, ruleId, productId, variantId, surface, sessionId, idempotencyKey } =
    req.body;

  if (!shop || !eventType) {
    return res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Shop and eventType are required" },
    });
  }

  try {
    const recorded = await AnalyticsService.recordStorefrontEvent({
      shop,
      eventType,
      ruleId,
      productId,
      variantId,
      surface,
      sessionId,
      idempotencyKey,
    });

    return res.status(200).json({
      success: true,
      data: recorded,
    });
  } catch (err: any) {
    console.error("[Analytics Event Ingestion Error]:", err.message);
    return res.status(500).json({
      success: false,
      error: { code: "EVENT_INGESTION_ERROR", message: "Could not record analytics event" },
    });
  }
}
