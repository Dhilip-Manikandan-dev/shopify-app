import prisma from "@/lib/prisma";
import { encryptToken, decryptToken } from "@/lib/encryption/tokenCrypto";

const REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes before expiry
const REFRESH_LOCK_LEASE_MS = 30 * 1000; // 30 seconds lock lease

export class ShopifyAuthRequiredError extends Error {
  code = "SHOPIFY_AUTH_REQUIRED";
  constructor(message = "Shopify re-authentication required.") {
    super(message);
    this.name = "ShopifyAuthRequiredError";
  }
}

export class CredentialRepository {
  /**
   * Atomically saves or updates encrypted credentials for a store.
   */
  static async saveCredentials(params: {
    storeId: string;
    shop: string;
    accessToken: string;
    expiresIn?: number;
    refreshToken?: string;
    refreshTokenExpiresIn?: number;
    scope?: string;
  }) {
    const now = Date.now();
    const accessTokenExpiresAt = params.expiresIn
      ? new Date(now + params.expiresIn * 1000)
      : null;

    const refreshTokenExpiresAt = params.refreshTokenExpiresIn
      ? new Date(now + params.refreshTokenExpiresIn * 1000)
      : null;

    const encryptedAccess = encryptToken(params.accessToken);
    const encryptedRefresh = params.refreshToken
      ? encryptToken(params.refreshToken)
      : null;

    return prisma.$transaction(async (tx) => {
      const cred = await tx.shopifyCredential.upsert({
        where: { storeId: params.storeId },
        create: {
          storeId: params.storeId,
          shop: params.shop,
          accessTokenEncrypted: encryptedAccess,
          accessTokenExpiresAt,
          refreshTokenEncrypted: encryptedRefresh,
          refreshTokenExpiresAt,
          scope: params.scope,
          reauthRequired: false,
          refreshLockUntil: null,
        },
        update: {
          accessTokenEncrypted: encryptedAccess,
          accessTokenExpiresAt,
          refreshTokenEncrypted: encryptedRefresh ?? undefined,
          refreshTokenExpiresAt: refreshTokenExpiresAt ?? undefined,
          scope: params.scope ?? undefined,
          reauthRequired: false,
          refreshLockUntil: null,
        },
      });

      return cred;
    });
  }

  /**
   * Retrieves the raw credential record for a store or shop.
   */
  static async findByShop(shop: string) {
    return prisma.shopifyCredential.findFirst({
      where: { shop },
      include: { store: true },
    });
  }

  /**
   * Retrieves an active, validated Shopify access token for API calls.
   * Handles proactive expiration checks, concurrent refresh locks,
   * refresh token rotation, and re-authentication tagging.
   */
  static async getValidAccessToken(shop: string): Promise<string> {
    const cred = await this.findByShop(shop);
    if (!cred) {
      throw new ShopifyAuthRequiredError(`No Shopify credentials found for shop: ${shop}`);
    }

    if (cred.reauthRequired) {
      throw new ShopifyAuthRequiredError(`Re-authentication required for shop: ${shop}`);
    }

    const now = Date.now();
    const isExpiringSoon =
      cred.accessTokenExpiresAt &&
      cred.accessTokenExpiresAt.getTime() - now < REFRESH_THRESHOLD_MS;

    // Token is still valid and not near expiry
    if (!isExpiringSoon) {
      return decryptToken(cred.accessTokenEncrypted);
    }

    // Token is expiring or expired: must refresh using refreshToken
    if (!cred.refreshTokenEncrypted) {
      // Offline token has no refresh token available; return current if not strictly expired
      if (!cred.accessTokenExpiresAt || cred.accessTokenExpiresAt.getTime() > now) {
        return decryptToken(cred.accessTokenEncrypted);
      }
      throw new ShopifyAuthRequiredError("Access token expired and no refresh token available");
    }

    // Acquire concurrent refresh lock
    const acquiredLock = await this.acquireRefreshLock(cred.id);
    if (!acquiredLock) {
      // Another request is currently refreshing the token; wait and re-read
      return this.waitForRefreshedToken(shop);
    }

    try {
      const rawRefreshToken = decryptToken(cred.refreshTokenEncrypted);
      const refreshResult = await this.executeTokenRefresh({
        shop,
        refreshToken: rawRefreshToken,
      });

      // Atomically persist new credential pair
      await this.saveCredentials({
        storeId: cred.storeId,
        shop,
        accessToken: refreshResult.access_token,
        expiresIn: refreshResult.expires_in,
        refreshToken: refreshResult.refresh_token,
        refreshTokenExpiresIn: refreshResult.refresh_token_expires_in,
        scope: refreshResult.scope,
      });

      return refreshResult.access_token;
    } catch (err) {
      // If refresh failed (e.g. refresh token revoked/expired), mark store as requiring reauth
      await prisma.shopifyCredential.update({
        where: { id: cred.id },
        data: { reauthRequired: true, refreshLockUntil: null },
      });
      throw new ShopifyAuthRequiredError(
        `Token refresh failed for ${shop}: ${(err as Error).message}`
      );
    }
  }

  private static async acquireRefreshLock(credentialId: string): Promise<boolean> {
    const now = new Date();
    const lockExpiry = new Date(now.getTime() + REFRESH_LOCK_LEASE_MS);

    // Atomically claim lock only if it is null or already expired
    const result = await prisma.shopifyCredential.updateMany({
      where: {
        id: credentialId,
        OR: [{ refreshLockUntil: null }, { refreshLockUntil: { lt: now } }],
      },
      data: {
        refreshLockUntil: lockExpiry,
      },
    });

    return result.count > 0;
  }

  private static async waitForRefreshedToken(shop: string, maxAttempts = 5): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const fresh = await this.findByShop(shop);
      if (!fresh) break;

      const isStillLocked =
        fresh.refreshLockUntil && fresh.refreshLockUntil.getTime() > Date.now();

      if (!isStillLocked && fresh.accessTokenExpiresAt) {
        if (fresh.accessTokenExpiresAt.getTime() - Date.now() > REFRESH_THRESHOLD_MS) {
          return decryptToken(fresh.accessTokenEncrypted);
        }
      }
    }

    // Fallback if lock timed out or resolved
    const latest = await this.findByShop(shop);
    if (latest && !latest.reauthRequired) {
      return decryptToken(latest.accessTokenEncrypted);
    }
    throw new ShopifyAuthRequiredError(`Concurrent refresh timed out for ${shop}`);
  }

  /**
   * Calls Shopify OAuth token refresh endpoint
   */
  private static async executeTokenRefresh(params: {
    shop: string;
    refreshToken: string;
  }): Promise<{
    access_token: string;
    expires_in?: number;
    refresh_token?: string;
    refresh_token_expires_in?: number;
    scope?: string;
  }> {
    const clientId = process.env.SHOPIFY_API_KEY;
    const clientSecret = process.env.SHOPIFY_API_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("SHOPIFY_API_KEY or SHOPIFY_API_SECRET missing in environment");
    }

    const tokenUrl = `https://${params.shop}/admin/oauth/access_token`;
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: params.refreshToken,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Shopify token refresh failed HTTP ${response.status}: ${errorText}`);
    }

    return response.json();
  }
}
