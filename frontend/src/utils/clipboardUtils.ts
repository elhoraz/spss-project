import { VariableMeta, VariableType } from '../types/spss';

/**
 * Parses raw clipboard text (TSV from Excel, CSV, or plain text) into a 2D string matrix.
 * Accurately handles newlines inside quoted cells and escaped quotes.
 */
export function parseClipboardMatrix(text: string): string[][] {
  if (!text || text.length === 0) return [];

  // Determine delimiter: Excel always uses '\t' (Tab) in text/plain clipboard
  const hasTab = text.includes('\t');
  const delimiter = hasTab ? '\t' : (text.includes(',') && !text.includes('\t') ? ',' : '\t');

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped double quote ("")
        currentCell += '"';
        i++; // skip next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n
      }
      currentRow.push(currentCell.trim());
      currentCell = '';
      if (currentRow.some((c) => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentCell += char;
    }
  }

  // Push trailing cell & row
  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Parses an individual cell string from Excel / clipboard into typed data (number or string).
 * Seamlessly handles:
 * - Empty or '.' -> null (system-missing)
 * - Indonesian / European format: 12,5 or 1.250,50
 * - US format: 1,250.50 or 12.5
 * - Currencies: $100, Rp 50.000, €45,50
 * - Percentages: 25%
 */
export function parseExcelCell(rawStr: string): { value: any; isNumeric: boolean } {
  if (rawStr === undefined || rawStr === null) {
    return { value: null, isNumeric: false };
  }

  const trimmed = String(rawStr).trim();
  if (trimmed === '' || trimmed === '.') {
    return { value: null, isNumeric: true };
  }

  // Remove currency signs, percentage, and surrounding spaces
  const cleanStr = trimmed.replace(/^[\$Rp€£¥\s]+|[\s%]+$/g, '').trim();

  // Pattern 1: Indonesian / European format with thousand dots and decimal comma: e.g. 1.500,75 or -1.500,75
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(cleanStr)) {
    const normalized = cleanStr.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(normalized);
    if (!isNaN(num) && isFinite(num)) {
      return { value: num, isNumeric: true };
    }
  }

  // Pattern 2: Single comma decimal: e.g. 12,5 or -0,75
  if (/^-?\d+,\d+$/.test(cleanStr)) {
    const normalized = cleanStr.replace(',', '.');
    const num = parseFloat(normalized);
    if (!isNaN(num) && isFinite(num)) {
      return { value: num, isNumeric: true };
    }
  }

  // Pattern 3: US standard with thousand commas and decimal dot: e.g. 1,500.75 or -1,500.75
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(cleanStr)) {
    const normalized = cleanStr.replace(/,/g, '');
    const num = parseFloat(normalized);
    if (!isNaN(num) && isFinite(num)) {
      return { value: num, isNumeric: true };
    }
  }

  // Pattern 4: Standard float or integer: e.g. 123, 123.45, -45.6
  if (/^-?\d+(\.\d+)?$/.test(cleanStr)) {
    const num = parseFloat(cleanStr);
    if (!isNaN(num) && isFinite(num)) {
      return { value: num, isNumeric: true };
    }
  }

  // Scientific notation: e.g. 1.2e+5 or 3.4e-2
  if (/^-?\d+(\.\d+)?e[+-]?\d+$/i.test(cleanStr)) {
    const num = parseFloat(cleanStr);
    if (!isNaN(num) && isFinite(num)) {
      return { value: num, isNumeric: true };
    }
  }

  // Otherwise, return as string
  return { value: trimmed, isNumeric: false };
}

/**
 * Checks whether the first row of a matrix looks like header names.
 * In SPSS, if the first row has variable names (all strings, non-numeric)
 * and subsequent rows contain numbers, it strongly indicates headers.
 */
export function looksLikeHeaderRow(matrix: string[][]): boolean {
  if (matrix.length < 2) return false;

  const headerRow = matrix[0];
  const firstDataRow = matrix[1];

  if (!headerRow || headerRow.length === 0) return false;

  // Header row should have valid string names (not purely numbers)
  const headerAreStrings = headerRow.every((cell) => {
    const trimmed = cell.trim();
    if (trimmed.length === 0) return false;
    const { isNumeric } = parseExcelCell(trimmed);
    return !isNumeric;
  });

  if (!headerAreStrings) return false;

  // Check if second row has at least some numbers
  const dataHasNumbers = firstDataRow && firstDataRow.some((cell) => {
    const { isNumeric } = parseExcelCell(cell);
    return isNumeric;
  });

  return headerAreStrings && dataHasNumbers;
}

/**
 * Sanitizes an arbitrary header name to make it a valid SPSS variable name:
 * - Starts with letter or @
 * - Contains only letters, numbers, and underscores
 * - Max length 64 chars
 * - Does not collide with existing names
 */
export function sanitizeSpssVarName(
  rawName: string,
  existingNames: string[],
  fallbackIndex: number
): string {
  let name = rawName.trim().replace(/[^a-zA-Z0-9_]/g, '_');

  // Must not start with number or underscore
  if (/^[0-9_]/.test(name) || name.length === 0) {
    name = `VAR_${name}`.slice(0, 64);
  }

  name = name.slice(0, 64);
  if (name.length === 0) {
    name = `VAR0000${fallbackIndex + 1}`.slice(-8);
  }

  // Ensure uniqueness
  let finalName = name;
  let counter = 1;
  const lowerExisting = new Set(existingNames.map((n) => n.toLowerCase()));

  while (lowerExisting.has(finalName.toLowerCase())) {
    finalName = `${name}_${counter}`.slice(0, 64);
    counter++;
  }

  return finalName;
}

/**
 * Creates a default VariableMeta object
 */
export function createDefaultVariableMeta(name: string, type: VariableType = 'Numeric'): VariableMeta {
  return {
    name,
    type,
    width: type === 'String' ? 50 : 8,
    decimals: type === 'String' ? 0 : 2,
    label: '',
    values: {},
    missing: 'None',
    columns: type === 'String' ? 12 : 8,
    align: type === 'String' ? 'Left' : 'Right',
    measure: type === 'String' ? 'Nominal' : 'Scale',
    role: 'Input',
  };
}
