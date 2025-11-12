import { Card } from "@/components/ui/card";
import { Camera, Box, MousePointerClick } from "lucide-react";

export const ImageCaptureDemo = () => {
  return (
    <Card className="p-6 bg-gradient-to-br from-extraction-image/5 to-extraction-image/10 border-extraction-image/20">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-extraction-image/10 rounded-lg">
          <Camera className="h-8 w-8 text-extraction-image" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2 text-extraction-image">Image Capture Feature</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Extract visual content from PDFs including tables, figures, charts, and diagrams
          </p>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-extraction-image/20 text-extraction-image text-xs font-bold shrink-0 mt-0.5">
                1
              </div>
              <div>
                <p className="text-sm font-medium">Activate Image Mode</p>
                <p className="text-xs text-muted-foreground">Click the <strong>📷 Image</strong> button in the PDF toolbar</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-extraction-image/20 text-extraction-image text-xs font-bold shrink-0 mt-0.5">
                2
              </div>
              <div>
                <p className="text-sm font-medium">Select Target Field</p>
                <p className="text-xs text-muted-foreground">Click any form field where you want to store the image</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-extraction-image/20 text-extraction-image text-xs font-bold shrink-0 mt-0.5">
                3
              </div>
              <div>
                <p className="text-sm font-medium">Capture Region</p>
                <p className="text-xs text-muted-foreground">Click and drag on the PDF to select the area to capture</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-success/20 text-success text-xs font-bold shrink-0 mt-0.5">
                ✓
              </div>
              <div>
                <p className="text-sm font-medium">Image Saved!</p>
                <p className="text-xs text-muted-foreground">
                  The captured image appears in the trace log with download option
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="flex items-start gap-2">
              <MousePointerClick className="h-4 w-4 text-warning mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-warning">Quick Tip</p>
                <p className="text-xs text-muted-foreground">
                  You can also use <strong>Region Mode</strong> (<Box className="inline h-3 w-3" />) to extract text from specific areas of the PDF
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
