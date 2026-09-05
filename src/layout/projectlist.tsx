import { Plus, Folder } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { useProjectsContext } from "../context/useProjectsContext";
import { CreateProjectSheet } from "../components/projectcomponent/CreateProjectSheet";
import { accentColor } from "../lib/palette";

interface ProjectListProps {
  onNavigate?: () => void;
}

export default function ProjectList({ onNavigate }: ProjectListProps) {
  const { projects, setProjects, searchQuery } = useProjectsContext();
  const navigate = useNavigate();
  const { id: activeProjectId } = useParams();
  const [createOpen, setCreateOpen] = useState(false);

  const visibleProjects = searchQuery.trim()
    ? projects.filter((p) => p.title.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : projects;

  function goToProject(id: number) {
    navigate(`/projects/${id}`);
    onNavigate?.();
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-4">
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Projects
        </p>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="New project"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <nav className="space-y-0.5">
        {visibleProjects.map((project, i) => {
          const active = String(project.id) === activeProjectId;
          const color = accentColor(i);
          return (
            <div
              key={project.id}
              onClick={() => goToProject(project.id)}
              className={`flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                active
                  ? "bg-accent font-medium text-accent-foreground"
                  : "text-foreground/75 hover:bg-muted hover:text-foreground"
              }`}
            >
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${color.dot}`} aria-hidden="true" />
              <Folder className="h-4 w-4 shrink-0" />
              <span className="truncate">{project.title}</span>
            </div>
          );
        })}
        {searchQuery.trim() && visibleProjects.length === 0 && (
          <p className="px-2.5 py-1.5 text-xs text-muted-foreground">No matches</p>
        )}
      </nav>

      <CreateProjectSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(created) => setProjects((prev) => [created, ...prev])}
      />
    </div>
  );
}