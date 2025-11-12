import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MousePointer, Pen, Square, Circle, Type, Eraser, Trash2, Save, Undo, Redo,
  Minus, ArrowRight, Pentagon, Highlighter, ChevronsUp, ChevronsDown, Trash
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type DrawingTool = 'select' | 'pen' | 'line' | 'arrow' | 'rectangle' | 'circle' | 'polygon' | 'text' | 'highlight' | 'eraser';

interface DrawingToolbarProps {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  activeColor: string;
  onColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  canUndo: boolean;
  canRedo: boolean;
  selectedObject?: any;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  onDeleteSelected?: () => void;
}

const COLORS = [
  { name: "Red", value: "#ef4444" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Yellow", value: "#eab308" },
  { name: "Purple", value: "#a855f7" },
  { name: "Black", value: "#000000" },
];

export const DrawingToolbar = ({
  activeTool,
  onToolChange,
  activeColor,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange,
  onClear,
  onUndo,
  onRedo,
  onSave,
  canUndo,
  canRedo,
  selectedObject,
  onBringToFront,
  onSendToBack,
  onDeleteSelected,
}: DrawingToolbarProps) => {
  return (
    <div className="flex items-center gap-2 p-3 bg-card border border-border rounded-lg shadow-sm flex-wrap">
      <Badge variant="secondary" className="text-xs">
        Annotation Tools
      </Badge>
      
      <Separator orientation="vertical" className="h-6" />
      
      {/* Selection and Drawing Tools */}
      <div className="flex gap-1">
        <Button
          variant={activeTool === "select" ? "default" : "outline"}
          size="sm"
          onClick={() => onToolChange("select")}
          title="Select & Move (V)"
        >
          <MousePointer className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === "pen" ? "default" : "outline"}
          size="sm"
          onClick={() => onToolChange("pen")}
          title="Freehand Drawing (P)"
        >
          <Pen className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === "line" ? "default" : "outline"}
          size="sm"
          onClick={() => onToolChange("line")}
          title="Line - Click and drag to draw a straight line"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === "arrow" ? "default" : "outline"}
          size="sm"
          onClick={() => onToolChange("arrow")}
          title="Arrow - Click and drag to draw an arrow"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === "rectangle" ? "default" : "outline"}
          size="sm"
          onClick={() => onToolChange("rectangle")}
          title="Rectangle (R)"
        >
          <Square className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === "circle" ? "default" : "outline"}
          size="sm"
          onClick={() => onToolChange("circle")}
          title="Circle (C)"
        >
          <Circle className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === "polygon" ? "default" : "outline"}
          size="sm"
          onClick={() => onToolChange("polygon")}
          title="Polygon - Click to add points, press Enter or Esc to finish"
        >
          <Pentagon className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === "highlight" ? "default" : "outline"}
          size="sm"
          onClick={() => onToolChange("highlight")}
          title="Highlight (H)"
        >
          <Highlighter className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === "text" ? "default" : "outline"}
          size="sm"
          onClick={() => onToolChange("text")}
          title="Text (T)"
        >
          <Type className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === "eraser" ? "default" : "outline"}
          size="sm"
          onClick={() => onToolChange("eraser")}
          title="Eraser (E)"
        >
          <Eraser className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Color:</span>
        <div className="flex gap-1">
          {COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => onColorChange(color.value)}
              className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 ${
                activeColor === color.value ? "border-primary ring-2 ring-primary/20" : "border-border"
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Width:</span>
        <Select value={strokeWidth.toString()} onValueChange={(v) => onStrokeWidthChange(parseInt(v))}>
          <SelectTrigger className="w-20 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Thin</SelectItem>
            <SelectItem value="3">Medium</SelectItem>
            <SelectItem value="5">Thick</SelectItem>
            <SelectItem value="8">Extra</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Object Management */}
      {selectedObject && (
        <>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onDeleteSelected}
              title="Delete Selected (Del)"
            >
              <Trash className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onBringToFront}
              title="Bring to Front"
            >
              <ChevronsUp className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onSendToBack}
              title="Send to Back"
            >
              <ChevronsDown className="h-4 w-4" />
            </Button>
          </div>
          <Separator orientation="vertical" className="h-6" />
        </>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={onClear}
        className="gap-2"
        title="Clear All Annotations"
      >
        <Trash2 className="h-4 w-4" />
        Clear
      </Button>

      <Button
        variant="default"
        size="sm"
        onClick={onSave}
        className="gap-2 ml-auto"
        title="Save Annotations"
      >
        <Save className="h-4 w-4" />
        Save
      </Button>
    </div>
  );
};
