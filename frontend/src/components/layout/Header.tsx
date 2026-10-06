import { useEffect, useRef, useState } from 'react';
import { Cpu, Layers, GitCompare, MoreHorizontal, Download, Sliders, BookOpen } from 'lucide-react';

interface HeaderProps {
  canExport: boolean;
  onOpenPresets: () => void;
  onOpenCompare: () => void;
  onOpenExport: () => void;
  onOpenCustom: () => void;
  onOpenGuide: () => void;
}

const BUTTON =
  'inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-surface border border-line text-sm font-medium text-ink hover:bg-surface-muted hover:border-line-strong transition-colors';

export default function Header({
  canExport,
  onOpenPresets,
  onOpenCompare,
  onOpenExport,
  onOpenCustom,
  onOpenGuide,
}: Readonly<HeaderProps>) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const menuItem = (label: string, Icon: typeof Download, onClick: () => void, disabled = false) => (
    <button
      role="menuitem"
      disabled={disabled}
      onClick={() => {
        setMenuOpen(false);
        onClick();
      }}
      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-ink rounded-md hover:bg-surface-muted disabled:opacity-40 disabled:hover:bg-transparent text-left"
    >
      <Icon size={15} className="text-muted" />
      {label}
    </button>
  );

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
          <Cpu size={19} />
        </div>
        <div>
          <h1 className="text-lg font-semibold leading-tight">OS Resource Simulator</h1>
          <p className="text-sm text-muted">จำลองการจัดคิว CPU หน่วยความจำ และดิสก์ แล้วดูว่าคอขวดอยู่ตรงไหน</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={onOpenPresets} className={BUTTON}>
          <Layers size={15} className="text-primary" />
          Preset scenarios
        </button>
        <button onClick={onOpenCompare} className={BUTTON}>
          <GitCompare size={15} className="text-primary" />
          เปรียบเทียบ A/B
        </button>

        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="เมนูเพิ่มเติม"
            className={`${BUTTON} px-2.5`}
          >
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-1.5 w-52 p-1 bg-surface border border-line rounded-lg shadow-pop z-40 animate-fade-in"
            >
              {menuItem('Export CSV', Download, onOpenExport, !canExport)}
              {menuItem('Custom workload', Sliders, onOpenCustom)}
              {menuItem('คู่มือทฤษฎี OS', BookOpen, onOpenGuide)}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
