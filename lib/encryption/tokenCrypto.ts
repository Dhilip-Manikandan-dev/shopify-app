import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12; // 96 bits standard for GCM
const AUTH_TAG_LENGTH_BYTES = 16;

/**
 * Derives a 32-byte encryption key buffer from SHOPIFY_TOKEN_ENCRYPTION_KEY.
 * Supports 64-char hex or 44-char base64, with sha256 fallback if needed.
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.SHOPIFY_TOKEN_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error(
      "SHOPIFY_TOKEN_ENCRYPTION_KEY is required but not defined in environment."
    );
  }

  // Hex encoded 32-byte key (64 hex characters)
  if (/^[0-9a-fA-F]{64}$/.test(secret)) {
    return Buffer.from(secret, "hex");
  }

  // Base64 encoded 32-byte key
  if (secret.length === 44 && secret.endsWith("=")) {
    return Buffer.from(secret, "base64");
  }

  // Otherwise derive a deterministic 32-byte key via SHA-256
  return crypto.createHash("sha256").update(secret, "utf-8").digest();
}

/**
 * Encrypts a sensitive string (such as Shopify accessToken or refreshToken)
 * using AES-256-GCM authenticated encryption.
 * Output format: `ivHex:authTagHex:ciphertextHex`
 */
export function encryptToken(plainText: string): string {
  if (!plainText) {
    throw new Error("Cannot encrypt empty token");
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH_BYTES,
  });

  let ciphertext = cipher.update(plainText, "utf8", "hex");
  ciphertext += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext}`;
}

/**
 * Decrypts a sensitive token previously encrypted with encryptToken.
 * Validates the GCM authentication tag before returning plaintext.
 */
export function decryptToken(encryptedPayload: string): string {
  if (!encryptedPayload) {
    throw new Error("Cannot decrypt empty payload");
  }

  const parts = encryptedPayload.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted token format. Expected iv:authTag:ciphertext");
  }

  const [ivHex, authTagHex, ciphertextHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH_BYTES,
  });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertextHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
