import { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { shop } = req.query;

  if (!shop || typeof shop !== "string") {
    return res.status(400).send("Missing shop parameter");
  }

  // Sanitize shop domain
  const cleanShop = shop.replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!cleanShop.endsWith(".myshopify.com")) {
    return res.status(400).send("Invalid Shopify store domain");
  }

  const apiKey = process.env.SHOPIFY_API_KEY;
  const scopes =
    process.env.SHOPIFY_APP_SCOPES ||
    "read_products,write_products,read_customers,read_orders,read_discounts,write_discounts";
  const appUrl = process.env.SHOPIFY_APP_URL || `https://${req.headers.host}`;
  const redirectUri = `${appUrl}/api/auth/callback`;
  const state = crypto.randomBytes(16).toString("hex");

  const authUrl = `https://${cleanShop}/admin/oauth/authorize?client_id=${apiKey}&scope=${encodeURIComponent(
    scopes
  )}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

  return res.redirect(authUrl);
}
