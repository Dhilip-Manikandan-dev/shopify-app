import { NextApiResponse } from "next";
import { withAuth, AuthenticatedNextApiRequest } from "@/server/auth/withAuth";
import { StoreRepository } from "@/server/repositories/storeRepository";
import { ApiResponse } from "@/types/api";

async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<ApiResponse<any>>
) {
  const storeId = req.store.id;

  if (req.method === "GET") {
    const store = await StoreRepository.findById(storeId);
    return res.status(200).json({
      success: true,
      data: store,
    });
  }

  if (req.method === "PUT") {
    const { domesticCountry, currency, timezone, name } = req.body;
    const updated = await StoreRepository.updateSettings(storeId, {
      domesticCountry,
      currency,
      timezone,
      name,
    });

    return res.status(200).json({
      success: true,
      data: updated,
    });
  }

  res.setHeader("Allow", ["GET", "PUT"]);
  return res.status(405).json({
    success: false,
    error: { code: "METHOD_NOT_ALLOWED", message: `Method ${req.method} not allowed` },
  });
}

export default withAuth(handler);
