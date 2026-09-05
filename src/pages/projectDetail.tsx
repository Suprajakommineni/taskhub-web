import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, LayoutGrid, Table2, List, MoreVertical, Trash2,
  Users, FolderKanban, CircleCheck, PanelRightOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { getProject } from '../lib/projectapi';
import { getTasksForProject, createTask, updateTask, deleteTask } from '../lib/taskapi';
import { accentColor } from '../lib/palette';
import { initials, photoUrl } from '../lib/utils';
import { STATUS_OPTIONS, STATUS_BADGE, STATUS_DOT, statusLabel, type TaskStatus } from '../lib/taskStatus';
import { PRIORITY_OPTIONS, PRIORITY_BADGE, PRIORITY_DOT, priorityLabel, roleChipColor, type Priority } from '../lib/priority';

interface ProjectUser {
  id: number;
  username?: string;
  email: string;
  profilePhoto?: string;
}

interface ProjectTeamMember {
  id: number;
  teamId: number;
  role: 'lead' | 'member';
  user?: ProjectUser;
}

interface ProjectTeam {
  id: number;
  name: string;
  members: ProjectTeamMember[];
}

interface ProjectDetailData {
  id: number;
  title: string;
  createdAt: string;
  teams: ProjectTeam[];
}

interface TaskAssignee {
  id: number;
  teamMemberId: number;
  teamMember?: ProjectTeamMember;
  roleInTask?: string[];
}

interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  projectId: number;
  assignees?: TaskAssignee[];
}

type ViewMode = 'board' | 'table' | 'list';

