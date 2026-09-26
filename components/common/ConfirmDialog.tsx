import React from "react";
import { Modal, Text } from "@shopify/polaris";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      primaryAction={{
        content: confirmLabel,
        destructive,
        loading,
        onAction: onConfirm,
      }}
      secondaryActions={[
        {
          content: "Cancel",
          disabled: loading,
          onAction: onCancel,
        },
      ]}
    >
      <Modal.Section>
        <Text as="p" variant="bodyMd">
          {message}
        </Text>
      </Modal.Section>
    </Modal>
  );
}
