import { useMemo, useState } from "react";
import { downloadCSVTemplate, downloadExcelTemplate, parseImportFile, toExcelTemplateFilename } from "../../utils/csv";
import type { CSVImportModalProps, ParsedCSVRow, ValidationResult } from "./types";

type PreviewRow = {
  source: ParsedCSVRow;
  result: ValidationResult;
};

export function CSVImportModal({
  isOpen,
  onClose,
  title,
  templateFilename,
  templateHeaders,
  templateExampleRows,
  warnings = [],
  validateRow,
  transformRow,
  onImport,
  onRefresh
}: CSVImportModalProps) {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ParsedCSVRow[]>([]);
  const [parseError, setParseError] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  const previewRows = useMemo<PreviewRow[]>(
    () => rows.map((row, index) => ({ source: row, result: validateRow(row, index) })),
    [rows, validateRow]
  );
  const validRows = previewRows.filter((row) => row.result.isValid);
  const invalidRows = previewRows.filter((row) => !row.result.isValid);
  const canImport = rows.length > 0 && invalidRows.length === 0 && !isImporting;

  if (!isOpen) return null;

  const resetAndClose = () => {
    setFileName("");
    setRows([]);
    setParseError("");
    setResultMessage("");
    onClose();
  };

  const handleFileChange = async (file?: File) => {
    setParseError("");
    setResultMessage("");
    setRows([]);
    setFileName(file?.name ?? "");
    if (!file) return;
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".csv") && !lowerName.endsWith(".xlsx")) {
      setParseError("Vui lòng chọn file .csv hoặc .xlsx.");
      return;
    }
    setIsParsing(true);
    try {
      const parsed = await parseImportFile(file);
      setRows(parsed);
    } catch (error: any) {
      console.error(error);
      setParseError(error?.message || "Không thể parse file import. Vui lòng kiểm tra format file.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (!canImport) return;
    setIsImporting(true);
    setResultMessage("");
    try {
      const payload = validRows.map((row) => {
        const normalized = row.result.normalizedRow ?? row.source;
        return transformRow ? transformRow(normalized) : normalized;
      });
      await onImport(payload);
      setResultMessage(`Import thành công ${payload.length} dòng.`);
      setRows([]);
      setFileName("");
    } catch (error: any) {
      console.error(error);
      setResultMessage(`Import thất bại: ${error?.message || "Lỗi không xác định"}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={resetAndClose}>
      <div className="modal-content csv-import-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={resetAndClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="csv-import-step">
            <div>
              <strong>1. Tải file CSV hoặc Excel lên</strong>
              <p>Vui lòng dùng đúng header CSV hoặc Excel. Có thể tải file mẫu.</p>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="secondary"
                onClick={() => downloadCSVTemplate(templateFilename, templateHeaders, templateExampleRows)}
              >
                Tải mẫu CSV
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => downloadExcelTemplate(toExcelTemplateFilename(templateFilename), templateHeaders, templateExampleRows)}
              >
                Tải mẫu Excel
              </button>
            </div>
          </div>

          <div className="csv-file-input">
            <input type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(e) => handleFileChange(e.target.files?.[0])} />
            {fileName && <span>{fileName}</span>}
          </div>

          {warnings.length > 0 && (
            <div className="csv-warning-box">
              {warnings.map((warning) => (
                <div key={warning}>{warning}</div>
              ))}
            </div>
          )}

          {isParsing && <p>Đang đọc file...</p>}
          {parseError && <p className="error-msg csv-error">{parseError}</p>}

          {rows.length > 0 && (
            <>
              <div className="csv-import-summary">
                <span>Tổng dòng: <strong>{rows.length}</strong></span>
                <span>Hợp lệ: <strong>{validRows.length}</strong></span>
                <span>Lỗi: <strong>{invalidRows.length}</strong></span>
              </div>

              <div className="table-wrap csv-preview-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: "72px" }}>Dòng</th>
                      <th style={{ width: "100px" }}>Trạng thái</th>
                      {templateHeaders.map((header) => (
                        <th key={header}>{header}</th>
                      ))}
                      <th>Lỗi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.slice(0, 20).map((row, index) => (
                      <tr key={index} className={row.result.isValid ? "" : "csv-invalid-row"}>
                        <td>{index + 2}</td>
                        <td>
                          <span className={`badge ${row.result.isValid ? "active" : "inactive"}`}>
                            {row.result.isValid ? "Hợp lệ" : "Có lỗi"}
                          </span>
                        </td>
                        {templateHeaders.map((header) => (
                          <td key={header}>{row.source[header] ?? ""}</td>
                        ))}
                        <td>{row.result.errors.join("; ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewRows.length > 20 && <p className="csv-helper">Đang hiển thị 20 dòng đầu tiên.</p>}
              {invalidRows.length > 0 && (
                <p className="error-msg csv-error">File còn dòng lỗi. Vui lòng sửa file rồi tải lên lại trước khi import.</p>
              )}
            </>
          )}

      {resultMessage && (
        <div className={resultMessage.startsWith("Import thành công") ? "csv-result-success" : "csv-result-error"}>
          {resultMessage}
          {resultMessage.startsWith("Import thành công") && onRefresh && (
            <div style={{ marginTop: "10px" }}>
              <button
                type="button"
                className="secondary"
                disabled={isRefreshing}
                onClick={async () => {
                  setIsRefreshing(true);
                  try {
                    await onRefresh();
                    setResultMessage(`${resultMessage} Danh sách đã được tải lại.`);
                  } finally {
                    setIsRefreshing(false);
                  }
                }}
              >
                {isRefreshing ? "Đang tải lại..." : "Tải lại danh sách"}
              </button>
            </div>
          )}
        </div>
      )}
        </div>

        <div className="modal-footer">
          <button type="button" className="secondary" onClick={resetAndClose}>Hủy</button>
          <button type="button" onClick={handleImport} disabled={!canImport}>
            {isImporting ? "Đang import..." : "Import các dòng hợp lệ"}
          </button>
        </div>
      </div>
    </div>
  );
}
