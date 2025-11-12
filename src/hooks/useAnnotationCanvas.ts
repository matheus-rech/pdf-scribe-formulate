import { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas as FabricCanvas, PencilBrush, Circle, Rect, IText, Line, Polygon } from 'fabric';

export type DrawingTool = 'select' | 'pen' | 'line' | 'arrow' | 'rectangle' | 'circle' | 'polygon' | 'text' | 'highlight' | 'eraser';

export const useAnnotationCanvas = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  width: number,
  height: number,
  enabled: boolean
) => {
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<DrawingTool>('select');
  const [drawingColor, setDrawingColor] = useState('#ef4444');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const polygonPoints = useRef<{ x: number; y: number }[]>([]);
  const isDrawingLine = useRef(false);
  const tempLine = useRef<Line | null>(null);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !enabled) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width,
      height,
      backgroundColor: 'transparent',
      isDrawingMode: false,
      selection: true,
    });

    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = drawingColor;
    canvas.freeDrawingBrush.width = strokeWidth;

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
      setFabricCanvas(null);
    };
  }, [enabled, canvasRef]);

  // Update canvas dimensions
  useEffect(() => {
    if (!fabricCanvas) return;
    fabricCanvas.setWidth(width);
    fabricCanvas.setHeight(height);
    fabricCanvas.renderAll();
  }, [fabricCanvas, width, height]);

  // Handle tool changes
  useEffect(() => {
    if (!fabricCanvas) return;

    const isDrawingMode = activeTool === 'pen' || activeTool === 'eraser';
    fabricCanvas.isDrawingMode = isDrawingMode;
    fabricCanvas.selection = activeTool === 'select';

    if (isDrawingMode && fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = activeTool === 'eraser' ? '#ffffff' : drawingColor;
      fabricCanvas.freeDrawingBrush.width = activeTool === 'eraser' ? strokeWidth * 3 : strokeWidth;
    }

    // Set cursor based on tool
    const cursorMap: Record<DrawingTool, string> = {
      select: 'default',
      pen: 'crosshair',
      eraser: 'crosshair',
      line: 'crosshair',
      arrow: 'crosshair',
      rectangle: 'crosshair',
      circle: 'crosshair',
      polygon: 'crosshair',
      text: 'text',
      highlight: 'crosshair'
    };
    fabricCanvas.defaultCursor = cursorMap[activeTool];
  }, [fabricCanvas, activeTool, drawingColor, strokeWidth]);

  // Track selected object
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleSelection = () => {
      const active = fabricCanvas.getActiveObject();
      setSelectedObject(active || null);
    };

    const handleDeselection = () => {
      setSelectedObject(null);
    };

    fabricCanvas.on('selection:created', handleSelection);
    fabricCanvas.on('selection:updated', handleSelection);
    fabricCanvas.on('selection:cleared', handleDeselection);

    return () => {
      fabricCanvas.off('selection:created', handleSelection);
      fabricCanvas.off('selection:updated', handleSelection);
      fabricCanvas.off('selection:cleared', handleDeselection);
    };
  }, [fabricCanvas]);

  const addShape = useCallback((tool: DrawingTool) => {
    if (!fabricCanvas) return;

    const commonProps = {
      left: width / 2 - 50,
      top: height / 2 - 50,
      stroke: drawingColor,
      strokeWidth,
      fill: tool === 'highlight' ? `${drawingColor}40` : 'transparent',
    };

    let shape;
    switch (tool) {
      case 'rectangle':
        shape = new Rect({ ...commonProps, width: 100, height: 100 });
        break;
      case 'circle':
        shape = new Circle({ ...commonProps, radius: 50 });
        break;
      case 'text':
        shape = new IText('Text', {
          left: width / 2 - 50,
          top: height / 2 - 50,
          fill: drawingColor,
          fontSize: 20,
        });
        break;
      case 'highlight':
        shape = new Rect({
          ...commonProps,
          width: 150,
          height: 30,
          fill: `${drawingColor}40`,
          stroke: 'transparent',
        });
        break;
    }

    if (shape) {
      fabricCanvas.add(shape);
      fabricCanvas.setActiveObject(shape);
      fabricCanvas.renderAll();
    }
  }, [fabricCanvas, drawingColor, strokeWidth, width, height]);

  const deleteSelected = useCallback(() => {
    if (!fabricCanvas || !selectedObject) return;
    fabricCanvas.remove(selectedObject);
    setSelectedObject(null);
    fabricCanvas.renderAll();
  }, [fabricCanvas, selectedObject]);

  const bringToFront = useCallback(() => {
    if (!fabricCanvas || !selectedObject) return;
    fabricCanvas.bringObjectToFront(selectedObject);
    fabricCanvas.renderAll();
  }, [fabricCanvas, selectedObject]);

  const sendToBack = useCallback(() => {
    if (!fabricCanvas || !selectedObject) return;
    fabricCanvas.sendObjectToBack(selectedObject);
    fabricCanvas.renderAll();
  }, [fabricCanvas, selectedObject]);

  const clearCanvas = useCallback(() => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = 'transparent';
    fabricCanvas.renderAll();
  }, [fabricCanvas]);

  const updateSelectedObjectColor = useCallback((color: string) => {
    if (!selectedObject) return;
    if (selectedObject.type === 'i-text' || selectedObject.type === 'text') {
      selectedObject.set('fill', color);
    } else {
      selectedObject.set('stroke', color);
    }
    fabricCanvas?.renderAll();
  }, [selectedObject, fabricCanvas]);

  return {
    fabricCanvas,
    activeTool,
    setActiveTool,
    drawingColor,
    setDrawingColor,
    strokeWidth,
    setStrokeWidth,
    selectedObject,
    addShape,
    deleteSelected,
    bringToFront,
    sendToBack,
    clearCanvas,
    updateSelectedObjectColor,
  };
};
