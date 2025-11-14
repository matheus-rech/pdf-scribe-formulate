/**
 * Parsing Error Handler
 * 
 * Provides comprehensive error handling and user-friendly feedback for PDF parsing failures.
 * Helps users understand what went wrong and how to fix it.
 */

export enum ParsingErrorType {
  /** PDF file is corrupted or invalid */
  CORRUPTED_PDF = 'CORRUPTED_PDF',
  
  /** PDF is password-protected */
  PASSWORD_PROTECTED = 'PASSWORD_PROTECTED',
  
  /** PDF contains only scanned images (no text layer) */
  SCANNED_PDF = 'SCANNED_PDF',
  
  /** PDF parsing timed out */
  TIMEOUT = 'TIMEOUT',
  
  /** No text could be extracted */
  NO_TEXT_EXTRACTED = 'NO_TEXT_EXTRACTED',
  
  /** Table extraction failed */
  TABLE_EXTRACTION_FAILED = 'TABLE_EXTRACTION_FAILED',
  
  /** Section detection failed */
  SECTION_DETECTION_FAILED = 'SECTION_DETECTION_FAILED',
  
  /** Chunking failed */
  CHUNKING_FAILED = 'CHUNKING_FAILED',
  
  /** File size too large */
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  
  /** Unsupported file format */
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  
  /** Network error during upload/processing */
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  /** Unknown error */
  UNKNOWN = 'UNKNOWN',
}

export interface ParsingError {
  /** Error type */
  type: ParsingErrorType;
  
  /** Error message for developers */
  message: string;
  
  /** User-friendly error message */
  userMessage: string;
  
  /** Suggested actions to resolve the error */
  suggestions: string[];
  
  /** Original error object if available */
  originalError?: Error;
  
  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Creates a parsing error with user-friendly messaging
 */
export function createParsingError(
  type: ParsingErrorType,
  originalError?: Error,
  context?: Record<string, unknown>
): ParsingError {
  const errorDetails = getErrorDetails(type);
  
  return {
    type,
    message: originalError?.message || errorDetails.message,
    userMessage: errorDetails.userMessage,
    suggestions: errorDetails.suggestions,
    originalError,
    context,
  };
}

/**
 * Gets user-friendly error details for each error type
 */
function getErrorDetails(type: ParsingErrorType): {
  message: string;
  userMessage: string;
  suggestions: string[];
} {
  switch (type) {
    case ParsingErrorType.CORRUPTED_PDF:
      return {
        message: 'PDF file is corrupted or invalid',
        userMessage: 'The PDF file appears to be corrupted and cannot be processed.',
        suggestions: [
          'Try re-downloading the PDF from the original source',
          'Open the PDF in a PDF viewer to verify it is not corrupted',
          'Try converting the PDF to a new PDF using a PDF editor',
          'Contact the document provider for a valid copy',
        ],
      };
    
    case ParsingErrorType.PASSWORD_PROTECTED:
      return {
        message: 'PDF is password-protected',
        userMessage: 'This PDF is password-protected and cannot be processed.',
        suggestions: [
          'Remove the password protection using a PDF editor',
          'Contact the document owner to obtain an unprotected version',
          'Use a PDF password remover tool if you have the password',
        ],
      };
    
    case ParsingErrorType.SCANNED_PDF:
      return {
        message: 'PDF contains only scanned images without text layer',
        userMessage: 'This PDF appears to be a scanned document without searchable text.',
        suggestions: [
          'Use OCR (Optical Character Recognition) software to add a text layer',
          'Request a text-based version from the document provider',
          'Try Adobe Acrobat Pro or similar tools to perform OCR',
          'Upload a different version of the document if available',
        ],
      };
    
    case ParsingErrorType.TIMEOUT:
      return {
        message: 'PDF parsing timed out',
        userMessage: 'The PDF is taking too long to process and timed out.',
        suggestions: [
          'Try uploading a smaller PDF or fewer pages',
          'Check your internet connection and try again',
          'The PDF may be too complex - try simplifying it',
          'Contact support if the issue persists',
        ],
      };
    
    case ParsingErrorType.NO_TEXT_EXTRACTED:
      return {
        message: 'No text could be extracted from PDF',
        userMessage: 'We could not extract any text from this PDF.',
        suggestions: [
          'Verify the PDF contains actual text (not just images)',
          'Try opening the PDF and copying text to verify it is selectable',
          'The PDF may be scanned - consider using OCR',
          'Upload a different version of the document',
        ],
      };
    
    case ParsingErrorType.TABLE_EXTRACTION_FAILED:
      return {
        message: 'Table extraction failed',
        userMessage: 'We encountered an error while extracting tables from this PDF.',
        suggestions: [
          'The PDF may have complex table formatting',
          'Try manually extracting tables if needed',
          'Some tables may still be visible in the text content',
          'Report this issue if tables are critical for your workflow',
        ],
      };
    
    case ParsingErrorType.SECTION_DETECTION_FAILED:
      return {
        message: 'Section detection failed',
        userMessage: 'We could not automatically detect sections in this document.',
        suggestions: [
          'The document may not follow standard section formatting',
          'You can still use the full text for extraction',
          'Manually navigate to specific sections if needed',
          'This does not affect the core extraction functionality',
        ],
      };
    
    case ParsingErrorType.CHUNKING_FAILED:
      return {
        message: 'Text chunking failed',
        userMessage: 'We encountered an error while processing the document text.',
        suggestions: [
          'Try uploading the document again',
          'The document may have unusual formatting',
          'Contact support if the issue persists',
          'Try a different version of the document if available',
        ],
      };
    
    case ParsingErrorType.FILE_TOO_LARGE:
      return {
        message: 'File size exceeds maximum limit',
        userMessage: 'This PDF is too large to process.',
        suggestions: [
          'Try compressing the PDF using a PDF compressor',
          'Split the PDF into smaller files and process separately',
          'Remove unnecessary pages or images from the PDF',
          'Maximum file size is typically 50MB',
        ],
      };
    
    case ParsingErrorType.UNSUPPORTED_FORMAT:
      return {
        message: 'Unsupported file format',
        userMessage: 'This file format is not supported. Please upload a PDF file.',
        suggestions: [
          'Convert your document to PDF format',
          'Ensure the file has a .pdf extension',
          'Only PDF files are currently supported',
        ],
      };
    
    case ParsingErrorType.NETWORK_ERROR:
      return {
        message: 'Network error during processing',
        userMessage: 'A network error occurred while processing your document.',
        suggestions: [
          'Check your internet connection',
          'Try uploading the document again',
          'The server may be temporarily unavailable',
          'Contact support if the issue persists',
        ],
      };
    
    case ParsingErrorType.UNKNOWN:
    default:
      return {
        message: 'Unknown error occurred',
        userMessage: 'An unexpected error occurred while processing your document.',
        suggestions: [
          'Try uploading the document again',
          'Check that the PDF is valid and not corrupted',
          'Contact support with details about the error',
          'Try a different document to see if the issue persists',
        ],
      };
  }
}

/**
 * Detects error type from error message or error object
 */
export function detectErrorType(error: Error | string): ParsingErrorType {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const lowerMessage = errorMessage.toLowerCase();
  
  if (lowerMessage.includes('password') || lowerMessage.includes('encrypted')) {
    return ParsingErrorType.PASSWORD_PROTECTED;
  }
  
  if (lowerMessage.includes('corrupt') || lowerMessage.includes('invalid pdf')) {
    return ParsingErrorType.CORRUPTED_PDF;
  }
  
  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    return ParsingErrorType.TIMEOUT;
  }
  
