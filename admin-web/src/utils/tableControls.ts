import { useEffect, useMemo, useState } from "react";

export type SortDirection = "asc" | "desc";

export type SortOption<T> = {
  value: string;
  label: string;
  getValue: (item: T) => unknown;
};

function normalizeSortValue(value: unknown) {
  if (value == null) return "";
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "object" && typeof (value as any).toDate === "function") {
    return (value as any).toDate().getTime();
  }
  return String(value).toLowerCase();
}

export function useTableControls<T>(items: T[], sortOptions: SortOption<T>[], defaultSort?: string) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState(defaultSort || sortOptions[0]?.value || "");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const sortedItems = useMemo(() => {
    const option = sortOptions.find((item) => item.value === sortKey);
    if (!option) return items;
    return [...items].sort((a, b) => {
      const av = normalizeSortValue(option.getValue(a));
      const bv = normalizeSortValue(option.getValue(b));
      if (av < bv) return sortDirection === "asc" ? -1 : 1;
      if (av > bv) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [items, sortOptions, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / pageSize));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (safePage !== page) setPage(safePage);
  }, [page, safePage]);

  const pagedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedItems.slice(start, start + pageSize);
  }, [sortedItems, safePage, pageSize]);

  return {
    page: safePage,
    pageSize,
    pagedItems,
    setPage,
    onPageChange: setPage,
    setPageSize: (size: number) => {
      setPageSize(size);
      setPage(1);
    },
    onPageSizeChange: (size: number) => {
      setPageSize(size);
      setPage(1);
    },
    setSortKey,
    onSortKeyChange: setSortKey,
    setSortDirection,
    onSortDirectionChange: setSortDirection,
    sortDirection,
    sortKey,
    sortOptions,
    totalItems: sortedItems.length,
    totalPages
  };
}
