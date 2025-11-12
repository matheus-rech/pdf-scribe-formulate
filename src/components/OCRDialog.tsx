import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Copy, FileText, Sparkles, ShieldCheck } from "lucide-react";
import { extractTextFromImage } from "@/lib/ocr";
import { detectTableStructure } from "@/lib/tableParser";
import { TableParserView } from "./TableParserView";
import { AIVisionEnhancement } from "./AIVisionEnhancement";
import { DataValidationView } from "./DataValidationView";
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
  const [hasTableStructure, setHasTableStructure] = useState(false);
  const [activeTab, setActiveTab] = useState("text");
  const [parsedTable, setParsedTable] = useState<any>(null);

  const handleRunOCR = async () => {
    setIsProcessing(true);
    try {
      toast.info("Processing image with OCR...", { duration: 2000 });
      const text = await extractTextFromImage(imageData);
      
      if (text) {
        setExtractedText(text);
        setHasRun(true);
        
        // Check if text contains table structure
        const hasTable = detectTableStructure(text);
        setHasTableStructure(hasTable);
        
        if (hasTable) {
          const { parseTableFromText } = await import("@/lib/tableParser");
          const parsed = parseTableFromText(text);
          setParsedTable(parsed);
          setActiveTab("table");
          toast.success("Table structure detected! Check the Table tab.");
        } else {
          toast.success("Text extracted successfully!");
        }
      } else {
        toast.warning("No text found in image");
        setExtractedText("[No text detected]");
        setHasRun(true);
        setHasTableStructure(false);
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
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            OCR - Extract Text & Parse Tables
          </DialogTitle>
          <DialogDescription>
            Use AI to extract text and automatically detect table structures
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-5 gap-4">
          {/* Image Preview */}
          <div className="col-span-2 space-y-2">
            <div className="text-sm font-medium">Source Image</div>
            <div className="border rounded-lg overflow-hidden bg-muted/30">
              <img 
                src={imageData} 
                alt="OCR source" 
                className="w-full h-auto"
              />
            </div>
            {!hasRun && (
              <Button onClick={handleRunOCR} disabled={isProcessing} className="w-full gap-2">
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
          </div>

          {/* Extracted Data */}
          <div className="col-span-3 space-y-2">
            <div className="text-sm font-medium">Extracted Data</div>
            {!hasRun ? (
              <div className="border rounded-lg p-8 flex flex-col items-center justify-center text-center h-[400px] bg-muted/30">
                <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  Click "Run OCR" to extract text from this image
                </p>
                <p className="text-xs text-muted-foreground">
                  Tables will be automatically detected and parsed
                </p>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className={`${hasTableStructure ? "grid w-full grid-cols-4" : "w-full"}`}>
                  <TabsTrigger value="text">Raw Text</TabsTrigger>
                  {hasTableStructure && (
                    <>
                      <TabsTrigger value="table" className="gap-2">
                        Table
                        <span className="px-1.5 py-0.5 rounded text-xs bg-success/20 text-success">
                          Detected
                        </span>
                      </TabsTrigger>
                      <TabsTrigger value="ai" className="gap-1">
                        <Sparkles className="h-3 w-3" />
                        AI Vision
                      </TabsTrigger>
                      <TabsTrigger value="validation" className="gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        Validate
                      </TabsTrigger>
                    </>
                  )}
                </TabsList>

                <TabsContent value="text" className="space-y-2">
                  <ScrollArea className="h-[350px] border rounded-lg p-3 bg-background">
                    <Textarea
                      value={extractedText}
                      onChange={(e) => setExtractedText(e.target.value)}
                      className="min-h-[330px] border-0 resize-none focus-visible:ring-0"
                      placeholder="Extracted text will appear here..."
                    />
                  </ScrollArea>
                </TabsContent>

                {hasTableStructure && (
                  <>
                    <TabsContent value="table">
                      <ScrollArea className="h-[350px]">
                        <TableParserView 
                          text={extractedText}
                          onExtractTable={(table) => {
                            setParsedTable(table);
                            toast.success("Table data saved");
                          }}
                        />
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="ai">
                      <ScrollArea className="h-[350px]">
                        <AIVisionEnhancement
                          imageData={imageData}
                          onEnhancedData={(data) => {
                            if (data.headers && data.rows) {
                              const enhanced = {
                                headers: data.headers,
                                rows: data.rows,
                                rowCount: data.rows.length,
                                columnCount: data.headers.length,
                              };
                              setParsedTable(enhanced);
                              setExtractedText(JSON.stringify(data, null, 2));
                            }
                          }}
                        />
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="validation">
                      <ScrollArea className="h-[350px]">
                        {parsedTable ? (
                          <DataValidationView 
                            table={parsedTable}
                            imageData={imageData}
                          />
                        ) : (
                          <Card className="p-6 text-center">
                            <p className="text-sm text-muted-foreground">
                              Parse table first to enable validation
                            </p>
                          </Card>
                        )}
                      </ScrollArea>
                    </TabsContent>
                  </>
                )}
              </Tabs>
            )}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <div className="flex gap-2">
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
              Copy Text
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
