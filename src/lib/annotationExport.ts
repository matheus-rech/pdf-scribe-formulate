import type { PageAnnotation } from "@/hooks/usePageAnnotations";

export interface AnnotationExportData {
  version: "1.0";
  exportDate: string;
  pdfFileName: string;
  totalPages: number;
  annotations: Array<{
    pageNumber: number;
    canvasJSON: any;
    thumbnail: string;
    timestamp: number;
    metadata: {
      toolsUsed: string[];
      objectCount: number;
      colors: string[];
    };
  }>;
}

function extractToolsFromJSON(canvasJSON: any): string[] {
  if (!canvasJSON?.objects) return [];
  
  const tools = new Set<string>();
  canvasJSON.objects.forEach((obj: any) => {
    if (obj.type === 'path') tools.add('pen');
    else if (obj.type === 'line') tools.add('line');
    else if (obj.type === 'rect') tools.add('rectangle');
    else if (obj.type === 'circle') tools.add('circle');
    else if (obj.type === 'polygon') tools.add('polygon');
    else if (obj.type === 'i-text' || obj.type === 'text') tools.add('text');
  });
  
  return Array.from(tools);
}

function extractColorsFromJSON(canvasJSON: any): string[] {
  if (!canvasJSON?.objects) return [];
  
  const colors = new Set<string>();
  canvasJSON.objects.forEach((obj: any) => {
    if (obj.stroke) colors.add(obj.stroke);
    if (obj.fill) colors.add(obj.fill);
  });
  
  return Array.from(colors);
}

export function exportAnnotationsAsJSON(
  annotations: PageAnnotation[],
  pdfFileName: string
): void {
  const exportData: AnnotationExportData = {
    version: "1.0",
    exportDate: new Date().toISOString(),
    pdfFileName,
    totalPages: annotations.length,
    annotations: annotations.map(ann => ({
      pageNumber: ann.pageNumber,
      canvasJSON: ann.canvasJSON,
      thumbnail: ann.thumbnail,
      timestamp: ann.timestamp,
      metadata: {
        toolsUsed: extractToolsFromJSON(ann.canvasJSON),
        objectCount: ann.canvasJSON?.objects?.length || 0,
        colors: extractColorsFromJSON(ann.canvasJSON)
      }
    }))
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json'
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${pdfFileName.replace('.pdf', '')}_annotations_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function validateAnnotationImport(data: any): { 
  isValid: boolean; 
  error?: string 
} {
  if (!data.version) {
    return { isValid: false, error: 'Missing version field' };
  }
  
  if (!data.annotations || !Array.isArray(data.annotations)) {
    return { isValid: false, error: 'Missing or invalid annotations array' };
  }
  
  for (let i = 0; i < data.annotations.length; i++) {
    const ann = data.annotations[i];
    if (typeof ann.pageNumber !== 'number') {
      return { isValid: false, error: `Invalid pageNumber in annotation ${i}` };
    }
    if (!ann.canvasJSON) {
      return { isValid: false, error: `Missing canvasJSON in annotation ${i}` };
    }
    if (typeof ann.timestamp !== 'number') {
      return { isValid: false, error: `Invalid timestamp in annotation ${i}` };
    }
  }
  
  return { isValid: true };
}

export function parseAnnotationJSON(jsonString: string): {
  success: boolean;
  data?: AnnotationExportData;
  error?: string;
} {
  try {
    const data = JSON.parse(jsonString);
    const validation = validateAnnotationImport(data);
    
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }
    
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to parse JSON' 
    };
  }
}
