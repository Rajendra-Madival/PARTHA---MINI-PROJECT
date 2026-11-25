import {
  BookOpen,
  Bookmark,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  Plus,
  ThumbsUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type {
  KnowledgeGuide,
  Opportunity,
  OpportunityType,
  UserRole,
} from '../types';

interface OpportunitiesFeedViewProps {
  initialFeed: 'opportunities' | 'guides';
  role: UserRole;
  canAlumniPost: boolean;
  loading: boolean;
  opportunities: Opportunity[];
  opportunitiesTotal: number;
  opportunitiesPage: number;
  opportunitiesTotalPages: number;
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
  onToggleUpvote,
  onOpenGuide,
  onOpenPostModal,
}: OpportunitiesFeedViewProps) {
  const [feedTab, setFeedTab] = useState<'opportunities' | 'guides'>(initialFeed);

  useEffect(() => {
    setFeedTab(initialFeed);
  }, [initialFeed]);

  const domains = ['All', ...availableDomains];

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] px-6 py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#18221D]">
            Opportunities &amp; Prep Guides
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Internships, full-time openings, capstone projects, and student-upvoted career guides shared by KLS VDIT alumni.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 rounded-lg border border-[#E5DFD0] bg-[#F3EFE4] p-1">
            <button
              type="button"
              onClick={() => setFeedTab('opportunities')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                feedTab === 'opportunities'
                  ? 'bg-[#FFFEFA] text-emerald-800 shadow-xs'
                  : 'text-stone-600 hover:text-[#18221D]'
              }`}
            >
              Opportunities ({opportunitiesTotal})
            </button>
            <button
              type="button"
              onClick={() => setFeedTab('guides')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                feedTab === 'guides'
                  ? 'bg-[#FFFEFA] text-emerald-800 shadow-xs'
                  : 'text-stone-600 hover:text-[#18221D]'
              }`}
            >
              Prep Guides ({guidesTotal})
            </button>
          </div>

          {((role === 'alumni' && canAlumniPost) || role === 'admin') && (
            <button
              type="button"
              onClick={() =>
                onOpenPostModal(feedTab === 'opportunities' ? 'opportunity' : 'guide')
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900 whitespace-nowrap cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Post Opportunity / Guide
            </button>
          )}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {feedTab === 'opportunities' ? (
          <div className="flex flex-wrap items-center gap-2">
            {(
              ['All', 'Internship', 'Full-time Job', 'Collaborative Project'] as const
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
        feedTab === 'opportunities' ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] p-5 space-y-3 animate-pulse"
              >
                <div className="h-3 w-40 rounded bg-[#F3EFE4]" />
                <div className="h-5 w-56 rounded bg-[#EEE9DC]" />
                <div className="h-14 w-full rounded bg-[#F3EFE4]" />
                <div className="flex items-center justify-between border-t border-[#EEE9DC] pt-3">
                  <div className="h-4 w-36 rounded bg-[#F3EFE4]" />
                  <div className="h-8 w-20 rounded-lg bg-[#EEE9DC]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-[#EEE9DC] rounded-xl border border-[#E5DFD0] bg-[#FFFEFA]">
            {[1, 2, 3].map((n) => (
              <div key={n} className="p-5 space-y-2.5 animate-pulse">
                <div className="h-3 w-40 rounded bg-[#F3EFE4]" />
                <div className="h-5 w-64 rounded bg-[#EEE9DC]" />
                <div className="h-10 w-full rounded bg-[#F3EFE4]" />
              </div>
            ))}
          </div>
        )
      ) : feedTab === 'opportunities' ? (
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

                      <a
                        href={opp.applyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-900 whitespace-nowrap shrink-0"
                      >
                        <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
                        Apply
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
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
    </div>
  );
}
