import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Upload } from "lucide-react";
import { format } from "date-fns";

interface Study {
  id: string;
  name: string;
  pdf_name: string | null;
  pdf_url: string | null;
  total_pages: number;
  created_at: string;
  updated_at: string;
}

interface StudyManagerProps {
  studies: Study[];
  currentStudy: Study | null;
  onStudySelect: (studyId: string) => void;
  onNewStudy: () => void;
}

export const StudyManager = ({
  studies,
  currentStudy,
  onStudySelect,
  onNewStudy,
}: StudyManagerProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Meta-Analysis Studies ({studies.length})
        </h3>
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

      {studies.length > 0 ? (
        <Select
          value={currentStudy?.id || ""}
          onValueChange={onStudySelect}
        >
          <SelectTrigger className="w-full bg-card border-border">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Select a study to extract data..." />
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
