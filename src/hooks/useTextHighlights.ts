import { useState, useCallback } from 'react';
import { TextHighlight, HighlightColor, HIGHLIGHT_COLORS } from '@/types/highlights';

export const useTextHighlights = () => {
  const [highlights, setHighlights] = useState<Map<number, TextHighlight[]>>(new Map());
  const [activeHighlightColor, setActiveHighlightColor] = useState<HighlightColor>('yellow');

  const addHighlight = useCallback((highlight: Omit<TextHighlight, 'id' | 'timestamp' | 'color'>) => {
    const newHighlight: TextHighlight = {
      ...highlight,
      id: `highlight-${Date.now()}-${Math.random()}`,
      color: HIGHLIGHT_COLORS[activeHighlightColor],
      timestamp: new Date(),
    };

    setHighlights(prev => {
      const newMap = new Map(prev);
      const pageHighlights = newMap.get(highlight.pageNumber) || [];
      newMap.set(highlight.pageNumber, [...pageHighlights, newHighlight]);
      return newMap;
    });

    return newHighlight;
  }, [activeHighlightColor]);

  const removeHighlight = useCallback((id: string) => {
    setHighlights(prev => {
      const newMap = new Map(prev);
      for (const [page, pageHighlights] of newMap.entries()) {
        const filtered = pageHighlights.filter(h => h.id !== id);
        if (filtered.length > 0) {
          newMap.set(page, filtered);
        } else {
          newMap.delete(page);
        }
      }
      return newMap;
    });
  }, []);

  const getHighlightsForPage = useCallback((page: number): TextHighlight[] => {
    return highlights.get(page) || [];
  }, [highlights]);

  const clearHighlightsOfType = useCallback((type: TextHighlight['type']) => {
    setHighlights(prev => {
      const newMap = new Map(prev);
      for (const [page, pageHighlights] of newMap.entries()) {
        const filtered = pageHighlights.filter(h => h.type !== type);
        if (filtered.length > 0) {
          newMap.set(page, filtered);
        } else {
          newMap.delete(page);
        }
      }
      return newMap;
    });
  }, []);

  const clearAllHighlights = useCallback(() => {
    setHighlights(new Map());
  }, []);

  const updateHighlightNote = useCallback((id: string, note: string) => {
    setHighlights(prev => {
      const newMap = new Map(prev);
      for (const [page, pageHighlights] of newMap.entries()) {
        const updated = pageHighlights.map(h => 
          h.id === id ? { ...h, note } : h
        );
        newMap.set(page, updated);
      }
      return newMap;
    });
  }, []);

  const exportHighlights = useCallback(() => {
    const allHighlights: TextHighlight[] = [];
    highlights.forEach(pageHighlights => {
      allHighlights.push(...pageHighlights);
    });
    return allHighlights;
  }, [highlights]);

  const importHighlights = useCallback((importedHighlights: TextHighlight[]) => {
    const newMap = new Map<number, TextHighlight[]>();
    importedHighlights.forEach(highlight => {
      const pageHighlights = newMap.get(highlight.pageNumber) || [];
      newMap.set(highlight.pageNumber, [...pageHighlights, highlight]);
    });
    setHighlights(newMap);
  }, []);

  return {
    highlights,
    activeHighlightColor,
    setActiveHighlightColor,
    addHighlight,
    removeHighlight,
    getHighlightsForPage,
    clearHighlightsOfType,
    clearAllHighlights,
    updateHighlightNote,
    exportHighlights,
    importHighlights,
  };
};
