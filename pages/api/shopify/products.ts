import { NextApiResponse } from "next";
import { withAuth, AuthenticatedNextApiRequest } from "@/server/auth/withAuth";
import { ShopifyService } from "@/server/services/shopify/shopifyService";
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

  const { query, limit } = req.query;

  try {
    const products = await ShopifyService.searchProducts({
      shop: req.shop,
      query: query ? String(query) : undefined,
      limit: limit ? parseInt(String(limit), 10) : 20,
    });

    return res.status(200).json({
      success: true,
      data: products,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: {
        code: "SHOPIFY_API_ERROR",
        message: err.message,
      },
    });
  }
}

export default withAuth(handler);
