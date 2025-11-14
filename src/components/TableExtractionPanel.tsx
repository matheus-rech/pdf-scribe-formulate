import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Table2, 
  Download, 
  FileJson, 
  FileSpreadsheet, 
  Trash2,
  Eye,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { tableToCSV, tableToJSON } from '@/lib/tableParser';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TableParserView } from './TableParserView';

interface TableExtractionPanelProps {
  studyId: string;
  onNavigateToTable?: (pageNumber: number, tableId: string) => void;
}

export const TableExtractionPanel: React.FC<TableExtractionPanelProps> = ({
  studyId,
  onNavigateToTable,
}) => {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    loadTables();
  }, [studyId]);

  const loadTables = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pdf_tables')
        .select('*')
        .eq('study_id', studyId)
        .order('page_number', { ascending: true });

      if (error) throw error;
      setTables(data || []);
    } catch (error) {
      console.error('Error loading tables:', error);
      toast.error('Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    try {
      const { error } = await supabase
        .from('pdf_tables')
        .delete()
        .eq('id', tableId);

      if (error) throw error;
      
      setTables(tables.filter(t => t.id !== tableId));
      toast.success('Table deleted');
    } catch (error) {
      console.error('Error deleting table:', error);
      toast.error('Failed to delete table');
    }
  };

  const handleDownloadCSV = (table: any) => {
    const csv = tableToCSV({
      headers: table.headers,
      rows: table.rows,
      columnCount: table.column_count,
      rowCount: table.row_count,
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${table.table_id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Table downloaded as CSV');
  };

  const handleDownloadJSON = (table: any) => {
    const json = tableToJSON({
      headers: table.headers,
      rows: table.rows,
      columnCount: table.column_count,
      rowCount: table.row_count,
    });
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${table.table_id}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Table downloaded as JSON');
  };

  const handleViewTable = (table: any) => {
    setSelectedTable(table);
  };

  return (
    <>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Table2 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Extracted Tables</h3>
            <Badge variant="secondary">{tables.length}</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>

        {isExpanded && (
          <>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading tables...
              </div>
            ) : tables.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Table2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No tables extracted from this document</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {tables.map((table, idx) => (
                    <Card key={table.id} className="p-3 hover:bg-accent/50 transition-colors">
                      <div className="space-y-2">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm font-medium">
                                {table.table_id}
                              </span>
                              {table.ai_enhanced && (
                                <Badge variant="secondary" className="text-xs gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  AI
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Page {table.page_number} • {table.column_count}×{table.row_count}
                            </p>
                          </div>
                        </div>

                        {/* Caption */}
                        {table.caption && (
                          <div className="p-2 rounded-md bg-muted/50">
                            <p className="text-xs line-clamp-2">{table.caption}</p>
                          </div>
                        )}

                        {/* Headers Preview */}
                        <div className="flex flex-wrap gap-1">
                          {table.headers.slice(0, 3).map((header: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {header.substring(0, 12)}
                              {header.length > 12 ? '...' : ''}
                            </Badge>
                          ))}
                          {table.headers.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{table.headers.length - 3}
                            </Badge>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs"
                            onClick={() => handleViewTable(table)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadCSV(table)}
                          >
                            <FileSpreadsheet className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadJSON(table)}
                          >
                            <FileJson className="w-3 h-3" />
                          </Button>
                          {onNavigateToTable && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onNavigateToTable(table.page_number, table.table_id)}
                            >
                              <Table2 className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteTable(table.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </>
        )}
      </Card>

      {/* Table Detail Dialog */}
      <Dialog open={!!selectedTable} onOpenChange={(open) => !open && setSelectedTable(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Table2 className="w-5 h-5" />
              {selectedTable?.table_id}
              {selectedTable?.ai_enhanced && (
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI Enhanced
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {selectedTable && (
              <TableParserView
                text="" // Not used for already parsed tables
                onExtractTable={() => {}}
              />
            )}
            {selectedTable && (
              <div className="space-y-4 p-4">
                {selectedTable.caption && (
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-sm font-medium mb-1">Caption:</p>
                    <p className="text-sm text-muted-foreground">{selectedTable.caption}</p>
                  </div>
                )}
                
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          {selectedTable.headers.map((header: string, idx: number) => (
                            <th key={idx} className="px-4 py-2 text-left text-sm font-medium">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTable.rows.map((row: string[], rowIdx: number) => (
                          <tr key={rowIdx} className="border-t">
                            {row.map((cell: string, cellIdx: number) => (
                              <td key={cellIdx} className="px-4 py-2 text-sm">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => handleDownloadCSV(selectedTable)} className="flex-1">
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Download CSV
                  </Button>
                  <Button onClick={() => handleDownloadJSON(selectedTable)} variant="outline" className="flex-1">
                    <FileJson className="w-4 h-4 mr-2" />
                    Download JSON
                  </Button>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};
