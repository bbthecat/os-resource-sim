// Process colors tuned to sit beside the Sage Forest palette while staying distinct
const PID_COLORS = [
  '#3F7D58', // sage
  '#D97706', // amber
  '#5B5FC7', // indigo
  '#C2417A', // raspberry
  '#2F8FA8', // teal
  '#8C6A3F', // walnut
  '#7A9A3A', // moss
  '#9A5BB5', // plum
  '#C9573A', // brick
  '#4D7C8A', // slate teal
];

export const IDLE_COLOR = '#DCE4DA';
export const IDLE_COLOR_DARK = '#3A4A3F';

export function pidColor(pid: number | null | undefined): string {
  if (pid === null || pid === undefined) return IDLE_COLOR;
  const index = Math.abs(pid) % PID_COLORS.length;
  return PID_COLORS[index];
}

export interface StatusStyle {
  bg: string;
  fg: string;
  dot: string;
}

const STATUS_STYLES: Record<string, StatusStyle> = {
  RUNNING: { bg: '#DCEFE2', fg: '#245338', dot: '#3F7D58' },
  READY: { bg: '#E1ECF6', fg: '#245683', dot: '#2F6FA8' },
  WAITING_IO: { bg: '#FDF0D8', fg: '#8A4B0A', dot: '#D97706' },
  WAITING_MEM: { bg: '#F9E1EC', fg: '#8E2A5A', dot: '#C2417A' },
  NEW: { bg: '#ECE8F6', fg: '#5A4A8E', dot: '#7C68C4' },
  DONE: { bg: '#EEF0ED', fg: '#5C665E', dot: '#94A397' },
};

const FALLBACK_STATUS: StatusStyle = { bg: '#EEF0ED', fg: '#5C665E', dot: '#94A397' };

export function statusStyle(status: string): StatusStyle {
  return STATUS_STYLES[status?.toUpperCase()] ?? FALLBACK_STATUS;
}

export function statusColor(status: string): string {
  return statusStyle(status).dot;
}

// Chart series + chrome for recharts, so charts never hardcode colors
export const CHART = {
  cpu: '#3F7D58',
  ram: '#5B5FC7',
  disk: '#D97706',
  ready: '#2F6FA8',
  io: '#D97706',
  mem: '#C2417A',
  fault: '#C2410C',
  grid: '#E6EDE3',
  axis: '#94A397',
  tooltipBg: '#FFFFFF',
  tooltipBorder: '#DFE8DC',
  tooltipText: '#1F2A1F',
};
