import { useEffect, useState } from 'react';
import { Bell, BellOff, Moon, Sun, ChevronDown, Search, CheckCheck, Menu, Settings } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useProjectsContext } from '../context/useProjectsContext';
import { getUserFromToken } from '../lib/jwt';
import { getMe, type Me } from '../lib/userapi';
import { initials, photoUrl } from '../lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { searchQuery, setSearchQuery } = useProjectsContext();
  const [notificationsOn, setNotificationsOn] = useState(
    () => localStorage.getItem('notificationsOn') !== 'false',
  );
  const [me, setMe] = useState<Me | null>(null);
  const navigate = useNavigate();
  const user = getUserFromToken();
  const displayName = me?.username || (user?.email ? user.email.split('@')[0] : 'Account');

  useEffect(() => {
    localStorage.setItem('notificationsOn', String(notificationsOn));
  }, [notificationsOn]);

  useEffect(() => {
    getMe().then(setMe).catch(() => {});
  }, []);

  function handleLogout() {
    localStorage.removeItem('token');
    navigate('/login');
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-3 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="relative w-full max-w-40 sm:max-w-xs">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-transparent bg-muted py-2 pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-ring focus:bg-background"
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title={notificationsOn ? 'Notifications on' : 'Notifications off'}
            >
              {notificationsOn ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              {notificationsOn && (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setNotificationsOn((v) => !v);
                }}
                className={`h-5 w-9 shrink-0 rounded-full transition-colors ${
                  notificationsOn ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              >
                <span
                  className={`block h-4 w-4 translate-y-0.5 rounded-full bg-white transition-transform ${
                    notificationsOn ? 'translate-x-4.5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notificationsOn ? (
              <div className="flex flex-col items-center gap-1.5 px-2 py-6 text-center">
                <CheckCheck className="h-5 w-5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">You're all caught up</p>
              </div>
            ) : (
              <div className="px-2 py-6 text-center">
                <p className="text-xs text-muted-foreground">Notifications are turned off</p>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Toggle theme"
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex items-center gap-2 rounded-lg py-1.5 pr-1.5 pl-2 transition-colors hover:bg-muted">
              {me?.profilePhoto ? (
                <img
                  src={photoUrl(me.profilePhoto)}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {initials(displayName)}
                </div>
              )}
              <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}