import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FolderOpen, Plus } from "lucide-react";
import { format } from "date-fns";

interface Project {
  id: string;
  name: string;
  pdf_name: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectSelectorProps {
  projects: Project[];
  currentProject: Project | null;
  onProjectSelect: (projectId: string) => void;
  onNewProject: () => void;
}

export const ProjectSelector = ({
  projects,
  currentProject,
  onProjectSelect,
  onNewProject,
}: ProjectSelectorProps) => {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={currentProject?.id || ""}
        onValueChange={onProjectSelect}
      >
        <SelectTrigger className="w-[280px] bg-card border-border">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Select a project..." />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-card border-border max-h-[300px] z-50">
          {projects.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              No projects yet
            </div>
          ) : (
            projects.map((project) => (
              <SelectItem key={project.id} value={project.id} className="cursor-pointer">
                <div className="flex flex-col items-start">
                  <span className="font-medium">{project.name}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {project.pdf_name && (
                      <span className="truncate max-w-[180px]">{project.pdf_name}</span>
                    )}
                    <span>•</span>
                    <span>{format(new Date(project.updated_at), "MMM d, yyyy")}</span>
                  </div>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onNewProject}
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        New
      </Button>
    </div>
  );
};
