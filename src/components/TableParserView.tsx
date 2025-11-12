import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Copy, Table as TableIcon, AlertCircle, CheckCircle2 } from "lucide-react";
import { detectTableStructure, parseTableFromText, tableToJSON, tableToCSV, getTableStats, type ParsedTable } from "@/lib/tableParser";
import { toast } from "sonner";

interface TableParserViewProps {
  text: string;
  onExtractTable?: (data: ParsedTable) => void;
}

export const TableParserView = ({ text, onExtractTable }: TableParserViewProps) => {
  const [parsedTable, setParsedTable] = useState<ParsedTable | null>(null);
  const [hasTable, setHasTable] = useState(false);

  useEffect(() => {
    const detected = detectTableStructure(text);
    setHasTable(detected);
    
    if (detected) {
      const parsed = parseTableFromText(text);
      setParsedTable(parsed);
    } else {
      setParsedTable(null);
    }
  }, [text]);

  if (!hasTable || !parsedTable) {
    return (
      <Card className="p-6 border-warning/20 bg-warning/5">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
          <div>
            <h3 className="font-semibold text-sm mb-1">No Table Structure Detected</h3>
            <p className="text-xs text-muted-foreground">
              The extracted text doesn't appear to contain a structured table. Tables should have:
            </p>
            <ul className="text-xs text-muted-foreground list-disc ml-4 mt-2 space-y-1">
              <li>Multiple columns separated by spaces, tabs, or pipes (|)</li>
              <li>At least 2 rows of data</li>
              <li>Consistent column alignment</li>
            </ul>
          </div>
        </div>
      </Card>
    );
  }

  const stats = getTableStats(parsedTable);
  const jsonData = tableToJSON(parsedTable);
  const csvData = tableToCSV(parsedTable);

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(jsonData);
    toast.success("JSON copied to clipboard");
  };

  const handleCopyCSV = () => {
    navigator.clipboard.writeText(csvData);
    toast.success("CSV copied to clipboard");
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `table-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON downloaded");
  };

  const handleDownloadCSV = () => {
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `table-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  };

  return (
    <div className="space-y-4">
      {/* Success Banner */}
      <Card className="p-4 border-success/20 bg-success/5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">Table Structure Detected!</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
              <div className="text-xs">
                <div className="text-muted-foreground">Rows</div>
                <div className="font-semibold text-sm">{stats.totalRows}</div>
              </div>
              <div className="text-xs">
                <div className="text-muted-foreground">Columns</div>
                <div className="font-semibold text-sm">{stats.totalColumns}</div>
              </div>
              <div className="text-xs">
                <div className="text-muted-foreground">Total Cells</div>
                <div className="font-semibold text-sm">{stats.totalCells}</div>
              </div>
              <div className="text-xs">
                <div className="text-muted-foreground">Fill Rate</div>
                <div className="font-semibold text-sm">{stats.fillRate}%</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Table Preview & Export */}
      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preview">
            <TableIcon className="h-4 w-4 mr-2" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="json">JSON</TabsTrigger>
          <TabsTrigger value="csv">CSV</TabsTrigger>
        </TabsList>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-3">
          <ScrollArea className="h-[300px] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {parsedTable.headers.map((header, index) => (
                    <TableHead key={index} className="font-semibold">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedTable.rows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex}>{cell}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
          <div className="flex gap-2">
            <Button onClick={handleDownloadCSV} variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Download CSV
            </Button>
            <Button onClick={handleDownloadJSON} variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Download JSON
            </Button>
            {onExtractTable && (
              <Button onClick={() => onExtractTable(parsedTable)} size="sm" className="gap-2 ml-auto">
                <TableIcon className="h-4 w-4" />
                Save Table Data
              </Button>
            )}
          </div>
        </TabsContent>

        {/* JSON Tab */}
        <TabsContent value="json" className="space-y-3">
          <ScrollArea className="h-[300px] rounded-md border bg-muted/30">
            <pre className="p-4 text-xs font-mono">
              {jsonData}
            </pre>
          </ScrollArea>
          <div className="flex gap-2">
            <Button onClick={handleCopyJSON} variant="outline" size="sm" className="gap-2">
              <Copy className="h-4 w-4" />
              Copy JSON
            </Button>
            <Button onClick={handleDownloadJSON} variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Download JSON
            </Button>
          </div>
        </TabsContent>

        {/* CSV Tab */}
        <TabsContent value="csv" className="space-y-3">
          <ScrollArea className="h-[300px] rounded-md border bg-muted/30">
            <pre className="p-4 text-xs font-mono whitespace-pre-wrap">
              {csvData}
            </pre>
          </ScrollArea>
          <div className="flex gap-2">
            <Button onClick={handleCopyCSV} variant="outline" size="sm" className="gap-2">
              <Copy className="h-4 w-4" />
              Copy CSV
            </Button>
            <Button onClick={handleDownloadCSV} variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Download CSV
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
