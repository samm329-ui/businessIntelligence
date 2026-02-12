import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';

/**
 * Professional Data Export
 * Generates branded Excel and PDF reports.
 */

export async function exportToExcel(data: any, industry: string) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Market Analysis');

    sheet.columns = [
        { header: 'Metric', key: 'metric', width: 25 },
        { header: 'Value', key: 'value', width: 20 },
        { header: 'Confidence', key: 'confidence', width: 15 }
    ];

    sheet.addRows([
        { metric: 'Industry', value: industry },
        { metric: 'Verdict', value: data.verdict },
        { metric: 'Revenue (LTM)', value: data.revenue },
        { metric: 'EBITDA (LTM)', value: data.ebitda }
    ]);

    // Style header
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D4AF37' } };

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
}

export async function exportToPdf(data: any, industry: string) {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setTextColor(212, 175, 55); // Gold
    doc.text(`EBITA Intelligence: ${industry}`, 20, 20);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Verdict: ${data.verdict}`, 20, 40);
    doc.text(`Analysis Date: ${new Date().toLocaleDateString()}`, 20, 50);

    doc.text(`Key Insights:`, 20, 70);
    data.keyInsights.forEach((insight: string, i: number) => {
        doc.text(`• ${insight}`, 30, 80 + (i * 10));
    });

    return doc.output('blob');
}
