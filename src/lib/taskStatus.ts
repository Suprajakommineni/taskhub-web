export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed';

export const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'review', label: 'In review' },
  { value: 'completed', label: 'Completed' },
];

// Semantic status color — communicates state, distinct from the
// team/project accent-color rotation in palette.ts which just distinguishes groups.
export const STATUS_BADGE: Record<TaskStatus, string> = {
  todo: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300',
  in_progress: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300',
  review: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
};

export const STATUS_DOT: Record<TaskStatus, string> = {
  todo: 'bg-slate-400',
  in_progress: 'bg-indigo-500',
  review: 'bg-amber-500',
  completed: 'bg-emerald-500',
};

export function statusLabel(status: TaskStatus) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;
}