export default function ProjectDetail() {
  const { id } = useParams();
  const projectId = Number(id);

  const [project, setProject] = useState<ProjectDetailData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<ViewMode>('board');
  const [panelOpen, setPanelOpen] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newStatus, setNewStatus] = useState<TaskStatus>('todo');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [newRoleInput, setNewRoleInput] = useState('');

  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [projectData, tasksData] = await Promise.all([
          getProject(projectId),
          getTasksForProject(projectId),
        ]);
        if (!cancelled) {
          setProject(projectData);
          setTasks(tasksData);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load project');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [projectId]);

  const teams = project?.teams ?? [];
  const teamColorMap = new Map<number, ReturnType<typeof accentColor>>();
  teams.forEach((t, i) => teamColorMap.set(t.id, accentColor(i)));

  const allMembers = teams.flatMap((t) =>
    (t.members ?? [])
      .filter((m) => m.user?.email)
      .map((m) => ({
        id: m.id,
        label: `${m.user?.username || m.user?.email} — ${t.name}`,
        color: teamColorMap.get(t.id)!,
      })),
  );

  // Real, computed from actual task status — not a fabricated number.
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  function memberDisplay(assignee: TaskAssignee) {
    const user = assignee.teamMember?.user;
    const name = user?.username || user?.email || 'Member';
    const color = teamColorMap.get(assignee.teamMember?.teamId ?? -1);
    return { name, color: color ?? accentColor(0), photo: user?.profilePhoto };
  }

  // Priority breakdown for the right panel — real counts from actual tasks.
  const priorityCounts: Record<Priority, number> = { low: 0, medium: 0, high: 0 };
  tasks.forEach((t) => { priorityCounts[t.priority] = (priorityCounts[t.priority] ?? 0) + 1; });

  // Every distinct team represented among a task's assignees, as pill tags —
  // real data (which teams are actually working this task), not invented categories.
  function taskTeamTags(task: Task) {
    const seen = new Map<number, { name: string; color: ReturnType<typeof accentColor> }>();
    for (const a of task.assignees ?? []) {
      const teamId = a.teamMember?.teamId;
      if (teamId == null || seen.has(teamId)) continue;
      const team = teams.find((t) => t.id === teamId);
      const color = teamColorMap.get(teamId);
      if (team && color) seen.set(teamId, { name: team.name, color });
    }
    return [...seen.values()];
  }

  function resetCreateForm() {
    setNewTitle('');
    setNewDescription('');
    setNewStatus('todo');
    setNewPriority('medium');
    setNewAssigneeId('');
    setNewRoleInput('');
  }

  function openCreateForColumn(status: TaskStatus) {
    resetCreateForm();
    setNewStatus(status);
    setCreateOpen(true);
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || saving) return;
    setSaving(true);
    setError('');
    try {
      const roleInTask = newRoleInput
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean);
      await createTask({
        title: newTitle.trim(),
        description: newDescription.trim() || newTitle.trim(),
        projectId,
        status: newStatus,
        priority: newPriority,
        assignees: newAssigneeId
          ? [{ teamMemberId: Number(newAssigneeId), ...(roleInTask.length ? { roleInTask } : {}) }]
          : [],
      });
      // re-fetch so the new task comes back with its nested assignee/user data
      const refreshed = await getTasksForProject(projectId);
      setTasks(refreshed);
      resetCreateForm();
      setCreateOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(task: Task, status: TaskStatus) {
    const prev = tasks;
    setTasks((cur) => cur.map((t) => (t.id === task.id ? { ...t, status } : t)));
    try {
      await updateTask(task.id, { status });
    } catch (err) {
      setTasks(prev);
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingTask) return;
    setSaving(true);
    try {
      await deleteTask(deletingTask.id);
      setTasks((cur) => cur.filter((t) => t.id !== deletingTask.id));
      setDeletingTask(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    } finally {
      setSaving(false);
    }
  }

  function TaskActionsMenu({ task }: { task: Task }) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Move to</DropdownMenuLabel>
          {STATUS_OPTIONS.filter((s) => s.value !== task.status).map((s) => (
            <DropdownMenuItem key={s.value} onClick={() => handleStatusChange(task, s.value)}>
              <span className={`h-2 w-2 rounded-full ${STATUS_DOT[s.value]}`} />
              {s.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setDeletingTask(task)}>
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  function TeamTags({ task }: { task: Task }) {
    const tags = taskTeamTags(task);
    return (
      <div className="mb-1.5 flex flex-wrap gap-1">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${PRIORITY_BADGE[task.priority]}`}>
          {priorityLabel(task.priority)}
        </span>
        {tags.map((t) => (
          <span
            key={t.name}
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${t.color.chip}`}
          >
            {t.name}
          </span>
        ))}
      </div>
    );
  }

  // Distinct roleInTask values across a task's assignees — color-only signal,
  // deterministic per role name so the same role always reads the same color.
  function RoleChips({ task }: { task: Task }) {
    const roles = [...new Set((task.assignees ?? []).flatMap((a) => a.roleInTask ?? []))];
    if (roles.length === 0) return null;
    return (
      <div className="mt-1.5 flex flex-wrap gap-1">
        {roles.map((r) => (
          <span key={r} className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${roleChipColor(r)}`}>
            {r}
          </span>
        ))}
      </div>
    );
  }

  function AssigneeAvatars({ assignees }: { assignees?: TaskAssignee[] }) {
    if (!assignees || assignees.length === 0) {
      return <span className="text-xs text-muted-foreground">Unassigned</span>;
    }
    const shown = assignees.slice(0, 3);
    const overflow = assignees.length - shown.length;
    return (
      <div className="flex items-center -space-x-1.5">
        {shown.map((a) => {
          const { name, color, photo } = memberDisplay(a);
          return photo ? (
            <img
              key={a.id}
              src={photoUrl(photo)}
              alt={name}
              title={name}
              className="h-6 w-6 rounded-full object-cover ring-2 ring-card"
            />
          ) : (
            <div
              key={a.id}
              title={name}
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ring-2 ring-card ${color.chip}`}
            >
              {initials(name)}
            </div>
          );
        })}
        {overflow > 0 && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground ring-2 ring-card">
            +{overflow}
          </div>
        )}
      </div>
    );
  }

  function TeamPanelContent() {
    return (
      <div className="space-y-6">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Priority breakdown
          </p>
          {tasks.length === 0 ? (
            <p className="text-xs text-muted-foreground">No tasks yet</p>
          ) : (
            <div className="space-y-2">
              {PRIORITY_OPTIONS.map((p) => {
                const count = priorityCounts[p.value];
                const pct = tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0;
                return (
                  <div key={p.value} className="flex items-center gap-2">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[p.value]}`} />
                    <span className="w-14 shrink-0 text-xs text-muted-foreground">{p.label}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${PRIORITY_DOT[p.value]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-5 shrink-0 text-right text-xs font-medium text-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Teams on this project
          </p>
          {teams.length === 0 ? (
            <p className="text-xs text-muted-foreground">No teams linked yet</p>
          ) : (
            <div className="space-y-4">
              {teams.map((t, i) => {
                const color = accentColor(i);
                return (
                  <div key={t.id}>
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${color.dot}`} />
                      <p className="text-sm font-medium text-foreground">{t.name}</p>
                    </div>
                    <div className="space-y-1.5 pl-3">
                      {(t.members ?? []).length === 0 ? (
                        <p className="text-xs text-muted-foreground">No members yet</p>
                      ) : (
                        t.members.map((m) => {
                          const name = m.user?.username || m.user?.email || 'Member';
                          return (
                            <div key={m.id} className="flex items-center gap-2">
                              {m.user?.profilePhoto ? (
                                <img
                                  src={photoUrl(m.user.profilePhoto)}
                                  alt=""
                                  className="h-6 w-6 shrink-0 rounded-full object-cover"
                                />
                              ) : (
                                <div
                                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${color.chip}`}
                                >
                                  {initials(name)}
                                </div>
                              )}
                              <span className="min-w-0 flex-1 truncate text-xs text-foreground">{name}</span>
                              {m.role === 'lead' && (
                                <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                                  Lead
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <main className="min-w-0 flex-1">
        <Link
          to="/projects"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All projects
        </Link>

        {loading ? (
          <div className="space-y-4">
            <div className="h-8 w-64 animate-pulse rounded-lg bg-card" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-48 animate-pulse rounded-2xl border border-border bg-card" />
              ))}
            </div>
          </div>
        ) : !project ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-20 text-center">
            <p className="text-muted-foreground">{error || 'Project not found'}</p>
          </div>
        ) : (
          <>
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <FolderKanban className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <h1 className="truncate font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    {project.title}
                  </h1>
                </div>

                {tasks.length > 0 && (
                  <div className="mt-3 flex max-w-xs items-center gap-2.5">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-xs font-medium text-muted-foreground">
                      {progressPct}% complete
                    </span>
                  </div>
                )}

                {teams.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    {teams.map((t, i) => {
                      const color = accentColor(i);
                      return (
                        <span
                          key={t.id}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${color.chip}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${color.dot}`} />
                          {t.name}
                          <span className="text-[10px] opacity-70">· {t.members?.length ?? 0}</span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <div className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
                  {[
                    { mode: 'board' as ViewMode, icon: LayoutGrid, label: 'Board' },
                    { mode: 'table' as ViewMode, icon: Table2, label: 'Table' },
                    { mode: 'list' as ViewMode, icon: List, label: 'List' },
                  ].map(({ mode, icon: Icon, label }) => (
                    <button
                      key={mode}
                      onClick={() => setView(mode)}
                      className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors ${
                        view === mode
                          ? 'bg-card text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      title={label}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                </div>
                <Button onClick={() => openCreateForColumn('todo')} className="gap-1.5 shadow-sm">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New task</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPanelOpen(true)}
                  className="shrink-0 xl:hidden"
                  aria-label="Team & breakdown"
                >
                  <PanelRightOpen className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-4 py-20 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <CircleCheck className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground">No tasks yet</h3>
                <p className="mt-1 mb-4 text-sm text-muted-foreground">
                  Add the first task to get this project moving.
                </p>
                <Button onClick={() => openCreateForColumn('todo')} className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  New task
                </Button>
              </div>
            ) : view === 'board' ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {STATUS_OPTIONS.map((col) => {
                  const columnTasks = tasks.filter((t) => t.status === col.value);
                  return (
                    <div key={col.value} className="flex flex-col rounded-2xl border border-border bg-card/50">
                      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
                        <span className={`h-2 w-2 rounded-full ${STATUS_DOT[col.value]}`} />
                        <p className="text-sm font-semibold text-foreground">{col.label}</p>
                        <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {columnTasks.length}
                        </span>
                      </div>

                      <button
                        onClick={() => openCreateForColumn(col.value)}
                        className="mx-2.5 mt-2.5 flex items-center justify-center gap-1 rounded-lg border border-dashed border-border py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
                      >
                        <Plus className="h-3 w-3" />
                        Add task
                      </button>

                      <div className="flex flex-1 flex-col gap-2 p-2.5">
                        {columnTasks.length === 0 ? (
                          <p className="px-1 py-3 text-center text-xs text-muted-foreground">Nothing here</p>
                        ) : (
                          columnTasks.map((task) => (
                            <div
                              key={task.id}
                              className="rounded-xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div className="min-w-0 flex-1">
                                  <TeamTags task={task} />
                                  <p className="text-sm font-medium text-foreground">{task.title}</p>
                                </div>
                                <TaskActionsMenu task={task} />
                              </div>
                              {task.description && (
                                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                  {task.description}
                                </p>
                              )}
                              <RoleChips task={task} />
                              <div className="mt-3">
                                <AssigneeAvatars assignees={task.assignees} />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : view === 'table' ? (
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground uppercase">
                      <th className="px-4 py-2.5 font-semibold">Task</th>
                      <th className="px-4 py-2.5 font-semibold">Status</th>
                      <th className="px-4 py-2.5 font-semibold">Assignees</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="max-w-xs px-4 py-3">
                          <TeamTags task={task} />
                          <p className="truncate font-medium text-foreground">{task.title}</p>
                          {task.description && (
                            <p className="truncate text-xs text-muted-foreground">{task.description}</p>
                          )}
                          <RoleChips task={task} />
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${STATUS_BADGE[task.status]}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[task.status]}`} />
                            {statusLabel(task.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <AssigneeAvatars assignees={task.assignees} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <TaskActionsMenu task={task} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm"
                  >
                    <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[task.status]}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                    </div>
                    {taskTeamTags(task).slice(0, 1).map((t) => (
                      <span
                        key={t.name}
                        className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:inline-block ${t.color.chip}`}
                      >
                        {t.name}
                      </span>
                    ))}
                    <span className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium sm:inline-block ${STATUS_BADGE[task.status]}`}>
                      {statusLabel(task.status)}
                    </span>
                    <AssigneeAvatars assignees={task.assignees} />
                    <TaskActionsMenu task={task} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <aside className="hidden w-72 shrink-0 xl:block">
        <div className="sticky top-6 rounded-2xl border border-border bg-card p-4">
          <TeamPanelContent />
        </div>
      </aside>
      </div>

      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent className="w-80 overflow-y-auto sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Team & breakdown</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            <TeamPanelContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* Create task dialog */}
      <Dialog open={createOpen} onOpenChange={(o) => { if (!saving) { setCreateOpen(o); if (!o) resetCreateForm(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                autoFocus
                placeholder="Task title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-desc">Description</Label>
              <Textarea
                id="task-desc"
                placeholder="Optional"
                rows={3}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="task-status">Status</Label>
                <select
                  id="task-status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as TaskStatus)}
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-priority">Priority</Label>
                <select
                  id="task-priority"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as Priority)}
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-assignee">Assignee</Label>
                <select
                  id="task-assignee"
                  value={newAssigneeId}
                  onChange={(e) => setNewAssigneeId(e.target.value)}
                  disabled={allMembers.length === 0}
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  <option value="">Unassigned</option>
                  {allMembers.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-roles">Role(s) — optional</Label>
                <Input
                  id="task-roles"
                  placeholder="reviewer, blocker"
                  value={newRoleInput}
                  onChange={(e) => setNewRoleInput(e.target.value)}
                  disabled={!newAssigneeId}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !newTitle.trim()}>
                {saving ? 'Creating…' : 'Create task'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deletingTask} onOpenChange={(o) => !o && setDeletingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete task?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete{' '}
            <span className="font-medium text-foreground">{deletingTask?.title}</span>. This can't be undone.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeletingTask(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteConfirm} disabled={saving}>
              {saving ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}