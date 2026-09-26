import React, { useState, useEffect, useTransition } from "react";
import {
  Modal,
  TextField,
  ResourceList,
  ResourceItem,
  Text,
  Thumbnail,
  Spinner,
  Banner,
} from "@shopify/polaris";
import { searchProducts } from "../api";
import { SelectedProductVariant, ShopifyProduct } from "../types";

interface ProductPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (item: SelectedProductVariant) => void;
  shop?: string;
}

export function ProductPickerModal({
  open,
  onClose,
  onSelect,
  shop,
}: ProductPickerModalProps) {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      searchProducts(query, shop, controller.signal)
        .then((data) => {
          startTransition(() => {
            setProducts(data);
            setLoading(false);
          });
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            setError(err.message);
            setLoading(false);
          }
        });
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open, shop]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Select Upsell Product"
      secondaryActions={[{ content: "Cancel", onAction: onClose }]}
    >
      <Modal.Section>
        <div className="space-y-4">
          <TextField
            label="Search Products"
            value={query}
            onChange={(val) => setQuery(val)}
            placeholder="Search by product title or vendor..."
            autoComplete="off"
            clearButton
            onClearButtonClick={() => setQuery("")}
          />

          {error && (
            <Banner tone="critical">
              <p>{error}</p>
            </Banner>
          )}

          {loading ? (
            <div className="flex justify-center p-8">
              <Spinner size="small" />
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <ResourceList
                resourceName={{ singular: "product", plural: "products" }}
                items={products}
                renderItem={(product) => {
                  const firstVariant = product.variants[0];
                  const price = firstVariant ? parseFloat(firstVariant.price) : 0;
                  const imageUrl =
                    product.featuredImage?.url ||
                    "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png";

                  return (
                    <ResourceItem
                      id={product.id}
                      onClick={() => {
                        onSelect({
                          productId: product.id,
                          variantId: firstVariant?.id,
                          title: product.title,
                          price,
                          imageUrl,
                        });
                        onClose();
                      }}
                      media={
                        <Thumbnail
                          source={imageUrl}
                          alt={product.title}
                          size="small"
                        />
                      }
                    >
                      <div className="flex justify-between items-center pr-4">
                        <div>
                          <Text as="h3" variant="bodyMd" fontWeight="bold">
                            {product.title}
                          </Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            {product.vendor || "Default Vendor"} · {product.variants.length} variant(s)
                          </Text>
                        </div>
                        <Text as="span" variant="bodyMd" fontWeight="semibold">
                          ₹{price.toFixed(0)}
                        </Text>
                      </div>
                    </ResourceItem>
                  );
                }}
              />
            </div>
          )}
        </div>
      </Modal.Section>
    </Modal>
  );
}
