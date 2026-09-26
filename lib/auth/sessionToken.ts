import crypto from "crypto";
import { ShopifySessionTokenPayload } from "@/types/shopify";

export class InvalidSessionTokenError extends Error {
  code = "INVALID_SESSION_TOKEN";
  constructor(message = "Invalid or expired Shopify session token.") {
    super(message);
    this.name = "InvalidSessionTokenError";
  }
}

/**
 * Validates a Shopify App Bridge Session Token (JWT).
 * Signature algorithm: HS256 using SHOPIFY_API_SECRET.
 * Audience: SHOPIFY_API_KEY.
 */
export function verifyShopifySessionToken(
  token: string
): { shop: string; payload: ShopifySessionTokenPayload } {
  if (!token) {
    throw new InvalidSessionTokenError("Session token missing");
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new InvalidSessionTokenError("Malformed JWT structure");
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const secret = process.env.SHOPIFY_API_SECRET;
  const apiKey = process.env.SHOPIFY_API_KEY;

  if (!secret) {
    throw new Error("SHOPIFY_API_SECRET is missing from server environment");
  }

  // Verify HMAC-SHA256 signature
  const dataToSign = `${headerB64}.${payloadB64}`;
  const calculatedSig = crypto
    .createHmac("sha256", secret)
    .update(dataToSign)
    .digest("base64url");

  if (calculatedSig !== signatureB64) {
    throw new InvalidSessionTokenError("Signature verification failed");
  }

  // Parse payload
  let payload: ShopifySessionTokenPayload;
  try {
    const jsonStr = Buffer.from(payloadB64, "base64url").toString("utf8");
    payload = JSON.parse(jsonStr);
  } catch {
    throw new InvalidSessionTokenError("Could not decode payload JSON");
  }

  const now = Math.floor(Date.now() / 1000);

  // Validate expiry and nbf
  if (payload.exp && payload.exp < now) {
    throw new InvalidSessionTokenError("Session token has expired");
  }
  if (payload.nbf && payload.nbf > now + 60) {
    throw new InvalidSessionTokenError("Session token not yet valid");
  }

  // Validate audience
  if (apiKey && payload.aud && payload.aud !== apiKey) {
    throw new InvalidSessionTokenError(`Audience mismatch. Expected ${apiKey}, got ${payload.aud}`);
  }

  // Extract shop domain from dest URL (e.g. "https://example.myshopify.com")
  let shop = "";
  if (payload.dest) {
    shop = payload.dest.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }

  if (!shop && payload.iss) {
    // iss is e.g. "https://example.myshopify.com/admin"
    shop = payload.iss.replace(/^https?:\/\//, "").replace(/\/admin.*$/, "");
  }

  if (!shop) {
    throw new InvalidSessionTokenError("Could not determine shop domain from session token");
  }

  return {
    shop,
    payload,
  };
}
