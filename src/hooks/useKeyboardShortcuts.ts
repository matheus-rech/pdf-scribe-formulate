import { useEffect } from 'react';

interface KeyboardShortcutHandlers {
  onDelete?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onEscape?: () => void;
  onSelectAll?: () => void;
}

export const useKeyboardShortcuts = (handlers: KeyboardShortcutHandlers, enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Prevent shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Delete/Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && handlers.onDelete) {
        e.preventDefault();
        handlers.onDelete();
      }

      // Ctrl/Cmd + Z (Undo)
      if (modKey && e.key === 'z' && !e.shiftKey && handlers.onUndo) {
        e.preventDefault();
        handlers.onUndo();
      }

      // Ctrl/Cmd + Shift + Z (Redo)
      if (modKey && e.key === 'z' && e.shiftKey && handlers.onRedo) {
        e.preventDefault();
        handlers.onRedo();
      }

      // Ctrl/Cmd + Y (Redo alternative)
      if (modKey && e.key === 'y' && handlers.onRedo) {
        e.preventDefault();
        handlers.onRedo();
      }

      // Escape
      if (e.key === 'Escape' && handlers.onEscape) {
        e.preventDefault();
        handlers.onEscape();
      }

      // Ctrl/Cmd + A (Select All)
      if (modKey && e.key === 'a' && handlers.onSelectAll) {
        e.preventDefault();
        handlers.onSelectAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers, enabled]);
};
