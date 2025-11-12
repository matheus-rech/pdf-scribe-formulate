import { Button } from "@/components/ui/button";
import { Highlighter, Trash2 } from "lucide-react";
import { HighlightColor } from "@/types/highlights";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface HighlightToolbarProps {
  activeColor: HighlightColor;
  onColorChange: (color: HighlightColor) => void;
  onClearHighlights: () => void;
  highlightCount: number;
  onHighlightSelection: () => void;
}

const COLORS: { value: HighlightColor; label: string; class: string }[] = [
  { value: 'yellow', label: 'Yellow', class: 'bg-[hsl(48,96%,53%)]' },
  { value: 'green', label: 'Green', class: 'bg-[hsl(142,76%,36%)]' },
  { value: 'blue', label: 'Blue', class: 'bg-[hsl(210,85%,55%)]' },
  { value: 'pink', label: 'Pink', class: 'bg-[hsl(330,81%,60%)]' },
  { value: 'orange', label: 'Orange', class: 'bg-[hsl(14,90%,53%)]' },
];

export const HighlightToolbar = ({
  activeColor,
  onColorChange,
  onClearHighlights,
  highlightCount,
  onHighlightSelection,
}: HighlightToolbarProps) => {
  const activeColorConfig = COLORS.find(c => c.value === activeColor);

  return (
    <div className="flex items-center gap-2 border-r border-border pr-3">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            title="Highlight selected text (Ctrl+H)"
          >
            <Highlighter className="h-4 w-4" />
            <div
              className={`w-4 h-4 rounded border border-border ${activeColorConfig?.class}`}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <div className="space-y-2">
            <p className="text-sm font-medium">Highlight Color</p>
            <div className="grid grid-cols-5 gap-2">
              {COLORS.map(color => (
                <button
                  key={color.value}
                  onClick={() => onColorChange(color.value)}
                  className={`w-8 h-8 rounded border-2 transition-all ${color.class} ${
                    activeColor === color.value
                      ? 'border-foreground scale-110'
                      : 'border-border hover:border-foreground/50'
                  }`}
                  title={color.label}
                />
              ))}
            </div>
            <Button
              onClick={onHighlightSelection}
              size="sm"
              className="w-full gap-2 mt-2"
            >
              <Highlighter className="h-4 w-4" />
              Highlight Selection
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {highlightCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearHighlights}
          className="gap-2 text-muted-foreground hover:text-destructive"
          title="Clear all highlights"
        >
          <Trash2 className="h-4 w-4" />
          <span className="text-xs">({highlightCount})</span>
        </Button>
      )}
    </div>
  );
};
