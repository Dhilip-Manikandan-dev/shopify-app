import { NextApiRequest, NextApiResponse } from "next";
import { verifyShopifySessionToken } from "@/lib/auth/sessionToken";
import { StoreRepository } from "@/server/repositories/storeRepository";
import { Store } from "@prisma/client";
import { ApiResponse } from "@/types/api";

export interface AuthenticatedNextApiRequest extends NextApiRequest {
  store: Store;
  shop: string;
}

export type AuthenticatedApiHandler<T = unknown> = (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<ApiResponse<T>>
) => Promise<void | NextApiResponse<ApiResponse<T>>>;

/**
 * Middleware higher-order function that verifies Shopify App Bridge session token
 * and resolves the multi-tenant Store record from the database.
 */
export function withAuth<T>(handler: AuthenticatedApiHandler<T>) {
  return async (req: NextApiRequest, res: NextApiResponse<ApiResponse<T>>) => {
    try {
      const authHeader = req.headers.authorization;
      let shop = "";

      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7).trim();
        const verification = verifyShopifySessionToken(token);
        shop = verification.shop;
      } else if (process.env.NODE_ENV === "development" && req.query.shop) {
        // Development fallback with explicit shop query param
        shop = String(req.query.shop);
      }

      if (!shop) {
        return res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Missing or invalid authorization header.",
          },
        });
      }

      // Resolve store
      let store = await StoreRepository.findByShop(shop);
      if (!store) {
        // Automatically upsert store if missing
        store = await StoreRepository.upsertStore({ shop });
      }

      if (!store || !store.isActive) {
        return res.status(403).json({
          success: false,
          error: {
            code: "STORE_INACTIVE",
            message: "This store has uninstalled the application or is inactive.",
          },
        });
      }

      const authReq = req as AuthenticatedNextApiRequest;
      authReq.store = store;
      authReq.shop = shop;

      return await handler(authReq, res);
    } catch (err: any) {
      console.error("[withAuth Error]:", err?.message || err);

      if (err?.code === "INVALID_SESSION_TOKEN" || err?.name === "InvalidSessionTokenError") {
        return res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: err.message,
          },
        });
      }

      if (err?.code === "SHOPIFY_AUTH_REQUIRED" || err?.name === "ShopifyAuthRequiredError") {
        return res.status(401).json({
          success: false,
          error: {
            code: "SHOPIFY_AUTH_REQUIRED",
            message: "Shopify re-authentication is required for this store.",
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred while processing your request.",
        },
      });
    }
  };
}
