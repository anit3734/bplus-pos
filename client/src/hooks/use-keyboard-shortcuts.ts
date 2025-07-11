import { useEffect } from 'react';

interface KeyboardShortcuts {
  onBarcodeScanner?: () => void;
  onClearCart?: () => void;
  onProcessPayment?: () => void;
  onFocusSearch?: () => void;
}

export function useKeyboardShortcuts({
  onBarcodeScanner,
  onClearCart,
  onProcessPayment,
  onFocusSearch,
}: KeyboardShortcuts) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Check if Ctrl/Cmd is pressed for shortcuts
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;

      switch (event.key.toLowerCase()) {
        case 'b':
          if (isCtrlOrCmd) {
            event.preventDefault();
            onBarcodeScanner?.();
          }
          break;
        case 'f':
          if (isCtrlOrCmd) {
            event.preventDefault();
            onFocusSearch?.();
          }
          break;
        case 'enter':
          if (isCtrlOrCmd) {
            event.preventDefault();
            onProcessPayment?.();
          }
          break;
        case 'delete':
          if (isCtrlOrCmd) {
            event.preventDefault();
            onClearCart?.();
          }
          break;
        case 'escape':
          // ESC key can be used to clear cart
          onClearCart?.();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onBarcodeScanner, onClearCart, onProcessPayment, onFocusSearch]);
}