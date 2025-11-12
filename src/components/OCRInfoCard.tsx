import { Card } from "@/components/ui/card";
import { Sparkles, Zap, Table, ShieldCheck, Cpu } from "lucide-react";

export const OCRInfoCard = () => {
  return (
    <Card className="p-4 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 border-primary/20">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <span>AI-Powered Image Analysis</span>
            <span className="text-xs px-2 py-0.5 rounded bg-success/10 text-success border border-success/20">
              Enhanced
            </span>
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Extract text, parse tables, and validate data with AI vision capabilities
          </p>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-xs">
                <Cpu className="h-4 w-4 text-info mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium">Standard OCR</span>
                  <div className="text-muted-foreground">Fast, on-device text extraction</div>
                </div>
              </div>
              
              <div className="flex items-start gap-2 text-xs">
                <Table className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium">Auto Table Parser</span>
                  <div className="text-muted-foreground">Detect & export to JSON/CSV</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2 text-xs">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium">AI Vision</span>
                  <div className="text-muted-foreground">Merged cells & nested tables</div>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs">
                <ShieldCheck className="h-4 w-4 text-success mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium">Data Validation</span>
                  <div className="text-muted-foreground">Find errors & outliers</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs mt-3 p-2 bg-info/10 rounded border border-info/20">
            <Zap className="h-4 w-4 text-info mt-0.5 shrink-0" />
            <div>
              <span className="font-medium text-info">Click ✨ on any image</span> to analyze with OCR, parse tables, use AI vision, and validate data
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
