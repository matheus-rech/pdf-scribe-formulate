import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Upload, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface Study {
  id: string;
  name: string;
  pdf_name: string | null;
  pdf_url: string | null;
  total_pages: number;
  created_at: string;
  updated_at: string;
  pdf_chunks?: any;
}

interface StudyManagerProps {
  studies: Study[];
  currentStudy: Study | null;
  onStudySelect: (studyId: string) => void;
  onNewStudy: () => void;
  onReprocessStudy?: (studyId: string) => void;
  onBulkReprocess?: () => void;
  isReprocessing?: boolean;
}

export const StudyManager = ({
  studies,
  currentStudy,
  onStudySelect,
  onNewStudy,
  onReprocessStudy,
  onBulkReprocess,
  isReprocessing = false,
}: StudyManagerProps) => {
  const hasChunks = currentStudy?.pdf_chunks?.pageChunks?.length > 0;
  const studiesNeedingReprocess = studies.filter(
    study => !study.pdf_chunks || 
      typeof study.pdf_chunks !== 'object' ||
      !('pageChunks' in study.pdf_chunks) || 
      !(study.pdf_chunks as any).pageChunks || 
      (study.pdf_chunks as any).pageChunks.length === 0
  ).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Meta-Analysis Studies ({studies.length})
        </h3>
        <div className="flex gap-2">
          {studiesNeedingReprocess > 0 && onBulkReprocess && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkReprocess}
              className="gap-2"
              title={`Reprocess ${studiesNeedingReprocess} studies with missing chunks`}
            >
              <RefreshCw className="h-3 w-3" />
              Bulk Process ({studiesNeedingReprocess})
            </Button>
          )}
          {currentStudy && onReprocessStudy && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReprocessStudy(currentStudy.id)}
              disabled={isReprocessing}
              className="gap-2"
              title={hasChunks ? "Re-process PDF chunks" : "Process PDF to enable section detection"}
            >
              <RefreshCw className={`h-3 w-3 ${isReprocessing ? 'animate-spin' : ''}`} />
              {hasChunks ? "Re-process" : "Process PDF"}
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            onClick={onNewStudy}
            className="gap-2"
          >
            <Plus className="h-3 w-3" />
            Add Study
          </Button>
        </div>
      </div>

      {studies.length > 0 ? (
        <Select
          value={currentStudy?.id || ""}
          onValueChange={onStudySelect}
        >
          <SelectTrigger className="w-full bg-card border-border">
            <div className="flex items-center gap-2 w-full">
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <SelectValue placeholder="Select a study to extract data..." />
                {currentStudy && !hasChunks && (
                  <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600 flex-shrink-0">
                    No chunks
                  </Badge>
                )}
              </div>
            </div>
          </SelectTrigger>
          <SelectContent className="bg-card border-border max-h-[300px] z-50">
            {studies.map((study) => (
              <SelectItem 
                key={study.id} 
                value={study.id} 
                className="cursor-pointer"
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{study.name}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {study.pdf_name && (
                      <span className="truncate max-w-[200px]">{study.pdf_name}</span>
                    )}
                    <span>•</span>
                    <span>{study.total_pages} pages</span>
                    <span>•</span>
                    <span>{format(new Date(study.updated_at), "MMM d")}</span>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="text-center py-6 px-4 border-2 border-dashed border-border rounded-lg bg-muted/30">
          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No studies added yet
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Click "Add Study" to upload a PDF
          </p>
        </div>
      )}
    </div>
  );
};
