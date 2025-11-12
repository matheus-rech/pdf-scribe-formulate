import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Copy, FileText, Sparkles } from "lucide-react";
import { extractTextFromImage } from "@/lib/ocr";
import { toast } from "sonner";

interface OCRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageData: string;
  onExtractToField?: (text: string) => void;
}

export const OCRDialog = ({ open, onOpenChange, imageData, onExtractToField }: OCRDialogProps) => {
  const [extractedText, setExtractedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const handleRunOCR = async () => {
    setIsProcessing(true);
    try {
      toast.info("Processing image with OCR...", { duration: 2000 });
      const text = await extractTextFromImage(imageData);
      
      if (text) {
        setExtractedText(text);
        setHasRun(true);
        toast.success("Text extracted successfully!");
      } else {
        toast.warning("No text found in image");
        setExtractedText("[No text detected]");
        setHasRun(true);
      }
    } catch (error) {
      console.error("OCR error:", error);
      toast.error("OCR failed. Try again or use a different image.");
      setExtractedText(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedText);
    toast.success("Text copied to clipboard");
  };

  const handleExtract = () => {
    if (onExtractToField && extractedText) {
      onExtractToField(extractedText);
      toast.success("Text extracted to active field");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            OCR - Extract Text from Image
          </DialogTitle>
          <DialogDescription>
            Use AI to extract text content from tables, figures, and diagrams
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* Image Preview */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Source Image</div>
            <div className="border rounded-lg overflow-hidden bg-muted/30">
              <img 
                src={imageData} 
                alt="OCR source" 
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* Extracted Text */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Extracted Text</div>
            {!hasRun ? (
              <div className="border rounded-lg p-8 flex flex-col items-center justify-center text-center h-[300px] bg-muted/30">
                <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  Click "Run OCR" to extract text from this image
                </p>
                <Button onClick={handleRunOCR} disabled={isProcessing} className="gap-2">
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Run OCR
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[300px] border rounded-lg p-3 bg-background">
                <Textarea
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  className="min-h-[280px] border-0 resize-none focus-visible:ring-0"
                  placeholder="Extracted text will appear here..."
                />
              </ScrollArea>
            )}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <div className="flex gap-2">
            {!hasRun && (
              <Button onClick={handleRunOCR} disabled={isProcessing} variant="default" className="gap-2">
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Run OCR
                  </>
                )}
              </Button>
            )}
            {hasRun && (
              <Button onClick={handleRunOCR} disabled={isProcessing} variant="outline" className="gap-2">
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Re-run OCR"
                )}
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCopy}
              disabled={!extractedText || extractedText === "[No text detected]"}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
            {onExtractToField && (
              <Button
                onClick={handleExtract}
                disabled={!extractedText || extractedText === "[No text detected]"}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Extract to Field
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
