import { useState, useCallback, useRef } from 'react';
import { Canvas as FabricCanvas } from 'fabric';

const HISTORY_LIMIT = 50;

export const useCanvasHistory = (fabricCanvas: FabricCanvas | null) => {
  const [history, setHistory] = useState<any[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const isRedoing = useRef(false);
  const isUndoing = useRef(false);

  const saveState = useCallback(() => {
    if (!fabricCanvas || isRedoing.current || isUndoing.current) return;

    const json = fabricCanvas.toJSON();
    setHistory(prev => {
      const newHistory = prev.slice(0, historyStep + 1);
      const updatedHistory = [...newHistory, json];
      // Limit history size
      if (updatedHistory.length > HISTORY_LIMIT) {
        updatedHistory.shift();
        setHistoryStep(prev => prev); // Keep step the same since we removed from beginning
        return updatedHistory;
      }
      setHistoryStep(updatedHistory.length - 1);
      return updatedHistory;
    });
  }, [fabricCanvas, historyStep]);

  const undo = useCallback(() => {
    if (!fabricCanvas || historyStep <= 0) return;

    isUndoing.current = true;
    const previousState = history[historyStep - 1];
    
    fabricCanvas.clear();
    fabricCanvas.loadFromJSON(previousState, () => {
      fabricCanvas.renderAll();
      setHistoryStep(prev => prev - 1);
      isUndoing.current = false;
    });
  }, [fabricCanvas, history, historyStep]);

  const redo = useCallback(() => {
    if (!fabricCanvas || historyStep >= history.length - 1) return;

    isRedoing.current = true;
    const nextState = history[historyStep + 1];
    
    fabricCanvas.clear();
    fabricCanvas.loadFromJSON(nextState, () => {
      fabricCanvas.renderAll();
      setHistoryStep(prev => prev + 1);
      isRedoing.current = false;
    });
  }, [fabricCanvas, history, historyStep]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setHistoryStep(-1);
  }, []);

  const initializeHistory = useCallback(() => {
    if (!fabricCanvas) return;
    const json = fabricCanvas.toJSON();
    setHistory([json]);
    setHistoryStep(0);
  }, [fabricCanvas]);

  const canUndo = historyStep > 0;
  const canRedo = historyStep < history.length - 1;

  return {
    saveState,
    undo,
    redo,
    clearHistory,
    initializeHistory,
    canUndo,
    canRedo
  };
};
