import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface BoundingBoxVisibility {
  textItems: boolean;
  semanticChunks: boolean;
  tables: boolean;
  figures: boolean;
}

interface BoundingBoxControlsProps {
  visibility: BoundingBoxVisibility;
  onVisibilityChange: (visibility: BoundingBoxVisibility) => void;
}

export const BoundingBoxControls = ({
  visibility,
  onVisibilityChange,
}: BoundingBoxControlsProps) => {
  const controls = [
    {
      id: "textItems" as keyof BoundingBoxVisibility,
      label: "Text Items",
      description: "Show individual text element boundaries",
      color: "text-red-500",
    },
    {
      id: "semanticChunks" as keyof BoundingBoxVisibility,
      label: "Text Chunks",
      description: "Show semantic chunks like sentences and paragraphs",
      color: "text-green-500",
    },
    {
      id: "tables" as keyof BoundingBoxVisibility,
      label: "Table Regions",
      description: "Show detected table areas",
      color: "text-blue-500",
    },
    {
      id: "figures" as keyof BoundingBoxVisibility,
      label: "Figure Regions",
      description: "Show extracted figure locations",
      color: "text-purple-500",
    },
  ];

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-1 w-1 rounded-full bg-primary" />
        <h3 className="font-semibold text-sm">Bounding Box Visualization</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-3 w-3 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-xs">
                Toggle visualization of different PDF elements with their
                coordinate boundaries. Useful for debugging extraction and
                understanding document structure.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="space-y-2">
        {controls.map((control) => (
          <div
            key={control.id}
            className="flex items-center justify-between space-x-2"
          >
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${control.color.replace(
                  "text-",
                  "bg-"
                )}`}
              />
              <Label
                htmlFor={control.id}
                className="text-sm cursor-pointer flex-1"
              >
                {control.label}
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{control.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Switch
              id={control.id}
              checked={visibility[control.id]}
              onCheckedChange={(checked) =>
                onVisibilityChange({ ...visibility, [control.id]: checked })
              }
            />
          </div>
        ))}
      </div>

      <div className="pt-2 border-t text-xs text-muted-foreground">
        Active overlays:{" "}
        {Object.values(visibility).filter(Boolean).length} /{" "}
        {controls.length}
      </div>
    </Card>
  );
};
