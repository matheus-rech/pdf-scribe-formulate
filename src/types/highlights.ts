export interface TextHighlight {
  id: string;
  pageNumber: number;
  text: string;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  color: string;
  type: 'selection' | 'search' | 'citation';
  timestamp: Date;
  note?: string;
}

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'orange';

export const HIGHLIGHT_COLORS: Record<HighlightColor, string> = {
  yellow: 'hsl(48 96% 53%)',
  green: 'hsl(142 76% 36%)',
  blue: 'hsl(210 85% 55%)',
  pink: 'hsl(330 81% 60%)',
  orange: 'hsl(14 90% 53%)',
};
