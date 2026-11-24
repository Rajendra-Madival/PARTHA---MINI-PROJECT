import {
  BadgeCheck,
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
import type { AdminMetrics, AlumniProfile } from '../types';
import { Avatar } from './Avatar';

interface AdminDashboardViewProps {
  allAlumni: AlumniProfile[];
  metrics: AdminMetrics | null;
  onVerify: (alumniId: string) => Promise<void>;
  onReject: (alumniId: string) => Promise<void>;
  onOpenSeniorForm?: () => void;
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
  metrics,
  onVerify,
  onReject,
  onOpenSeniorForm,
}: AdminDashboardViewProps) {
  const [busyId, setBusyId] = useState<string | null>(null);

  const pendingQueue = allAlumni.filter((a) => a.verificationStatus === 'pending');
  const verifiedList = allAlumni.filter((a) => a.verificationStatus === 'verified');

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
          {(metrics?.topDomains ?? []).length === 0 ? (
            <p className="mt-2 text-xs text-stone-500">
              No verified domains yet
            </p>
          ) : (
            <ul className="mt-2 space-y-1 text-xs">
              {(metrics?.topDomains ?? []).slice(0, 3).map((d) => (
                <li
                  key={d.domain}
                  className="flex items-center justify-between gap-2 text-stone-700"
                >
                  <span className="truncate">{d.domain}</span>
                  <span className="font-mono font-medium text-[#18221D] tabular-nums shrink-0">
                    {d.alumniCount}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-[#18221D]">
            Alumni Verification Queue ({pendingQueue.length})
          </h2>
          <span className="text-xs text-stone-500">
            Only verified alumni appear in Find Mentors
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
                          USN: <span className="font-mono text-stone-700">{item.regNumber}</span>
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

                        <p className="text-xs text-stone-600 leading-relaxed max-w-2xl">
                          {item.bio}
                        </p>

                        <p className="text-xs text-stone-500">
                          <span className="font-medium text-stone-700">Skills: </span>
                          {item.skills.join(' · ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
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
                <th className="px-4 py-3 font-semibold text-right">Guides</th>
                <th className="px-4 py-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEE9DC]">
              {verifiedList.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
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
                    <td className="px-4 py-3 text-right font-mono text-stone-700 tabular-nums">
                      {a.sharedProjectGuidesCount}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                        <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                        Verified
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
