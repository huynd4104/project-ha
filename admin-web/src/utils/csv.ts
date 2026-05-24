import Papa from "papaparse";
import * as XLSX from "xlsx";

export function parseImportFile(file: File): Promise<Record<string, string>[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) return parseCSV(file);
  if (name.endsWith(".xlsx")) return parseXLSX(file);
  return Promise.reject(new Error("Vui lòng chọn file .csv hoặc .xlsx."));
}

export function parseCSV(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => normalizeString(header),
      transform: (value) => (typeof value === "string" ? value.trim() : value),
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(results.errors.map((err) => err.message).join("; ")));
          return;
        }
        resolve(results.data);
      },
      error: (error) => reject(error)
    });
  });
}

export function parseXLSX(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const workbook = XLSX.read(reader.result, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          reject(new Error("File Excel không có worksheet."));
          return;
        }
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
          defval: "",
          raw: false
        });
        resolve(rows.map(normalizeObjectRow));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error("Không thể đọc file Excel."));
    reader.readAsArrayBuffer(file);
  });
}

export function downloadCSVTemplate(filename: string, headers: string[], exampleRows: Record<string, string>[]) {
  const rows = exampleRows.length > 0 ? exampleRows : [Object.fromEntries(headers.map((header) => [header, ""]))];
  const csv = Papa.unparse({
    fields: headers,
    data: rows.map((row) => headers.map((header) => row[header] ?? ""))
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadExcelTemplate(filename: string, headers: string[], exampleRows: Record<string, string>[]) {
  const rows = exampleRows.length > 0 ? exampleRows : [Object.fromEntries(headers.map((header) => [header, ""]))];
  const worksheet = XLSX.utils.json_to_sheet(rows.map((row) => {
    return Object.fromEntries(headers.map((header) => [header, row[header] ?? ""]));
  }), { header: headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
  XLSX.writeFile(workbook, filename);
}

export function toExcelTemplateFilename(filename: string) {
  return filename.replace(/\.csv$/i, ".xlsx");
}

function normalizeObjectRow(row: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [normalizeString(key), normalizeString(value)])
  );
}

export function normalizeBoolean(value: unknown, defaultValue?: boolean): boolean | null {
  if (value === null || value === undefined || normalizeString(value) === "") {
    return defaultValue ?? null;
  }
  const normalized = normalizeString(value).toLowerCase();
  if (["true", "yes", "1"].includes(normalized)) return true;
  if (["false", "no", "0"].includes(normalized)) return false;
  return null;
}

export function normalizeNumber(value: unknown): number | null {
  if (value === null || value === undefined || normalizeString(value) === "") return null;
  const num = Number(normalizeString(value));
  return Number.isFinite(num) ? num : null;
}

export function normalizeString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function normalizeOptionalString(value: unknown): string | null {
  const normalized = normalizeString(value);
  return normalized ? normalized : null;
}

export function validateRequired(value: unknown): boolean {
  return normalizeString(value).length > 0;
}

export function validateUrl(value: unknown): boolean {
  const url = normalizeString(value);
  if (!url) return true;
  return /^(https?:\/\/|\/)/i.test(url);
}

export function validateEnum(value: unknown, allowedValues: readonly string[]): boolean {
  return allowedValues.includes(normalizeString(value));
}
