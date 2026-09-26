import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { verifyShopifyWebhookHmac } from "@/server/security/webhookHmac";
import { StoreRepository } from "@/server/repositories/storeRepository";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end("Method Not Allowed");
  }

  const rawBody = await getRawBody(req);
  const hmacHeader = req.headers["x-shopify-hmac-sha256"];
  const topic = req.headers["x-shopify-topic"] as string;
  const shop = req.headers["x-shopify-shop-domain"] as string;
  const webhookId = (req.headers["x-shopify-webhook-id"] as string) || "";

  // 1. Verify HMAC Authenticity
  if (!verifyShopifyWebhookHmac(rawBody, hmacHeader)) {
    console.warn(`[Webhook] HMAC verification failed for ${shop} topic: ${topic}`);
    return res.status(401).send("HMAC verification failed");
  }

  // 2. Check Idempotency
  if (webhookId) {
    const existing = await prisma.processedWebhook.findUnique({
      where: { webhookId },
    });
    if (existing) {
      console.log(`[Webhook] Duplicate webhook ${webhookId} already processed.`);
      return res.status(200).send("OK (Duplicate)");
    }

    await prisma.processedWebhook.create({
      data: {
        webhookId,
        topic: topic || "unknown",
        shop: shop || "unknown",
      },
    });
  }

  // 3. Process Topic
  try {
    switch (topic) {
      case "app/uninstalled": {
        console.log(`[Webhook] Processing app/uninstalled for shop: ${shop}`);
        await StoreRepository.markUninstalled(shop);
        break;
      }
      default: {
        console.log(`[Webhook] Received unhandled webhook topic: ${topic} for ${shop}`);
        break;
      }
    }

    return res.status(200).send("OK");
  } catch (err: any) {
    console.error(`[Webhook Error]:`, err.message);
    return res.status(500).send("Internal processing error");
  }
}
