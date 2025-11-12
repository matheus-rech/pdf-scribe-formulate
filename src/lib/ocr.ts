import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

let ocrPipeline: any = null;

export const initOCR = async () => {
  if (ocrPipeline) return ocrPipeline;
  
  try {
    console.log('Initializing OCR pipeline...');
    ocrPipeline = await pipeline(
      'image-to-text',
      'Xenova/trocr-small-printed',
      { device: 'webgpu' }
    );
    console.log('OCR pipeline initialized successfully');
    return ocrPipeline;
  } catch (error) {
    console.warn('WebGPU not available, falling back to CPU:', error);
    ocrPipeline = await pipeline(
      'image-to-text',
      'Xenova/trocr-small-printed'
    );
    return ocrPipeline;
  }
};

export const extractTextFromImage = async (imageDataUrl: string): Promise<string> => {
  try {
    const pipe = await initOCR();
    
    // Convert data URL to image element
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageDataUrl;
    });

    console.log('Running OCR on image...');
    const result = await pipe(imageDataUrl);
    
    console.log('OCR result:', result);
    
    // Extract text from result - handle various return formats
    if (Array.isArray(result) && result.length > 0) {
      const firstResult = result[0] as any;
      return firstResult.generated_text || firstResult.text || '';
    } else if (result && typeof result === 'object') {
      const objResult = result as any;
      return objResult.generated_text || objResult.text || '';
    }
    
    return '';
  } catch (error) {
    console.error('OCR error:', error);
    throw new Error(`OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Alternative: Use vision language model for better table/figure understanding
export const analyzeImageWithVision = async (imageDataUrl: string, prompt: string = "Extract all text from this image."): Promise<string> => {
  try {
    console.log('Initializing vision language model...');
    const captioner = await pipeline(
      'image-to-text',
      'Xenova/vit-gpt2-image-captioning'
    );
    
    const result = await captioner(imageDataUrl);
    console.log('Vision analysis result:', result);
    
    if (Array.isArray(result) && result.length > 0) {
      const firstResult = result[0] as any;
      return firstResult.generated_text || firstResult.text || '';
    } else if (result && typeof result === 'object') {
      const objResult = result as any;
      return objResult.generated_text || objResult.text || '';
    }
    
    return '';
  } catch (error) {
    console.error('Vision analysis error:', error);
    throw new Error(`Vision analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
