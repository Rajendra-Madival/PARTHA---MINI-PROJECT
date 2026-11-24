import {
  BadgeCheck,
  Bookmark,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  Lock,
  Mail,
  Phone,
  Sparkles,
  ThumbsUp,
} from 'lucide-react';
import type { MatchResult, MentorshipRequest, UserRole } from '../types';
import { Avatar } from './Avatar';

interface AlumniCardProps {
  match: MatchResult;
  role: UserRole;
  mentorshipRequest?: MentorshipRequest;
  isSaved?: boolean;
  onToggleSave?: (alumniId: string) => void;
  onRequestMentorship: (alumniId: string) => void;
  onOpenGuide?: (guideId: string) => void;
}

export function AlumniCard({
  match,
  role,
  mentorshipRequest,
  isSaved = false,
  onToggleSave,
  onRequestMentorship,
  onOpenGuide,
}: AlumniCardProps) {
  const { alumni, score, whyMatchedSummary } = match;
  const status = mentorshipRequest?.status;
  const isUnlocked = !alumni.isContactGated && alumni.contact !== null;

  return (
    <article className="flex flex-col justify-between rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] p-5 transition-colors hover:border-emerald-300">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <Avatar name={alumni.name} src={alumni.avatarUrl} size="md" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display text-base font-semibold text-[#18221D] truncate">
                  {alumni.name}
                </h3>
                {alumni.verificationStatus === 'verified' && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 whitespace-nowrap shrink-0">
                    <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    Verified
                  </span>
                )}
              </div>

              <p className="mt-0.5 text-sm font-medium text-stone-800">
                {alumni.role} at {alumni.company}
              </p>

              <p className="mt-0.5 text-xs text-stone-500 tabular-nums">
                Class of {alumni.graduationYear} {alumni.branch}
                <span aria-hidden="true" className="mx-1.5">
                  ·
                </span>
                <span>{alumni.location}</span>
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 shrink-0">
            {role === 'student' && (
              <div className="text-right">
                <span className="font-mono text-sm font-semibold tabular-nums text-emerald-800">
                  {score}%
                </span>
                <p className="text-[11px] text-stone-500">Match</p>
              </div>
            )}

            {role === 'student' && onToggleSave && (
              <button
                type="button"
                onClick={() => onToggleSave(alumni.id)}
                aria-label={isSaved ? 'Remove mentor from saved' : 'Save mentor'}
                title={isSaved ? 'Saved' : 'Save mentor'}
                className={`rounded-lg border p-1.5 transition-colors cursor-pointer ${
                  isSaved
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-800'
                    : 'border-[#E5DFD0] bg-[#FAF7F0] text-stone-500 hover:text-emerald-800'
                }`}
              >
                <Bookmark
                  className={`h-4 w-4 ${isSaved ? 'fill-emerald-800' : ''}`}
                  aria-hidden="true"
                />
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5">
          <div className="flex items-start gap-2 text-xs leading-relaxed text-emerald-950">
            <Sparkles
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700"
              aria-hidden="true"
            />
            <div>
              <span className="font-semibold text-emerald-900">Why matched: </span>
              <span>{whyMatchedSummary}</span>
            </div>
          </div>
        </div>

        <div className="mt-3.5 text-xs text-stone-600 leading-relaxed">
          <span className="font-medium text-[#18221D]">Can help with: </span>
          {alumni.skills.slice(0, 4).join(' · ')}
          {(alumni.openToInternshipReferrals || alumni.openToProjectMentoring) && (
            <p className="mt-1 text-stone-500">
              {alumni.openToInternshipReferrals && 'Internship referrals'}
              {alumni.openToInternshipReferrals && alumni.openToProjectMentoring && ' · '}
              {alumni.openToProjectMentoring && 'Project guidance'}
            </p>
          )}
        </div>

        {alumni.topHighlight && (
          <div className="mt-3.5 border-t border-[#EEE9DC] pt-3">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onOpenGuide?.(alumni.topHighlight!.guideId)}
                className="group flex items-start gap-2 text-left text-xs text-stone-700 hover:text-emerald-800 cursor-pointer min-w-0"
              >
                <BookOpen
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-400 group-hover:text-emerald-700"
                  aria-hidden="true"
                />
                <span className="truncate font-medium">
                  Guide: &ldquo;{alumni.topHighlight.title}&rdquo;
                </span>
              </button>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 tabular-nums whitespace-nowrap shrink-0">
                <ThumbsUp className="h-3 w-3 text-stone-400" aria-hidden="true" />
                {alumni.topHighlight.upvotes}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-[#EEE9DC] pt-3.5">
        {isUnlocked && alumni.contact ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                {role === 'student' ? 'Accepted · Contact Unlocked' : 'Contact Visible'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-1.5 text-xs text-stone-700 sm:grid-cols-2">
              {alumni.contact.email && (
                <a
                  href={`mailto:${alumni.contact.email}`}
                  className="inline-flex items-center gap-1.5 truncate hover:text-emerald-800"
                >
                  <Mail className="h-3.5 w-3.5 shrink-0 text-stone-400" aria-hidden="true" />
                  <span className="truncate">{alumni.contact.email}</span>
                </a>
              )}
              {alumni.contact.phone && (
                <a
                  href={`tel:${alumni.contact.phone}`}
                  className="inline-flex items-center gap-1.5 tabular-nums hover:text-emerald-800"
                >
                  <Phone className="h-3.5 w-3.5 shrink-0 text-stone-400" aria-hidden="true" />
                  <span>{alumni.contact.phone}</span>
                </a>
              )}
            </div>
            {alumni.contact.linkedinUrl && (
              <a
                href={alumni.contact.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 hover:text-emerald-950"
              >
                <span>Open LinkedIn Profile</span>
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center gap-1 rounded-md border border-[#E5DFD0] bg-[#FAF7F0] px-2 py-0.5 text-xs font-medium text-stone-700 whitespace-nowrap shrink-0">
                <Lock className="h-3 w-3 text-stone-500" aria-hidden="true" />
                Gated
              </span>
              <span className="text-xs text-stone-500 truncate">
                Contact unlocks after accept
              </span>
            </div>

            {role === 'student' && (
              <div className="shrink-0">
                {status === 'pending' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 whitespace-nowrap">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    Pending
                  </span>
                ) : status === 'declined' ? (
                  <span className="inline-flex items-center rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] px-3 py-2 text-xs font-medium text-stone-500 whitespace-nowrap">
                    Declined
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onRequestMentorship(alumni.id)}
                    className="rounded-lg bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-900 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Request Mentorship
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
