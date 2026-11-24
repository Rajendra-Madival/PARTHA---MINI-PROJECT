import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import type {
  AlumniProfile,
  DiscoveryFilters,
  MentorshipRequest,
  StudentTargetProfile,
  UserRole,
} from '../types';
import { filterAndRankAlumni } from '../utils/matchingEngine';
import { AlumniCard } from './AlumniCard';

interface StudentDiscoveryViewProps {
  alumni: AlumniProfile[];
  studentProfile: StudentTargetProfile;
  mentorships: MentorshipRequest[];
  savedAlumniIds: string[];
  role: UserRole;
  loading: boolean;
  onUpdateStudentProfile: (updates: Partial<StudentTargetProfile>) => Promise<void>;
  onToggleSaveAlumni: (alumniId: string) => Promise<void>;
  onRequestMentorship: (alumniId: string) => void;
  onOpenGuide: (guideId: string) => void;
}

const DEFAULT_FILTERS: DiscoveryFilters = {
  search: '',
  skill: 'All',
  company: 'All',
  role: 'All',
  domain: 'All',
  internshipOnly: false,
  projectHelpOnly: false,
  savedOnly: false,
  sortBy: 'match',
};

export function StudentDiscoveryView({
  alumni,
  studentProfile,
  mentorships,
  savedAlumniIds,
  role,
  loading,
  onUpdateStudentProfile,
  onToggleSaveAlumni,
  onRequestMentorship,
  onOpenGuide,
}: StudentDiscoveryViewProps) {
  const [filters, setFilters] = useState<DiscoveryFilters>(DEFAULT_FILTERS);
  const [editingGoals, setEditingGoals] = useState(false);
  const [goalSkillsInput, setGoalSkillsInput] = useState(
    studentProfile.targetSkills.join(', '),
  );
  const [goalDomain, setGoalDomain] = useState(studentProfile.targetDomain);
  const [goalCompany, setGoalCompany] = useState(studentProfile.targetCompany);

  const verifiedAlumni = useMemo(
    () => alumni.filter((a) => a.verificationStatus === 'verified'),
    [alumni],
  );

  const filterOptions = useMemo(() => {
    const skills = new Set<string>();
    const companies = new Set<string>();
    const roles = new Set<string>();
    const domains = new Set<string>();

    for (const a of verifiedAlumni) {
      a.skills.forEach((s) => skills.add(s));
      companies.add(a.company);
      roles.add(a.role);
      domains.add(a.domain);
    }

    return {
      skills: ['All', ...Array.from(skills).sort()],
      companies: ['All', ...Array.from(companies).sort()],
      roles: ['All', ...Array.from(roles).sort()],
      domains: ['All', ...Array.from(domains).sort()],
    };
  }, [verifiedAlumni]);

  const rankedMatches = useMemo(
    () =>
      filterAndRankAlumni(
        verifiedAlumni,
        studentProfile,
        filters,
        savedAlumniIds,
      ),
    [verifiedAlumni, studentProfile, filters, savedAlumniIds],
  );

  const mentorshipByAlumniId = useMemo(() => {
    const map = new Map<string, MentorshipRequest>();
    for (const m of mentorships) {
      map.set(m.alumniId, m);
    }
    return map;
  }, [mentorships]);

  const savedSet = useMemo(() => new Set(savedAlumniIds), [savedAlumniIds]);

  const hasActiveFilters =
    filters.search !== '' ||
    filters.skill !== 'All' ||
    filters.company !== 'All' ||
    filters.role !== 'All' ||
    filters.domain !== 'All' ||
    filters.internshipOnly ||
    filters.projectHelpOnly ||
    filters.savedOnly;

  async function handleSaveGoals() {
    const parsedSkills = goalSkillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    await onUpdateStudentProfile({
      targetSkills: parsedSkills.length > 0 ? parsedSkills : ['Machine Learning'],
      targetDomain: goalDomain,
      targetCompany: goalCompany.trim(),
    });
    setEditingGoals(false);
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] px-6 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#18221D]">
              {role === 'student'
                ? 'Find KLS VDIT Mentors'
                : 'Verified Alumni Directory'}
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              {role === 'student'
                ? 'Browse verified seniors matched to your skills. Save mentors to your shortlist or send a mentorship request to unlock contact details.'
                : 'All verified KLS VDIT alumni currently visible to students.'}
            </p>
          </div>

          {role === 'student' && (
            <button
              type="button"
              onClick={() => {
                setGoalSkillsInput(studentProfile.targetSkills.join(', '));
                setGoalDomain(studentProfile.targetDomain);
                setGoalCompany(studentProfile.targetCompany);
                setEditingGoals((v) => !v);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              {editingGoals ? 'Close Interests' : 'Edit My Interests'}
            </button>
          )}
        </div>

        {role === 'student' && !editingGoals && (
          <p className="mt-3 border-t border-[#EEE9DC] pt-3 text-xs text-stone-600">
            Matching based on your interests:{' '}
            <strong className="font-medium text-[#18221D]">
              {studentProfile.targetSkills.join(', ')}
            </strong>
            <span aria-hidden="true" className="mx-1.5 text-stone-300">
              ·
            </span>
            <span>{studentProfile.targetDomain}</span>
            {studentProfile.targetCompany && (
              <>
                <span aria-hidden="true" className="mx-1.5 text-stone-300">
                  ·
                </span>
                <span>Target: {studentProfile.targetCompany}</span>
              </>
            )}
          </p>
        )}

        {role === 'student' && editingGoals && (
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-[#EEE9DC] pt-4 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Skills you want to learn
              </label>
              <input
                type="text"
                value={goalSkillsInput}
                onChange={(e) => setGoalSkillsInput(e.target.value)}
                className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-1.5 text-sm focus:border-emerald-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Domain
              </label>
              <select
                value={goalDomain}
                onChange={(e) => setGoalDomain(e.target.value)}
                className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-1.5 text-sm focus:border-emerald-700 focus:outline-none"
              >
                {Array.from(
                  new Set([
                    'Machine Learning & AI',
                    'Cloud & Distributed Systems',
                    'Full-Stack & FinTech',
                    'Embedded & Robotics',
                    'Data Engineering',
                    'Cybersecurity & Infra',
                    ...filterOptions.domains.filter((d) => d !== 'All'),
                  ]),
                ).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Dream Company
                </label>
                <input
                  type="text"
                  value={goalCompany}
                  onChange={(e) => setGoalCompany(e.target.value)}
                  placeholder="Any"
                  className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-1.5 text-sm focus:border-emerald-700 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveGoals}
                className="rounded-lg bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-900 whitespace-nowrap cursor-pointer"
              >
                Update
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] p-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search by mentor name, skill, company, or guide..."
              aria-label="Search alumni"
              className="w-full rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] py-2 pl-10 pr-4 text-sm text-[#18221D] placeholder:text-stone-400 focus:border-emerald-700 focus:bg-white focus:outline-none"
            />
          </div>

          <select
            aria-label="Sort mentors"
            value={filters.sortBy}
            onChange={(e) =>
              setFilters({
                ...filters,
                sortBy: e.target.value as DiscoveryFilters['sortBy'],
              })
            }
            className="rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-xs font-medium text-stone-700 focus:border-emerald-700 focus:outline-none"
          >
            <option value="match">Sort: Best Match</option>
            <option value="upvotes">Sort: Top Guides</option>
            <option value="batch">Sort: Recent Batch</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <select
            aria-label="Filter by Skill"
            value={filters.skill}
            onChange={(e) => setFilters({ ...filters, skill: e.target.value })}
            className="rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-xs text-stone-700 focus:border-emerald-700 focus:outline-none"
          >
            <option value="All">Skill: Any</option>
            {filterOptions.skills
              .filter((s) => s !== 'All')
              .map((s) => (
                <option key={s} value={s}>
                  Skill: {s}
                </option>
              ))}
          </select>

          <select
            aria-label="Filter by Company"
            value={filters.company}
            onChange={(e) => setFilters({ ...filters, company: e.target.value })}
            className="rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-xs text-stone-700 focus:border-emerald-700 focus:outline-none"
          >
            <option value="All">Company: Any</option>
            {filterOptions.companies
              .filter((c) => c !== 'All')
              .map((c) => (
                <option key={c} value={c}>
                  Company: {c}
                </option>
              ))}
          </select>

          <select
            aria-label="Filter by Role"
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            className="rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-xs text-stone-700 focus:border-emerald-700 focus:outline-none"
          >
            <option value="All">Role: Any</option>
            {filterOptions.roles
              .filter((r) => r !== 'All')
              .map((r) => (
                <option key={r} value={r}>
                  Role: {r}
                </option>
              ))}
          </select>

          <select
            aria-label="Filter by Domain"
            value={filters.domain}
            onChange={(e) => setFilters({ ...filters, domain: e.target.value })}
            className="rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-xs text-stone-700 focus:border-emerald-700 focus:outline-none"
          >
            <option value="All">Domain: Any</option>
            {filterOptions.domains
              .filter((d) => d !== 'All')
              .map((d) => (
                <option key={d} value={d}>
                  Domain: {d}
                </option>
              ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.internshipOnly}
                onChange={(e) =>
                  setFilters({ ...filters, internshipOnly: e.target.checked })
                }
                className="h-4 w-4 rounded border-stone-300 accent-emerald-800"
              />
              Internship referrals
            </label>
            <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.projectHelpOnly}
                onChange={(e) =>
                  setFilters({ ...filters, projectHelpOnly: e.target.checked })
                }
                className="h-4 w-4 rounded border-stone-300 accent-emerald-800"
              />
              Project help
            </label>
            {role === 'student' && (
              <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.savedOnly}
                  onChange={(e) =>
                    setFilters({ ...filters, savedOnly: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-stone-300 accent-emerald-800"
                />
                Saved shortlist ({savedAlumniIds.length})
              </label>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-stone-500">
            <span className="tabular-nums">
              Showing {rankedMatches.length} mentors
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="inline-flex items-center gap-1 font-medium text-emerald-800 hover:text-emerald-950 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                Reset filters
              </button>
            )}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-64 animate-pulse rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] p-5"
            />
          ))}
        </div>
      ) : rankedMatches.length === 0 ? (
        <div className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] px-6 py-12 text-center">
          <h3 className="font-display text-base font-semibold text-[#18221D]">
            {verifiedAlumni.length === 0
              ? 'No verified alumni in the directory yet'
              : 'No mentors match those filters'}
          </h3>
          <p className="mt-1 text-sm text-stone-500 max-w-md mx-auto">
            {verifiedAlumni.length === 0
              ? 'As soon as KLS VDIT seniors register or Placement Admin imports replies from the WhatsApp Senior Google Form, verified mentors will appear here.'
              : 'Clear a filter to see all verified KLS VDIT alumni.'}
          </p>
          {verifiedAlumni.length > 0 && (
            <button
              type="button"
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="mt-4 rounded-lg bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900 cursor-pointer"
            >
              Show All Mentors
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {rankedMatches.map((match) => (
            <AlumniCard
              key={match.alumni.id}
              match={match}
              role={role}
              isSaved={savedSet.has(match.alumni.id)}
              onToggleSave={onToggleSaveAlumni}
              mentorshipRequest={mentorshipByAlumniId.get(match.alumni.id)}
              onRequestMentorship={onRequestMentorship}
              onOpenGuide={onOpenGuide}
            />
          ))}
        </div>
      )}
    </div>
  );
}
