import {
  BadgeCheck,
  BarChart3,
  Briefcase,
  Check,
  Clock,
  Download,
  FileSpreadsheet,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type {
  AdminMetrics,
  AdminStudentRecord,
  AlumniProfile,
  MentorshipRequest,
  OpportunityApplication,
} from '../types';
import { Avatar } from './Avatar';

interface AdminDashboardViewProps {
  allAlumni: AlumniProfile[];
  allStudents: AdminStudentRecord[];
  mentorships: MentorshipRequest[];
  applications: OpportunityApplication[];
  metrics: AdminMetrics | null;
  loading?: boolean;
  onVerify: (alumniId: string) => Promise<void>;
  onReject: (alumniId: string) => Promise<void>;
  onSetAccountActive: (userId: string, isActive: boolean) => Promise<void>;
  onOpenSeniorForm?: () => void;
  onUpdateApplicationStatus: (
    applicationId: string,
    status: OpportunityApplication['status'],
  ) => Promise<void>;
  onDownloadApplicationResume: (applicationId: string) => Promise<void>;
  onDownloadStudentResume: (studentId: string) => Promise<void>;
}

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function AdminDashboardView({
  allAlumni,
  allStudents,
  mentorships,
  applications,
  metrics,
  loading = false,
  onVerify,
  onReject,
  onSetAccountActive,
  onOpenSeniorForm,
  onUpdateApplicationStatus,
  onDownloadApplicationResume,
  onDownloadStudentResume,
}: AdminDashboardViewProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  const pendingQueue = allAlumni.filter((a) => a.verificationStatus === 'pending');
  const verifiedList = allAlumni.filter((a) => a.verificationStatus === 'verified');
  const rejectedList = allAlumni.filter((a) => a.verificationStatus === 'rejected');

  const topDomains = metrics?.topDomains ?? [];
  const maxDomainTotal = Math.max(
    1,
    ...topDomains.map((d) => d.alumniCount + d.guideCount + d.studentCount),
  );
  const branchBreakdown = metrics?.branchBreakdown ?? [];
  const maxBranchCount = Math.max(
    1,
    ...branchBreakdown.map((b) => b.alumniCount),
  );
  const totalRequestsSent = mentorships.length;
  const activeStudentIds = new Set(
    mentorships.filter((request) => request.status === 'accepted').map((request) => request.studentId),
  );
  const unmatchedStudents = allStudents.filter(
    (student) => !activeStudentIds.has(student.profile.id),
  );

  function handleDownloadCsv() {
    const header = [
      'Name',
      'Role',
      'Company',
      'GraduationYear',
      'Branch',
      'USN',
      'Domain',
      'Location',
      'Guides',
    ];
    const rows = verifiedList.map((a) => [
      a.name,
      a.role,
      a.company,
      a.graduationYear,
      a.branch,
      a.regNumber,
      a.domain,
      a.location,
      a.sharedProjectGuidesCount,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map(escapeCsvCell).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'partha_kls_vdit_verified_alumni.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleVerify(id: string) {
    setBusyId(id);
    try {
      await onVerify(id);
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: string) {
    setBusyId(id);
    try {
      await onReject(id);
    } finally {
      setBusyId(null);
    }
  }

  async function handleAccountStatus(userId: string, isActive: boolean) {
    setBusyId(userId);
    setDetailError(null);
    try {
      await onSetAccountActive(userId, isActive);
    } catch (err) {
      setDetailError(
        err instanceof Error ? err.message : 'Unable to update account status.',
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleApplicationStatus(
    id: string,
    status: OpportunityApplication['status'],
  ) {
    setDetailError(null);
    try {
      await onUpdateApplicationStatus(id, status);
    } catch (err) {
      setDetailError(
        err instanceof Error ? err.message : 'Unable to update application status.',
      );
    }
  }

  async function handleResumeDownload(download: () => Promise<void>) {
    setDetailError(null);
    try {
      await download();
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Unable to download resume.');
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] px-6 py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-emerald-800">
            KLS VDIT Placement &amp; Alumni Cell Administration
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#18221D]">
            Admin Verification &amp; Engagement Dashboard
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Verify alumni academic records before they appear in Student Smart Discovery, and collect senior profiles via Google Forms on WhatsApp.
          </p>
        </div>

        {onOpenSeniorForm && (
          <button
            type="button"
            onClick={onOpenSeniorForm}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            WhatsApp Senior Google Form
          </button>
        )}
      </section>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] p-5 space-y-3 animate-pulse"
            >
              <div className="h-3.5 w-32 rounded bg-[#F3EFE4]" />
              <div className="h-7 w-16 rounded bg-[#EEE9DC]" />
              <div className="h-3 w-28 rounded bg-[#F3EFE4]" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <section
            aria-label="Platform Metrics"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] p-5">
              <div className="flex items-center justify-between text-xs font-medium text-stone-500">
                <span>Total Verified Alumni</span>
                <ShieldCheck className="h-4 w-4 text-emerald-800" aria-hidden="true" />
              </div>
              <p className="mt-2 font-mono text-2xl font-semibold text-[#18221D] tabular-nums">
                {metrics?.totalVerifiedAlumni ?? verifiedList.length}
              </p>
              <p className="mt-1 text-xs text-stone-500 tabular-nums">
                {pendingQueue.length} awaiting review
              </p>
            </div>

            <div className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] p-5">
              <div className="flex items-center justify-between text-xs font-medium text-stone-500">
                <span>Active Mentorship Connections</span>
                <Users className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              </div>
              <p className="mt-2 font-mono text-2xl font-semibold text-[#18221D] tabular-nums">
                {metrics?.activeMentorshipConnections ?? 0}
              </p>
              <p className="mt-1 text-xs text-stone-500 tabular-nums">
                {metrics?.pendingMentorshipRequests ?? 0} pending requests
              </p>
            </div>

            <div className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] p-5">
              <div className="flex items-center justify-between text-xs font-medium text-stone-500">
                <span>Opportunities Shared</span>
                <Briefcase className="h-4 w-4 text-emerald-800" aria-hidden="true" />
              </div>
              <p className="mt-2 font-mono text-2xl font-semibold text-[#18221D] tabular-nums">
                {metrics?.opportunitiesShared ?? 0}
              </p>
              <p className="mt-1 text-xs text-stone-500 tabular-nums">
                {metrics?.knowledgeGuidesCount ?? 0} guides ·{' '}
                {metrics?.totalGuideUpvotes ?? 0} upvotes
              </p>
            </div>

            <div className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] p-5">
              <div className="flex items-center justify-between text-xs font-medium text-stone-500">
                <span>Top Domains</span>
              </div>
              {topDomains.length === 0 ? (
                <p className="mt-2 text-xs text-stone-500">
                  No student or alumni domains yet
                </p>
              ) : (
                <ul className="mt-2 space-y-1 text-xs">
                  {topDomains.slice(0, 3).map((d) => (
                    <li
                      key={d.domain}
                      className="flex items-center justify-between gap-2 text-stone-700"
                    >
                      <span className="truncate">{d.domain}</span>
                      <span className="font-mono font-medium text-[#18221D] tabular-nums shrink-0">
                        {d.studentCount} students
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Engagement & Domain Analytics */}
          <section
            aria-label="Engagement and Domain Analytics"
            className="grid grid-cols-1 gap-4 lg:grid-cols-12"
          >
            <div className="lg:col-span-7 rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BarChart3
                    className="h-4 w-4 text-emerald-800"
                    aria-hidden="true"
                  />
                  <h2 className="font-display text-sm font-semibold text-[#18221D]">
                    Domain Distribution (Students, Alumni &amp; Prep Guides)
                  </h2>
                </div>
                <span className="text-[11px] text-stone-500">
                  Live Supabase SQL counts
                </span>
              </div>

              {topDomains.length === 0 ? (
                <p className="py-6 text-center text-xs text-stone-500">
                  Verify alumni profiles or import Google Form replies to view domain breakdown.
                </p>
              ) : (
                <div className="space-y-3">
                  {topDomains.map((d) => {
                    const combined =
                      d.alumniCount + d.guideCount + d.studentCount;
                    const widthPct = Math.max(
                      8,
                      Math.round((combined / maxDomainTotal) * 100),
                    );
                    return (
                      <div key={d.domain} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-[#18221D]">
                            {d.domain}
                          </span>
                          <span className="font-mono text-stone-600 tabular-nums">
                            {d.studentCount} students · {d.alumniCount} alumni · {d.guideCount} guides
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[#F3EFE4]">
                          <div
                            className="h-full rounded-full bg-emerald-800 transition-all"
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="lg:col-span-5 rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] p-5 space-y-5">
              <div className="space-y-2.5">
                <h2 className="font-display text-sm font-semibold text-[#18221D]">
                  Mentorship Funnel
                </h2>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] p-3">
                    <p className="text-stone-500">Requests Sent</p>
                    <p className="mt-1 font-mono text-lg font-semibold text-[#18221D] tabular-nums">
                      {totalRequestsSent}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] p-3">
                    <p className="text-stone-500">Accepted</p>
                    <p className="mt-1 font-mono text-lg font-semibold text-emerald-800 tabular-nums">
                      {metrics?.activeMentorshipConnections ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] p-3">
                    <p className="text-stone-500">Calls Booked</p>
                    <p className="mt-1 font-mono text-lg font-semibold text-[#18221D] tabular-nums">
                      {metrics?.totalSessionsBooked ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] p-3">
                    <p className="text-stone-500">Calls Confirmed</p>
                    <p className="mt-1 font-mono text-lg font-semibold text-emerald-800 tabular-nums">
                      {metrics?.confirmedSessionsCount ?? 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#EEE9DC] pt-3.5 space-y-2">
                <h3 className="text-xs font-semibold text-[#18221D]">
                  Most Requested Mentorship Goals
                </h3>
                {metrics?.mentorshipGoalBreakdown.length ? (
                  metrics.mentorshipGoalBreakdown.slice(0, 5).map((item) => (
                    <div
                      key={item.goal}
                      className="flex items-center justify-between gap-3 text-xs text-stone-600"
                    >
                      <span className="truncate">{item.goal}</span>
                      <span className="font-mono tabular-nums">{item.requestCount}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-stone-500">No goal selections recorded yet.</p>
                )}
              </div>

              <div className="border-t border-[#EEE9DC] pt-3.5 space-y-2">
                <h3 className="text-xs font-semibold text-[#18221D]">
                  Verified Alumni by Branch
                </h3>
                <div className="space-y-2">
                  {branchBreakdown.map((b) => {
                    const widthPct =
                      b.alumniCount === 0
                        ? 0
                        : Math.max(8, Math.round((b.alumniCount / maxBranchCount) * 100));
                    return (
                      <div key={b.branch} className="flex items-center gap-3 text-xs">
                        <span className="w-8 font-mono font-medium text-stone-700">
                          {b.branch}
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#F3EFE4]">
                          <div
                            className="h-full rounded-full bg-emerald-700"
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                        <span className="w-6 text-right font-mono text-stone-600 tabular-nums">
                          {b.alumniCount}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-[#18221D]">
            Alumni Verification Queue ({pendingQueue.length})
          </h2>
          <span className="text-xs text-stone-500">
            Only verified alumni appear in the Alumni Directory
          </span>
        </div>

        {pendingQueue.length === 0 ? (
          <div className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] px-6 py-10 text-center">
            <h3 className="font-display text-sm font-semibold text-[#18221D]">
              Verification queue is clear
            </h3>
            <p className="mt-1 text-xs text-stone-500">
              All submitted KLS VDIT alumni profiles have been reviewed.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingQueue.map((item) => {
              const busy = busyId === item.id;
              return (
                <article
                  key={item.id}
                  className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <Avatar name={item.name} src={item.avatarUrl} size="md" />
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-base font-semibold text-[#18221D]">
                            {item.name}
                          </h3>
                          <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            Pending Verification
                          </span>
                        </div>

                        <p className="text-sm font-medium text-stone-800">
                          {item.role}, {item.company}
                        </p>

                        <p className="text-xs text-stone-500 tabular-nums">
                          USN:{' '}
                          <span className="font-mono text-stone-700">
                            {item.regNumber}
                          </span>
                          <span aria-hidden="true" className="mx-1.5">
                            ·
                          </span>
                          Class of {item.graduationYear} {item.branch}
                          <span aria-hidden="true" className="mx-1.5">
                            ·
                          </span>
                          {item.domain}
                          <span aria-hidden="true" className="mx-1.5">
                            ·
                          </span>
                          {item.location}
                        </p>

                        {item.bio && (
                          <p className="text-xs text-stone-600 leading-relaxed max-w-2xl">
                            {item.bio}
                          </p>
                        )}

                        <p className="text-xs text-stone-500">
                          <span className="font-medium text-stone-700">
                            Skills:{' '}
                          </span>
                          {item.skills.join(' · ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        disabled={busyId === item.ownerUid}
                        onClick={() =>
                          void handleAccountStatus(item.ownerUid, !item.accountActive)
                        }
                        className="text-[11px] font-medium text-red-700 underline disabled:opacity-50"
                      >
                        {item.accountActive ? 'Suspend account' : 'Reactivate account'}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleReject(item.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] px-3.5 py-2 text-xs font-medium text-stone-700 hover:bg-[#F3EFE4] disabled:opacity-60 cursor-pointer whitespace-nowrap"
                      >
                        <X className="h-3.5 w-3.5 text-stone-500" aria-hidden="true" />
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleVerify(item.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-60 cursor-pointer whitespace-nowrap"
                      >
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        Approve &amp; Verify
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-base font-semibold text-[#18221D]">
          Rejected Alumni Accounts ({rejectedList.length})
        </h2>
        <div className="overflow-x-auto rounded-xl border border-[#E5DFD0] bg-[#FFFEFA]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E5DFD0] bg-[#F3EFE4] text-stone-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Alumnus</th>
                <th className="px-4 py-3 font-semibold">Role &amp; Company</th>
                <th className="px-4 py-3 font-semibold">Account</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEE9DC]">
              {rejectedList.map((alumnus) => (
                <tr key={alumnus.id}>
                  <td className="px-4 py-3 font-medium text-[#18221D]">
                    {alumnus.name}
                  </td>
                  <td className="px-4 py-3 text-stone-700">
                    {alumnus.role}, {alumnus.company}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={alumnus.accountActive ? 'text-emerald-800' : 'font-medium text-red-700'}>
                      {alumnus.accountActive ? 'Active' : 'Suspended'}
                    </span>
                    <button
                      type="button"
                      disabled={busyId === alumnus.ownerUid}
                      onClick={() =>
                        void handleAccountStatus(alumnus.ownerUid, !alumnus.accountActive)
                      }
                      className="mt-1 block w-full text-[11px] font-medium text-red-700 underline disabled:opacity-50"
                    >
                      {alumnus.accountActive ? 'Suspend' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
              {rejectedList.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-stone-500">
                    No rejected alumni accounts.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-base font-semibold text-[#18221D]">
            Verified Alumni Registry ({verifiedList.length})
          </h2>
          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={verifiedList.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5DFD0] bg-[#FFFEFA] px-3 py-1.5 text-xs font-medium text-[#18221D] hover:border-emerald-400 hover:bg-[#FAF7F0] disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5 text-emerald-800" aria-hidden="true" />
            Download CSV
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-[#E5DFD0] bg-[#FFFEFA]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E5DFD0] bg-[#F3EFE4] text-stone-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Alumnus</th>
                <th className="px-4 py-3 font-semibold">Role &amp; Company</th>
                <th className="px-4 py-3 font-semibold">Batch &amp; USN</th>
                <th className="px-4 py-3 font-semibold">Domain</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold text-right">Guides</th>
                <th className="px-4 py-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEE9DC]">
              {verifiedList.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-xs text-stone-500"
                  >
                    No verified alumni yet. Approve profiles above or import responses from your Senior Intake Google Form.
                  </td>
                </tr>
              ) : (
                verifiedList.map((a) => (
                  <tr key={a.id} className="hover:bg-[#FAF7F0]">
                    <td className="px-4 py-3 font-medium text-[#18221D] whitespace-nowrap">
                      {a.name}
                    </td>
                    <td className="px-4 py-3 text-stone-700 whitespace-nowrap">
                      {a.role}, {a.company}
                    </td>
                    <td className="px-4 py-3 text-stone-500 tabular-nums whitespace-nowrap">
                      {a.graduationYear} {a.branch} ·{' '}
                      <span className="font-mono">{a.regNumber}</span>
                    </td>
                    <td className="px-4 py-3 text-stone-600 whitespace-nowrap">
                      {a.domain}
                    </td>
                    <td className="px-4 py-3 text-stone-600 whitespace-nowrap">
                      {a.contact?.email || '—'}
                      {a.contact?.phone && <p>{a.contact.phone}</p>}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-stone-700 tabular-nums">
                      {a.sharedProjectGuidesCount}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex flex-col items-end gap-2">
                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                          <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                          Verified
                        </span>
                        <button
                          type="button"
                          disabled={busyId === a.ownerUid}
                          onClick={() =>
                            void handleAccountStatus(a.ownerUid, !a.accountActive)
                          }
                          className="text-[11px] font-medium text-red-700 underline disabled:opacity-50"
                        >
                          {a.accountActive ? 'Suspend account' : 'Reactivate account'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-base font-semibold text-[#18221D]">
            Student Directory ({allStudents.length})
          </h2>
          <span className="text-xs text-stone-600">
            {unmatchedStudents.length} students without an accepted mentorship
          </span>
        </div>
        {detailError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {detailError}
          </p>
        )}
        <div className="overflow-x-auto rounded-xl border border-[#E5DFD0] bg-[#FFFEFA]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E5DFD0] bg-[#F3EFE4] text-stone-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Student / Academic</th>
                <th className="px-4 py-3 font-semibold">Domain &amp; Skills</th>
                <th className="px-4 py-3 font-semibold">Mentorship Goals</th>
                <th className="px-4 py-3 font-semibold">Links / Resume</th>
                <th className="px-4 py-3 font-semibold">Registered</th>
                <th className="px-4 py-3 font-semibold">Account</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEE9DC]">
              {allStudents.map(({ profile, registeredAt, accountActive }) => (
                <tr key={profile.id} className="align-top hover:bg-[#FAF7F0]">
                  <td className="px-4 py-3 text-stone-700">
                    <p className="font-semibold text-[#18221D]">{profile.name}</p>
                    <p>{profile.email}</p>
                    <p className="mt-1 font-mono">{profile.usn}</p>
                    <p>Sem {profile.semester} · {profile.branch}</p>
                  </td>
                  <td className="px-4 py-3 text-stone-700">
                    <p>{profile.targetDomain}</p>
                    <p className="mt-1 max-w-xs text-stone-500">
                      {profile.targetSkills.join(' · ') || 'No skills listed'}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-stone-700">
                    {[...profile.mentorshipGoals, profile.customMentorshipGoal]
                      .filter(Boolean)
                      .join(' · ') || 'None specified'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1">
                      {profile.leetcodeUrl && (
                        <a href={profile.leetcodeUrl} target="_blank" rel="noreferrer" className="text-emerald-800 underline">LeetCode</a>
                      )}
                      {profile.githubUrl && (
                        <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="text-emerald-800 underline">GitHub</a>
                      )}
                      {profile.linkedinUrl && (
                        <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="text-emerald-800 underline">LinkedIn</a>
                      )}
                      {profile.resumeFileName && (
                        <button
                          type="button"
                          onClick={() =>
                            void handleResumeDownload(() =>
                              onDownloadStudentResume(profile.id),
                            )
                          }
                          className="text-emerald-800 underline"
                        >
                          Resume: {profile.resumeFileName}
                        </button>
                      )}
                      {!profile.leetcodeUrl &&
                        !profile.githubUrl &&
                        !profile.linkedinUrl &&
                        !profile.resumeFileName && (
                          <span className="text-stone-500">No links or resume</span>
                        )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-stone-600">
                    {registeredAt.slice(0, 10)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <span
                      className={
                        accountActive
                          ? 'text-emerald-800'
                          : 'font-medium text-red-700'
                      }
                    >
                      {accountActive ? 'Active' : 'Suspended'}
                    </span>
                    <button
                      type="button"
                      disabled={busyId === profile.id}
                      onClick={() =>
                        void handleAccountStatus(profile.id, !accountActive)
                      }
                      className="mt-1 block w-full text-[11px] font-medium text-red-700 underline disabled:opacity-50"
                    >
                      {accountActive ? 'Suspend' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
              {allStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-stone-500">
                    No student profiles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-base font-semibold text-[#18221D]">
          Mentorship Activity ({mentorships.length})
        </h2>
        <div className="overflow-x-auto rounded-xl border border-[#E5DFD0] bg-[#FFFEFA]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E5DFD0] bg-[#F3EFE4] text-stone-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 font-semibold">Alumni</th>
                <th className="px-4 py-3 font-semibold">Goal</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEE9DC]">
              {mentorships.slice(0, 50).map((request) => (
                <tr key={request.id} className="hover:bg-[#FAF7F0]">
                  <td className="px-4 py-3 text-stone-700">
                    {request.studentName} · {request.studentUsn}
                  </td>
                  <td className="px-4 py-3 text-stone-700">
                    {request.alumniName} · {request.alumniCompany}
                  </td>
                  <td className="px-4 py-3 text-stone-700">{request.goal}</td>
                  <td className="px-4 py-3 capitalize text-stone-700">{request.status}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-stone-600">
                    {request.createdAt.slice(0, 10)}
                  </td>
                </tr>
              ))}
              {mentorships.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                    No mentorship activity recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-base font-semibold text-[#18221D]">
          Opportunity Applications ({applications.length})
        </h2>
        <div className="space-y-2">
          {applications.map((application) => (
            <article
              key={application.id}
              className="flex flex-col gap-3 rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-[#18221D]">
                  {application.studentName} · {application.opportunityTitle}
                </p>
                <p className="text-xs text-stone-600">
                  {application.studentEmail} · {application.studentBranch} · {application.resumeFileName}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-[#E5DFD0] px-2.5 py-1 text-xs capitalize text-stone-700">
                  {application.status}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    void handleResumeDownload(() =>
                      onDownloadApplicationResume(application.id),
                    )
                  }
                  className="rounded-lg border border-[#E5DFD0] px-3 py-1.5 text-xs font-medium text-stone-700"
                >
                  View Resume
                </button>
                {application.status !== 'accepted' &&
                  application.status !== 'declined' && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          void handleApplicationStatus(application.id, 'reviewed')
                        }
                        className="rounded-lg border border-[#E5DFD0] px-3 py-1.5 text-xs font-medium text-stone-700"
                      >
                        Mark Reviewed
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void handleApplicationStatus(application.id, 'accepted')
                        }
                        className="rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void handleApplicationStatus(application.id, 'declined')
                        }
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700"
                      >
                        Decline
                      </button>
                    </>
                  )}
              </div>
            </article>
          ))}
          {applications.length === 0 && (
            <p className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] px-5 py-6 text-center text-xs text-stone-500">
              No opportunity applications yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
