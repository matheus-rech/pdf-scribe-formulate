import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Users, Zap, Clock, Coins, Target } from "lucide-react";

interface ExtractionMethodInfoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ExtractionMethodInfo = ({ open, onOpenChange }: ExtractionMethodInfoProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Extraction Method Comparison
          </DialogTitle>
          <DialogDescription>
            Choose the right extraction method based on your needs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Comparison Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature</TableHead>
                <TableHead>Single AI Extraction</TableHead>
                <TableHead>Multi-AI Review</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  AI Models
                </TableCell>
                <TableCell>1 model (Gemini Flash)</TableCell>
                <TableCell>8 specialized models</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Processing Time
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                    ~3-5 seconds
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                    ~20-30 seconds
                  </Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium flex items-center gap-2">
                  <Coins className="w-4 h-4" />
                  Credit Usage
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                    Lower
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                    Higher (8x models)
                  </Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Accuracy
                </TableCell>
                <TableCell>
                  Good for straightforward data
                </TableCell>
                <TableCell>
                  Superior with consensus validation
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Features
                </TableCell>
                <TableCell>
                  <ul className="text-sm space-y-1">
                    <li>• Quick extraction</li>
                    <li>• Single confidence score</li>
                    <li>• No conflict detection</li>
                  </ul>
                </TableCell>
                <TableCell>
                  <ul className="text-sm space-y-1">
                    <li>• Consensus-based results</li>
                    <li>• Conflict detection & resolution</li>
                    <li>• Agreement level tracking</li>
                    <li>• Multiple validation perspectives</li>
                  </ul>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Recommendations */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">When to Use Each Method</h3>
            
            <div className="space-y-2">
              <div className="p-3 rounded-lg border bg-card">
                <div className="font-medium text-sm mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Single AI Extraction
                </div>
                <p className="text-sm text-muted-foreground">
                  Best for: Initial drafts, straightforward data, time-sensitive extractions, 
                  or when working with limited credits. Ideal for simple study designs with clear data.
                </p>
              </div>

              <div className="p-3 rounded-lg border bg-card">
                <div className="font-medium text-sm mb-1 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Multi-AI Review
                </div>
                <p className="text-sm text-muted-foreground">
                  Best for: Final extractions, complex studies, ambiguous data, systematic reviews,
                  or when accuracy is critical. Provides validation through multiple AI perspectives
                  and helps identify conflicting interpretations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
