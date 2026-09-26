import { CredentialRepository } from "@/server/repositories/credentialRepository";

export class ShopifyGraphQLClient {
  /**
   * Executes a GraphQL query against the Shopify Admin API for a specific shop.
   * Automatically fetches and verifies the fresh expiring offline access token.
   */
  static async query<T = any>(params: {
    shop: string;
    query: string;
    variables?: Record<string, any>;
  }): Promise<T> {
    const accessToken = await CredentialRepository.getValidAccessToken(params.shop);
    const apiVersion = process.env.SHOPIFY_API_VERSION || "2025-01";
    const endpoint = `https://${params.shop}/admin/api/${apiVersion}/graphql.json`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({
        query: params.query,
        variables: params.variables,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Shopify GraphQL API error HTTP ${response.status}: ${errorBody}`
      );
    }

    const json = await response.json();
    if (json.errors && json.errors.length > 0) {
      throw new Error(`Shopify GraphQL errors: ${json.errors.map((e: any) => e.message).join(", ")}`);
    }

    return json.data as T;
  }
}
