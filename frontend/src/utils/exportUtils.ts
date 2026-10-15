import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { OutputItem } from '../types/spss';

// Helper to sanitize sheet names for Excel (max 31 chars, no special prohibited chars)
export function sanitizeSheetName(name: string, existingNames = new Set<string>()): string {
  let cleaned = (name || 'Sheet')
    .replace(/[\\/?*[\]:]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 28);
  if (!cleaned) cleaned = 'Sheet';

  let unique = cleaned;
  let counter = 1;
  while (existingNames.has(unique.toLowerCase())) {
    unique = `${cleaned.slice(0, 26)}_${counter++}`;
  }
  existingNames.add(unique.toLowerCase());
  return unique;
}

// 1. REAL PDF EXPORT (Multi-page A4 canvas export)
export async function exportReportToPdf(datasetName: string): Promise<void> {
  const container = document.querySelector('.spss-output-doc-scroll') as HTMLElement | null;
  if (!container) {
    window.print();
    return;
  }

  // Save current styles
  const prevOverflow = container.style.overflow;
  const prevHeight = container.style.height;
  const prevMaxHeight = container.style.maxHeight;

  try {
    container.style.overflow = 'visible';
    container.style.height = 'auto';
    container.style.maxHeight = 'none';

    const canvas = await html2canvas(container, {
      scale: 1.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    const pdf = new jsPDF('p', 'mm', 'a4');
    let position = 0;

    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const cleanName = (datasetName || 'OpenSPSS').replace(/\.[^/.]+$/, '');
    pdf.save(`${cleanName}_Statistical_Report.pdf`);
  } catch (err: any) {
    console.error('PDF export error:', err);
    // Fallback to print
    window.print();
  } finally {
    container.style.overflow = prevOverflow;
    container.style.height = prevHeight;
    container.style.maxHeight = prevMaxHeight;
  }
}

// 2. WORD (.doc) EXPORT
export function exportReportToWord(outputs: OutputItem[], datasetName: string): void {
  const container = document.querySelector('.spss-output-doc-scroll');
  const innerHtml = container ? container.innerHTML : '<p>No output generated.</p>';

  const cleanName = (datasetName || 'OpenSPSS').replace(/\.[^/.]+$/, '');
  const wordContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${cleanName} - Statistical Report</title>
  <style>
    body { font-family: 'Times New Roman', Calibri, serif; font-size: 11pt; color: #111; }
    h1 { font-size: 16pt; font-weight: bold; border-bottom: 2px solid #333; padding-bottom: 4px; }
    .spss-pivot-title { font-size: 12pt; font-weight: bold; margin-top: 16pt; margin-bottom: 4pt; }
    .spss-pivot-table { width: 100%; border-collapse: collapse; margin-bottom: 12pt; }
    .spss-pivot-table th { border-top: 1.5pt solid black; border-bottom: 1pt solid black; padding: 4pt 6pt; font-weight: bold; }
    .spss-pivot-table td { border-bottom: 0.5pt solid #ddd; padding: 4pt 6pt; }
    .spss-pivot-total-row td { border-top: 1pt solid black; border-bottom: 1.5pt solid black; font-weight: bold; }
    .spss-syntax-log-block { background: #f4f4f4; border-left: 3pt solid #005a9c; padding: 6pt; font-family: 'Courier New', monospace; font-size: 9pt; margin-bottom: 8pt; }
    .spss-pivot-notes { font-size: 9pt; color: #555; font-style: italic; margin-top: 2pt; margin-bottom: 14pt; }
    .spss-btn, button { display: none !important; }
  </style>
</head>
<body>
  <h1>IBM SPSS Statistics Report - ${cleanName}</h1>
  <p>Generated on ${new Date().toLocaleString()} by OpenSPSS Statistics Studio</p>
  <hr/>
  ${innerHtml}
</body>
</html>
  `.trim();

  const blob = new Blob(['\ufeff', wordContent], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${cleanName}_Report.doc`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 3. STANDALONE HTML EXPORT
export function exportReportToHtml(outputs: OutputItem[], datasetName: string): void {
  const container = document.querySelector('.spss-output-doc-scroll');
  const innerHtml = container ? container.innerHTML : '<p>No output generated.</p>';
  const cleanName = (datasetName || 'OpenSPSS').replace(/\.[^/.]+$/, '');

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${cleanName} - Statistical Output Document</title>
  <style>
    :root {
      --bg-window: #f0f2f5;
      --bg-surface: #ffffff;
      --text-main: #1e293b;
      --text-muted: #64748b;
      --border-app: #cfd8dc;
      --border-cell: #e2e8f0;
      --border-header: #cbd5e1;
      --accent: #1976d2;
      --table-border-spss: #1e293b;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg-window);
      color: var(--text-main);
      padding: 32px;
      margin: 0;
      line-height: 1.5;
    }
    .report-container {
      max-width: 1000px;
      margin: 0 auto;
      background: var(--bg-surface);
      border: 1px solid var(--border-app);
      border-radius: 6px;
      padding: 32px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .report-header {
      border-bottom: 2px solid var(--accent);
      padding-bottom: 12px;
      margin-bottom: 28px;
    }
    .report-header h1 {
      margin: 0 0 6px 0;
      font-size: 20px;
      font-weight: 700;
      color: var(--accent);
    }
    .report-header p {
      margin: 0;
      font-size: 12px;
      color: var(--text-muted);
    }
    .spss-output-item-card {
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--border-cell);
    }
    .spss-output-item-title {
      font-size: 15px;
      font-weight: 700;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .spss-syntax-log-block {
      background: #f8fafc;
      border: 1px solid var(--border-cell);
      border-left: 4px solid var(--accent);
      padding: 8px 12px;
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
      font-size: 11px;
      margin-bottom: 12px;
      white-space: pre-wrap;
    }
    .spss-pivot-table-wrapper {
      margin: 12px 0;
      overflow-x: auto;
    }
    .spss-pivot-title {
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .spss-pivot-table {
      border-collapse: collapse;
      font-size: 12px;
      width: 100%;
      border-top: 2px solid var(--table-border-spss);
      border-bottom: 2px solid var(--table-border-spss);
      margin-bottom: 8px;
    }
    .spss-pivot-table th {
      border-top: 1.5px solid var(--table-border-spss);
      border-bottom: 1px solid var(--table-border-spss);
      padding: 4px 8px;
      font-weight: 600;
      background: #f8fafc;
      text-align: right;
    }
    .spss-pivot-table td {
      border-bottom: 0.5px solid var(--border-cell);
      padding: 4px 8px;
      text-align: right;
    }
    .spss-pivot-table th.align-left, .spss-pivot-table td.align-left {
      text-align: left;
    }
    .spss-pivot-table th.align-center, .spss-pivot-table td.align-center {
      text-align: center;
    }
    .spss-pivot-total-row td {
      border-top: 1px solid var(--table-border-spss);
      border-bottom: 1.5px solid var(--table-border-spss);
      font-weight: 700;
    }
    .spss-pivot-notes {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 4px;
    }
    button, .spss-btn { display: none !important; }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="report-header">
      <h1>IBM SPSS Statistics Output Document</h1>
      <p>Dataset: <strong>${cleanName}</strong> | Created: ${new Date().toLocaleString()}</p>
    </div>
    ${innerHtml}
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${cleanName}_Statistical_Report.html`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 4. DETERMINISTIC EXCEL WORKBOOK BUILDER (Supports All Procedures)
export function buildExcelWorkbook(outputs: OutputItem[]): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const existingSheetNames = new Set<string>();
  let sheetCount = 0;

  outputs.forEach((item) => {
    const data = item.data || {};
    const type = item.type;

    // 1. DESCRIPTIVES
    if (type === 'descriptives') {
      const rows = data.rows || data.descriptives;
      if (Array.isArray(rows) && rows.length > 0) {
        const formatted = rows.map((r: any) => ({
          Variable: r.variable,
          'Valid N': r.valid_n ?? '.',
          Mean: r.mean ?? '.',
          'Std. Error Mean': r.se_mean ?? '.',
          'Std. Deviation': r.std_dev ?? '.',
          Variance: r.variance ?? '.',
          Minimum: r.min ?? '.',
          Maximum: r.max ?? '.',
          Skewness: r.skewness ?? '.',
          Kurtosis: r.kurtosis ?? '.',
        }));

        if (data.valid_n_listwise !== undefined) {
          formatted.push({
            Variable: 'Valid N (listwise)',
            'Valid N': data.valid_n_listwise,
            Mean: '',
            'Std. Error Mean': '',
            'Std. Deviation': '',
            Variance: '',
            Minimum: '',
            Maximum: '',
            Skewness: '',
            Kurtosis: '',
          });
        }

        const ws = XLSX.utils.json_to_sheet(formatted);
        const name = sanitizeSheetName(`Descriptives_${++sheetCount}`, existingSheetNames);
        XLSX.utils.book_append_sheet(wb, ws, name);
      }
    }

    // 2. FREQUENCIES
    else if (type === 'frequencies' && Array.isArray(data.tables)) {
      if (data.tables.length > 1) {
        const statsSummary = data.tables.map((t: any) => ({
          Variable: t.variable,
          'Valid N': t.total_valid,
          'Missing N': t.total_missing,
          'Total N': t.total,
        }));
        const wsStats = XLSX.utils.json_to_sheet(statsSummary);
        const statsSheetName = sanitizeSheetName(`Freq_Statistics_${++sheetCount}`, existingSheetNames);
        XLSX.utils.book_append_sheet(wb, wsStats, statsSheetName);
      }

      data.tables.forEach((t: any) => {
        const rows: any[] = [];
        if (Array.isArray(t.rows)) {
          t.rows.forEach((r: any) => {
            rows.push({
              Category: 'Valid',
              Value: r.label !== r.value ? `${r.label} (${r.value})` : r.value,
              Frequency: r.frequency,
              Percent: r.percent,
              'Valid Percent': r.valid_percent !== null && r.valid_percent !== undefined ? r.valid_percent : '.',
              'Cumulative Percent': r.cumulative_percent !== null && r.cumulative_percent !== undefined ? r.cumulative_percent : '.',
            });
          });

          rows.push({
            Category: 'Valid',
            Value: 'Total',
            Frequency: t.total_valid,
            Percent: t.valid_total_percent ?? (t.total > 0 ? ((t.total_valid / t.total) * 100).toFixed(1) : '100.0'),
            'Valid Percent': '100.0',
            'Cumulative Percent': '',
          });
        }

        if (t.total_missing > 0 && Array.isArray(t.missing_rows)) {
          t.missing_rows.forEach((mr: any) => {
            rows.push({
              Category: 'Missing',
              Value: mr.label !== mr.value && mr.value !== '.' ? `${mr.label} (${mr.value})` : mr.label,
              Frequency: mr.frequency,
              Percent: mr.percent,
              'Valid Percent': '',
              'Cumulative Percent': '',
            });
          });
          rows.push({
            Category: 'Missing',
            Value: 'Total',
            Frequency: t.total_missing,
            Percent: t.missing_total_percent ?? ((t.total_missing / (t.total || 1)) * 100).toFixed(1),
            'Valid Percent': '',
            'Cumulative Percent': '',
          });
        }

        if (t.total > 0) {
          rows.push({
            Category: 'Total',
            Value: 'Total',
            Frequency: t.total,
            Percent: '100.0',
            'Valid Percent': '',
            'Cumulative Percent': '',
          });
        }

        if (rows.length > 0) {
          const ws = XLSX.utils.json_to_sheet(rows);
          const name = sanitizeSheetName(`Freq_${t.variable}`, existingSheetNames);
          XLSX.utils.book_append_sheet(wb, ws, name);
        }
      });
    }

    // 3. CORRELATIONS (PEARSON & NONPARAMETRIC)
    else if (type === 'correlations') {
      const pMat = data.pearson_matrix || data.matrix;
      if (Array.isArray(pMat)) {
        const rows: any[] = [];
        pMat.forEach((rowItem: any) => {
          const rObj: Record<string, any> = { Variable: rowItem.variable, Metric: 'Pearson Correlation' };
          const sigObj: Record<string, any> = { Variable: rowItem.variable, Metric: `Sig. (${data.options?.twoTailed === false ? '1-tailed' : '2-tailed'})` };
          const nObj: Record<string, any> = { Variable: rowItem.variable, Metric: 'N' };

          (rowItem.correlations || []).forEach((c: any) => {
            rObj[c.var2] = c.var1 === c.var2 ? 1 : (c.coefficient ?? '.');
            sigObj[c.var2] = c.var1 === c.var2 ? '' : (c.sig === 0 || c.sig_2_tailed === 0 ? '.000' : (c.sig ?? c.sig_2_tailed ?? '.'));
            nObj[c.var2] = c.n ?? '.';
          });

          rows.push(rObj, sigObj, nObj);
        });

        if (rows.length > 0) {
          const ws = XLSX.utils.json_to_sheet(rows);
          const name = sanitizeSheetName(`Correlations_${++sheetCount}`, existingSheetNames);
          XLSX.utils.book_append_sheet(wb, ws, name);
        }
      }

      // Nonparametric correlations (Kendall / Spearman)
      if (Array.isArray(data.kendall_matrix) || Array.isArray(data.spearman_matrix)) {
        const npRows: any[] = [];
        if (Array.isArray(data.kendall_matrix)) {
          data.kendall_matrix.forEach((rowItem: any) => {
            const rObj: Record<string, any> = { Method: "Kendall's tau_b", Variable: rowItem.variable, Metric: 'Correlation Coefficient' };
            rowItem.correlations?.forEach((c: any) => {
              rObj[c.var2] = c.coefficient !== null ? (c.var1 === c.var2 ? '1.000' : `${c.coefficient}${c.flag || ''}`) : '.';
            });
            npRows.push(rObj);
            const sigObj: Record<string, any> = { Method: "Kendall's tau_b", Variable: rowItem.variable, Metric: 'Sig.' };
            rowItem.correlations?.forEach((c: any) => {
              sigObj[c.var2] = c.var1 === c.var2 ? '.' : (c.sig !== null ? (c.sig === 0 ? '.000' : c.sig) : '.');
            });
            npRows.push(sigObj);
            const nObj: Record<string, any> = { Method: "Kendall's tau_b", Variable: rowItem.variable, Metric: 'N' };
            rowItem.correlations?.forEach((c: any) => {
              nObj[c.var2] = c.n ?? '.';
            });
            npRows.push(nObj);
          });
        }
        if (Array.isArray(data.spearman_matrix)) {
          data.spearman_matrix.forEach((rowItem: any) => {
            const rObj: Record<string, any> = { Method: "Spearman's rho", Variable: rowItem.variable, Metric: 'Correlation Coefficient' };
            rowItem.correlations?.forEach((c: any) => {
              rObj[c.var2] = c.coefficient !== null ? (c.var1 === c.var2 ? '1.000' : `${c.coefficient}${c.flag || ''}`) : '.';
            });
            npRows.push(rObj);
            const sigObj: Record<string, any> = { Method: "Spearman's rho", Variable: rowItem.variable, Metric: 'Sig.' };
            rowItem.correlations?.forEach((c: any) => {
              sigObj[c.var2] = c.var1 === c.var2 ? '.' : (c.sig !== null ? (c.sig === 0 ? '.000' : c.sig) : '.');
            });
            npRows.push(sigObj);
            const nObj: Record<string, any> = { Method: "Spearman's rho", Variable: rowItem.variable, Metric: 'N' };
            rowItem.correlations?.forEach((c: any) => {
              nObj[c.var2] = c.n ?? '.';
            });
            npRows.push(nObj);
          });
        }
        const wsNP = XLSX.utils.json_to_sheet(npRows);
        const nameNP = sanitizeSheetName(`Nonpar_Corr_${++sheetCount}`, existingSheetNames);
        XLSX.utils.book_append_sheet(wb, wsNP, nameNP);
      }
    }

    // 4. ONE-SAMPLE T-TEST
    else if (type === 'one_sample_t_test') {
      const rows: any[] = [];
      // Table 1: Descriptives
      if (Array.isArray(data.descriptives)) {
        rows.push({ Section: 'One-Sample Statistics', Variable: '', 'Stat / Value': '', 'df / N': '', Sig: '', 'Mean / Diff': '', 'CI Lower': '', 'CI Upper': '' });
        data.descriptives.forEach((d: any) => {
          rows.push({
            Section: 'Statistics',
            Variable: d.variable,
            'Stat / Value': d.mean ?? '.',
            'df / N': d.n ?? '.',
            Sig: '',
            'Mean / Diff': d.std_dev ?? '.',
            'CI Lower': d.se_mean ?? '.',
            'CI Upper': '',
          });
        });
      }
      // Table 2: Test Results
      if (Array.isArray(data.test_results)) {
        rows.push({ Section: `One-Sample Test (Test Value = ${data.test_value})`, Variable: '', 'Stat / Value': '', 'df / N': '', Sig: '', 'Mean / Diff': '', 'CI Lower': '', 'CI Upper': '' });
        data.test_results.forEach((t: any) => {
          rows.push({
            Section: 'Test Results',
            Variable: t.variable,
            'Stat / Value': t.t ?? '.',
            'df / N': t.df ?? '.',
            Sig: t.sig_2_tailed === 0 ? '.000' : (t.sig_2_tailed ?? '.'),
            'Mean / Diff': t.mean_difference ?? '.',
            'CI Lower': t.ci_lower ?? '.',
            'CI Upper': t.ci_upper ?? '.',
          });
        });
      }
      if (rows.length > 0) {
        const ws = XLSX.utils.json_to_sheet(rows);
        const name = sanitizeSheetName(`OneSample_TTest_${++sheetCount}`, existingSheetNames);
        XLSX.utils.book_append_sheet(wb, ws, name);
      }
    }

    // 5. INDEPENDENT SAMPLES T-TEST
    else if (type === 'independent_t_test') {
      const rows: any[] = [];
      if (Array.isArray(data.group_statistics)) {
        rows.push({ Table: 'Group Statistics', Variable: '', Group: '', N: '', Mean: '', 'Std. Deviation': '', 'Std. Error': '' });
        data.group_statistics.forEach((g: any) => {
          rows.push({
            Table: 'Group Statistics',
            Variable: g.variable,
            Group: g.group,
            N: g.n,
            Mean: g.mean,
            'Std. Deviation': g.std_dev,
            'Std. Error': g.se_mean,
          });
        });
      }
      if (Array.isArray(data.test_results)) {
        rows.push({ Table: 'Independent Samples Test', Variable: '', Group: '', N: '', Mean: '', 'Std. Deviation': '', 'Std. Error': '' });
        data.test_results.forEach((t: any) => {
          rows.push({
            Table: 'Equal variances assumed',
            Variable: t.variable,
            Group: `Levene F=${t.levene_f}, Sig=${t.levene_sig === 0 ? '.000' : t.levene_sig}`,
            N: t.equal_var_assumed?.df ?? '.',
            Mean: t.equal_var_assumed?.t ?? '.',
            'Std. Deviation': t.equal_var_assumed?.sig_2_tailed === 0 ? '.000' : (t.equal_var_assumed?.sig_2_tailed ?? '.'),
            'Std. Error': t.equal_var_assumed?.mean_diff ?? '.',
          });
          rows.push({
            Table: 'Equal variances not assumed',
            Variable: t.variable,
            Group: 'Welch t-test',
            N: t.equal_var_not_assumed?.df ?? '.',
            Mean: t.equal_var_not_assumed?.t ?? '.',
            'Std. Deviation': t.equal_var_not_assumed?.sig_2_tailed === 0 ? '.000' : (t.equal_var_not_assumed?.sig_2_tailed ?? '.'),
            'Std. Error': t.equal_var_not_assumed?.mean_diff ?? '.',
          });
        });
      }
      if (rows.length > 0) {
        const ws = XLSX.utils.json_to_sheet(rows);
        const name = sanitizeSheetName(`Indep_TTest_${++sheetCount}`, existingSheetNames);
        XLSX.utils.book_append_sheet(wb, ws, name);
      }
    }

    // 6. PAIRED SAMPLES T-TEST
    else if (type === 'paired_t_test') {
      const rows: any[] = [];
      if (Array.isArray(data.paired_statistics)) {
        data.paired_statistics.forEach((p: any) => {
          rows.push({
            Section: 'Paired Statistics',
            Pair: p.pair,
            Variable: p.variable,
            Mean: p.mean,
            N: p.n,
            'Std. Deviation': p.std_dev,
            'Std. Error Mean': p.se_mean,
          });
        });
      }
      if (Array.isArray(data.paired_differences)) {
        data.paired_differences.forEach((d: any) => {
          rows.push({
            Section: 'Paired Differences & Test',
            Pair: d.pair,
            Variable: `t=${d.t}, df=${d.df}, Sig=${d.sig_2_tailed === 0 ? '.000' : d.sig_2_tailed}`,
            Mean: d.mean,
            N: `95% CI [${d.ci_lower}, ${d.ci_upper}]`,
            'Std. Deviation': d.std_dev,
            'Std. Error Mean': d.se_mean,
          });
        });
      }
      if (rows.length > 0) {
        const ws = XLSX.utils.json_to_sheet(rows);
        const name = sanitizeSheetName(`Paired_TTest_${++sheetCount}`, existingSheetNames);
        XLSX.utils.book_append_sheet(wb, ws, name);
      }
    }

    // 7. ONE-WAY ANOVA
    else if (type === 'one_way_anova') {
      const rows: any[] = [];
      const anova = data.anova_table || {};
      rows.push({
        'Source of Variation': 'Between Groups',
        'Sum of Squares': anova.between_groups?.sum_of_squares ?? '.',
        df: anova.between_groups?.df ?? '.',
        'Mean Square': anova.between_groups?.mean_square ?? '.',
        F: anova.between_groups?.f ?? '.',
        Sig: anova.between_groups?.sig ?? '.',
      });
      rows.push({
        'Source of Variation': 'Within Groups',
        'Sum of Squares': anova.within_groups?.sum_of_squares ?? '.',
        df: anova.within_groups?.df ?? '.',
        'Mean Square': anova.within_groups?.mean_square ?? '.',
        F: '',
        Sig: '',
      });
      rows.push({
        'Source of Variation': 'Total',
        'Sum of Squares': anova.total?.sum_of_squares ?? '.',
        df: anova.total?.df ?? '.',
        'Mean Square': '',
        F: '',
        Sig: '',
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const name = sanitizeSheetName(`ANOVA_${++sheetCount}`, existingSheetNames);
      XLSX.utils.book_append_sheet(wb, ws, name);

      // Export Post-Hoc Multiple Comparisons sheets
      if (Array.isArray(data.post_hoc_tests) && data.post_hoc_tests.length > 0) {
        data.post_hoc_tests.forEach((t: any) => {
          if (Array.isArray(t.comparisons) && t.comparisons.length > 0) {
            const phRows = t.comparisons.map((c: any) => ({
              [`(I) ${data.factor_variable || 'Factor'}`]: c.group_i,
              [`(J) ${data.factor_variable || 'Factor'}`]: c.group_j,
              'Mean Difference (I-J)': c.mean_diff,
              'Std. Error': c.se,
              Sig: c.sig,
              'CI Lower': c.ci_lower,
              'CI Upper': c.ci_upper,
            }));
            const phWs = XLSX.utils.json_to_sheet(phRows);
            const phName = sanitizeSheetName(`PostHoc_${(t.test_name || 'Test').replace(/[^a-zA-Z0-9]/g, '')}`, existingSheetNames);
            XLSX.utils.book_append_sheet(wb, phWs, phName);
          }
        });
      }
    }

    // REPEATED MEASURES ANOVA
    else if (type === 'repeated_measures_anova') {
      if (Array.isArray(data.multivariate_tests) && data.multivariate_tests.length > 0) {
        const mvRows = data.multivariate_tests.map((m: any) => ({
          Effect: m.effect,
          Test: m.test,
          Value: m.value ?? '.',
          F: m.f ?? '.',
          'Hypothesis df': m.hypothesis_df ?? '.',
          'Error df': m.error_df ?? '.',
          Sig: m.sig ?? '.',
          'Partial Eta Squared': m.partial_eta_squared ?? '.',
        }));
        const mvWs = XLSX.utils.json_to_sheet(mvRows);
        const mvName = sanitizeSheetName(`RM_Multivariate_${++sheetCount}`, existingSheetNames);
        XLSX.utils.book_append_sheet(wb, mvWs, mvName);
      }
      if (Array.isArray(data.tests_within_subjects) && data.tests_within_subjects.length > 0) {
        const wsRows = data.tests_within_subjects.map((w: any) => ({
          Source: w.source,
          'Type III Sum of Squares': w.ss ?? '.',
          df: w.df ?? '.',
          'Mean Square': w.ms ?? '.',
          F: w.f ?? '.',
          Sig: w.sig ?? '.',
          'Partial Eta Squared': w.partialEtaSq ?? '.',
        }));
        const wsWs = XLSX.utils.json_to_sheet(wsRows);
        const wsName = sanitizeSheetName(`RM_Within_${++sheetCount}`, existingSheetNames);
        XLSX.utils.book_append_sheet(wb, wsWs, wsName);
      }
    }

    // 8. LINEAR REGRESSION
    else if (type === 'linear_regression') {
      const rows: any[] = [];
      // Model Summary
      const ms = data.model_summary || {};
      rows.push({
        Section: 'Model Summary',
        Item: 'Model 1',
        Metric1: `R = ${ms.r}`,
        Metric2: `R Square = ${ms.r_squared}`,
        Metric3: `Adj R Square = ${ms.adjusted_r_squared}`,
        Metric4: `Std Error = ${ms.std_error_estimate}`,
      });
      // Coefficients
      if (Array.isArray(data.coefficients)) {
        data.coefficients.forEach((c: any) => {
          rows.push({
            Section: 'Coefficients',
            Item: c.term,
            Metric1: `B = ${c.b}`,
            Metric2: `Std. Error = ${c.se}`,
            Metric3: `Beta = ${c.beta ?? '.'}`,
            Metric4: `t = ${c.t}, Sig = ${c.sig}`,
          });
        });
      }
      if (rows.length > 0) {
        const ws = XLSX.utils.json_to_sheet(rows);
        const name = sanitizeSheetName(`Regression_${++sheetCount}`, existingSheetNames);
        XLSX.utils.book_append_sheet(wb, ws, name);
      }
    }

    // 9. CROSSTABS
    else if (type === 'crosstabs' && data.cells) {
      // 9a. Case Processing Summary
      if (data.case_summary) {
        const caseRows = [
          {
            Comparison: `${data.row_var} * ${data.col_var}`,
            'Valid N': data.case_summary.valid,
            'Valid Percent': `${data.case_summary.valid_percent}%`,
            'Missing N': data.case_summary.missing,
            'Missing Percent': `${data.case_summary.missing_percent}%`,
            'Total N': data.case_summary.total,
            'Total Percent': `${data.case_summary.total_percent}%`,
          },
        ];
        const wsCases = XLSX.utils.json_to_sheet(caseRows);
        const nameCases = sanitizeSheetName(`Cases_${++sheetCount}`, existingSheetNames);
        XLSX.utils.book_append_sheet(wb, wsCases, nameCases);
      }

      // 9b. Crosstabulation Table
      const rowsFormatted: any[] = [];
      data.row_categories?.forEach((rc: string, rIdx: number) => {
        // Count row
        const countObj: Record<string, any> = { [data.row_var]: rc, Metric: 'Count' };
        data.col_categories?.forEach((cc: string, cIdx: number) => {
          countObj[cc] = data.cells[rIdx]?.[cIdx]?.count ?? 0;
        });
        countObj['Total'] = data.row_totals?.[rIdx] ?? 0;
        rowsFormatted.push(countObj);

        // Expected row if available
        if (data.options?.expected) {
          const expObj: Record<string, any> = { [data.row_var]: rc, Metric: 'Expected Count' };
          data.col_categories?.forEach((cc: string, cIdx: number) => {
            expObj[cc] = data.cells[rIdx]?.[cIdx]?.expected ?? 0;
          });
          expObj['Total'] = data.row_totals?.[rIdx] ?? 0;
          rowsFormatted.push(expObj);
        }

        // Row percent
        if (data.options?.rowPct !== false) {
          const pctObj: Record<string, any> = { [data.row_var]: rc, Metric: `% within ${data.row_var}` };
          data.col_categories?.forEach((cc: string, cIdx: number) => {
            pctObj[cc] = `${data.cells[rIdx]?.[cIdx]?.row_percent ?? 0}%`;
          });
          pctObj['Total'] = '100.0%';
          rowsFormatted.push(pctObj);
        }
      });

      // Total row
      const totalCountObj: Record<string, any> = { [data.row_var]: 'Total', Metric: 'Count' };
      data.col_categories?.forEach((cc: string, cIdx: number) => {
        totalCountObj[cc] = data.col_totals?.[cIdx] ?? 0;
      });
      totalCountObj['Total'] = data.grand_total ?? 0;
      rowsFormatted.push(totalCountObj);

      const ws = XLSX.utils.json_to_sheet(rowsFormatted);
      const name = sanitizeSheetName(`Crosstab_${++sheetCount}`, existingSheetNames);
      XLSX.utils.book_append_sheet(wb, ws, name);

      // 9c. Chi-Square Tests
      if (Array.isArray(data.chi_square_tests) && data.chi_square_tests.length > 0) {
        const chiRows = data.chi_square_tests.map((t: any) => ({
          Test: t.test,
          Value: t.value,
          df: t.df ?? '.',
          'Asymptotic Sig (2-sided)': t.asymp_sig_2_sided ?? '.',
          'Exact Sig (2-sided)': t.exact_sig_2_sided ?? '',
          'Exact Sig (1-sided)': t.exact_sig_1_sided ?? '',
        }));
        const wsChi = XLSX.utils.json_to_sheet(chiRows);
        const nameChi = sanitizeSheetName(`ChiSquare_${++sheetCount}`, existingSheetNames);
        XLSX.utils.book_append_sheet(wb, wsChi, nameChi);
      }

      // 9d. Symmetric Measures
      if (Array.isArray(data.symmetric_measures) && data.symmetric_measures.length > 0) {
        const symRows = data.symmetric_measures.map((sm: any) => ({
          Category: sm.category,
          Measure: sm.measure,
          Value: sm.value,
          'Approximate Sig': sm.approx_sig ?? '.',
        }));
        const wsSym = XLSX.utils.json_to_sheet(symRows);
        const nameSym = sanitizeSheetName(`Symmetric_${++sheetCount}`, existingSheetNames);
        XLSX.utils.book_append_sheet(wb, wsSym, nameSym);
      }

      // 9e. Risk Estimates
      if (Array.isArray(data.risk_estimates) && data.risk_estimates.length > 0) {
        const riskRows = data.risk_estimates.map((re: any) => ({
          Statistic: re.statistic,
          Value: re.value,
          '95% CI Lower': re.ciLower,
          '95% CI Upper': re.ciUpper,
        }));
        const wsRisk = XLSX.utils.json_to_sheet(riskRows);
        const nameRisk = sanitizeSheetName(`Risk_${++sheetCount}`, existingSheetNames);
        XLSX.utils.book_append_sheet(wb, wsRisk, nameRisk);
      }
    }


    // 10. MEANS REPORT
    else if (type === 'means_report' && Array.isArray(data.tables)) {
      data.tables.forEach((t: any) => {
        if (t.rows) {
          const ws = XLSX.utils.json_to_sheet(t.rows);
          const name = sanitizeSheetName(`Means_${t.dependent_variable}`, existingSheetNames);
          XLSX.utils.book_append_sheet(wb, ws, name);
        }
      });
    }

    // GENERIC FALLBACK FOR TABULAR DATA
    else if (data && typeof data === 'object') {
      const arrData = Object.values(data).find((val) => Array.isArray(val) && val.length > 0 && typeof val[0] === 'object');
      if (arrData) {
        const ws = XLSX.utils.json_to_sheet(arrData as any[]);
        const name = sanitizeSheetName(`${item.type}_${++sheetCount}`, existingSheetNames);
        XLSX.utils.book_append_sheet(wb, ws, name);
      }
    }
  });

  if (wb.SheetNames.length === 0) {
    const ws = XLSX.utils.json_to_sheet([{ Message: 'No tabular statistical output to export.' }]);
    XLSX.utils.book_append_sheet(wb, ws, 'Summary');
  }

  return wb;
}

// 5. EXCEL OUTPUT EXPORT ACTION
export function exportReportToExcel(outputs: OutputItem[], datasetName: string): void {
  const wb = buildExcelWorkbook(outputs);
  const cleanName = (datasetName || 'OpenSPSS').replace(/\.[^/.]+$/, '');
  XLSX.writeFile(wb, `${cleanName}_Output_Tables.xlsx`);
}

// 6. RICH CLIPBOARD COPY (TSV + Rich HTML Table)
export async function copyTableElementToClipboard(tableEl: HTMLElement): Promise<boolean> {
  if (!tableEl) return false;

  const rows = Array.from(tableEl.querySelectorAll('tr'));
  const tsv = rows
    .map((row) => {
      const cells = Array.from(row.querySelectorAll('th, td'));
      return cells.map((cell) => cell.textContent?.trim() || '').join('\t');
    })
    .join('\r\n');

  // Clone table to create styled clean HTML for clipboard
  const cloned = tableEl.cloneNode(true) as HTMLElement;
  cloned.querySelectorAll('button, svg, .spss-copy-table-btn').forEach((b) => b.remove());

  const richHtml = `
    <table style="border-collapse: collapse; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11pt; border-top: 2pt solid #000; border-bottom: 2pt solid #000; margin: 12px 0;">
      ${cloned.innerHTML}
    </table>
  `;

  if (navigator?.clipboard?.write && typeof ClipboardItem !== 'undefined') {
    try {
      const textBlob = new Blob([tsv], { type: 'text/plain' });
      const htmlBlob = new Blob([richHtml], { type: 'text/html' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': textBlob,
          'text/html': htmlBlob,
        }),
      ]);
      return true;
    } catch {
      // Fallback to writeText below
    }
  }

  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(tsv);
    return true;
  }

  return false;
}
