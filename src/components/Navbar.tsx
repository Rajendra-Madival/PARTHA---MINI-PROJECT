import { LogOut } from 'lucide-react';
import type { AuthUser, UserRole } from '../types';

export type ActiveTab =
  | 'discover'
  | 'connections'
  | 'opportunities'
  | 'guides'
  | 'alumni-inbox'
  | 'admin-queue'
  | 'senior-form'
  | 'profile';

interface NavbarProps {
  user: AuthUser;
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  onSwitchRole?: (role: UserRole) => void;
  onLogout: () => void;
  pendingRequestsCount: number;
  pendingVerificationsCount: number;
}

export function Navbar({
  user,
  activeTab,
  onChangeTab,
  onSwitchRole,
  onLogout,
  pendingRequestsCount,
  pendingVerificationsCount,
}: NavbarProps) {
  const navItems: Array<{ id: ActiveTab; label: string; count?: number }> =
    user.role === 'student'
      ? [
          { id: 'discover', label: 'Find Mentors' },
          { id: 'connections', label: 'My Mentors' },
          { id: 'opportunities', label: 'Opportunities' },
          { id: 'guides', label: 'Prep Guides' },
          { id: 'profile', label: 'My Details' },
        ]
      : user.role === 'alumni'
        ? [
            {
              id: 'alumni-inbox',
              label: 'Student Requests',
              count: pendingRequestsCount,
            },
            { id: 'opportunities', label: 'Opportunities' },
            { id: 'guides', label: 'Prep Guides' },
            { id: 'discover', label: 'Mentor Directory' },
            { id: 'profile', label: 'My Details' },
          ]
        : [
            {
              id: 'admin-queue',
              label: 'Verification Queue',
              count: pendingVerificationsCount,
            },
            { id: 'senior-form', label: 'Senior Google Form' },
            { id: 'discover', label: 'Verified Alumni' },
            { id: 'opportunities', label: 'Opportunities' },
            { id: 'profile', label: 'My Details' },
          ];

  const roleLabel =
    user.role === 'student'
      ? 'Student'
      : user.role === 'alumni'
        ? 'Alumni'
        : 'Admin';

  return (
    <header className="sticky top-0 z-30 border-b border-[#E5DFD0] bg-[#FFFEFA]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-6 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() =>
            onChangeTab(
              user.role === 'student'
                ? 'discover'
                : user.role === 'alumni'
                  ? 'alumni-inbox'
                  : 'admin-queue',
            )
          }
          className="font-display text-lg font-bold tracking-tight text-emerald-950 whitespace-nowrap shrink-0 cursor-pointer"
        >
          PARTHA
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeTab(item.id)}
                className={`relative py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isActive
                    ? 'text-emerald-800 font-semibold'
                    : 'text-stone-600 hover:text-emerald-950'
                }`}
              >
                <span>{item.label}</span>
                {typeof item.count === 'number' && item.count > 0 && (
                  <span className="ml-1.5 font-mono text-xs tabular-nums text-emerald-800">
                    ({item.count})
                  </span>
                )}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[15px] h-0.5 bg-emerald-800"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Signed-in Account, Admin View Switcher & Sign Out */}
        <div className="flex items-center gap-2.5 shrink-0">
          {user.isAdminAccount && onSwitchRole ? (
            <select
              aria-label="Active Portal View"
              value={user.role}
              onChange={(e) => onSwitchRole(e.target.value as UserRole)}
              className="rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] px-2.5 py-1.5 text-xs font-medium text-[#18221D] focus:border-emerald-700 focus:outline-none cursor-pointer"
            >
              <option value="admin">View: Admin</option>
              <option value="student">View: Student</option>
              <option value="alumni">View: Alumni</option>
            </select>
          ) : (
            <span className="hidden sm:inline-block text-xs text-stone-600 whitespace-nowrap">
              <strong className="font-semibold text-[#18221D]">{user.name}</strong>
              <span aria-hidden="true" className="mx-1.5 text-stone-300">
                ·
              </span>
              <span>{roleLabel}</span>
            </span>
          )}

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-[#F3EFE4] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5 text-stone-500" aria-hidden="true" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Mobile horizontal nav row */}
      <div className="flex md:hidden items-center gap-4 overflow-x-auto border-t border-[#EEE9DC] px-4 py-2 text-xs font-medium">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeTab(item.id)}
              className={`whitespace-nowrap shrink-0 py-1 cursor-pointer ${
                isActive
                  ? 'text-emerald-800 font-semibold border-b-2 border-emerald-800'
                  : 'text-stone-600'
              }`}
            >
              {item.label}
              {typeof item.count === 'number' && item.count > 0
                ? ` (${item.count})`
                : ''}
            </button>
          );
        })}
      </div>
    </header>
  );
}
