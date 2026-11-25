import {
  BookOpen,
  Bookmark,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  Plus,
  Upload,
  ThumbsUp,
} from 'lucide-react';
import { useState } from 'react';
import type {
  KnowledgeGuide,
  Opportunity,
  OpportunityApplication,
  OpportunityType,
  UserRole,
} from '../types';
import {
  GuidesSkeletonList,
  OpportunitiesSkeletonGrid,
} from './SkeletonLoaders';

interface OpportunitiesFeedViewProps {
  initialFeed: 'opportunities' | 'guides';
  role: UserRole;
  canAlumniPost: boolean;
  loading: boolean;
  opportunities: Opportunity[];
  opportunitiesTotal: number;
  opportunitiesPage: number;
  opportunitiesTotalPages: number;
  appliedOpportunityIds: string[];
  myApplications: OpportunityApplication[];
  guides: KnowledgeGuide[];
  guidesTotal: number;
  guidesPage: number;
  guidesTotalPages: number;
  oppTypeFilter: 'All' | OpportunityType;
  domainFilter: string;
  savedOnly: boolean;
  availableDomains: string[];
  savedOpportunityIds: string[];
  onChangeOppType: (type: 'All' | OpportunityType) => void;
  onChangeDomain: (domain: string) => void;
  onChangeSavedOnly: (savedOnly: boolean) => void;
  onOpportunitiesPageChange: (page: number) => void;
  onGuidesPageChange: (page: number) => void;
  onToggleSaveOpportunity: (opportunityId: string) => Promise<void>;
  onApply: (opportunityId: string, file: File) => Promise<void>;
  onToggleUpvote: (guideId: string) => Promise<void>;
  onOpenGuide: (guideId: string) => void;
  onOpenPostModal: (mode: 'opportunity' | 'guide') => void;
}

