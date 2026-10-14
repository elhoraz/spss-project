import { VariableMeta } from '../types/spss';

/**
 * Checks whether a value is System-Missing (empty, undefined, null, or '.').
 * In IBM SPSS Statistics, unentered or invalid numbers are system-missing.
 */
export function isSystemMissingValue(val: any): boolean {
  if (val === undefined || val === null) return true;
  const str = String(val).trim();
  return str === '' || str === '.';
}

/**
 * Checks whether a value matches a variable's User-Missing definition.
 * In IBM SPSS Statistics, user-missing values can be:
 * - Up to 3 discrete values: e.g. "99", "99, 999", "-1, 98, 99"
 * - A numeric range with optional discrete value: e.g. "90 THRU 99" or "90 THRU 99, 999"
 */
export function isUserMissingValue(val: any, varMeta?: VariableMeta | null): boolean {
  if (!varMeta || !varMeta.missing || varMeta.missing === 'None' || isSystemMissingValue(val)) {
    return false;
  }

  const strVal = String(val).trim();
  const numVal = typeof val === 'number' ? val : parseFloat(strVal);

  const def = varMeta.missing.trim();

  // Pattern: "LOW THRU HIGH" or "LOW THRU HIGH, DISCRETE"
  const thruMatch = def.match(/([+-]?\d+(?:\.\d+)?)\s+THRU\s+([+-]?\d+(?:\.\d+)?)(?:,\s*([+-]?\d+(?:\.\d+)?))?/i);
  if (thruMatch) {
    const low = parseFloat(thruMatch[1]);
    const high = parseFloat(thruMatch[2]);
    const discrete = thruMatch[3] !== undefined ? parseFloat(thruMatch[3]) : null;

    if (!isNaN(numVal)) {
      if (numVal >= low && numVal <= high) return true;
      if (discrete !== null && numVal === discrete) return true;
    }
    return false;
  }

  // Pattern: Comma-separated discrete values: "99", "99, 999", "-1, 8, 9"
  const discreteParts = def.split(',').map((p) => p.trim());
  for (const part of discreteParts) {
    if (part === strVal) return true;
    const pNum = parseFloat(part);
    if (!isNaN(pNum) && !isNaN(numVal) && pNum === numVal) {
      return true;
    }
  }

  return false;
}

/**
 * Checks whether a value is either System-Missing OR User-Missing.
 */
export function isMissingValue(val: any, varMeta?: VariableMeta | null): boolean {
  return isSystemMissingValue(val) || isUserMissingValue(val, varMeta);
}
