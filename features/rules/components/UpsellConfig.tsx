import React, { useState } from "react";
import {
  Card,
  Button,
  TextField,
  Select,
  Checkbox,
  Thumbnail,
  Text,
} from "@shopify/polaris";
import { PlusIcon, DeleteIcon } from "@shopify/polaris-icons";
import { ProductPickerModal } from "@/features/products/components/ProductPickerModal";
import { UpsellItemConfig } from "@/lib/rule-engine/types";
import { SelectedProductVariant } from "@/features/products/types";

interface UpsellConfigProps {
  upsells: UpsellItemConfig[];
  onChange: (updated: UpsellItemConfig[]) => void;
  shop?: string;
}

export function UpsellConfig({ upsells, onChange, shop }: UpsellConfigProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleProductSelected = (selected: SelectedProductVariant) => {
    const defaultOfferPrice = Math.round(selected.price * 0.8); // 20% off by default
    const newItem: UpsellItemConfig = {
      productId: selected.productId,
      variantId: selected.variantId,
      title: selected.title,
      imageUrl: selected.imageUrl,
      originalPrice: selected.price,
      offerPrice: defaultOfferPrice,
      discountType: "PERCENTAGE",
      discountValue: 20,
      buttonText: `Add for ₹${defaultOfferPrice}`,
      maxProducts: 1,
      enabled: true,
      excludeIfInCart: true,
      displayOrder: upsells.length,
    };
    onChange([...upsells, newItem]);
  };

  const handleUpdateItem = (index: number, updated: Partial<UpsellItemConfig>) => {
    const next = [...upsells];
    next[index] = { ...next[index], ...updated };
    onChange(next);
  };

  const handleRemoveItem = (index: number) => {
    onChange(upsells.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <Text as="h3" variant="headingSm">
            Upsell Products (Frequently Bought Together)
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Target products to recommend at a special promotional price
          </Text>
        </div>
        <Button icon={PlusIcon} onClick={() => setPickerOpen(true)} variant="primary">
          Select Upsell Product
        </Button>
      </div>

      {upsells.length === 0 ? (
        <Card>
          <div className="text-center py-6 text-gray-500">
            <p className="mb-2">No upsell products selected yet.</p>
            <Button onClick={() => setPickerOpen(true)} variant="plain">
              Browse store catalog
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {upsells.map((item, idx) => (
            <Card key={item.id || idx}>
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Thumbnail
                      source={
                        item.imageUrl ||
                        "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                      }
                      alt={item.title}
                      size="medium"
                    />
                    <div>
                      <Text as="h4" variant="bodyMd" fontWeight="bold">
                        {item.title}
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Original: ₹{item.originalPrice} → Offer: ₹{item.offerPrice}
                      </Text>
                    </div>
                  </div>

                  <Button
                    icon={DeleteIcon}
                    tone="critical"
                    variant="tertiary"
                    onClick={() => handleRemoveItem(idx)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <TextField
                    label="Offer Price (₹)"
                    type="number"
                    value={String(item.offerPrice)}
                    onChange={(val) => {
                      const num = parseFloat(val) || 0;
                      handleUpdateItem(idx, {
                        offerPrice: num,
                        buttonText: `Add for ₹${num}`,
                      });
                    }}
                    autoComplete="off"
                  />

                  <TextField
                    label="Button Text"
                    value={item.buttonText || ""}
                    onChange={(val) => handleUpdateItem(idx, { buttonText: val })}
                    autoComplete="off"
                  />

                  <Select
                    label="Discount Mode"
                    options={[
                      { label: "Custom Offer Price", value: "FIXED" },
                      { label: "Percentage Discount", value: "PERCENTAGE" },
                      { label: "Free Gift (₹0)", value: "FREE" },
                    ]}
                    value={item.discountType || "PERCENTAGE"}
                    onChange={(val) => handleUpdateItem(idx, { discountType: val as any })}
                  />
                </div>

                <div className="pt-1">
                  <Checkbox
                    label="Exclude if this product is already in the cart"
                    checked={item.excludeIfInCart !== false}
                    onChange={(checked) =>
                      handleUpdateItem(idx, { excludeIfInCart: checked })
                    }
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ProductPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleProductSelected}
        shop={shop}
      />
    </div>
  );
}
