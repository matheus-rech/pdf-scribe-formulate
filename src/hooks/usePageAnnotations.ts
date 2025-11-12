import { useState, useCallback } from 'react';

export interface PageAnnotation {
  pageNumber: number;
  canvasJSON: any;
  thumbnail: string;
  timestamp: number;
}

export const usePageAnnotations = () => {
  const [pageAnnotations, setPageAnnotations] = useState<Map<number, PageAnnotation>>(new Map());

  const savePageAnnotation = useCallback((pageNumber: number, canvasJSON: any, thumbnail: string) => {
    setPageAnnotations(prev => {
      const newMap = new Map(prev);
      newMap.set(pageNumber, {
        pageNumber,
        canvasJSON,
        thumbnail,
        timestamp: Date.now()
      });
      return newMap;
    });
  }, []);

  const getPageAnnotation = useCallback((pageNumber: number): PageAnnotation | undefined => {
    return pageAnnotations.get(pageNumber);
  }, [pageAnnotations]);

  const clearPageAnnotation = useCallback((pageNumber: number) => {
    setPageAnnotations(prev => {
      const newMap = new Map(prev);
      newMap.delete(pageNumber);
      return newMap;
    });
  }, []);

  const clearAllAnnotations = useCallback(() => {
    setPageAnnotations(new Map());
  }, []);

  const hasAnnotation = useCallback((pageNumber: number): boolean => {
    return pageAnnotations.has(pageNumber);
  }, [pageAnnotations]);

  const getAllAnnotations = useCallback((): PageAnnotation[] => {
    return Array.from(pageAnnotations.values());
  }, [pageAnnotations]);

  return {
    pageAnnotations,
    savePageAnnotation,
    getPageAnnotation,
    clearPageAnnotation,
    clearAllAnnotations,
    hasAnnotation,
    getAllAnnotations
  };
};
