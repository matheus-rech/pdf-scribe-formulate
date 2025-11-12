interface NavigationTarget {
  page: number;
  coordinates?: { x: number; y: number; width: number; height: number };
  highlight?: boolean;
  zoom?: number;
}

export function navigateToPosition(
  target: NavigationTarget,
  containerRef: React.RefObject<HTMLDivElement>,
  onPageChange: (page: number) => void,
  onFlashHighlight?: (coords: { x: number; y: number; width: number; height: number }) => void
): void {
  // Navigate to page
  if (target.page !== undefined) {
    onPageChange(target.page);
  }

  // Wait for page render
  setTimeout(() => {
    if (!containerRef.current || !target.coordinates) return;

    // Scroll to position
    const scrollTop = target.coordinates.y - 100; // Offset for better visibility
    containerRef.current.scrollTo({
      top: scrollTop,
      behavior: 'smooth',
    });

    // Flash highlight if requested
    if (target.highlight && onFlashHighlight) {
      onFlashHighlight(target.coordinates);
    }
  }, 150);
}

export function findAllTextMatches(
  textItems: Array<{ text: string; x: number; y: number; width: number; height: number }>,
  query: string,
  caseSensitive: boolean = false
): Array<{ text: string; coordinates: { x: number; y: number; width: number; height: number } }> {
  const matches: Array<{ text: string; coordinates: { x: number; y: number; width: number; height: number } }> = [];
  const searchQuery = caseSensitive ? query : query.toLowerCase();

  for (const item of textItems) {
    const itemText = caseSensitive ? item.text : item.text.toLowerCase();
    
    if (itemText.includes(searchQuery)) {
      matches.push({
        text: item.text,
        coordinates: {
          x: item.x,
          y: item.y,
          width: item.width,
          height: item.height,
        },
      });
    }
  }

  return matches;
}
