/**
 * PDF Figure Extraction Engine
 * 
 * Extracts figures directly from PDF.js operator lists for pixel-perfect quality.
 * Supports multiple color spaces and provides detailed diagnostics.
 */

export interface ExtractedFigure {
  id: string;
  pageNum: number;
  dataUrl: string;
  width: number;
  height: number;
  x: number;
  y: number;
  extractionMethod: string;
  metadata: {
    imageName: string;
    colorSpace: number;
    hasAlpha: boolean;
    dataLength: number;
  };
  caption?: string;
  aiEnhanced?: boolean;
}

export interface ExtractionDiagnostics {
  pageNum: number;
  totalOperators: number;
  imageOperators: number;
  extractedImages: number;
  filteredImages: number;
  errors: string[];
  processingTime: number;
  imageDetails: Array<{
    name: string;
    width: number;
    height: number;
    kind: number;
    hasAlpha: boolean;
    dataLength: number;
  }>;
}

export interface FigureExtractionResult {
  figures: ExtractedFigure[];
  diagnostics: ExtractionDiagnostics;
}

// PDF.js image operator type codes
const IMAGE_OPERATOR_TYPES = [
  92, // paintImageXObject - External image reference
  93, // paintInlineImageXObject - Embedded image data
  94, // paintImageMaskXObject - Image masks/transparency
];

/**
 * Convert image data to canvas and generate PNG data URL
 * Handles multiple color spaces: grayscale, RGB, RGBA, CMYK
 */
