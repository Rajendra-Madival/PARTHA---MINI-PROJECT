import {
  BookOpen,
  Briefcase,
  Compass,
  FileSpreadsheet,
  Inbox,
  LogOut,
  ShieldCheck,
  UserCircle2,
  Users,
} from 'lucide-react';
import type { AuthUser } from '../types';
import { Avatar } from './Avatar';

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
  onLogout: () => void;
  unreadMentorshipsCount: number;
  pendingRequestsCount: number;
  pendingVerificationsCount: number;
}

export function Navbar({
  user,
  activeTab,
  onChangeTab,
  onLogout,
  unreadMentorshipsCount,
  pendingRequestsCount,
  pendingVerificationsCount,
}: NavbarProps) {
  const alumniInboxBadge = pendingRequestsCount + unreadMentorshipsCount;

  const navItems: Array<{
    id: ActiveTab;
    label: string;
    mobileLabel: string;
    icon: typeof Compass;
    count?: number;
  }> =
    user.role === 'student'
      ? [
          {
            id: 'discover',
            label: 'Find Alumni',
            mobileLabel: 'Alumni',
            icon: Compass,
          },
          {
            id: 'connections',
            label: 'My Connections',
            mobileLabel: 'Chats',
            icon: Users,
            count: unreadMentorshipsCount,
          },
          {
            id: 'opportunities',
            label: 'Opportunities',
            mobileLabel: 'Jobs',
            icon: Briefcase,
          },
          {
            id: 'guides',
            label: 'Prep Guides',
            mobileLabel: 'Guides',
            icon: BookOpen,
          },
          {
            id: 'profile',
            label: 'My Details',
            mobileLabel: 'Profile',
            icon: UserCircle2,
          },
        ]
      : user.role === 'alumni'
        ? [
            {
              id: 'alumni-inbox',
              label: 'Student Requests',
              mobileLabel: 'Inbox',
              icon: Inbox,
              count: alumniInboxBadge,
            },
            {
              id: 'opportunities',
              label: 'Opportunities',
              mobileLabel: 'Jobs',
              icon: Briefcase,
            },
            {
              id: 'guides',
              label: 'Prep Guides',
              mobileLabel: 'Guides',
              icon: BookOpen,
            },
            {
              id: 'discover',
              label: 'Alumni Directory',
              mobileLabel: 'Directory',
              icon: Compass,
            },
            {
              id: 'profile',
              label: 'My Details',
              mobileLabel: 'Profile',
              icon: UserCircle2,
            },
          ]
        : [
            {
              id: 'admin-queue',
              label: 'Verification Queue',
              mobileLabel: 'Queue',
              icon: ShieldCheck,
              count: pendingVerificationsCount,
            },
            {
              id: 'senior-form',
              label: 'Senior Form',
              mobileLabel: 'Form',
              icon: FileSpreadsheet,
            },
            {
              id: 'discover',
              label: 'Verified Alumni',
              mobileLabel: 'Alumni',
              icon: Compass,
            },
            {
              id: 'opportunities',
              label: 'Opportunities',
              mobileLabel: 'Jobs',
              icon: Briefcase,
            },
            {
              id: 'guides',
              label: 'Prep Guides',
              mobileLabel: 'Guides',
              icon: BookOpen,
            },
            {
              id: 'profile',
              label: 'My Details',
              mobileLabel: 'Profile',
              icon: UserCircle2,
            },
          ];

  const roleLabel =
    user.role === 'student'
      ? 'Student'
      : user.role === 'alumni'
        ? 'Alumni'
        : 'Admin';

  return (
    <>
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

          {/* Zone 2: Clean single-line desktop navigation links */}
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

          {/* Zone 3: Signed-in Account & Sign Out */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onChangeTab('profile')}
              className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-left hover:bg-[#FAF7F0] transition-colors cursor-pointer"
              title="Open My Details & Avatar"
            >
              <Avatar name={user.name} src={user.avatarUrl} size="sm" />
              <span className="hidden sm:inline text-xs text-stone-600 whitespace-nowrap">
                <strong className="font-semibold text-[#18221D]">{user.name}</strong>
                <span aria-hidden="true" className="mx-1.5 text-stone-300">
                  ·
                </span>
                <span>{roleLabel}</span>
              </span>
            </button>

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
      </header>

      {/* Slim mobile bottom navigation bar (total mobile sticky footprint <= 15% height) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 h-14 border-t border-[#E5DFD0] bg-[#FFFEFA]/95 backdrop-blur-sm"
      >
        <div
          className={`grid h-full ${navItems.length > 5 ? 'grid-cols-7' : 'grid-cols-5'}`}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeTab(item.id)}
                className={`relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium cursor-pointer ${
                  isActive ? 'text-emerald-800 font-semibold' : 'text-stone-500'
                }`}
              >
                <div className="relative">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {typeof item.count === 'number' && item.count > 0 && (
                    <span className="absolute -right-2 -top-1 rounded-full bg-emerald-800 px-1 text-[9px] font-mono leading-tight text-white tabular-nums">
                      {item.count}
                    </span>
                  )}
                </div>
                <span className="truncate max-w-full px-1">{item.mobileLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
