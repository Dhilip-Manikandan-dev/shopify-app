import prisma from "@/lib/prisma";

export interface UpdateStoreSettingsInput {
  name?: string;
  currency?: string;
  country?: string;
  timezone?: string;
  domesticCountry?: string;
}

export class StoreRepository {
  /**
   * Find a store by its unique shop domain (e.g. "my-store.myshopify.com")
   */
  static async findByShop(shop: string) {
    return prisma.store.findUnique({
      where: { shop },
      include: {
        credential: true,
        subscription: true,
      },
    });
  }

  /**
   * Find a store by its internal UUID/CUID
   */
  static async findById(id: string) {
    return prisma.store.findUnique({
      where: { id },
      include: {
        credential: true,
        subscription: true,
      },
    });
  }

  /**
   * Find or create store upon Shopify app install or verification
   */
  static async upsertStore(params: {
    shop: string;
    name?: string;
    currency?: string;
    country?: string;
    timezone?: string;
    domesticCountry?: string;
  }) {
    return prisma.store.upsert({
      where: { shop: params.shop },
      create: {
        shop: params.shop,
        name: params.name,
        currency: params.currency ?? "INR",
        country: params.country ?? "IN",
        timezone: params.timezone ?? "Asia/Kolkata",
        domesticCountry: params.domesticCountry ?? "IN",
        isActive: true,
        installedAt: new Date(),
        uninstalledAt: null,
      },
      update: {
        name: params.name ?? undefined,
        currency: params.currency ?? undefined,
        country: params.country ?? undefined,
        timezone: params.timezone ?? undefined,
        isActive: true,
        uninstalledAt: null,
      },
      include: {
        credential: true,
        subscription: true,
      },
    });
  }

  /**
   * Update store settings (currency, domestic country, timezone, etc.)
   */
  static async updateSettings(storeId: string, data: UpdateStoreSettingsInput) {
    return prisma.store.update({
      where: { id: storeId },
      data: {
        name: data.name ?? undefined,
        currency: data.currency ?? undefined,
        country: data.country ?? undefined,
        timezone: data.timezone ?? undefined,
        domesticCountry: data.domesticCountry ?? undefined,
      },
    });
  }

  /**
   * Marks a store as inactive upon receiving APP_UNINSTALLED webhook
   */
  static async markUninstalled(shop: string) {
    const store = await prisma.store.findUnique({ where: { shop } });
    if (!store) return null;

    return prisma.$transaction([
      prisma.store.update({
        where: { id: store.id },
        data: {
          isActive: false,
          uninstalledAt: new Date(),
        },
      }),
      prisma.shopifyCredential.updateMany({
        where: { storeId: store.id },
        data: { reauthRequired: true },
      }),
      prisma.rule.updateMany({
        where: { storeId: store.id, status: "ACTIVE" },
        data: { status: "PAUSED" },
      }),
    ]);
  }
}
