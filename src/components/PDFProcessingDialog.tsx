import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

export interface ProcessingStatus {
  stage: 'uploading' | 'analyzing' | 'chunking' | 'sections' | 'complete';
  progress: number;
  currentPage?: number;
  totalPages?: number;
  message: string;
}

interface PDFProcessingDialogProps {
  open: boolean;
  status: ProcessingStatus;
}

const stageLabels = {
  uploading: "Uploading PDF",
  analyzing: "Analyzing PDF Structure",
  chunking: "Creating Semantic Chunks",
  sections: "Detecting Document Sections",
  complete: "Complete"
};

export function PDFProcessingDialog({ open, status }: PDFProcessingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Processing PDF
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{stageLabels[status.stage]}</span>
              <span className="text-muted-foreground">{Math.round(status.progress)}%</span>
            </div>
            <Progress value={status.progress} className="h-2" />
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{status.message}</p>
            {status.currentPage && status.totalPages && (
              <p className="text-xs text-muted-foreground">
                Page {status.currentPage} of {status.totalPages}
              </p>
            )}
          </div>
          
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${status.progress > 0 ? 'bg-primary' : 'bg-muted'}`} />
              <span className={status.progress > 0 ? 'text-foreground' : ''}>Upload PDF</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${status.progress > 25 ? 'bg-primary' : 'bg-muted'}`} />
              <span className={status.progress > 25 ? 'text-foreground' : ''}>Analyze Structure</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${status.progress > 60 ? 'bg-primary' : 'bg-muted'}`} />
              <span className={status.progress > 60 ? 'text-foreground' : ''}>Create Chunks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${status.progress > 85 ? 'bg-primary' : 'bg-muted'}`} />
              <span className={status.progress > 85 ? 'text-foreground' : ''}>Detect Sections</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
