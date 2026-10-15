/**
 * SPSS Filter Condition Evaluator
 * Safely parses and evaluates SPSS SELECT CASES filter expressions against data rows.
 */

const JS_KEYWORDS = new Set([
  'true',
  'false',
  'null',
  'undefined',
  'nan',
  'infinity',
  'if',
  'else',
  'return',
  'function',
  'var',
  'let',
  'const',
  'in',
  'typeof',
  'instanceof',
]);

export function evaluateFilterCondition(condition: string, row: Record<string, any>): boolean {
  if (!condition || !condition.trim()) {
    return true;
  }

  const rawCond = condition.trim();
  if (rawCond.toUpperCase() === 'ALL' || rawCond === '1') {
    return true;
  }

  // Create case-insensitive lookup for row keys
  const rowLower: Record<string, any> = {};
  for (const [key, val] of Object.entries(row)) {
    rowLower[key.toLowerCase()] = val;
  }

  let expr = rawCond;

  // 1. Mask string literals so tokens inside strings are not modified
  const strings: string[] = [];
  let masked = expr.replace(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/g, (match) => {
    strings.push(match);
    return `__STR_${strings.length - 1}__`;
  });

  // 2. Replace SPSS comparison and logical operators
  masked = masked
    .replace(/\bAND\b/gi, ' && ')
    .replace(/\bOR\b/gi, ' || ')
    .replace(/\bNOT\b/gi, ' ! ')
    .replace(/<>/g, ' !== ')
    .replace(/~=/g, ' !== ')
    .replace(/([^<>=!])=([^=])/g, '$1 === $2');

  if (masked.startsWith('=')) {
    masked = '===' + masked.slice(1);
  }

  // 3. Replace variable identifiers with row lookup
  masked = masked.replace(/[a-zA-Z_$][a-zA-Z0-9_$]*/g, (ident) => {
    if (ident.startsWith('__STR_')) return ident;
    const lower = ident.toLowerCase();
    if (JS_KEYWORDS.has(lower)) {
      return ident;
    }
    if (Object.prototype.hasOwnProperty.call(rowLower, lower)) {
      return `rowLower[${JSON.stringify(lower)}]`;
    }
    return ident;
  });

  // 4. Restore string literals
  expr = masked.replace(/__STR_(\d+)__/g, (_, idx) => strings[Number(idx)]);

  // 5. Evaluate expression safely
  try {
    const fn = new Function('rowLower', `try { return Boolean(${expr}); } catch (e) { return false; }`);
    return Boolean(fn(rowLower));
  } catch (err) {
    console.warn('Invalid filter expression:', rawCond, err);
    return false;
  }
}
