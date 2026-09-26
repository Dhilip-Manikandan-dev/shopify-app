import React, { useState } from "react";
import {
  Card,
  Tabs,
  TextField,
  Pagination,
  InlineStack,
  BlockStack,
  Button,
} from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";
import { useRules } from "../hooks/useRules";
import { RuleTable } from "./RuleTable";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { RuleDefinition } from "../types";

interface RuleListProps {
  shop?: string;
  onNavigateCreate: () => void;
  onNavigateEdit: (ruleId: string) => void;
  onNavigateTest: (ruleId: string) => void;
}

const TABS = [
  { id: "ALL", content: "All Rules" },
  { id: "ACTIVE", content: "Active" },
  { id: "DRAFT", content: "Draft" },
  { id: "PAUSED", content: "Paused" },
  { id: "ARCHIVED", content: "Archived" },
];

export function RuleList({
  shop,
  onNavigateCreate,
  onNavigateEdit,
  onNavigateTest,
}: RuleListProps) {
  const {
    rules,
    loading,
    error,
    status,
    setStatus,
    search,
    setSearch,
    page,
    setPage,
    totalPages,
    refresh,
    archiveRule,
  } = useRules(shop);

  const [archiveTarget, setArchiveTarget] = useState<RuleDefinition | null>(null);
  const [archiving, setArchiving] = useState(false);

  const selectedTabIndex = TABS.findIndex((t) => t.id === status);

  const handleTabSelect = (index: number) => {
    setStatus(TABS[index].id);
    setPage(1);
  };

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    try {
      setArchiving(true);
      await archiveRule(archiveTarget.id);
      setArchiveTarget(null);
    } finally {
      setArchiving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card padding="0">
        <Tabs
          tabs={TABS}
          selected={selectedTabIndex >= 0 ? selectedTabIndex : 0}
          onSelect={handleTabSelect}
        >
          <div className="p-4 border-b border-gray-200 bg-white">
            <TextField
              label="Filter rules"
              labelHidden
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Search by rule name..."
              prefix={<SearchIcon />}
              clearButton
              onClearButtonClick={() => setSearch("")}
              autoComplete="off"
            />
          </div>

          {loading ? (
            <div className="p-8">
              <LoadingState message="Loading offer rules..." />
            </div>
          ) : error ? (
            <div className="p-8">
              <ErrorState title="Error Loading Rules" message={error} onRetry={refresh} />
            </div>
          ) : rules.length === 0 ? (
            <div className="p-8">
              <EmptyState
                heading={
                  search
                    ? "No rules found matching your search"
                    : "No smart offer rules yet"
                }
                action={{
                  content: "Create Rule",
                  onAction: onNavigateCreate,
                }}
              >
                <p>Create your first rule to trigger intelligent upsells, free shipping, and cart discounts based on customer tags and cart thresholds.</p>
              </EmptyState>
            </div>
          ) : (
            <div>
              <RuleTable
                rules={rules}
                onEdit={(rule) => onNavigateEdit(rule.id)}
                onTest={(rule) => onNavigateTest(rule.id)}
                onArchive={(rule) => setArchiveTarget(rule)}
              />

              {totalPages > 1 && (
                <div className="p-4 flex justify-center border-t border-gray-100">
                  <Pagination
                    hasPrevious={page > 1}
                    onPrevious={() => setPage((p) => Math.max(1, p - 1))}
                    hasNext={page < totalPages}
                    onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
                  />
                </div>
              )}
            </div>
          )}
        </Tabs>
      </Card>

      <ConfirmDialog
        open={!!archiveTarget}
        title="Archive Offer Rule?"
        message={`Are you sure you want to archive "${archiveTarget?.name}"? It will immediately stop triggering on all storefront surfaces.`}
        confirmLabel="Archive Rule"
        destructive
        loading={archiving}
        onConfirm={handleConfirmArchive}
        onCancel={() => setArchiveTarget(null)}
      />
    </div>
  );
}
