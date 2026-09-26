import crypto from "crypto";

/**
 * Validates a Shopify webhook's HMAC-SHA256 signature against the raw body buffer.
 */
export function verifyShopifyWebhookHmac(
  rawBody: string | Buffer,
  hmacHeader: string | string[] | undefined
): boolean {
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret || !hmacHeader) {
    return false;
  }

  const hmacString = Array.isArray(hmacHeader) ? hmacHeader[0] : hmacHeader;
  if (!hmacString) {
    return false;
  }

  const bodyBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, "utf8");
  const calculatedHmac = crypto
    .createHmac("sha256", secret)
    .update(bodyBuffer)
    .digest("base64");

  try {
    const receivedBuffer = Buffer.from(hmacString, "base64");
    const calculatedBuffer = Buffer.from(calculatedHmac, "base64");

    if (receivedBuffer.length !== calculatedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(receivedBuffer, calculatedBuffer);
  } catch {
    return false;
  }
}
