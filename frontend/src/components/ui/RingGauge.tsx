interface RingGaugeProps {
  // 0–100
  value: number;
  color: string;
  trackColor: string;
  size?: number;
  stroke?: number;
  label?: string;
  valueClassName?: string;
}

// Donut meter with the value in the centre
export default function RingGauge({
  value,
  color,
  trackColor,
  size = 76,
  stroke = 8,
  label,
  valueClassName = 'text-ink',
}: Readonly<RingGaugeProps>) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={label ? `${label} ${pct.toFixed(0)}%` : undefined}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * c} ${c}`}
          className="transition-[stroke-dasharray] duration-300 ease-out"
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-base font-semibold tabular-nums ${valueClassName}`}>
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}
