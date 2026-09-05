import { useState } from 'react';
import { Plus, Trash2, Users, ListTodo, UserPlus, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { createProject, getProject } from '../../lib/projectapi';
import { createTask } from '../../lib/taskapi';
import { addTeamMember } from '../../lib/teamapi';
import { accentColor } from '../../lib/palette';
import { initials } from '../../lib/utils';

interface Project {
  id: number;
  title: string;
  createdAt: string;
}

interface CreateProjectSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (project: Project) => void;
}

type Role = 'lead' | 'member';
type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed';

interface DraftMember {
  id: string;
  email: string;
  role: Role;
  photo: File | null;
  photoPreview: string | null;
}

interface DraftTeam {
  id: string;
  name: string;
  members: DraftMember[];
}

interface DraftTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeEmail: string;
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'review', label: 'In review' },
  { value: 'completed', label: 'Completed' },
];

const selectClass =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30';

export function CreateProjectSheet({ open, onOpenChange, onCreated }: CreateProjectSheetProps) {
  const [title, setTitle] = useState('');
  const [teams, setTeams] = useState<DraftTeam[]>([]);
  const [tasks, setTasks] = useState<DraftTask[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function resetForm() {
    setTitle('');
    setTeams([]);
    setTasks([]);
    setError('');
  }

  function addTeam() {
    setTeams((prev) => [...prev, { id: genId(), name: '', members: [] }]);
  }

  function removeTeam(teamId: string) {
    const removed = teams.find((t) => t.id === teamId);
    setTeams((prev) => prev.filter((t) => t.id !== teamId));
    setTasks((prev) =>
      prev.map((t) =>
        removed?.members.some((m) => m.email === t.assigneeEmail)
          ? { ...t, assigneeEmail: '' }
          : t,
      ),
    );
  }

  function updateTeamName(teamId: string, name: string) {
    setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, name } : t)));
  }

  function addMember(teamId: string) {
    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId
          ? {
              ...t,
              members: [
                ...t.members,
                { id: genId(), email: '', role: 'member', photo: null, photoPreview: null },
              ],
            }
          : t,
      ),
    );
  }

  function updateMemberPhoto(teamId: string, memberId: string, file: File | null) {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id !== teamId) return t;
        return {
          ...t,
          members: t.members.map((m) => {
            if (m.id !== memberId) return m;
            if (m.photoPreview) URL.revokeObjectURL(m.photoPreview);
            return { ...m, photo: file, photoPreview: file ? URL.createObjectURL(file) : null };
          }),
        };
      }),
    );
  }

  function updateMember(teamId: string, memberId: string, patch: Partial<DraftMember>) {
    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId
          ? { ...t, members: t.members.map((m) => (m.id === memberId ? { ...m, ...patch } : m)) }
          : t,
      ),
    );
  }

  function removeMember(teamId: string, memberId: string) {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id !== teamId) return t;
        const removed = t.members.find((m) => m.id === memberId);
        if (removed?.photoPreview) URL.revokeObjectURL(removed.photoPreview);
        return { ...t, members: t.members.filter((m) => m.id !== memberId) };
      }),
    );
  }

  function addTask() {
    setTasks((prev) => [
      ...prev,
      { id: genId(), title: '', description: '', status: 'todo', assigneeEmail: '' },
    ]);
  }

  function updateTask(taskId: string, patch: Partial<DraftTask>) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)));
  }

  function removeTask(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  const allMembers = teams.flatMap((t, i) =>
    t.members
      .filter((m) => m.email.trim())
      .map((m) => ({ ...m, teamName: t.name.trim() || `Team ${i + 1}`, color: accentColor(i) })),
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || saving) return;

    setSaving(true);
    setError('');
    try {
      // Teams are created bare here — members are added one at a time below
      // via addTeamMember, since that's the endpoint that can also carry a photo.
      const teamsPayload = teams
        .filter((t) => t.name.trim())
        .map((t) => ({ teamName: t.name.trim(), members: [] }));

      const project = await createProject(title.trim(), teamsPayload);
      const detail = await getProject(project.id);
      const teamIdByName = new Map<string, number>();
      for (const team of detail.teams ?? []) {
        teamIdByName.set(team.name, team.id);
      }

      // Every member add is independent — running them in parallel instead of
      // one-at-a-time matters once these are real network round-trips rather
      // than near-instant localhost calls.
      const memberJobs: { teamId: number; email: string; role: Role; photo: File | null }[] = [];
      for (const draftTeam of teams) {
        if (!draftTeam.name.trim()) continue;
        const teamId = teamIdByName.get(draftTeam.name.trim());
        if (!teamId) continue;

        for (const member of draftTeam.members) {
          const email = member.email.trim();
          if (!email) continue;
          memberJobs.push({ teamId, email, role: member.role, photo: member.photo });
        }
      }

      const createdMembers = await Promise.all(
        memberJobs.map((job) => addTeamMember(job.teamId, job.email, job.role, job.photo)),
      );
      const emailToTeamMemberId = new Map<string, number>();
      createdMembers.forEach((created, i) => {
        emailToTeamMemberId.set(memberJobs[i].email.toLowerCase(), created.id);
      });

      const validTasks = tasks.filter((t) => t.title.trim());
      await Promise.all(
        validTasks.map((task) => {
          const teamMemberId = task.assigneeEmail
            ? emailToTeamMemberId.get(task.assigneeEmail.toLowerCase())
            : undefined;

          return createTask({
            title: task.title.trim(),
            description: task.description.trim() || task.title.trim(),
            projectId: project.id,
            status: task.status,
            assignees: teamMemberId ? [{ teamMemberId }] : [],
          });
        }),
      );

      onCreated(project);
      resetForm();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(next) => { if (!saving) onOpenChange(next); }}>
      <SheetContent>
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <SheetHeader className="bg-linear-to-b from-primary/5 to-transparent">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15">
                <FolderKanban className="h-4.5 w-4.5 text-primary" />
              </div>
              <SheetTitle className="font-display text-lg">New project</SheetTitle>
            </div>
            <SheetDescription>
              Name your project, build out any teams you need, and optionally line up the first tasks.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-7 overflow-y-auto px-5 py-5">
            {/* Project title */}
            <div className="space-y-1.5">
              <Label htmlFor="project-title">Project title</Label>
              <Input
                id="project-title"
                autoFocus
                placeholder="e.g. Website redesign"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Teams */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Teams
                  </p>
                </div>
                <Button type="button" variant="ghost" size="xs" onClick={addTeam} className="gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  Add a team
                </Button>
              </div>

              {teams.length === 0 && (
                <div className="rounded-xl border border-dashed border-border px-4 py-5 text-center">
                  <p className="text-sm text-muted-foreground">
                    No teams yet — you can still create the project, or add one now.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {teams.map((team, i) => {
                  const color = accentColor(i);
                  return (
                    <div
                      key={team.id}
                      className={`overflow-hidden rounded-xl border border-border bg-card shadow-sm ring-1 ${color.ring}`}
                    >
                      <div className={`h-1 w-full ${color.bar}`} />
                      <div className="flex items-center gap-2 p-3 pb-2">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${color.dot}`} />
                        <Input
                          placeholder={`Team ${i + 1} name`}
                          value={team.name}
                          onChange={(e) => updateTeamName(team.id, e.target.value)}
                          className="h-7"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removeTeam(team.id)}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {team.members.length > 0 && (
                        <div className="space-y-1.5 px-3 pb-2">
                          {team.members.map((member) => (
                            <div key={member.id} className="flex items-center gap-1.5">
                              <label
                                htmlFor={`photo-${member.id}`}
                                title="Set a photo (optional)"
                                className="relative h-7 w-7 shrink-0 cursor-pointer overflow-hidden rounded-full ring-1 ring-input"
                              >
                                {member.photoPreview ? (
                                  <img
                                    src={member.photoPreview}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div
                                    className={`flex h-full w-full items-center justify-center text-[10px] font-semibold ${color.chip}`}
                                  >
                                    {member.email ? initials(member.email) : '+'}
                                  </div>
                                )}
                                <input
                                  id={`photo-${member.id}`}
                                  type="file"
                                  accept="image/png,image/jpeg,image/gif,image/webp"
                                  className="sr-only"
                                  onChange={(e) =>
                                    updateMemberPhoto(team.id, member.id, e.target.files?.[0] ?? null)
                                  }
                                />
                              </label>
                              <Input
                                type="email"
                                placeholder="teammate@email.com"
                                value={member.email}
                                onChange={(e) =>
                                  updateMember(team.id, member.id, { email: e.target.value })
                                }
                                className="h-7 flex-1"
                              />
                              <div className="flex h-7 shrink-0 overflow-hidden rounded-md border border-input">
                                {(['lead', 'member'] as Role[]).map((role) => (
                                  <button
                                    key={role}
                                    type="button"
                                    onClick={() => updateMember(team.id, member.id, { role })}
                                    className={`px-2 text-xs font-medium capitalize transition-colors ${
                                      member.role === role
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-transparent text-muted-foreground hover:bg-muted'
                                    }`}
                                  >
                                    {role}
                                  </button>
                                ))}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => removeMember(team.id, member.id)}
                                className="shrink-0 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="px-3 pb-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={() => addMember(team.id)}
                          className="w-full gap-1"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          Add member
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tasks */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ListTodo className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Starting tasks
                  </p>
                </div>
                <Button type="button" variant="ghost" size="xs" onClick={addTask} className="gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  Add a task
                </Button>
              </div>

              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Optional — add a few tasks now, or create them later from the project.
                </p>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="space-y-2 rounded-xl border border-border bg-card p-3 shadow-sm">
                      <div className="flex items-center gap-1.5">
                        <Input
                          placeholder="Task title"
                          value={task.title}
                          onChange={(e) => updateTask(task.id, { title: e.target.value })}
                          className="h-7 flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removeTask(task.id)}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <Textarea
                        placeholder="Description (optional)"
                        value={task.description}
                        onChange={(e) => updateTask(task.id, { description: e.target.value })}
                        rows={2}
                        className="text-sm"
                      />

                      <div className="grid grid-cols-2 gap-1.5">
                        <select
                          value={task.status}
                          onChange={(e) =>
                            updateTask(task.id, { status: e.target.value as TaskStatus })
                          }
                          className={selectClass}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>

                        <select
                          value={task.assigneeEmail}
                          onChange={(e) => updateTask(task.id, { assigneeEmail: e.target.value })}
                          className={selectClass}
                          disabled={allMembers.length === 0}
                        >
                          <option value="">Unassigned</option>
                          {allMembers.map((m) => (
                            <option key={m.id} value={m.email}>
                              {m.email} — {m.teamName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
          </div>

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (saving) return;
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !title.trim()}>
              {saving ? 'Creating…' : 'Create project'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}