export function OpportunitiesFeedView({
  initialFeed,
  role,
  canAlumniPost,
  loading,
  opportunities,
  opportunitiesTotal,
  opportunitiesPage,
  opportunitiesTotalPages,
  appliedOpportunityIds,
  myApplications,
  guides,
  guidesTotal,
  guidesPage,
  guidesTotalPages,
  oppTypeFilter,
  domainFilter,
  savedOnly,
  availableDomains,
  savedOpportunityIds,
  onChangeOppType,
  onChangeDomain,
  onChangeSavedOnly,
  onOpportunitiesPageChange,
  onGuidesPageChange,
  onToggleSaveOpportunity,
  onApply,
  onToggleUpvote,
  onOpenGuide,
  onOpenPostModal,
}: OpportunitiesFeedViewProps) {
  const [applyOpportunity, setApplyOpportunity] = useState<Opportunity | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const domains = ['All', ...availableDomains];

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] px-6 py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#18221D]">
            {initialFeed === 'opportunities' ? 'Opportunities' : 'Prep Guides'}
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            {initialFeed === 'opportunities'
              ? 'Internships, jobs, hackathons, competitions, and research openings shared by alumni.'
              : 'Interview preparation, learning resources, roadmaps, and career guides shared by alumni.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {((role === 'alumni' && canAlumniPost) || role === 'admin') && (
            <button
              type="button"
              onClick={() =>
                onOpenPostModal(initialFeed === 'opportunities' ? 'opportunity' : 'guide')
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900 whitespace-nowrap cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {initialFeed === 'opportunities' ? 'Post Opportunity' : 'Publish Prep Guide'}
            </button>
          )}
        </div>
      </section>

      {initialFeed === 'opportunities' &&
        role === 'student' &&
        myApplications.length > 0 && (
          <section className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] p-4">
            <h2 className="font-display text-sm font-semibold text-[#18221D]">
              Your Applications ({myApplications.length})
            </h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {myApplications.map((application) => (
                <li
                  key={application.id}
                  className="rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] px-3 py-2 text-xs text-stone-700"
                >
                  {application.opportunityTitle}
                  <span className="ml-2 font-semibold capitalize text-emerald-800">
                    {application.status}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {initialFeed === 'opportunities' ? (
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                'All',
                'Internship',
                'Full-time Job',
                'Hackathon',
                'Competition',
                'Research Opportunity',
                'Collaborative Project',
                'Other',
              ] as const
            ).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onChangeOppType(type)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                  oppTypeFilter === type
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                    : 'border-[#E5DFD0] bg-[#FFFEFA] text-stone-600 hover:border-emerald-300'
                }`}
              >
                {type}
              </button>
            ))}

            <label className="ml-1 inline-flex items-center gap-2 rounded-lg border border-[#E5DFD0] bg-[#FFFEFA] px-3 py-1.5 text-xs font-medium text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={savedOnly}
                onChange={(e) => onChangeSavedOnly(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-stone-300 accent-emerald-800"
              />
              <span>Saved only ({savedOpportunityIds.length})</span>
            </label>
          </div>
        ) : (
          <p className="text-xs font-medium text-stone-600">
            Click any guide to read full details or upvote helpful posts
          </p>
        )}

        <div className="flex items-center gap-2">
          <label htmlFor="hub-domain-filter" className="text-xs text-stone-500">
            Domain:
          </label>
          <select
            id="hub-domain-filter"
            value={domainFilter}
            onChange={(e) => onChangeDomain(e.target.value)}
            className="rounded-lg border border-[#E5DFD0] bg-[#FFFEFA] px-3 py-1.5 text-xs font-medium text-stone-700 focus:border-emerald-700 focus:outline-none"
          >
            {domains.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        initialFeed === 'opportunities' ? (
          <OpportunitiesSkeletonGrid />
        ) : (
          <GuidesSkeletonList />
        )
      ) : initialFeed === 'opportunities' ? (
        opportunities.length === 0 ? (
          <div className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] px-6 py-10 text-center">
            <h2 className="font-display text-sm font-semibold text-[#18221D]">
              {oppTypeFilter !== 'All' || domainFilter !== 'All' || savedOnly
                ? 'No opportunities match this filter'
                : 'No opportunities shared yet'}
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              {savedOnly
                ? 'Bookmark opportunities you want to apply to later, or uncheck Saved only.'
                : oppTypeFilter !== 'All' || domainFilter !== 'All'
                  ? 'Try selecting All types or another domain.'
                  : 'Verified alumni and Placement Cell Admins can publish internships, jobs, and collaborative projects here.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {opportunities.map((opp) => {
                const isSaved = savedOpportunityIds.includes(opp.id);
                return (
                  <article
                    key={opp.id}
                    className="flex flex-col justify-between rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] p-5 transition-colors hover:border-emerald-300"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 text-xs text-stone-500">
                            <span className="font-semibold text-emerald-800">
                              {opp.type}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{opp.domain}</span>
                            <span aria-hidden="true">·</span>
                            <span>{opp.postedAt}</span>
                          </div>
                          <h2 className="mt-1 font-display text-base font-semibold text-[#18221D]">
                            {opp.title}
                          </h2>
                          <p className="mt-0.5 text-sm font-medium text-stone-700">
                            {opp.company}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="rounded-md border border-[#E5DFD0] bg-[#FAF7F0] px-2.5 py-1 font-mono text-xs font-medium text-[#18221D] tabular-nums whitespace-nowrap">
                            {opp.stipendOrCtc}
                          </span>
                          <button
                            type="button"
                            onClick={() => onToggleSaveOpportunity(opp.id)}
                            aria-label={isSaved ? 'Remove from saved' : 'Save opportunity'}
                            title={isSaved ? 'Saved' : 'Save for later'}
                            className={`inline-flex items-center justify-center rounded-lg border p-1.5 transition-colors cursor-pointer ${
                              isSaved
                                ? 'border-emerald-700 bg-emerald-50 text-emerald-800'
                                : 'border-[#E5DFD0] bg-[#FAF7F0] text-stone-500 hover:border-emerald-300 hover:text-emerald-800'
                            }`}
                          >
                            <Bookmark
                              className={`h-3.5 w-3.5 ${isSaved ? 'fill-emerald-800' : ''}`}
                              aria-hidden="true"
                            />
                          </button>
                        </div>
                      </div>

                      <p className="mt-3 text-sm leading-relaxed text-stone-600">
                        {opp.description}
                      </p>

                      <p className="mt-3 text-xs text-stone-500">
                        <span className="font-medium text-stone-700">Skills: </span>
                        {opp.skills.join(' · ')}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#EEE9DC] pt-3.5">
                      <div className="text-xs text-stone-500 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                          <span className="truncate">
                            {opp.location}
                            {opp.isRemote ? ' (Remote/Hybrid)' : ''}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate">
                          Posted by {opp.postedByName} ({opp.postedByRole})
                        </p>
                      </div>

                      {role === 'student' ? (
                        <div className="flex items-center gap-2">
                          {opp.applyUrl && (
                            <a
                              href={opp.applyUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-[#E5DFD0] px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-[#F3EFE4]"
                            >
                              External link
                              <ExternalLink className="h-3 w-3" aria-hidden="true" />
                            </a>
                          )}
                          <button
                            type="button"
                            disabled={appliedOpportunityIds.includes(opp.id)}
                            onClick={() => {
                              setApplyOpportunity(opp);
                              setResumeFile(null);
                              setApplyError(null);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-900 disabled:cursor-default disabled:bg-emerald-100 disabled:text-emerald-900 whitespace-nowrap shrink-0"
                          >
                            <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
                            {appliedOpportunityIds.includes(opp.id) ? 'Applied' : 'Apply with Resume'}
                          </button>
                        </div>
                      ) : opp.applyUrl ? (
                        <a
                          href={opp.applyUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-900 whitespace-nowrap shrink-0"
                        >
                          <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
                          External Apply
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </a>
                      ) : (
                        <span className="text-xs font-medium text-stone-500">
                          Apply through PARTHA
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            {opportunitiesTotalPages > 1 && (
              <div className="flex items-center justify-between rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] px-4 py-3 text-xs">
                <span className="text-stone-600 tabular-nums">
                  Page {opportunitiesPage} of {opportunitiesTotalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={opportunitiesPage <= 1}
                    onClick={() => onOpportunitiesPageChange(opportunitiesPage - 1)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] px-3 py-1.5 font-medium text-stone-700 hover:bg-[#F3EFE4] disabled:opacity-50 cursor-pointer"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={opportunitiesPage >= opportunitiesTotalPages}
                    onClick={() => onOpportunitiesPageChange(opportunitiesPage + 1)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] px-3 py-1.5 font-medium text-stone-700 hover:bg-[#F3EFE4] disabled:opacity-50 cursor-pointer"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )
      ) : guides.length === 0 ? (
        <div className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] px-6 py-10 text-center">
          <h2 className="font-display text-sm font-semibold text-[#18221D]">
            {domainFilter !== 'All'
              ? 'No prep guides in this domain'
              : 'No prep guides published yet'}
          </h2>
          <p className="mt-1 text-xs text-stone-500">
            {domainFilter !== 'All'
              ? 'Select All domains to see every prep guide.'
              : 'Verified alumni and admins can share interview prep and career guides from the button above.'}
          </p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-[#EEE9DC] rounded-xl border border-[#E5DFD0] bg-[#FFFEFA]">
            {guides.map((guide) => (
              <article
                key={guide.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                    <span className="font-semibold text-emerald-800">
                      {guide.domain}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{guide.readTimeMinutes} min read</span>
                    <span aria-hidden="true">·</span>
                    <span>{guide.publishedAt}</span>
                  </div>

                  <h2 className="font-display text-base font-semibold text-[#18221D]">
                    <button
                      type="button"
                      onClick={() => onOpenGuide(guide.id)}
                      className="text-left hover:text-emerald-800 cursor-pointer"
                    >
                      {guide.title}
                    </button>
                  </h2>

                  <p className="text-sm text-stone-600 leading-relaxed">
                    {guide.summary}
                  </p>

                  <div className="pt-1 flex flex-wrap items-center gap-3 text-xs text-stone-500">
                    <span>
                      By{' '}
                      <strong className="font-medium text-[#18221D]">
                        {guide.authorName}
                      </strong>{' '}
                      · {guide.authorRole}, {guide.authorCompany} ({guide.authorBatch})
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenGuide(guide.id)}
                      className="inline-flex items-center gap-1 font-medium text-emerald-800 hover:text-emerald-950 cursor-pointer"
                    >
                      <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                      Read Guide
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleUpvote(guide.id)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    guide.upvotedByStudent
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                      : 'border-[#E5DFD0] bg-[#FAF7F0] text-stone-700 hover:border-emerald-300'
                  }`}
                >
                  <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{guide.upvotedByStudent ? 'Upvoted' : 'Upvote'}</span>
                  <span className="font-mono tabular-nums">{guide.upvotes}</span>
                </button>
              </article>
            ))}
          </div>

          {guidesTotalPages > 1 && (
            <div className="flex items-center justify-between rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] px-4 py-3 text-xs">
              <span className="text-stone-600 tabular-nums">
                Page {guidesPage} of {guidesTotalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={guidesPage <= 1}
                  onClick={() => onGuidesPageChange(guidesPage - 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] px-3 py-1.5 font-medium text-stone-700 hover:bg-[#F3EFE4] disabled:opacity-50 cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </button>
                <button
                  type="button"
                  disabled={guidesPage >= guidesTotalPages}
                  onClick={() => onGuidesPageChange(guidesPage + 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] px-3 py-1.5 font-medium text-stone-700 hover:bg-[#F3EFE4] disabled:opacity-50 cursor-pointer"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
      {applyOpportunity && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="apply-opportunity-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/40 p-4"
        >
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              if (!resumeFile) {
                setApplyError('Choose a PDF resume to apply.');
                return;
              }
              setApplying(true);
              setApplyError(null);
              try {
                await onApply(applyOpportunity.id, resumeFile);
                setApplyOpportunity(null);
                setResumeFile(null);
              } catch (err) {
                setApplyError(
                  err instanceof Error ? err.message : 'Unable to submit application.',
                );
              } finally {
                setApplying(false);
              }
            }}
            className="w-full max-w-md space-y-4 rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] p-6 shadow-xl"
          >
            <div>
              <h2
                id="apply-opportunity-title"
                className="font-display text-lg font-semibold text-[#18221D]"
              >
                Apply: {applyOpportunity.title}
              </h2>
              <p className="mt-1 text-xs text-stone-600">
                Upload your PDF resume. Only the opportunity poster and admins can view it.
              </p>
            </div>
            <label className="block space-y-1.5 text-xs font-semibold text-stone-700">
              Resume (PDF, max 2 MB)
              <input
                type="file"
                accept="application/pdf,.pdf"
                required
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  if (
                    file &&
                    ((file.type && file.type !== 'application/pdf') ||
                      !/\.pdf$/i.test(file.name) ||
                      file.size === 0 ||
                      file.size > 2 * 1024 * 1024)
                  ) {
                    setApplyError('Choose a non-empty PDF file up to 2 MB.');
                    event.target.value = '';
                    setResumeFile(null);
                    return;
                  }
                  setResumeFile(file);
                  setApplyError(null);
                }}
                className="block w-full text-xs font-normal text-stone-700 file:mr-3 file:rounded-md file:border file:border-[#E5DFD0] file:bg-[#FAF7F0] file:px-3 file:py-1.5 file:text-xs"
              />
            </label>
            {resumeFile && (
              <p className="text-xs text-stone-500">{resumeFile.name}</p>
            )}
            {applyError && (
              <p role="alert" className="text-xs font-medium text-red-700">
                {applyError}
              </p>
            )}
            <div className="flex justify-end gap-2 border-t border-[#EEE9DC] pt-3">
              <button
                type="button"
                onClick={() => setApplyOpportunity(null)}
                disabled={applying}
                className="rounded-lg border border-[#E5DFD0] px-3.5 py-2 text-xs font-medium text-stone-700 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={applying || !resumeFile}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                {applying ? 'Submitting…' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
