import { NextApiResponse } from "next";
import { withAuth, AuthenticatedNextApiRequest } from "@/server/auth/withAuth";
import { AnalyticsService } from "@/server/services/analytics/analyticsService";
import { ApiResponse } from "@/types/api";

async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<ApiResponse<any>>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({
      success: false,
      error: { code: "METHOD_NOT_ALLOWED", message: `Method ${req.method} not allowed` },
    });
  }

  const days = req.query.days ? parseInt(String(req.query.days), 10) : 30;
  const metrics = await AnalyticsService.getDashboardMetrics(req.store.id, days);
  return res.status(200).json({
    success: true,
    data: metrics,
  });
}

export default withAuth(handler);