const convertImageDataToCanvas = (image: any): string => {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  const imageData = ctx.createImageData(image.width, image.height);
  const data = image.data;

  if (!data || data.length === 0) {
    throw new Error('Image has no data');
  }

  // Handle different color spaces
  if (image.kind === 1) {
    // Grayscale (1 byte per pixel)
    for (let j = 0; j < data.length; j++) {
      const gray = data[j];
      imageData.data[j * 4] = gray; // R
      imageData.data[j * 4 + 1] = gray; // G
      imageData.data[j * 4 + 2] = gray; // B
      imageData.data[j * 4 + 3] = 255; // Alpha
    }
  } else if (image.kind === 2) {
    // RGB format
    if (data.length === image.width * image.height * 4) {
      // Already RGBA - just copy
      imageData.data.set(data);
    } else if (data.length === image.width * image.height * 3) {
      // RGB - need to add alpha channel
      for (let j = 0, k = 0; j < data.length; j += 3, k += 4) {
        imageData.data[k] = data[j]; // R
        imageData.data[k + 1] = data[j + 1]; // G
        imageData.data[k + 2] = data[j + 2]; // B
        imageData.data[k + 3] = 255; // Alpha
      }
    } else {
      throw new Error(`Unexpected RGB data length: ${data.length} for ${image.width}x${image.height}`);
    }
  } else {
    // Other color spaces (CMYK, etc.) - best effort conversion
    const pixelCount = image.width * image.height;
    const bytesPerPixel = Math.max(1, Math.floor(data.length / pixelCount));

    for (let j = 0; j < pixelCount; j++) {
      const srcIndex = j * bytesPerPixel;

      if (bytesPerPixel >= 3) {
        // Assume RGB-like
        imageData.data[j * 4] = data[srcIndex] || 0;
        imageData.data[j * 4 + 1] = data[srcIndex + 1] || 0;
        imageData.data[j * 4 + 2] = data[srcIndex + 2] || 0;
      } else {
        // Grayscale fallback
        const gray = data[srcIndex] || 0;
        imageData.data[j * 4] = gray;
        imageData.data[j * 4 + 1] = gray;
        imageData.data[j * 4 + 2] = gray;
      }
      imageData.data[j * 4 + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
};

/**
 * Filter to determine if an image should be extracted as a figure
 */
const shouldExtractAsFigure = (image: any): boolean => {
  const minSize = 50; // Minimum dimension in pixels
  const aspectRatio = image.width / image.height;

  // Size check
  const isReasonableSize = image.width >= minSize && image.height >= minSize;

  // Aspect ratio check (very permissive to catch various figure types)
  const isNotTooWide = aspectRatio <= 20 && aspectRatio >= 0.05;

  // Data quality check
  const hasValidData = image.data && image.data.length > 0;

  return isReasonableSize && isNotTooWide && hasValidData;
};

/**
 * Extract figures from a single PDF page using operator list
 */
export const extractFiguresFromPage = async (
  page: any,
  pageNum: number
): Promise<FigureExtractionResult> => {
  const diagnostics: ExtractionDiagnostics = {
    pageNum,
    totalOperators: 0,
    imageOperators: 0,
    extractedImages: 0,
    filteredImages: 0,
    errors: [],
    processingTime: 0,
    imageDetails: [],
  };

  const startTime = Date.now();
  const figures: ExtractedFigure[] = [];

  try {
    // Get operator list from PDF.js
    const ops = await page.getOperatorList();
    diagnostics.totalOperators = ops.fnArray?.length || 0;

    // Iterate through all operators
    for (let i = 0; i < ops.fnArray.length; i++) {
      const opType = ops.fnArray[i];

      // Check if this is an image operator
      if (IMAGE_OPERATOR_TYPES.includes(opType)) {
        diagnostics.imageOperators++;

        try {
          const args = ops.argsArray[i];
          const imageName = args?.[0];

          if (!imageName) {
            diagnostics.errors.push(`No image name at operator ${i}`);
            continue;
          }

          // Retrieve the actual image object from PDF.js memory
          let image = null;

          try {
            // Primary method
            image = await page.objs.get(imageName);
          } catch (e) {
            // Fallback: direct memory access
            if (page.objs.objs && page.objs.objs[imageName]) {
              image = page.objs.objs[imageName];
            } else {
              throw e;
            }
          }

          if (image && image.width && image.height) {
            diagnostics.extractedImages++;

            // Log image details
            diagnostics.imageDetails.push({
              name: imageName,
              width: image.width,
              height: image.height,
              kind: image.kind,
              hasAlpha: !!image.smask,
              dataLength: image.data?.length || 0,
            });

            // Filter based on criteria
            if (shouldExtractAsFigure(image)) {
              diagnostics.filteredImages++;

              try {
                const dataUrl = convertImageDataToCanvas(image);

                // Extract position from transform matrix
                // Look backwards for recent transform operations (cm, Tm, etc.)
                let x = 0;
                let y = 0;
                const viewport = page.getViewport({ scale: 1.0 });
                
                // Search backwards up to 20 operators to find transform
                for (let j = Math.max(0, i - 20); j < i; j++) {
                  const prevOp = ops.fnArray[j];
                  const prevArgs = ops.argsArray[j];
                  
                  // OPS.transform = 19 (cm operator)
                  // OPS.setMatrix = 20 (Tm operator)
                  if ((prevOp === 19 || prevOp === 20) && prevArgs && prevArgs.length >= 6) {
                    // Transform matrix: [a, b, c, d, e, f]
                    // e = x translation, f = y translation
                    x = prevArgs[4] || 0;
                    y = viewport.height - (prevArgs[5] || 0) - image.height; // Convert to top-left origin
                    break;
                  }
                }

                figures.push({
                  id: `fig-${pageNum}-${figures.length + 1}`,
                  pageNum: pageNum,
                  dataUrl: dataUrl,
                  width: image.width,
                  height: image.height,
                  x,
                  y,
                  extractionMethod: 'PDF.js Operator List',
                  metadata: {
                    imageName,
                    colorSpace: image.kind,
                    hasAlpha: !!image.smask,
                    dataLength: image.data?.length || 0,
                  },
                });
              } catch (conversionError: any) {
                diagnostics.errors.push(
                  `Error converting image ${imageName}: ${conversionError.message}`
                );
              }
            }
          }
        } catch (error: any) {
          diagnostics.errors.push(`Error processing operator ${i}: ${error.message}`);
        }
      }
    }
  } catch (error: any) {
    diagnostics.errors.push(`Page processing error: ${error.message}`);
  }

  diagnostics.processingTime = Date.now() - startTime;

  return { figures, diagnostics };
};

/**
 * Extract figures from all pages of a PDF
 */
export const extractAllFigures = async (
  pdf: any,
  onProgress?: (current: number, total: number) => void
): Promise<{
  allFigures: ExtractedFigure[];
  allDiagnostics: ExtractionDiagnostics[];
}> => {
  const allFigures: ExtractedFigure[] = [];
  const allDiagnostics: ExtractionDiagnostics[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const result = await extractFiguresFromPage(page, pageNum);

    allFigures.push(...result.figures);
    allDiagnostics.push(result.diagnostics);

    if (onProgress) {
      onProgress(pageNum, pdf.numPages);
    }

    console.log(
      `Page ${pageNum}: Found ${result.figures.length} figures in ${result.diagnostics.processingTime}ms`
    );
  }

  return { allFigures, allDiagnostics };
};

/**
 * Generate diagnostic summary for all pages
 */
export const generateDiagnosticSummary = (
  diagnostics: ExtractionDiagnostics[]
): string => {
  const totalPages = diagnostics.length;
  const totalOperators = diagnostics.reduce((sum, d) => sum + d.totalOperators, 0);
  const totalImageOps = diagnostics.reduce((sum, d) => sum + d.imageOperators, 0);
  const totalExtracted = diagnostics.reduce((sum, d) => sum + d.extractedImages, 0);
  const totalFiltered = diagnostics.reduce((sum, d) => sum + d.filteredImages, 0);
  const totalTime = diagnostics.reduce((sum, d) => sum + d.processingTime, 0);
  const totalErrors = diagnostics.reduce((sum, d) => sum + d.errors.length, 0);

  return `
📊 Figure Extraction Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pages processed:     ${totalPages}
Total operators:     ${totalOperators.toLocaleString()}
Image operators:     ${totalImageOps}
Images extracted:    ${totalExtracted}
Images filtered:     ${totalFiltered}
Total time:          ${totalTime}ms (avg ${Math.round(totalTime / totalPages)}ms/page)
Errors:              ${totalErrors}

Extraction rate:     ${((totalFiltered / totalImageOps) * 100).toFixed(1)}%
Performance:         ${((totalPages / (totalTime / 1000)) * 60).toFixed(1)} pages/min
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `.trim();
};
