import { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { StoreRepository } from "@/server/repositories/storeRepository";
import { CredentialRepository } from "@/server/repositories/credentialRepository";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, hmac, shop } = req.query;

  if (!code || !hmac || !shop || typeof shop !== "string") {
    return res.status(400).send("Missing required OAuth parameters");
  }

  // 1. Verify Query HMAC
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) {
    return res.status(500).send("Server missing SHOPIFY_API_SECRET");
  }

  const queryParams = { ...req.query };
  delete queryParams.hmac;
  delete queryParams.signature;

  const sortedQuery = Object.keys(queryParams)
    .sort()
    .map((k) => `${k}=${queryParams[k]}`)
    .join("&");

  const calculatedHmac = crypto
    .createHmac("sha256", secret)
    .update(sortedQuery)
    .digest("hex");

  if (calculatedHmac !== hmac) {
    return res.status(401).send("OAuth query HMAC validation failed");
  }

  // 2. Exchange Code for Offline Access Token
  const clientId = process.env.SHOPIFY_API_KEY;
  const tokenUrl = `https://${shop}/admin/oauth/access_token`;

  try {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: secret,
        code,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).send(`Token exchange failed: ${errText}`);
    }

    const tokenData = await response.json();

    // 3. Upsert Store Record
    const store = await StoreRepository.upsertStore({ shop });

    // 4. Atomically Persist Encrypted Credentials
    await CredentialRepository.saveCredentials({
      storeId: store.id,
      shop,
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in,
      refreshToken: tokenData.refresh_token,
      refreshTokenExpiresIn: tokenData.refresh_token_expires_in,
      scope: tokenData.scope,
    });

    // 5. Redirect to Embedded Admin App
    const host = req.query.host ? String(req.query.host) : "";
    const redirectUrl = `/app?shop=${encodeURIComponent(shop)}${host ? `&host=${encodeURIComponent(host)}` : ""}`;
    return res.redirect(redirectUrl);
  } catch (err: any) {
    console.error("[OAuth Callback Error]:", err.message);
    return res.status(500).send(`OAuth error: ${err.message}`);
  }
}
