import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Search, X } from "lucide-react";
import Fuse from "fuse.js";

interface SearchPanelProps {
  pdfText: string;
  onSearchResult: (results: Array<{ page: number; text: string; index: number }>) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const SearchPanel = ({ pdfText, onSearchResult, isOpen, onClose }: SearchPanelProps) => {
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"exact" | "fuzzy">("exact");
  const [results, setResults] = useState<Array<{ page: number; text: string; index: number }>>([]);

  const handleSearch = () => {
    if (!query.trim()) return;

    if (searchMode === "exact") {
      // Exact search
      const matches: Array<{ page: number; text: string; index: number }> = [];
      const lines = pdfText.split("\n");
      
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(query.toLowerCase())) {
          matches.push({
            page: Math.floor(index / 50) + 1, // Approximate page
            text: line,
            index,
          });
        }
      });
      
      setResults(matches);
      onSearchResult(matches);
    } else {
      // Fuzzy search using Fuse.js
      const lines = pdfText.split("\n").map((text, index) => ({
        text,
        index,
        page: Math.floor(index / 50) + 1,
      }));
      
      const fuse = new Fuse(lines, {
        keys: ["text"],
        threshold: 0.4,
        includeScore: true,
      });
      
      const fuseResults = fuse.search(query);
      const matches = fuseResults.slice(0, 20).map((r) => r.item);
      
      setResults(matches);
      onSearchResult(matches);
    }
  };

  if (!isOpen) return null;

  return (
    <Card className="absolute top-16 right-4 w-96 p-4 shadow-xl z-50 bg-card border-2 border-primary/20">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Search PDF</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-3">
        <Textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter text to search..."
          rows={3}
          className="resize-none"
        />
        
        <div className="flex gap-2">
          <Button
            variant={searchMode === "exact" ? "default" : "outline"}
            size="sm"
            onClick={() => setSearchMode("exact")}
            className="flex-1"
          >
            Exact
          </Button>
          <Button
            variant={searchMode === "fuzzy" ? "default" : "outline"}
            size="sm"
            onClick={() => setSearchMode("fuzzy")}
            className="flex-1"
          >
            Fuzzy
          </Button>
        </div>
        
        <Button onClick={handleSearch} className="w-full gap-2">
          <Search className="h-4 w-4" />
          Search
        </Button>
        
        {results.length > 0 && (
          <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
            <div className="text-sm font-medium text-muted-foreground">
              {results.length} results found
            </div>
            {results.slice(0, 10).map((result, i) => (
              <Card
                key={i}
                className="p-2 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <div className="text-xs font-medium text-primary mb-1">
                  Page {result.page}
                </div>
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {result.text}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
