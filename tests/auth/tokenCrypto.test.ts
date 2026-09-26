import { describe, it, expect, beforeAll } from "vitest";
import { encryptToken, decryptToken } from "@/lib/encryption/tokenCrypto";

describe("tokenCrypto (AES-256-GCM)", () => {
  beforeAll(() => {
    process.env.SHOPIFY_TOKEN_ENCRYPTION_KEY =
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  });

  it("encrypts and decrypts a token correctly", () => {
    const originalToken = "shpca_sample_offline_access_token_1234567890";
    const encrypted = encryptToken(originalToken);

    expect(encrypted).not.toBe(originalToken);
    expect(encrypted.split(":").length).toBe(3);

    const decrypted = decryptToken(encrypted);
    expect(decrypted).toBe(originalToken);
  });

  it("produces different ciphertexts for the same plaintext due to random IV", () => {
    const token = "shpca_token_constant";
    const enc1 = encryptToken(token);
    const enc2 = encryptToken(token);

    expect(enc1).not.toBe(enc2);
    expect(decryptToken(enc1)).toBe(token);
    expect(decryptToken(enc2)).toBe(token);
  });

  it("rejects tampered ciphertext with authentication tag failure", () => {
    const encrypted = encryptToken("super_secret_shopify_refresh_token");
    const parts = encrypted.split(":");
    // Tamper with the ciphertext
    const tampered = `${parts[0]}:${parts[1]}:${parts[2].slice(0, -2)}ff`;

    expect(() => decryptToken(tampered)).toThrow();
  });

  it("rejects corrupted auth tag", () => {
    const encrypted = encryptToken("secret_token");
    const parts = encrypted.split(":");
    const badTag = "00".repeat(16);
    const tampered = `${parts[0]}:${badTag}:${parts[2]}`;

    expect(() => decryptToken(tampered)).toThrow();
  });
});
