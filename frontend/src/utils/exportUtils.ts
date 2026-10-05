import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { OutputItem } from '../types/spss';

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

// 3. EXCEL OUTPUT EXPORT
export function exportReportToExcel(outputs: OutputItem[], datasetName: string): void {
  const wb = XLSX.utils.book_new();
  const cleanName = (datasetName || 'OpenSPSS').replace(/\.[^/.]+$/, '');

  let sheetCount = 0;
  outputs.forEach((item) => {
    if (item.type === 'descriptives' && item.data?.rows) {
      const ws = XLSX.utils.json_to_sheet(item.data.rows);
      XLSX.utils.book_append_sheet(wb, ws, `Descriptives_${++sheetCount}`.slice(0, 31));
    } else if (item.type === 'frequencies' && item.data?.tables) {
      item.data.tables.forEach((t: any) => {
        if (t.rows) {
          const ws = XLSX.utils.json_to_sheet(t.rows);
          XLSX.utils.book_append_sheet(wb, ws, `Freq_${t.variable}`.slice(0, 31));
        }
      });
    } else if (item.type === 'means_report' && item.data?.tables) {
      item.data.tables.forEach((t: any) => {
        if (t.rows) {
          const ws = XLSX.utils.json_to_sheet(t.rows);
          XLSX.utils.book_append_sheet(wb, ws, `Means_${t.dependent_variable}`.slice(0, 31));
        }
      });
    } else if (item.type === 'crosstabs' && item.data?.cells) {
      const rowsFormatted: any[] = [];
      item.data.row_categories?.forEach((rc: string, rIdx: number) => {
        const rowObj: Record<string, any> = { [item.data.row_var]: rc };
        item.data.col_categories?.forEach((cc: string, cIdx: number) => {
          rowObj[cc] = item.data.cells[rIdx]?.[cIdx]?.count ?? 0;
        });
        rowObj['Total'] = item.data.row_totals?.[rIdx] ?? 0;
        rowsFormatted.push(rowObj);
      });
      const ws = XLSX.utils.json_to_sheet(rowsFormatted);
      XLSX.utils.book_append_sheet(wb, ws, `Crosstab_${++sheetCount}`.slice(0, 31));
    }
  });

  if (wb.SheetNames.length === 0) {
    const ws = XLSX.utils.json_to_sheet([{ Message: 'No tabular statistical output to export.' }]);
    XLSX.utils.book_append_sheet(wb, ws, 'Summary');
  }

  XLSX.writeFile(wb, `${cleanName}_Output_Tables.xlsx`);
}
