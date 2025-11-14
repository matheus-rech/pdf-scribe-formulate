import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { ExtractionEntry } from '@/pages/Index';

/**
 * Create an annotated PDF with extraction highlights and notes
 */
export async function createAnnotatedPDF(
  originalPdfFile: File,
  extractions: ExtractionEntry[]
): Promise<Uint8Array> {
  // Read the original PDF
  const arrayBuffer = await originalPdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Group extractions by page
  const extractionsByPage = new Map<number, ExtractionEntry[]>();
  extractions.forEach(ext => {
    if (!extractionsByPage.has(ext.page)) {
      extractionsByPage.set(ext.page, []);
    }
    extractionsByPage.get(ext.page)!.push(ext);
  });
  
  // Add annotations to each page
  extractionsByPage.forEach((pageExtractions, pageNum) => {
    if (pageNum <= 0 || pageNum > pages.length) return;
    
    const page = pages[pageNum - 1];
    const { height } = page.getSize();
    
    pageExtractions.forEach((extraction, index) => {
      if (!extraction.coordinates) return;
      
      const { x, y, width, height: rectHeight } = extraction.coordinates;
      
      // Draw highlight rectangle (semi-transparent yellow)
      page.drawRectangle({
        x: x,
        y: height - y - rectHeight, // PDF coordinates are bottom-up
        width: width,
        height: rectHeight,
        color: rgb(1, 1, 0),
        opacity: 0.3,
        borderColor: rgb(1, 0.8, 0),
        borderWidth: 1
      });
      
      // Add annotation label
      const label = `${index + 1}`;
      const labelSize = 10;
      const labelWidth = boldFont.widthOfTextAtSize(label, labelSize);
      const labelHeight = labelSize + 4;
      
      // Draw label background
      page.drawRectangle({
        x: x - 2,
        y: height - y - labelHeight + 2,
        width: labelWidth + 4,
        height: labelHeight,
        color: rgb(1, 0.8, 0),
        borderColor: rgb(1, 0.6, 0),
        borderWidth: 1
      });
      
      // Draw label text
      page.drawText(label, {
        x: x,
        y: height - y - labelSize,
        size: labelSize,
        font: boldFont,
        color: rgb(0, 0, 0)
      });
    });
  });
  
  // Add summary page at the end
  const summaryPage = pdfDoc.addPage();
  const { width, height } = summaryPage.getSize();
  
  let yPosition = height - 50;
  const lineHeight = 14;
  const margin = 50;
  
  // Title
  summaryPage.drawText('Extraction Summary', {
    x: margin,
    y: yPosition,
    size: 18,
    font: boldFont,
    color: rgb(0, 0, 0)
  });
  
  yPosition -= 30;
  
  // Stats
  const uniquePages = new Set(extractions.map(e => e.page)).size;
  summaryPage.drawText(`Total Extractions: ${extractions.length}`, {
    x: margin,
    y: yPosition,
    size: 12,
    font: font,
    color: rgb(0, 0, 0)
  });
  
  yPosition -= lineHeight;
  summaryPage.drawText(`Pages with Data: ${uniquePages}`, {
    x: margin,
    y: yPosition,
    size: 12,
    font: font,
    color: rgb(0, 0, 0)
  });
  
  yPosition -= 25;
  
  // Extraction list
  summaryPage.drawText('Extractions:', {
    x: margin,
    y: yPosition,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0)
  });
  
  yPosition -= 20;
  
  extractions.forEach((ext, index) => {
    if (yPosition < 50) {
      // Need a new page
      const newPage = pdfDoc.addPage();
      yPosition = newPage.getSize().height - 50;
    }
    
    const text = `${index + 1}. [Page ${ext.page}] ${ext.fieldName}: ${ext.text.substring(0, 60)}${ext.text.length > 60 ? '...' : ''}`;
    const maxWidth = width - (margin * 2);
    
    summaryPage.drawText(text, {
      x: margin,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
      maxWidth: maxWidth
    });
    
    yPosition -= lineHeight;
  });
  
  // Save and return
  const pdfBytes = await pdfDoc.save();
  return new Uint8Array(pdfBytes);
}
