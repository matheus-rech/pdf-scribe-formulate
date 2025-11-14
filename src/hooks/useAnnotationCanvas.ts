import { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas as FabricCanvas, PencilBrush, Circle, Rect, IText, Line, Polygon, Triangle, Group } from 'fabric';

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
  const polygonCircles = useRef<Circle[]>([]);
  const isDrawingLine = useRef(false);
  const lineStartPoint = useRef<{ x: number; y: number } | null>(null);
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

    // Reset interactive drawing states when changing tools
    if (activeTool !== 'line' && activeTool !== 'arrow') {
      isDrawingLine.current = false;
      lineStartPoint.current = null;
      if (tempLine.current) {
        fabricCanvas.remove(tempLine.current);
        tempLine.current = null;
      }
    }
    
    if (activeTool !== 'polygon') {
      clearPolygonPoints();
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

  // Clear polygon helper points
  const clearPolygonPoints = useCallback(() => {
    if (!fabricCanvas) return;
    polygonCircles.current.forEach(circle => fabricCanvas.remove(circle));
    polygonCircles.current = [];
    polygonPoints.current = [];
  }, [fabricCanvas]);

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

  // Handle interactive line/arrow drawing
  const handleCanvasMouseDown = useCallback((e: any) => {
    if (!fabricCanvas || (activeTool !== 'line' && activeTool !== 'arrow' && activeTool !== 'polygon')) return;

    const pointer = fabricCanvas.getPointer(e.e);

    if (activeTool === 'line' || activeTool === 'arrow') {
      if (!isDrawingLine.current) {
        // Start drawing
        isDrawingLine.current = true;
        lineStartPoint.current = { x: pointer.x, y: pointer.y };
        
        tempLine.current = new Line(
          [pointer.x, pointer.y, pointer.x, pointer.y],
          {
            stroke: drawingColor,
            strokeWidth,
            selectable: false,
            evented: false,
          }
        );
        fabricCanvas.add(tempLine.current);
      }
    } else if (activeTool === 'polygon') {
      // Add point to polygon
      polygonPoints.current.push({ x: pointer.x, y: pointer.y });
      
      // Add visual marker
      const circle = new Circle({
        left: pointer.x - 3,
        top: pointer.y - 3,
        radius: 3,
        fill: drawingColor,
        selectable: false,
        evented: false,
      });
      fabricCanvas.add(circle);
      polygonCircles.current.push(circle);
      
      // Draw lines between points
      if (polygonPoints.current.length > 1) {
        const points = polygonPoints.current;
        const lastTwo = points.slice(-2);
        if (lastTwo[0] && lastTwo[1]) {
          const line = new Line(
            [lastTwo[0].x, lastTwo[0].y, lastTwo[1].x, lastTwo[1].y],
            {
              stroke: drawingColor,
              strokeWidth,
              selectable: false,
              evented: false,
            }
          );
          fabricCanvas.add(line);
        }
      }
      
      fabricCanvas.renderAll();
    }
  }, [fabricCanvas, activeTool, drawingColor, strokeWidth]);

  const handleCanvasMouseMove = useCallback((e: any) => {
    if (!fabricCanvas) return;

    if ((activeTool === 'line' || activeTool === 'arrow') && isDrawingLine.current && tempLine.current && lineStartPoint.current) {
      const pointer = fabricCanvas.getPointer(e.e);
      tempLine.current.set({
        x2: pointer.x,
        y2: pointer.y,
      });
      fabricCanvas.renderAll();
    }
  }, [fabricCanvas, activeTool]);

  const handleCanvasMouseUp = useCallback(() => {
    if (!fabricCanvas || !isDrawingLine.current || !tempLine.current || !lineStartPoint.current) return;

    // Remove temp line
    fabricCanvas.remove(tempLine.current);
    
    const x1 = lineStartPoint.current.x;
    const y1 = lineStartPoint.current.y;
    const x2 = tempLine.current.x2 || x1;
    const y2 = tempLine.current.y2 || y1;

    if (activeTool === 'arrow') {
      // Create arrow (line + triangle)
      const line = new Line([x1, y1, x2, y2], {
        stroke: drawingColor,
        strokeWidth,
      });

      // Calculate arrowhead
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const headLength = 15;
      
      const triangle = new Triangle({
        left: x2,
        top: y2,
        width: headLength,
        height: headLength,
        fill: drawingColor,
        angle: (angle * 180) / Math.PI + 90,
        originX: 'center',
        originY: 'center',
      });

      const arrow = new Group([line, triangle]);
      fabricCanvas.add(arrow);
    } else {
      // Create regular line
      const line = new Line([x1, y1, x2, y2], {
        stroke: drawingColor,
        strokeWidth,
      });
      fabricCanvas.add(line);
    }

    isDrawingLine.current = false;
    lineStartPoint.current = null;
    tempLine.current = null;
    fabricCanvas.renderAll();
  }, [fabricCanvas, activeTool, drawingColor, strokeWidth]);

  const finishPolygon = useCallback(() => {
    if (!fabricCanvas || polygonPoints.current.length < 3) return;

    const points = polygonPoints.current.map(p => ({ x: p.x, y: p.y }));
    const polygon = new Polygon(points, {
      fill: 'transparent',
      stroke: drawingColor,
      strokeWidth,
    });

    fabricCanvas.add(polygon);
    clearPolygonPoints();
    fabricCanvas.renderAll();
  }, [fabricCanvas, drawingColor, strokeWidth, clearPolygonPoints]);

  // Set up canvas event listeners
  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.on('mouse:down', handleCanvasMouseDown);
    fabricCanvas.on('mouse:move', handleCanvasMouseMove);
    fabricCanvas.on('mouse:up', handleCanvasMouseUp);

    return () => {
      fabricCanvas.off('mouse:down', handleCanvasMouseDown);
      fabricCanvas.off('mouse:move', handleCanvasMouseMove);
      fabricCanvas.off('mouse:up', handleCanvasMouseUp);
    };
  }, [fabricCanvas, handleCanvasMouseDown, handleCanvasMouseMove, handleCanvasMouseUp]);

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
    finishPolygon,
    polygonPointCount: polygonPoints.current.length,
  };
};
