import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ExtractionEntry } from "@/pages/Index";

interface Project {
  id: string;
  email: string;
  name: string;
  pdf_name: string | null;
  total_pages: number;
  created_at: string;
  updated_at: string;
}

export const useProjectStorage = (email: string | null) => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Create or get project
  const createProject = async (name: string, pdfName: string, totalPages: number) => {
    if (!email) {
      toast.error("Email required");
      return null;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .insert({
          email,
          name,
          pdf_name: pdfName,
          total_pages: totalPages,
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentProject(data);
      toast.success("Project created");
      return data;
    } catch (error: any) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Save extraction
  const saveExtraction = async (projectId: string, extraction: ExtractionEntry) => {
    try {
      const { error } = await supabase.from("extractions").insert({
        project_id: projectId,
        extraction_id: extraction.id,
        field_name: extraction.fieldName,
        text: extraction.text,
        page: extraction.page,
        coordinates: extraction.coordinates || null,
        method: extraction.method,
        timestamp: extraction.timestamp.toISOString(),
        image_data: extraction.imageData || null,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("Error saving extraction:", error);
      toast.error("Failed to save extraction");
    }
  };

  // Load extractions for project
  const loadExtractions = async (projectId: string): Promise<ExtractionEntry[]> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("extractions")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return data.map((e) => ({
        id: e.extraction_id,
        fieldName: e.field_name,
        text: e.text || "",
        page: e.page || 1,
        coordinates: e.coordinates as any,
        method: e.method as any,
        timestamp: new Date(e.timestamp || e.created_at),
        imageData: e.image_data || undefined,
      }));
    } catch (error: any) {
      console.error("Error loading extractions:", error);
      toast.error("Failed to load extractions");
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Get recent projects for email
  const getRecentProjects = async () => {
    if (!email) return [];

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("email", email)
        .order("updated_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error loading projects:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    currentProject,
    setCurrentProject,
    isLoading,
    createProject,
    saveExtraction,
    loadExtractions,
    getRecentProjects,
  };
};
