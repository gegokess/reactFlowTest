// PDF generation utilities (no external libraries)

/**
 * Generates a minimal PDF with an embedded JPEG image
 * PDF structure follows PDF 1.4 specification
 */
export async function generatePdfFromSvg(
  svgElement: SVGSVGElement,
  filename: string
): Promise<void> {
  // Convert SVG to canvas
  const canvas = await svgToCanvas(svgElement);

  // Convert canvas to JPEG
  const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.95);
  const jpegData = dataUrlToBytes(jpegDataUrl);

  // Create PDF with embedded JPEG
  const pdfBytes = createPdfWithImage(jpegData, canvas.width, canvas.height);

  // Download PDF
  downloadBlob(pdfBytes, filename, 'application/pdf');
}

/**
 * Converts SVG element to canvas
 */
async function svgToCanvas(svgElement: SVGSVGElement): Promise<HTMLCanvasElement> {
  // Get SVG dimensions
  const bbox = svgElement.getBoundingClientRect();
  const width = bbox.width || 1200;
  const height = bbox.height || 800;

  // Serialize SVG to string
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);

  // Create blob and object URL
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  // Load image
  const img = new Image();
  img.width = width;
  img.height = height;

  const loadPromise = new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
  });

  img.src = url;
  await loadPromise;

  // Draw to canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  URL.revokeObjectURL(url);

  return canvas;
}

/**
 * Converts data URL to byte array
 */
function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Creates a minimal PDF document with embedded JPEG image
 * A4 Landscape: 842 x 595 points (1 point = 1/72 inch)
 */
function createPdfWithImage(jpegData: Uint8Array, imgWidth: number, imgHeight: number): Uint8Array {
  const pageWidth = 842; // A4 landscape width in points
  const pageHeight = 595; // A4 landscape height in points

  // Calculate image dimensions to fit page (with margins)
  const margin = 40;
  const maxWidth = pageWidth - 2 * margin;
  const maxHeight = pageHeight - 2 * margin;

  const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
  const scaledWidth = imgWidth * scale;
  const scaledHeight = imgHeight * scale;

  // Center image on page
  const x = (pageWidth - scaledWidth) / 2;
  const y = (pageHeight - scaledHeight) / 2;

  // Build PDF structure
  const pdfLines: string[] = [];

  // Header
  pdfLines.push('%PDF-1.4');
  pdfLines.push('%âãÏÓ'); // Binary marker

  // Object 1: Catalog
  const obj1Start = getPdfPosition(pdfLines);
  pdfLines.push('1 0 obj');
  pdfLines.push('<< /Type /Catalog /Pages 2 0 R >>');
  pdfLines.push('endobj');

  // Object 2: Pages
  const obj2Start = getPdfPosition(pdfLines);
  pdfLines.push('2 0 obj');
  pdfLines.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  pdfLines.push('endobj');

  // Object 3: Page
  const obj3Start = getPdfPosition(pdfLines);
  pdfLines.push('3 0 obj');
  pdfLines.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}]`);
  pdfLines.push('   /Contents 4 0 R /Resources << /XObject << /Im1 5 0 R >> >> >>');
  pdfLines.push('endobj');

  // Object 4: Content stream
  const contentStream = `q\n${scaledWidth.toFixed(2)} 0 0 ${scaledHeight.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm\n/Im1 Do\nQ\n`;
  const obj4Start = getPdfPosition(pdfLines);
  pdfLines.push('4 0 obj');
  pdfLines.push(`<< /Length ${contentStream.length} >>`);
  pdfLines.push('stream');
  pdfLines.push(contentStream);
  pdfLines.push('endstream');
  pdfLines.push('endobj');

  // Object 5: Image
  const obj5Start = getPdfPosition(pdfLines);
  pdfLines.push('5 0 obj');
  pdfLines.push(`<< /Type /XObject /Subtype /Image /Width ${imgWidth} /Height ${imgHeight}`);
  pdfLines.push('   /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode');
  pdfLines.push(`   /Length ${jpegData.length} >>`);
  pdfLines.push('stream');

  // We'll add the binary JPEG data separately
  const beforeImage = pdfLines.join('\n') + '\n';
  const afterImage = '\nendstream\nendobj\n';

  // Cross-reference table
  const xrefStart = beforeImage.length + jpegData.length + afterImage.length;
  const xref = [
    'xref',
    '0 6',
    '0000000000 65535 f ',
    padOffset(obj1Start),
    padOffset(obj2Start),
    padOffset(obj3Start),
    padOffset(obj4Start),
    padOffset(obj5Start),
    'trailer',
    '<< /Size 6 /Root 1 0 R >>',
    'startxref',
    xrefStart.toString(),
    '%%EOF'
  ].join('\n');

  // Combine everything
  const textEncoder = new TextEncoder();
  const beforeBytes = textEncoder.encode(beforeImage);
  const afterBytes = textEncoder.encode(afterImage);
  const xrefBytes = textEncoder.encode(xref);

  const totalLength = beforeBytes.length + jpegData.length + afterBytes.length + xrefBytes.length;
  const pdfBytes = new Uint8Array(totalLength);

  let offset = 0;
  pdfBytes.set(beforeBytes, offset);
  offset += beforeBytes.length;
  pdfBytes.set(jpegData, offset);
  offset += jpegData.length;
  pdfBytes.set(afterBytes, offset);
  offset += afterBytes.length;
  pdfBytes.set(xrefBytes, offset);

  return pdfBytes;
}

function getPdfPosition(lines: string[]): number {
  return lines.join('\n').length + 1; // +1 for newline
}

function padOffset(offset: number): string {
  return offset.toString().padStart(10, '0') + ' 00000 n ';
}

/**
 * Downloads a blob as a file
 */
function downloadBlob(data: Uint8Array, filename: string, mimeType: string): void {
  const blob = new Blob([data as BlobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates PNG from SVG
 */
export async function generatePngFromSvg(
  svgElement: SVGSVGElement,
  filename: string
): Promise<void> {
  const canvas = await svgToCanvas(svgElement);

  // Convert to PNG blob
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 'image/png');
}
