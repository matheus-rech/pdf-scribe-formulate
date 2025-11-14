/**
 * Parse a markdown file and extract its text content
 */
export async function parseMarkdownFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(content);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read markdown file'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Extract searchable text from markdown content
 * Removes markdown syntax while preserving the actual content
 */
export function extractTextForSearch(markdownContent: string): string {
  // Remove markdown headers
  let text = markdownContent.replace(/^#{1,6}\s+/gm, '');
  
  // Remove markdown links but keep the text
  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  
  // Remove markdown images
  text = text.replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1');
  
  // Remove markdown bold/italic
  text = text.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1');
  
  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`([^`]+)`/g, '$1');
  
  // Remove horizontal rules
  text = text.replace(/^[-*_]{3,}$/gm, '');
  
  // Clean up extra whitespace
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.trim();
  
  return text;
}

/**
 * Parse markdown into structured sections
 */
export interface MarkdownSection {
  title: string;
  level: number;
  content: string;
}

export function parseMarkdownSections(markdownContent: string): MarkdownSection[] {
  const sections: MarkdownSection[] = [];
  const lines = markdownContent.split('\n');
  
  let currentSection: MarkdownSection | null = null;
  
  for (const line of lines) {
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    
    if (headerMatch) {
      // Save previous section
      if (currentSection) {
        sections.push(currentSection);
      }
      
      // Start new section
      currentSection = {
        title: headerMatch[2],
        level: headerMatch[1].length,
        content: ''
      };
    } else if (currentSection) {
      // Add to current section
      currentSection.content += line + '\n';
    }
  }
  
  // Add final section
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return sections;
}
