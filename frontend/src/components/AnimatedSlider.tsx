import * as Slider from '@radix-ui/react-slider';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedSliderProps {
  value: number;
  onValueChange: (val: number) => void;
  min: number;
  max: number;
  step?: number;
  // Kept for API compatibility; every variant renders with the primary token
  color?: 'blue' | 'emerald' | 'purple' | 'amber';
  label?: string;
  unit?: string;
}

export function AnimatedSlider({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  label,
  unit = ''
}: AnimatedSliderProps) {
  return (
    <div className="w-full flex flex-col gap-2">
      {(label || value !== undefined) && (
        <div className="flex justify-between items-baseline gap-2">
          {label && <span className="text-sm font-medium text-ink">{label}</span>}
          <div
            aria-hidden="true"
            className="inline-flex items-baseline shrink-0 overflow-hidden h-6 rounded-full bg-primary-soft px-2 py-0.5 font-mono text-xs text-primary-ink"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={value}
                initial={{ y: 6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -6, opacity: 0 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="font-semibold tabular-nums leading-5"
              >
                {value}
              </motion.span>
            </AnimatePresence>
            {unit && <span className="ml-1 leading-5 text-primary-ink/70">{unit}</span>}
          </div>
        </div>
      )}

      <Slider.Root
        className="relative flex items-center select-none touch-none w-full h-5 cursor-pointer"
        value={[value]}
        onValueChange={(vals) => onValueChange(vals[0])}
        max={max}
        min={min}
        step={step}
      >
        <Slider.Track className="relative flex-grow rounded-full h-1.5 overflow-hidden bg-surface-muted">
          <Slider.Range className="absolute h-full rounded-full bg-primary" />
        </Slider.Track>
        <Slider.Thumb
          aria-label={label}
          aria-valuetext={unit ? `${value} ${unit}` : undefined}
          className="block w-4 h-4 rounded-full bg-surface border-2 border-primary shadow-card cursor-grab active:cursor-grabbing hover:border-primary-hover transition-colors"
        />
      </Slider.Root>
      <div className="flex justify-between -mt-1 text-xs text-subtle tabular-nums">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
}
