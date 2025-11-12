import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import Fuse from "fuse.js";

interface SearchResult {
  page: number;
  text: string;
  index: number;
  coordinates?: { x: number; y: number; width: number; height: number };
}

interface SearchPanelProps {
  pdfText: string;
  onSearchResult: (results: SearchResult[]) => void;
  onNavigateToResult?: (result: SearchResult) => void;
  isOpen: boolean;
  onClose: () => void;
  pageTextCache?: Map<number, any>;
  scale?: number;
}

export const SearchPanel = ({ pdfText, onSearchResult, onNavigateToResult, isOpen, onClose, pageTextCache, scale = 1.0 }: SearchPanelProps) => {
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"exact" | "fuzzy">("exact");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const handleSearch = () => {
    if (!query.trim()) return;

    if (searchMode === "exact") {
      const matches: SearchResult[] = [];
      const lines = pdfText.split("\n");
      
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(query.toLowerCase())) {
          const pageNum = Math.floor(index / 50) + 1;
          
          // Try to get precise coordinates if available
          let coordinates: { x: number; y: number; width: number; height: number } | undefined;
          if (pageTextCache?.has(pageNum)) {
            const textData = pageTextCache.get(pageNum);
            const matchingItems = textData.items.filter((item: any) => 
              item.text.toLowerCase().includes(query.toLowerCase())
            );
            
            if (matchingItems.length > 0) {
              const firstMatch = matchingItems[0];
              // Convert PDF coords to screen coords
              coordinates = {
                x: firstMatch.x * scale,
                y: (textData.pageHeight - firstMatch.y - firstMatch.height) * scale,
                width: firstMatch.width * scale,
                height: firstMatch.height * scale,
              };
            }
          }
          
          matches.push({
            page: pageNum,
            text: line,
            index,
            coordinates,
          });
        }
      });
      
      setResults(matches);
      setCurrentMatchIndex(0);
      onSearchResult(matches);
    } else {
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
      setCurrentMatchIndex(0);
      onSearchResult(matches);
    }
  };

  const handleNavigate = (direction: 'next' | 'prev') => {
    if (results.length === 0) return;
    
    let newIndex = currentMatchIndex;
    if (direction === 'next') {
      newIndex = (currentMatchIndex + 1) % results.length;
    } else {
      newIndex = currentMatchIndex === 0 ? results.length - 1 : currentMatchIndex - 1;
    }
    
    setCurrentMatchIndex(newIndex);
    if (onNavigateToResult) {
      onNavigateToResult(results[newIndex]);
    }
  };

  const handleResultClick = (result: SearchResult, index: number) => {
    setCurrentMatchIndex(index);
    if (onNavigateToResult) {
      onNavigateToResult(result);
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
          <>
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
              <div className="text-xs font-medium text-muted-foreground">
                {currentMatchIndex + 1} of {results.length}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavigate('prev')}
                  disabled={results.length === 0}
                  className="h-7 px-2"
                  title="Previous match (Shift+F3)"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavigate('next')}
                  disabled={results.length === 0}
                  className="h-7 px-2"
                  title="Next match (F3)"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
              {results.slice(0, 10).map((result, i) => (
                <Card
                  key={i}
                  className={`p-2 cursor-pointer transition-colors ${
                    i === currentMatchIndex
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleResultClick(result, i)}
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
          </>
        )}
      </div>
    </Card>
  );
};
