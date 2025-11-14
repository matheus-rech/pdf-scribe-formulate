import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Check } from "lucide-react";
import { InputWithHints } from "@/components/InputWithHints";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Step1Props {
  formData: Record<string, string>;
  onUpdate: (updates: Record<string, string>) => void;
  onFieldFocus: (field: string | null) => void;
}

export const Step1StudyId = ({ formData, onUpdate, onFieldFocus }: Step1Props) => {
  const [isSearching, setIsSearching] = useState(false);

  const handleMetadataSearch = async () => {
    const citation = formData.citation?.trim();
    if (!citation || citation.length < 10) {
      toast.error("Please enter a citation or title first");
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-study-metadata', {
        body: { citation }
      });

      if (error) throw error;

      if (data?.success && data?.metadata) {
        onUpdate(data.metadata);
        toast.success("Metadata found and populated!");
      } else {
        toast.warning("Could not extract metadata from citation");
      }
    } catch (error: any) {
      console.error("Metadata search error:", error);
      toast.error(error.message || "Failed to search metadata");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Step 1: Study ID</h2>
      
      {/* Full Citation with AI Metadata Search */}
      <div className="space-y-2">
        <Label htmlFor="citation">Full Citation (Required)</Label>
        <div className="flex gap-2">
          <Textarea
            id="citation"
            value={formData.citation || ''}
            onChange={(e) => onUpdate({ citation: e.target.value })}
            onFocus={() => onFieldFocus('citation')}
            onBlur={() => onFieldFocus(null)}
            placeholder="Paste citation or title, then click ✨"
            required
            className="flex-1"
            rows={3}
          />
          <Button
            type="button"
            onClick={handleMetadataSearch}
            disabled={isSearching}
            variant="outline"
            size="icon"
            className="shrink-0"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* DOI & PMID */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="doi">DOI</Label>
          <Input
            id="doi"
            value={formData.doi || ''}
            onChange={(e) => onUpdate({ doi: e.target.value })}
            onFocus={() => onFieldFocus('doi')}
            onBlur={() => onFieldFocus(null)}
            data-validation="doi"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pmid">PMID</Label>
          <Input
            id="pmid"
            value={formData.pmid || ''}
            onChange={(e) => onUpdate({ pmid: e.target.value })}
            onFocus={() => onFieldFocus('pmid')}
            onBlur={() => onFieldFocus(null)}
            data-validation="pmid"
          />
        </div>
      </div>

      {/* Journal, Year, Country */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="journal">Journal</Label>
          <Input
            id="journal"
            value={formData.journal || ''}
            onChange={(e) => onUpdate({ journal: e.target.value })}
            onFocus={() => onFieldFocus('journal')}
            onBlur={() => onFieldFocus(null)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Input
            id="year"
            type="number"
            value={formData.year || ''}
            onChange={(e) => onUpdate({ year: e.target.value })}
            onFocus={() => onFieldFocus('year')}
            onBlur={() => onFieldFocus(null)}
            data-validation="year"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={formData.country || ''}
            onChange={(e) => onUpdate({ country: e.target.value })}
            onFocus={() => onFieldFocus('country')}
            onBlur={() => onFieldFocus(null)}
          />
        </div>
      </div>

      {/* Centers */}
      <div className="space-y-2">
        <Label htmlFor="centers">Centers (e.g., Single, Multi)</Label>
        <Input
          id="centers"
          value={formData.centers || ''}
          onChange={(e) => onUpdate({ centers: e.target.value })}
          onFocus={() => onFieldFocus('centers')}
          onBlur={() => onFieldFocus(null)}
        />
      </div>

      {/* Funding */}
      <div className="space-y-2">
        <Label htmlFor="funding">Funding Sources</Label>
        <Textarea
          id="funding"
          value={formData.funding || ''}
          onChange={(e) => onUpdate({ funding: e.target.value })}
          onFocus={() => onFieldFocus('funding')}
          onBlur={() => onFieldFocus(null)}
          rows={3}
        />
      </div>

      {/* Conflicts */}
      <div className="space-y-2">
        <Label htmlFor="conflicts">Conflicts of Interest</Label>
        <Textarea
          id="conflicts"
          value={formData.conflicts || ''}
          onChange={(e) => onUpdate({ conflicts: e.target.value })}
          onFocus={() => onFieldFocus('conflicts')}
          onBlur={() => onFieldFocus(null)}
          rows={3}
        />
      </div>

      {/* Trial Registration */}
      <div className="space-y-2">
        <Label htmlFor="registration">Trial Registration ID</Label>
        <Input
          id="registration"
          value={formData.registration || ''}
          onChange={(e) => onUpdate({ registration: e.target.value })}
          onFocus={() => onFieldFocus('registration')}
          onBlur={() => onFieldFocus(null)}
        />
      </div>
    </div>
  );
};
