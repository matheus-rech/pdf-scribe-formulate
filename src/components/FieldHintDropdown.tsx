import { Card } from "@/components/ui/card";
import { Loader2, Sparkles, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FieldHint } from "@/hooks/useFieldHints";

interface FieldHintDropdownProps {
  hints: FieldHint[];
  isLoading: boolean;
  onSelectHint: (hint: FieldHint) => void;
  className?: string;
}

export const FieldHintDropdown = ({
  hints,
  isLoading,
  onSelectHint,
  className
}: FieldHintDropdownProps) => {
  if (!isLoading && hints.length === 0) {
    return null;
  }

  return (
    <Card className={cn("absolute z-50 mt-1 w-full max-w-md shadow-lg", className)}>
      <div className="max-h-64 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Finding suggestions...</span>
          </div>
        ) : (
          <div className="py-1">
            {hints.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No suggestions found
              </div>
            ) : (
              <>
                <div className="px-3 py-1 text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI Suggestions
                </div>
                {hints.map((hint, index) => (
                  <button
                    key={index}
                    onClick={() => onSelectHint(hint)}
                    className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {hint.suggestion}
                        </div>
                        {hint.sourceText && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            "{hint.sourceText}"
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {hint.sourceLocation && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{hint.sourceLocation}</span>
                            </div>
                          )}
                          <div className={cn(
                            "text-xs font-medium",
                            hint.confidence >= 0.8 ? "text-green-600" :
                            hint.confidence >= 0.6 ? "text-yellow-600" :
                            "text-orange-600"
                          )}>
                            {Math.round(hint.confidence * 100)}% confident
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
