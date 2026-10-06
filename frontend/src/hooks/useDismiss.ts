import { useEffect } from 'react';

// Close an open dialog with Escape
export function useDismiss(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);
}

// Overlay handler: close only when the press starts on the backdrop itself, not inside the dialog
export function backdropDismiss(onClose: () => void) {
  return (e: React.PointerEvent<HTMLElement>) => {
    if (e.target === e.currentTarget) onClose();
  };
}
