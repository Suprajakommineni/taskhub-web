export type Priority = 'low' | 'medium' | 'high';

export const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

// Semantic priority color — separate from the team accent rotation in
// palette.ts. This always means the same thing (how urgent the task is),
// so it stays fixed rather than rotating.
export const PRIORITY_BADGE: Record<Priority, string> = {
  low: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  medium: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  high: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
};

export const PRIORITY_DOT: Record<Priority, string> = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-rose-500',
};

export function priorityLabel(priority: Priority) {
  return PRIORITY_OPTIONS.find((p) => p.value === priority)?.label ?? priority;
}

// Small fixed rotation for role chips (roleInTask) — role names are free text,
// so pick a color deterministically from the string itself.
const ROLE_COLORS = [
  'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-500/10 dark:text-fuchsia-300',
  'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300',
  'bg-lime-50 text-lime-700 dark:bg-lime-500/10 dark:text-lime-300',
  'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
  'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
];

export function roleChipColor(role: string) {
  let hash = 0;
  for (let i = 0; i < role.length; i++) hash = (hash * 31 + role.charCodeAt(i)) >>> 0;
  return ROLE_COLORS[hash % ROLE_COLORS.length];
}
