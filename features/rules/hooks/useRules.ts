import { useState, useEffect, useCallback } from "react";
import { RuleDefinition } from "../types";
import { getRules, archiveRule } from "../api";

export function useRules(shop?: string) {
  const [rules, setRules] = useState<RuleDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRules({
        shop,
        status: status === "ALL" ? undefined : status,
        search: search.trim() ? search.trim() : undefined,
        page,
      });
      setRules(data.items);
      setTotal(data.total);
      setTotalPages(Math.ceil(data.total / data.pageSize) || 1);
    } catch (err: any) {
      setError(err.message || "Failed to load rules");
    } finally {
      setLoading(false);
    }
  }, [shop, status, search, page]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleArchive = async (ruleId: string) => {
    try {
      await archiveRule(ruleId, shop);
      await fetchRules();
    } catch (err: any) {
      setError(err.message || "Failed to archive rule");
    }
  };

  return {
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
    total,
    refresh: fetchRules,
    archiveRule: handleArchive,
  };
}
