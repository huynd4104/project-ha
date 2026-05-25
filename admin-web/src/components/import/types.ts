export type ValidationResult = {
  isValid: boolean;
  errors: string[];
  normalizedRow?: any;
};

export type ParsedCSVRow = Record<string, string>;

export type CSVImportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  templateFilename: string;
  templateHeaders: string[];
  templateExampleRows: Record<string, string>[];
  warnings?: string[];
  validateRow: (row: ParsedCSVRow, index: number) => ValidationResult;
  transformRow?: (row: any) => any;
  onImport: (validRows: any[]) => Promise<void>;
  onRefresh?: () => Promise<void> | void;
};
