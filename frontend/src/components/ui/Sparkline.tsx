import { useId, useMemo } from 'react';

interface SparklineProps {
  values: number[];
  color: string;
  height?: number;
  // fixed y-range; defaults to the data's own min/max
  min?: number;
  max?: number;
  className?: string;
}

// Tiny trend line with a soft fill, drawn in a 100-wide viewBox and stretched to the container
export default function Sparkline({ values, color, height = 32, min, max, className }: Readonly<SparklineProps>) {
  const id = useId();
  const { line, area } = useMemo(() => {
    if (values.length < 2) return { line: '', area: '' };
    const lo = min ?? Math.min(...values);
    const hi = max ?? Math.max(...values);
    const span = hi - lo || 1;
    const pts = values.map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = height - 2 - ((v - lo) / span) * (height - 4);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    });
    return {
      line: `M${pts.join(' L')}`,
      area: `M0,${height} L${pts.join(' L')} L100,${height} Z`,
    };
  }, [values, height, min, max]);

  return (
    <svg
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      className={className}
      style={{ width: '100%', height }}
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.22" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {area && <path d={area} fill={`url(#${id})`} />}
      {line && <path d={line} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />}
    </svg>
  );
}
