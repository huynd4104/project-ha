import type { SortDirection, SortOption } from "../utils/tableControls";

type TableControlsProps<T> = {
  page: number;
  pageSize: number;
  sortDirection: SortDirection;
  sortKey: string;
  sortOptions: SortOption<T>[];
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSortDirectionChange: (direction: SortDirection) => void;
  onSortKeyChange: (key: string) => void;
};

export function TableControls<T>({
  page,
  pageSize,
  sortDirection,
  sortKey,
  sortOptions,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onSortDirectionChange,
  onSortKeyChange
}: TableControlsProps<T>) {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(totalItems, page * pageSize);

  return (
    <div className="table-controls">
      <div className="table-controls-left">
        <span>
          Hiển thị {start}-{end} / {totalItems}
        </span>
        <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))} aria-label="Số dòng mỗi trang">
          {[10, 20, 50, 100].map((size) => <option key={size} value={size}>{size} dòng</option>)}
        </select>
      </div>
      <div className="table-controls-right">
        <label>
          Sắp xếp
          <select value={sortKey} onChange={(e) => onSortKeyChange(e.target.value)} aria-label="Sắp xếp theo">
            {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <select value={sortDirection} onChange={(e) => onSortDirectionChange(e.target.value as SortDirection)} aria-label="Chiều sắp xếp">
          <option value="asc">Tăng dần</option>
          <option value="desc">Giảm dần</option>
        </select>
        <button className="secondary" type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Trước</button>
        <span>Trang {page}/{totalPages}</span>
        <button className="secondary" type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Sau</button>
      </div>
    </div>
  );
}
