import { useEffect } from 'react';
import { useSimStore } from '../store/useSimStore';

// Elements that own these keys themselves (typing, native buttons/selects, the timeline slider)
function ownsKeys(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target.closest('input, textarea, select, button, [role="slider"], [role="tab"]')) return true;
  return false;
}

/**
 * Playback shortcuts: Space = play/pause, ←/→ = step one tick (Shift = 10), Home/End = jump.
 * Ignored while a dialog is open or a control has focus.
 */
export function useHotkeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (ownsKeys(e.target)) return;
      if (document.querySelector('[role="dialog"]')) return;

      const { result, currentTick, setTick, togglePlay } = useSimStore.getState();
      if (!result) return;
      const maxTick = Math.max(0, result.snapshots.length - 1);
      const step = e.shiftKey ? 10 : 1;

      switch (e.key) {
        case ' ':
          togglePlay();
          break;
        case 'ArrowRight':
          setTick(Math.min(maxTick, currentTick + step));
          break;
        case 'ArrowLeft':
          setTick(Math.max(0, currentTick - step));
          break;
        case 'Home':
          setTick(0);
          break;
        case 'End':
          setTick(maxTick);
          break;
        default:
          return;
      }
      e.preventDefault();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
