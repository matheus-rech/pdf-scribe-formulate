import { Card } from "@/components/ui/card";
import { Sparkles, Image as ImageIcon, FileText, Zap } from "lucide-react";

export const OCRInfoCard = () => {
  return (
    <Card className="p-4 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 border-primary/20">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <span>AI-Powered OCR</span>
            <span className="text-xs px-2 py-0.5 rounded bg-success/10 text-success border border-success/20">
              New
            </span>
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Extract text from captured images including tables, figures, and charts using on-device AI
          </p>
          
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-xs">
              <ImageIcon className="h-4 w-4 text-extraction-image mt-0.5 shrink-0" />
              <div>
                <span className="font-medium">Capture images</span> using the 📷 Image Mode
              </div>
            </div>
            
            <div className="flex items-start gap-2 text-xs">
              <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <span className="font-medium">Click the ✨ button</span> on any image in the trace log
              </div>
            </div>
            
            <div className="flex items-start gap-2 text-xs">
              <FileText className="h-4 w-4 text-accent mt-0.5 shrink-0" />
              <div>
                <span className="font-medium">Extract text</span> and copy to form fields
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs mt-3 p-2 bg-info/10 rounded border border-info/20">
              <Zap className="h-4 w-4 text-info mt-0.5 shrink-0" />
              <div>
                <span className="font-medium text-info">Runs entirely in your browser</span> - No data sent to servers, works offline
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
