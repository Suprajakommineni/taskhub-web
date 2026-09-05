import { X, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";
import logo from "../assets/taskhub-icon.svg";
import ProjectList from "./projectlist";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Overlay — mobile only, closes the drawer on tap */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px] md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 -translate-x-full flex-col border-r border-border bg-card transition-transform duration-200 ease-out md:static md:z-auto md:w-64 md:translate-x-0 ${
          open ? "translate-x-0" : ""
        }`}
      >
        {/* Logo / Workspace switcher */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center">
            <img src={logo} alt="TaskHub" className="h-8 w-8" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-bold text-foreground">
              TaskHub
            </p>
            <p className="truncate text-xs text-muted-foreground">
              Your Workspace
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ProjectList onNavigate={onClose} />

        <div className="border-t border-border p-2">
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-accent font-medium text-accent-foreground"
                  : "text-foreground/75 hover:bg-muted hover:text-foreground"
              }`
            }
          >
            <Settings className="h-4 w-4 shrink-0" />
            Settings
          </NavLink>
        </div>
      </aside>
    </>
  );
}
export default Sidebar;