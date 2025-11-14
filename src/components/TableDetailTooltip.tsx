import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Copy, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { tableToCSV, tableToJSON } from '@/lib/tableParser';

interface TableDetailTooltipProps {
  table: {
    id: string;
    table_id: string;
    page_number: number;
    caption: string | null;
    headers: string[];
    rows: string[][];
    column_count: number;
    row_count: number;
    ai_enhanced: boolean;
    confidence_score: number | null;
    x: number;
    y: number;
    bbox_width: number;
    bbox_height: number;
  } | null;
  mouseX: number;
  mouseY: number;
}

export const TableDetailTooltip: React.FC<TableDetailTooltipProps> = ({
  table,
  mouseX,
  mouseY,
}) => {
  const [position, setPosition] = useState({ x: mouseX, y: mouseY });

  useEffect(() => {
    if (!table) return;

    const tooltipWidth = 350;
    const tooltipHeight = 300;
    const padding = 20;

    let x = mouseX + 15;
    let y = mouseY + 15;

    if (x + tooltipWidth > window.innerWidth - padding) {
      x = mouseX - tooltipWidth - 15;
    }

    if (y + tooltipHeight > window.innerHeight - padding) {
      y = window.innerHeight - tooltipHeight - padding;
    }

    setPosition({ x: Math.max(padding, x), y: Math.max(padding, y) });
  }, [table, mouseX, mouseY]);

  if (!table) return null;

  const handleCopyJSON = () => {
    const json = tableToJSON({
      headers: table.headers,
      rows: table.rows,
      columnCount: table.column_count,
      rowCount: table.row_count,
    });
    navigator.clipboard.writeText(json);
    toast.success('Table JSON copied to clipboard');
  };

  const handleDownloadCSV = () => {
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

  return (
    <Card
      className="fixed z-50 p-4 shadow-xl border-2 border-primary/20 bg-background/95 backdrop-blur-sm max-w-[350px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm text-muted-foreground">
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
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-sm font-medium mb-1">Caption:</p>
            <p className="text-xs text-muted-foreground line-clamp-3">
              {table.caption}
            </p>
            {table.confidence_score !== null && (
              <p className="text-xs text-muted-foreground mt-1">
                Confidence: {(table.confidence_score * 100).toFixed(0)}%
              </p>
            )}
          </div>
        )}

        {/* Headers Preview */}
        <div>
          <p className="text-sm font-medium mb-1">Headers:</p>
          <div className="flex flex-wrap gap-1">
            {table.headers.slice(0, 4).map((header, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {header.substring(0, 15)}
                {header.length > 15 ? '...' : ''}
              </Badge>
            ))}
            {table.headers.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{table.headers.length - 4} more
              </Badge>
            )}
          </div>
        </div>

        {/* Position Info */}
        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>Position: ({Math.round(table.x)}, {Math.round(table.y)})</p>
          <p>Size: {Math.round(table.bbox_width)}×{Math.round(table.bbox_height)}px</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={handleDownloadCSV}
          >
            <Download className="w-3 h-3 mr-1" />
            CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={handleCopyJSON}
          >
            <Copy className="w-3 h-3 mr-1" />
            JSON
          </Button>
        </div>
      </div>
    </Card>
  );
};
