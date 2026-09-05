// Shared accent-color rotation used to color-code teams (in the create-project
// sheet), projects (on the Projects grid), and task assignees (on the project
// detail page), so the same visual language carries across the whole app.

export interface AccentColor {
  name: string;
  dot: string;
  border: string;
  bar: string;
  chip: string;
  ring: string;
  text: string;
}

export const ACCENT_COLORS: AccentColor[] = [
  {
    name: 'indigo',
    dot: 'bg-indigo-500',
    border: 'border-l-indigo-500',
    bar: 'bg-indigo-500',
    chip: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300',
    ring: 'ring-indigo-500/15',
    text: 'text-indigo-700 dark:text-indigo-300',
  },
  {
    name: 'violet',
    dot: 'bg-violet-500',
    border: 'border-l-violet-500',
    bar: 'bg-violet-500',
    chip: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
    ring: 'ring-violet-500/15',
    text: 'text-violet-700 dark:text-violet-300',
  },
  {
    name: 'emerald',
    dot: 'bg-emerald-500',
    border: 'border-l-emerald-500',
    bar: 'bg-emerald-500',
    chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    ring: 'ring-emerald-500/15',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    name: 'amber',
    dot: 'bg-amber-500',
    border: 'border-l-amber-500',
    bar: 'bg-amber-500',
    chip: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    ring: 'ring-amber-500/15',
    text: 'text-amber-700 dark:text-amber-300',
  },
  {
    name: 'rose',
    dot: 'bg-rose-500',
    border: 'border-l-rose-500',
    bar: 'bg-rose-500',
    chip: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
    ring: 'ring-rose-500/15',
    text: 'text-rose-700 dark:text-rose-300',
  },
  {
    name: 'sky',
    dot: 'bg-sky-500',
    border: 'border-l-sky-500',
    bar: 'bg-sky-500',
    chip: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
    ring: 'ring-sky-500/15',
    text: 'text-sky-700 dark:text-sky-300',
  },
];

export function accentColor(index: number): AccentColor {
  return ACCENT_COLORS[index % ACCENT_COLORS.length];
}