import prisma from "@/lib/prisma";
import { Prisma, RuleStatus } from "@prisma/client";
import { RuleDefinition } from "@/lib/rule-engine/types";

export class RuleRepository {
  /**
   * Retrieves all rules for a given store with pagination, status filter, and search.
   */
  static async findRulesByStore(params: {
    storeId: string;
    status?: RuleStatus;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.RuleWhereInput = {
      storeId: params.storeId,
      ...(params.status ? { status: params.status } : {}),
      ...(params.search
        ? {
            name: {
              contains: params.search,
              mode: "insensitive",
            },
          }
        : {}),
    };

    const [total, items] = await prisma.$transaction([
      prisma.rule.count({ where }),
      prisma.rule.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        include: {
          groups: {
            include: { conditions: { orderBy: { position: "asc" } } },
            orderBy: { position: "asc" },
          },
          actions: { orderBy: { position: "asc" } },
          upsells: { orderBy: { displayOrder: "asc" } },
          display: true,
        },
      }),
    ]);

    return {
      items: items.map(this.mapPrismaToDomain),
      total,
      page,
      pageSize,
      hasMore: skip + items.length < total,
    };
  }

  /**
   * Finds a single rule strictly scoped to storeId.
   */
  static async findRuleById(storeId: string, ruleId: string): Promise<RuleDefinition | null> {
    const rule = await prisma.rule.findFirst({
      where: { id: ruleId, storeId },
      include: {
        groups: {
          include: { conditions: { orderBy: { position: "asc" } } },
          orderBy: { position: "asc" },
        },
        actions: { orderBy: { position: "asc" } },
        upsells: { orderBy: { displayOrder: "asc" } },
        display: true,
      },
    });

    return rule ? this.mapPrismaToDomain(rule) : null;
  }

  /**
   * Finds all ACTIVE rules for a store for storefront evaluation.
   */
  static async findActiveRulesForStorefront(storeId: string): Promise<RuleDefinition[]> {
    const now = new Date();
    const rules = await prisma.rule.findMany({
      where: {
        storeId,
        status: "ACTIVE",
        AND: [
          { OR: [{ startAt: null }, { startAt: { lte: now } }] },
          { OR: [{ endAt: null }, { endAt: { gte: now } }] },
        ],
      },
      orderBy: { priority: "asc" },
      include: {
        groups: {
          include: { conditions: { orderBy: { position: "asc" } } },
          orderBy: { position: "asc" },
        },
        actions: { orderBy: { position: "asc" } },
        upsells: { where: { enabled: true }, orderBy: { displayOrder: "asc" } },
        display: true,
      },
    });

    return rules.map(this.mapPrismaToDomain);
  }

  /**
   * Creates a complete rule atomically with groups, conditions, actions, and upsells.
   */
  static async createRule(
    storeId: string,
    data: {
      name: string;
      description?: string;
      status?: RuleStatus;
      priority?: number;
      startAt?: Date | null;
      endAt?: Date | null;
      groups: Array<{
        position: number;
        conditions: Array<{
          field: string;
          operator: string;
          value: unknown;
          valueType?: string;
          position: number;
        }>;
      }>;
      actions: Array<{
        type: "SHIPPING" | "DISCOUNT" | "UPSELL";
        configuration: Record<string, unknown>;
        position: number;
      }>;
      upsells?: Array<{
        productId: string;
        variantId?: string;
        title: string;
        description?: string;
        imageUrl?: string;
        originalPrice: number;
        offerPrice: number;
        discountType?: string;
        discountValue?: number;
        buttonText?: string;
        maxProducts?: number;
        enabled?: boolean;
        displayOrder?: number;
        excludeIfInCart?: boolean;
      }>;
      display?: {
        productPage: boolean;
        collectionPage: boolean;
        cartPage: boolean;
      };
    }
  ): Promise<RuleDefinition> {
    const created = await prisma.$transaction(async (tx) => {
      const rule = await tx.rule.create({
        data: {
          storeId,
          name: data.name,
          description: data.description,
          status: data.status ?? "DRAFT",
          priority: data.priority ?? 10,
          startAt: data.startAt,
          endAt: data.endAt,
          display: data.display
            ? {
                create: {
                  productPage: data.display.productPage,
                  collectionPage: data.display.collectionPage,
                  cartPage: data.display.cartPage,
                },
              }
            : undefined,
          groups: {
            create: data.groups.map((g) => ({
              position: g.position,
              conditions: {
                create: g.conditions.map((c) => ({
                  field: c.field,
                  operator: c.operator,
                  value: typeof c.value === "string" ? c.value : JSON.stringify(c.value),
                  valueType: c.valueType ?? "string",
                  position: c.position,
                })),
              },
            })),
          },
          actions: {
            create: data.actions.map((a) => ({
              type: a.type,
              configuration: a.configuration as Prisma.InputJsonValue,
              position: a.position,
            })),
          },
          upsells: data.upsells?.length
            ? {
                create: data.upsells.map((u) => ({
                  productId: u.productId,
                  variantId: u.variantId,
                  title: u.title,
                  description: u.description,
                  imageUrl: u.imageUrl,
                  originalPrice: new Prisma.Decimal(u.originalPrice),
                  offerPrice: new Prisma.Decimal(u.offerPrice),
                  discountType: u.discountType ?? "PERCENTAGE",
                  discountValue: new Prisma.Decimal(u.discountValue ?? 0),
                  buttonText: u.buttonText ?? "Add to Cart",
                  maxProducts: u.maxProducts ?? 1,
                  enabled: u.enabled ?? true,
                  displayOrder: u.displayOrder ?? 0,
                  excludeIfInCart: u.excludeIfInCart ?? true,
                })),
              }
            : undefined,
        },
        include: {
          groups: {
            include: { conditions: { orderBy: { position: "asc" } } },
            orderBy: { position: "asc" },
          },
          actions: { orderBy: { position: "asc" } },
          upsells: { orderBy: { displayOrder: "asc" } },
          display: true,
        },
      });

      return rule;
    });

    return this.mapPrismaToDomain(created);
  }

  /**
   * Updates a rule atomically while preserving multi-tenant isolation.
   */
  static async updateRule(
    storeId: string,
    ruleId: string,
    data: {
      name?: string;
      description?: string;
      status?: RuleStatus;
      priority?: number;
      startAt?: Date | null;
      endAt?: Date | null;
      groups?: Array<{
        position: number;
        conditions: Array<{
          field: string;
          operator: string;
          value: unknown;
          valueType?: string;
          position: number;
        }>;
      }>;
      actions?: Array<{
        type: "SHIPPING" | "DISCOUNT" | "UPSELL";
        configuration: Record<string, unknown>;
        position: number;
      }>;
      upsells?: Array<{
        productId: string;
        variantId?: string;
        title: string;
        description?: string;
        imageUrl?: string;
        originalPrice: number;
        offerPrice: number;
        discountType?: string;
        discountValue?: number;
        buttonText?: string;
        maxProducts?: number;
        enabled?: boolean;
        displayOrder?: number;
        excludeIfInCart?: boolean;
      }>;
      display?: {
        productPage: boolean;
        collectionPage: boolean;
        cartPage: boolean;
      };
    }
  ): Promise<RuleDefinition | null> {
    const existing = await prisma.rule.findFirst({
      where: { id: ruleId, storeId },
    });
    if (!existing) return null;

    const updated = await prisma.$transaction(async (tx) => {
      // Re-create groups/actions if provided in full update
      if (data.groups) {
        await tx.condition.deleteMany({
          where: { ruleGroup: { ruleId } },
        });
        await tx.ruleGroup.deleteMany({
          where: { ruleId },
        });
      }

      if (data.actions) {
        await tx.action.deleteMany({
          where: { ruleId },
        });
      }

      if (data.upsells) {
        await tx.upsell.deleteMany({
          where: { ruleId },
        });
      }

      const rule = await tx.rule.update({
        where: { id: ruleId },
        data: {
          name: data.name ?? undefined,
          description: data.description ?? undefined,
          status: data.status ?? undefined,
          priority: data.priority ?? undefined,
          startAt: data.startAt ?? undefined,
          endAt: data.endAt ?? undefined,
          display: data.display
            ? {
                upsert: {
                  create: data.display,
                  update: data.display,
                },
              }
            : undefined,
          groups: data.groups
            ? {
                create: data.groups.map((g) => ({
                  position: g.position,
                  conditions: {
                    create: g.conditions.map((c) => ({
                      field: c.field,
                      operator: c.operator,
                      value: typeof c.value === "string" ? c.value : JSON.stringify(c.value),
                      valueType: c.valueType ?? "string",
                      position: c.position,
                    })),
                  },
                })),
              }
            : undefined,
          actions: data.actions
            ? {
                create: data.actions.map((a) => ({
                  type: a.type,
                  configuration: a.configuration as Prisma.InputJsonValue,
                  position: a.position,
                })),
              }
            : undefined,
          upsells: data.upsells?.length
            ? {
                create: data.upsells.map((u) => ({
                  productId: u.productId,
                  variantId: u.variantId,
                  title: u.title,
                  description: u.description,
                  imageUrl: u.imageUrl,
                  originalPrice: new Prisma.Decimal(u.originalPrice),
                  offerPrice: new Prisma.Decimal(u.offerPrice),
                  discountType: u.discountType ?? "PERCENTAGE",
                  discountValue: new Prisma.Decimal(u.discountValue ?? 0),
                  buttonText: u.buttonText ?? "Add to Cart",
                  maxProducts: u.maxProducts ?? 1,
                  enabled: u.enabled ?? true,
                  displayOrder: u.displayOrder ?? 0,
                  excludeIfInCart: u.excludeIfInCart ?? true,
                })),
              }
            : undefined,
        },
        include: {
          groups: {
            include: { conditions: { orderBy: { position: "asc" } } },
            orderBy: { position: "asc" },
          },
          actions: { orderBy: { position: "asc" } },
          upsells: { orderBy: { displayOrder: "asc" } },
          display: true,
        },
      });

      return rule;
    });

    return this.mapPrismaToDomain(updated);
  }

  /**
   * Soft-archives a rule by setting status = ARCHIVED.
   * Preserves historical execution logs and analytics.
   */
  static async archiveRule(storeId: string, ruleId: string) {
    const existing = await prisma.rule.findFirst({
      where: { id: ruleId, storeId },
    });
    if (!existing) return null;

    return prisma.rule.update({
      where: { id: ruleId },
      data: { status: "ARCHIVED" },
    });
  }

  private static mapPrismaToDomain(raw: any): RuleDefinition {
    return {
      id: raw.id,
      storeId: raw.storeId,
      name: raw.name,
      description: raw.description,
      status: raw.status,
      priority: raw.priority,
      startAt: raw.startAt,
      endAt: raw.endAt,
      groups: raw.groups.map((g: any) => ({
        id: g.id,
        position: g.position,
        conditions: g.conditions.map((c: any) => {
          let parsedValue: any = c.value;
          if (c.valueType === "array" || c.valueType === "number" || c.valueType === "boolean") {
            try {
              parsedValue = JSON.parse(c.value);
            } catch {
              parsedValue = c.value;
            }
          }
          return {
            id: c.id,
            field: c.field,
            operator: c.operator,
            value: parsedValue,
            valueType: c.valueType,
            position: c.position,
          };
        }),
      })),
      actions: raw.actions.map((a: any) => ({
        id: a.id,
        type: a.type,
        configuration: a.configuration,
        position: a.position,
      })),
      upsells: raw.upsells?.map((u: any) => ({
        id: u.id,
        productId: u.productId,
        variantId: u.variantId,
        title: u.title,
        description: u.description,
        imageUrl: u.imageUrl,
        originalPrice: Number(u.originalPrice),
        offerPrice: Number(u.offerPrice),
        discountType: u.discountType,
        discountValue: Number(u.discountValue),
        buttonText: u.buttonText,
        maxProducts: u.maxProducts,
        enabled: u.enabled,
        displayOrder: u.displayOrder,
        excludeIfInCart: u.excludeIfInCart,
      })),
      display: raw.display
        ? {
            productPage: raw.display.productPage,
            collectionPage: raw.display.collectionPage,
            cartPage: raw.display.cartPage,
          }
        : undefined,
    };
  }
}
