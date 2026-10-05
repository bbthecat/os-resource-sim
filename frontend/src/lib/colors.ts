const PID_COLORS = [
  '#6366F1', // indigo
  '#EC4899', // pink
  '#10B981', // emerald
  '#F59E0B', // amber
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#14B8A6', // teal
  '#F97316', // orange
  '#06B6D4', // cyan
  '#E11D48', // rose
];

export function pidColor(pid: number | null | undefined): string {
  if (pid === null || pid === undefined) return '#374151'; // gray-700
  const index = Math.abs(pid) % PID_COLORS.length;
  return PID_COLORS[index];
}

export function statusColor(status: string): string {
  switch (status?.toUpperCase()) {
    case 'RUNNING':
      return '#10B981'; // green
    case 'READY':
      return '#3B82F6'; // blue
    case 'WAITING_IO':
      return '#F59E0B'; // amber
    case 'WAITING_MEM':
      return '#EC4899'; // pink
    case 'DONE':
      return '#6B7280'; // gray
    case 'NEW':
      return '#8B5CF6'; // purple
    default:
      return '#9CA3AF';
  }
}
