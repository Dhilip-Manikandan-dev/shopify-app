import { ShopifyGraphQLClient } from "@/lib/shopify/client";
import { ShopifyProduct } from "@/types/shopify";

const PRODUCTS_QUERY = `
  query getProducts($query: String, $first: Int!) {
    products(first: $first, query: $query) {
      edges {
        node {
          id
          title
          handle
          vendor
          productType
          featuredImage {
            url
            altText
          }
          variants(first: 20) {
            edges {
              node {
                id
                title
                price
                compareAtPrice
                availableForSale
                sku
              }
            }
          }
        }
      }
    }
  }
`;

export class ShopifyService {
  static async searchProducts(params: {
    shop: string;
    query?: string;
    limit?: number;
  }): Promise<ShopifyProduct[]> {
    try {
      const data = await ShopifyGraphQLClient.query({
        shop: params.shop,
        query: PRODUCTS_QUERY,
        variables: {
          query: params.query ? `title:*${params.query}*` : undefined,
          first: params.limit ?? 20,
        },
      });

      if (!data?.products?.edges) {
        return [];
      }

      return data.products.edges.map((edge: any) => {
        const node = edge.node;
        return {
          id: node.id,
          title: node.title,
          handle: node.handle,
          vendor: node.vendor,
          productType: node.productType,
          featuredImage: node.featuredImage
            ? {
                url: node.featuredImage.url,
                altText: node.featuredImage.altText,
              }
            : undefined,
          variants: (node.variants?.edges || []).map((vEdge: any) => ({
            id: vEdge.node.id,
            title: vEdge.node.title,
            price: vEdge.node.price,
            compareAtPrice: vEdge.node.compareAtPrice,
            availableForSale: vEdge.node.availableForSale,
            sku: vEdge.node.sku,
          })),
        };
      });
    } catch (err: any) {
      console.error("[ShopifyService.searchProducts Error]:", err.message);
      // If credentials not yet configured in local test, return mock products for UI testing
      if (process.env.NODE_ENV === "development") {
        return [
          {
            id: "gid://shopify/Product/1001",
            title: "Classic Leather Sneakers",
            handle: "classic-leather-sneakers",
            vendor: "Acme Shoes",
            productType: "Footwear",
            featuredImage: {
              url: "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-lifestyle-1.jpg",
              altText: "Sneakers",
            },
            variants: [
              {
                id: "gid://shopify/ProductVariant/2001",
                title: "Size 9 / White",
                price: "2999.00",
                availableForSale: true,
              },
            ],
          },
          {
            id: "gid://shopify/Product/1002",
            title: "Premium Shoe Cleaner & Protectant",
            handle: "premium-shoe-cleaner",
            vendor: "Acme Care",
            productType: "Accessories",
            featuredImage: {
              url: "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-product-1.jpg",
              altText: "Shoe Cleaner",
            },
            variants: [
              {
                id: "gid://shopify/ProductVariant/2002",
                title: "150ml Bottle",
                price: "499.00",
                availableForSale: true,
              },
            ],
          },
          {
            id: "gid://shopify/Product/1003",
            title: "Cotton Ankle Socks (Pack of 3)",
            handle: "cotton-ankle-socks",
            vendor: "Acme Basics",
            productType: "Apparel",
            featuredImage: {
              url: "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-product-2.jpg",
              altText: "Socks",
            },
            variants: [
              {
                id: "gid://shopify/ProductVariant/2003",
                title: "One Size",
                price: "299.00",
                availableForSale: true,
              },
            ],
          },
        ];
      }
      throw err;
    }
  }
}