  if (lowerMessage.includes('no text') || lowerMessage.includes('empty')) {
    return ParsingErrorType.NO_TEXT_EXTRACTED;
  }
  
  if (lowerMessage.includes('table')) {
    return ParsingErrorType.TABLE_EXTRACTION_FAILED;
  }
  
  if (lowerMessage.includes('section')) {
    return ParsingErrorType.SECTION_DETECTION_FAILED;
  }
  
  if (lowerMessage.includes('chunk')) {
    return ParsingErrorType.CHUNKING_FAILED;
  }
  
  if (lowerMessage.includes('too large') || lowerMessage.includes('file size')) {
    return ParsingErrorType.FILE_TOO_LARGE;
  }
  
  if (lowerMessage.includes('unsupported') || lowerMessage.includes('format')) {
    return ParsingErrorType.UNSUPPORTED_FORMAT;
  }
  
  if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
    return ParsingErrorType.NETWORK_ERROR;
  }
  
  return ParsingErrorType.UNKNOWN;
}

/**
 * Handles parsing errors and returns user-friendly error
 */
export function handleParsingError(
  error: Error | string,
  context?: Record<string, unknown>
): ParsingError {
  const errorType = detectErrorType(error);
  const originalError = typeof error === 'string' ? new Error(error) : error;
  
  const parsingError = createParsingError(errorType, originalError, context);
  
  // Log error for debugging
  console.error('❌ Parsing error:', {
    type: parsingError.type,
    message: parsingError.message,
    context: parsingError.context,
  });
  
  return parsingError;
}

/**
 * Formats error for display to user
 */
export function formatErrorForDisplay(error: ParsingError): string {
  let formatted = `**${error.userMessage}**\n\n`;
  
  if (error.suggestions.length > 0) {
    formatted += '**Suggestions:**\n';
    error.suggestions.forEach((suggestion, index) => {
      formatted += `${index + 1}. ${suggestion}\n`;
    });
  }
  
  return formatted;
}

/**
 * Validates PDF file before processing
 */
export async function validatePdfFile(file: File): Promise<{
  isValid: boolean;
  error?: ParsingError;
}> {
  // Check file extension
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return {
      isValid: false,
      error: createParsingError(ParsingErrorType.UNSUPPORTED_FORMAT),
    };
  }
  
  // Check file size (50MB limit)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: createParsingError(ParsingErrorType.FILE_TOO_LARGE, undefined, {
        fileSize: file.size,
        maxSize,
      }),
    };
  }
  
  // Check if file is empty
  if (file.size === 0) {
    return {
      isValid: false,
      error: createParsingError(ParsingErrorType.CORRUPTED_PDF),
    };
  }
  
  return { isValid: true };
}

/**
 * Gets parsing progress message for user feedback
 */
export function getProgressMessage(stage: string): string {
  const messages: Record<string, string> = {
    uploading: 'Uploading PDF file...',
    parsing: 'Parsing PDF document...',
    extracting_text: 'Extracting text content...',
    detecting_tables: 'Detecting tables...',
    detecting_sections: 'Detecting document sections...',
    chunking: 'Processing text chunks...',
    indexing: 'Indexing content for search...',
    complete: 'Processing complete!',
  };
  
  return messages[stage] || 'Processing...';
}

/**
 * Estimates processing time based on file size
 */
export function estimateProcessingTime(fileSize: number): string {
  // Rough estimate: 1MB = 5 seconds
  const seconds = Math.ceil((fileSize / (1024 * 1024)) * 5);
  
  if (seconds < 60) {
    return `~${seconds} seconds`;
  }
  
  const minutes = Math.ceil(seconds / 60);
  return `~${minutes} minute${minutes > 1 ? 's' : ''}`;
}
