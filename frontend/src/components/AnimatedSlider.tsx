import React from 'react';
import * as Slider from '@radix-ui/react-slider';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedSliderProps {
  value: number;
  onValueChange: (val: number) => void;
  min: number;
  max: number;
  step?: number;
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
  color = 'blue',
  label,
  unit = ''
}: AnimatedSliderProps) {
  const [isDragging, setIsDragging] = React.useState(false);

  const colors = {
    blue: {
      range: 'bg-blue-500',
      thumb: 'bg-white',
      shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.6)]',
      text: 'text-blue-400',
      glow: 'rgba(59,130,246,0.8)'
    },
    emerald: {
      range: 'bg-emerald-500',
      thumb: 'bg-white',
      shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.6)]',
      text: 'text-emerald-400',
      glow: 'rgba(16,185,129,0.8)'
    },
    purple: {
      range: 'bg-purple-500',
      thumb: 'bg-white',
      shadow: 'shadow-[0_0_15px_rgba(168,85,247,0.6)]',
      text: 'text-purple-400',
      glow: 'rgba(168,85,247,0.8)'
    },
    amber: {
      range: 'bg-amber-500',
      thumb: 'bg-white',
      shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.6)]',
      text: 'text-amber-400',
      glow: 'rgba(245,158,11,0.8)'
    }
  };

  const theme = colors[color];

  return (
    <div className="w-full flex flex-col gap-2 group">
      {(label || value !== undefined) && (
        <div className="flex justify-between items-end">
          {label && <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{label}</label>}
          <div className="flex items-center overflow-hidden h-5">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={value}
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -15, opacity: 0 }}
                transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 25 }}
                className={`font-mono text-xs font-bold ${theme.text} drop-shadow-sm`}
              >
                {value}
              </motion.span>
            </AnimatePresence>
            {unit && <span className={`ml-1 text-[10px] ${theme.text} opacity-70`}>{unit}</span>}
          </div>
        </div>
      )}

      <Slider.Root
        className="relative flex items-center select-none touch-none w-full h-4 cursor-pointer"
        value={[value]}
        onValueChange={(vals) => onValueChange(vals[0])}
        max={max}
        min={min}
        step={step}
        onPointerDown={() => setIsDragging(true)}
        onPointerUp={() => setIsDragging(false)}
      >
        <Slider.Track className="relative flex-grow rounded-full h-2 overflow-hidden bg-slate-200 border border-slate-300 shadow-inner">
          <Slider.Range className={`absolute h-full rounded-full ${theme.range} transition-all duration-75 ease-out relative`} />
        </Slider.Track>
        <Slider.Thumb
          className={`block w-4 h-4 rounded-full ${theme.thumb} outline-none focus:outline-none transition-transform duration-200 ease-out z-10`}
          asChild
        >
          <motion.div
            animate={{
              scale: isDragging ? 1.6 : 1.2,
              boxShadow: isDragging ? `0 0 25px ${theme.glow}` : `0 0 10px ${theme.glow}`
            }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className={`cursor-grab active:cursor-grabbing border-2 border-white ${theme.shadow}`}
          >
            {isDragging && (
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className={`absolute inset-0 rounded-full ${theme.range} mix-blend-screen blur-[2px] opacity-70`}
              />
            )}
          </motion.div>
        </Slider.Thumb>
      </Slider.Root>
      <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1 opacity-50 group-hover:opacity-100 transition-opacity">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
}
