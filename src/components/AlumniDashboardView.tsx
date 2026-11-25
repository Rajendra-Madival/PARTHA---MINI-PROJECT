import {
  BadgeCheck,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  LockOpen,
  MessageSquare,
  Plus,
  Send,
  Video,
  X,
  XCircle,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { AlumniProfile, AuthUser, MentorshipRequest } from '../types';
import { Avatar } from './Avatar';

interface AlumniDashboardViewProps {
  user: AuthUser;
  alumniProfile?: AlumniProfile;
  requests: MentorshipRequest[];
  loading?: boolean;
  onRespond: (
    requestId: string,
    decision: 'accepted' | 'declined',
  ) => Promise<void>;
  onOpenPostModal: (mode: 'opportunity' | 'guide') => void;
  onToggleAvailability: (updates: {
    openToInternshipReferrals?: boolean;
    openToProjectMentoring?: boolean;
  }) => Promise<void>;
  onSendMessage: (requestId: string, text: string) => Promise<void>;
  onConfirmSession: (requestId: string) => Promise<void>;
  onMarkRead: (requestId: string) => Promise<void>;
  onEditDetails?: () => void;
}

export function AlumniDashboardView({
  user,
  alumniProfile,
  requests,
  loading = false,
  onRespond,
  onOpenPostModal,
  onToggleAvailability,
  onSendMessage,
  onConfirmSession,
  onMarkRead,
  onEditDetails,
}: AlumniDashboardViewProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [availabilityBusy, setAvailabilityBusy] = useState(false);
  const [draftMessages, setDraftMessages] = useState<Record<string, string>>({});

  const isPendingVerification =
    (alumniProfile?.verificationStatus ?? user.verificationStatus) === 'pending';
  const isRejected =
    (alumniProfile?.verificationStatus ?? user.verificationStatus) === 'rejected';

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const acceptedRequests = requests.filter((r) => r.status === 'accepted');
  const declinedRequests = requests.filter((r) => r.status === 'declined');

  async function handleAction(
    requestId: string,
    decision: 'accepted' | 'declined',
  ) {
    setProcessingId(requestId);
    try {
      await onRespond(requestId, decision);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleAvailabilityChange(updates: {
    openToInternshipReferrals?: boolean;
    openToProjectMentoring?: boolean;
  }) {
    setAvailabilityBusy(true);
    try {
      await onToggleAvailability(updates);
    } finally {
      setAvailabilityBusy(false);
    }
  }

  async function handleSend(e: FormEvent, requestId: string) {
    e.preventDefault();
    const text = (draftMessages[requestId] ?? '').trim();
    if (!text) return;
    setProcessingId(requestId);
    try {
      await onSendMessage(requestId, text);
      setDraftMessages((prev) => ({ ...prev, [requestId]: '' }));
    } finally {
      setProcessingId(null);
    }
  }

  async function handleConfirm(requestId: string) {
    setProcessingId(requestId);
    try {
      await onConfirmSession(requestId);
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] px-6 py-5 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <Avatar name={user.name} src={alumniProfile?.avatarUrl} size="lg" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-xl font-bold tracking-tight text-[#18221D]">
                  {user.name}
                </h1>
                {isPendingVerification ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    Pending Verification
                  </span>
                ) : isRejected ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                    <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    Verification Rejected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                    <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    Verified Alumni
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-stone-600">
                {user.subtitle} · KLS VDIT
              </p>
              <p className="mt-1 text-xs text-stone-500">
                Your email, phone, and LinkedIn stay gated until you accept a student&apos;s request.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onEditDetails && (
              <button
                type="button"
                onClick={onEditDetails}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] px-3.5 py-2 text-xs font-semibold text-[#18221D] hover:bg-[#F3EFE4] whitespace-nowrap cursor-pointer"
              >
                Edit My Details
              </button>
            )}
            {!isPendingVerification && !isRejected && (
              <button
                type="button"
                onClick={() => onOpenPostModal('opportunity')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900 whitespace-nowrap cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Post Opportunity / Guide
              </button>
            )}
          </div>
        </div>

        {!isPendingVerification && !isRejected && alumniProfile && (
          <div className="flex flex-wrap items-center gap-4 border-t border-[#EEE9DC] pt-3.5 text-xs">
            <span className="font-semibold text-[#18221D]">
              Mentoring Availability:
            </span>
            <label className="inline-flex items-center gap-2 text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                disabled={availabilityBusy}
                checked={alumniProfile.openToInternshipReferrals}
                onChange={(e) =>
                  handleAvailabilityChange({
                    openToInternshipReferrals: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-stone-300 accent-emerald-800"
              />
              <span>Open to internship referrals</span>
            </label>
            <label className="inline-flex items-center gap-2 text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                disabled={availabilityBusy}
                checked={alumniProfile.openToProjectMentoring}
                onChange={(e) =>
                  handleAvailabilityChange({
                    openToProjectMentoring: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-stone-300 accent-emerald-800"
              />
              <span>Open to project guidance</span>
            </label>
          </div>
        )}
      </section>

      {isPendingVerification && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-xs text-amber-900">
          <p className="font-semibold">Awaiting Admin Verification</p>
          <p className="mt-1 text-amber-800">
            Your KLS VDIT alumni registration is currently in the Admin Verification Queue. Once Placement Cell verifies your profile, students can discover you and send mentorship requests.
          </p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] p-5 space-y-3 animate-pulse"
            >
              <div className="h-4 w-48 rounded bg-[#EEE9DC]" />
              <div className="h-3.5 w-32 rounded bg-[#F3EFE4]" />
              <div className="h-12 w-full rounded bg-[#F3EFE4]" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-[#18221D]">
                Student Mentorship Requests ({pendingRequests.length})
              </h2>
              <span className="text-xs text-stone-500">
                Accepting unlocks your contact info for that student
              </span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] px-6 py-10 text-center">
                <h3 className="font-display text-sm font-semibold text-[#18221D]">
                  No pending student requests
                </h3>
                <p className="mt-1 text-xs text-stone-500">
                  New mentorship requests from KLS VDIT students will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((req) => {
                  const busy = processingId === req.id;
                  return (
                    <article
                      key={req.id}
                      className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-display text-base font-semibold text-[#18221D]">
                              {req.studentName}
                            </h3>
                            <span className="font-mono text-xs text-stone-500 tabular-nums">
                              {req.studentUsn}
                            </span>
                            <span aria-hidden="true" className="text-stone-300">
                              ·
                            </span>
                            <span className="text-xs text-stone-600 tabular-nums">
                              Sem {req.studentSemester} {req.studentBranch}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                              <Clock className="h-3 w-3" aria-hidden="true" />
                              Pending
                            </span>
                          </div>

                          <p className="text-xs font-semibold text-emerald-800">
                            Goal: {req.goal}
                          </p>

                          <p className="text-sm leading-relaxed text-stone-700">
                            &ldquo;{req.message}&rdquo;
                          </p>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleAction(req.id, 'declined')}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] px-3.5 py-2 text-xs font-medium text-stone-700 hover:bg-[#F3EFE4] disabled:opacity-60 cursor-pointer whitespace-nowrap"
                          >
                            <X className="h-3.5 w-3.5 text-stone-500" aria-hidden="true" />
                            Decline
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleAction(req.id, 'accepted')}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-60 cursor-pointer whitespace-nowrap"
                          >
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            Accept
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {acceptedRequests.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-display text-base font-semibold text-[#18221D]">
                Active Mentees ({acceptedRequests.length})
              </h2>
              <div className="space-y-4">
                {acceptedRequests.map((req) => {
                  const busy = processingId === req.id;
                  return (
                    <article
                      key={req.id}
                      className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] p-5 space-y-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-display text-base font-semibold text-[#18221D]">
                              {req.studentName}
                            </h3>
                            <span className="font-mono text-xs text-stone-500 tabular-nums">
                              {req.studentUsn} · Sem {req.studentSemester}{' '}
                              {req.studentBranch}
                            </span>
                            {req.unreadCount > 0 && (
                              <span className="inline-flex items-center rounded-md border border-emerald-300 bg-emerald-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-900 tabular-nums">
                                {req.unreadCount} unread
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-stone-600">
                            <span className="font-semibold text-emerald-800">
                              {req.goal}:
                            </span>{' '}
                            &ldquo;{req.message}&rdquo;
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {req.unreadCount > 0 && (
                            <button
                              type="button"
                              onClick={() => void onMarkRead(req.id)}
                              className="rounded-md border border-[#E5DFD0] bg-[#FAF7F0] px-2.5 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-50 cursor-pointer"
                            >
                              Mark Read
                            </button>
                          )}
                          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                            Accepted
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-stone-500">
                            <LockOpen
                              className="h-3.5 w-3.5 text-emerald-700"
                              aria-hidden="true"
                            />
                            Contact unlocked
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] p-4 space-y-2.5">
                          <div className="flex items-center gap-2 text-xs font-semibold text-[#18221D]">
                            <Calendar
                              className="h-3.5 w-3.5 text-emerald-800"
                              aria-hidden="true"
                            />
                            <span>1-on-1 Mentorship Session</span>
                          </div>

                          {req.sessionBooking ? (
                            <div className="space-y-2 text-xs">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="font-medium text-[#18221D]">
                                  {req.sessionBooking.slotLabel}
                                </span>
                                <span
                                  className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                                    req.sessionBooking.status === 'confirmed'
                                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                      : 'border-amber-200 bg-amber-50 text-amber-800'
                                  }`}
                                >
                                  {req.sessionBooking.status === 'confirmed'
                                    ? 'Confirmed'
                                    : 'Requested by Student'}
                                </span>
                              </div>
                              <p className="text-stone-600">
                                Topic: {req.sessionBooking.topic}
                              </p>
                              <div className="flex flex-wrap items-center gap-3 pt-1">
                                <a
                                  href={req.sessionBooking.meetingLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 font-medium text-emerald-800 hover:text-emerald-950"
                                >
                                  <Video className="h-3.5 w-3.5" aria-hidden="true" />
                                  Open Meeting Room
                                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                                </a>
                                {req.sessionBooking.status === 'requested' && (
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => handleConfirm(req.id)}
                                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-60 cursor-pointer"
                                  >
                                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                    Confirm Session
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-stone-500">
                              No call slot requested yet. The student can pick a 20-minute slot from their My Mentors tab.
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col justify-between rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] p-4 space-y-3">
                          <div className="flex items-center gap-2 text-xs font-semibold text-[#18221D]">
                            <MessageSquare
                              className="h-3.5 w-3.5 text-emerald-800"
                              aria-hidden="true"
                            />
                            <span>Direct Messages ({req.messages.length})</span>
                          </div>

                          <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
                            {req.messages.length === 0 ? (
                              <p className="text-xs text-stone-500">
                                Send a quick greeting or share prep tips below.
                              </p>
                            ) : (
                              req.messages.map((m) => (
                                <div
                                  key={m.id}
                                  className={`rounded-lg border px-3 py-2 text-xs ${
                                    m.senderRole === 'alumni'
                                      ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                                      : 'border-[#E5DFD0] bg-[#FFFEFA] text-stone-800'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2 text-[11px] text-stone-500">
                                    <span className="font-semibold text-[#18221D]">
                                      {m.senderName}
                                    </span>
                                    <span className="tabular-nums">{m.sentAt}</span>
                                  </div>
                                  <p className="mt-1 leading-relaxed">{m.text}</p>
                                </div>
                              ))
                            )}
                          </div>

                          <form
                            onSubmit={(e) => handleSend(e, req.id)}
                            className="flex items-center gap-2 pt-1"
                          >
                            <input
                              type="text"
                              value={draftMessages[req.id] ?? ''}
                              onFocus={() => {
                                if (req.unreadCount > 0) void onMarkRead(req.id);
                              }}
                              onChange={(e) =>
                                setDraftMessages((prev) => ({
                                  ...prev,
                                  [req.id]: e.target.value,
                                }))
                              }
                              placeholder="Reply to student..."
                              className="flex-1 rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-xs focus:border-emerald-700 focus:outline-none"
                            />
                            <button
                              type="submit"
                              disabled={busy}
                              aria-label="Send message"
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-800 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-60 cursor-pointer"
                            >
                              <Send className="h-3.5 w-3.5" aria-hidden="true" />
                              Send
                            </button>
                          </form>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {declinedRequests.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-display text-base font-semibold text-[#18221D]">
                Declined Requests ({declinedRequests.length})
              </h2>
              <div className="divide-y divide-[#EEE9DC] rounded-xl border border-[#E5DFD0] bg-[#FFFEFA]">
                {declinedRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-sm font-semibold text-[#18221D]">
                          {req.studentName}
                        </span>
                        <span className="text-xs text-stone-500 tabular-nums">
                          {req.studentUsn} · Sem {req.studentSemester} {req.studentBranch}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-stone-600">
                        {req.goal} — &ldquo;{req.message}&rdquo;
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-1 rounded-md border border-[#E5DFD0] bg-[#F3EFE4] px-2.5 py-1 text-xs font-medium text-stone-600 shrink-0">
                      <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      Declined
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
