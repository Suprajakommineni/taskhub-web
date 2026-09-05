import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MoreVertical, Pencil, Trash2, FolderKanban, Plus, SearchX, Mail } from 'lucide-react';
import { updateProject, deleteProject } from '../lib/projectapi';
import { updateTeamMember, removeTeamMember } from '../lib/teamapi';
import { accentColor } from '../lib/palette';
import { initials, photoUrl } from '../lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreateProjectSheet } from '../components/projectcomponent/CreateProjectSheet';
import { useProjectsContext } from '../context/useProjectsContext';
import type { Project, ProjectTeamMember } from '../context/projects-context';

interface FlatMember extends ProjectTeamMember {
  teamId: number;
  teamName: string;
}

function projectMembers(project: Project): FlatMember[] {
  return (project.teams ?? []).flatMap((team) =>
    (team.members ?? []).map((m) => ({ ...m, teamId: team.id, teamName: team.name })),
  );
}

export default function Projects() {
  const { projects, setProjects, loading, error, setError, searchQuery, refetch } = useProjectsContext();
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [memberActionId, setMemberActionId] = useState<number | null>(null);
  const [deletingMember, setDeletingMember] = useState<FlatMember | null>(null);

  const visibleProjects = searchQuery.trim()
    ? projects.filter((p) => p.title.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : projects;

  function openEdit(project: Project) {
    setEditingProject(project);
    setEditTitle(project.title);
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProject || !editTitle.trim()) return;
    setSaving(true);
    try {
      const updated = await updateProject(editingProject.id, editTitle.trim());
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
      setEditingProject(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingProject) return;
    setSaving(true);
    try {
      await deleteProject(deletingProject.id);
      setProjects((prev) => prev.filter((p) => p.id !== deletingProject.id));
      setDeletingProject(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    } finally {
      setSaving(false);
    }
  }

  // Flip a member's role and update just that one member in local state,
  // rather than refetching every project.
  async function handleToggleRole(member: FlatMember) {
    const nextRole = member.role === 'lead' ? 'member' : 'lead';
    setMemberActionId(member.id);
    try {
      await updateTeamMember(member.teamId, member.id, nextRole);
      setProjects((prev) =>
        prev.map((p) => ({
          ...p,
          teams: p.teams?.map((t) =>
            t.id !== member.teamId
              ? t
              : { ...t, members: t.members?.map((m) => (m.id === member.id ? { ...m, role: nextRole } : m)) },
          ),
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update member role');
    } finally {
      setMemberActionId(null);
    }
  }

  async function handleDeleteMemberConfirm() {
    if (!deletingMember) return;
    setMemberActionId(deletingMember.id);
    try {
      await removeTeamMember(deletingMember.teamId, deletingMember.id);
      setProjects((prev) =>
        prev.map((p) => ({
          ...p,
          teams: p.teams?.map((t) =>
            t.id !== deletingMember.teamId
              ? t
              : { ...t, members: t.members?.filter((m) => m.id !== deletingMember.id) },
          ),
        })),
      );
      setDeletingMember(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setMemberActionId(null);
    }
  }

  return (
    <div className="min-h-full bg-background">
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">
              Workspace
            </p>
            <h1 className="mt-0.5 font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Your projects
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery.trim()
                ? `${visibleProjects.length} match${visibleProjects.length === 1 ? '' : 'es'} for "${searchQuery.trim()}"`
                : projects.length > 0
                  ? `${projects.length} project${projects.length === 1 ? '' : 's'}`
                  : 'Nothing here yet'}
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="w-fit gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl border border-border bg-card" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-4 py-20 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <FolderKanban className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-display font-semibold text-foreground">No projects yet</h3>
            <p className="mt-1 mb-4 text-sm text-muted-foreground">
              Create your first project to start organizing tasks.
            </p>
            <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>
        ) : visibleProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-4 py-20 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <SearchX className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-display font-semibold text-foreground">No matching projects</h3>
            <p className="mt-1 text-sm text-muted-foreground">Try a different search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleProjects.map((project, i) => {
              const color = accentColor(i);
              return (
                <div
                  key={project.id}
                  className={`group relative overflow-hidden rounded-2xl border border-border border-l-4 ${color.border} bg-card shadow-sm ring-1 ring-transparent transition-all hover:-translate-y-0.5 hover:shadow-lg hover:ring-border`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color.chip}`}
                        >
                          <FolderKanban className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/projects/${project.id}`}
                            className="block truncate font-display font-semibold text-foreground transition-colors hover:text-primary"
                          >
                            {project.title}
                          </Link>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Created {new Date(project.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="-mt-1 -mr-1 h-8 w-8 shrink-0 opacity-60 group-hover:opacity-100"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(project)}>
                            <Pencil className="h-4 w-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeletingProject(project)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-3 border-t border-border pt-3">
                      <p className="mb-2 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                        Team members
                      </p>
                      {(() => {
                        const members = projectMembers(project);
                        if (members.length === 0) {
                          return <p className="text-xs text-muted-foreground">No members yet</p>;
                        }
                        return (
                          <div className="space-y-1.5">
                            {members.map((m) => {
                              const name = m.user?.username || m.user?.email || 'Member';
                              const busy = memberActionId === m.id;
                              return (
                                <div
                                  key={m.id}
                                  className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-muted"
                                >
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
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-medium text-foreground">{name}</p>
                                    {m.user?.email && (
                                      <p className="flex items-center gap-1 truncate text-[10px] text-muted-foreground">
                                        <Mail className="h-2.5 w-2.5 shrink-0" />
                                        {m.user.email}
                                      </p>
                                    )}
                                  </div>
                                  <span
                                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                                      m.role === 'lead'
                                        ? 'bg-primary/10 text-primary'
                                        : 'bg-muted text-muted-foreground'
                                    }`}
                                  >
                                    {m.role === 'lead' ? 'Lead' : 'Member'}
                                  </span>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={busy}
                                        className="h-6 w-6 shrink-0 opacity-60 hover:opacity-100"
                                      >
                                        <MoreVertical className="h-3.5 w-3.5" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleToggleRole(m)}>
                                        <Pencil className="h-3.5 w-3.5" />
                                        Make {m.role === 'lead' ? 'member' : 'lead'}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        variant="destructive"
                                        onClick={() => setDeletingMember(m)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Remove
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <CreateProjectSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => refetch()}
      />

      <Dialog open={!!editingProject} onOpenChange={(open: boolean) => !open && setEditingProject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSave} className="space-y-4">
            <Input
              autoFocus
              placeholder="Project title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingProject(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !editTitle.trim()}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingProject} onOpenChange={(open: boolean) => !open && setDeletingProject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete project?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete{' '}
            <span className="font-medium text-foreground">{deletingProject?.title}</span> and all
            of its tasks. This can't be undone.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeletingProject(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteConfirm} disabled={saving}>
              {saving ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!deletingMember} onOpenChange={(open: boolean) => !open && setDeletingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove member?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {deletingMember?.user?.username || deletingMember?.user?.email}
            </span>{' '}
            will be removed from <span className="font-medium text-foreground">{deletingMember?.teamName}</span> and
            lose access to this project's tasks through that team.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeletingMember(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteMemberConfirm}
              disabled={memberActionId === deletingMember?.id}
            >
              {memberActionId === deletingMember?.id ? 'Removing...' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}