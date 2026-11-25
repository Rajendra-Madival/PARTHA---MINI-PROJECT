import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  Send,
  Video,
  XCircle,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { MentorshipRequest } from '../types';
import { Avatar } from './Avatar';

const AVAILABLE_SLOTS = [
  'Saturday · 5:00 PM – 5:20 PM',
  'Saturday · 7:30 PM – 7:50 PM',
  'Sunday · 11:00 AM – 11:20 AM',
  'Wednesday · 8:00 PM – 8:20 PM',
];

interface ConnectionsViewProps {
  mentorships: MentorshipRequest[];
  loading?: boolean;
  onGoToDiscover: () => void;
  onSendMessage: (requestId: string, text: string) => Promise<void>;
  onBookSession: (
    requestId: string,
    payload: { slotLabel: string; topic: string },
  ) => Promise<void>;
  onMarkRead: (requestId: string) => Promise<void>;
}

export function ConnectionsView({
  mentorships,
  loading = false,
  onGoToDiscover,
  onSendMessage,
  onBookSession,
  onMarkRead,
}: ConnectionsViewProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [draftMessages, setDraftMessages] = useState<Record<string, string>>({});
  const [selectedSlots, setSelectedSlots] = useState<Record<string, string>>({});
  const [bookingTopics, setBookingTopics] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const accepted = mentorships.filter((m) => m.status === 'accepted');
  const pendingOrDeclined = mentorships.filter((m) => m.status !== 'accepted');

  async function handleCopy(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      // Ignore clipboard failure
    }
  }

  async function handleSend(e: FormEvent, requestId: string) {
    e.preventDefault();
    const text = (draftMessages[requestId] ?? '').trim();
    if (!text) return;
    setBusyId(requestId);
    try {
      await onSendMessage(requestId, text);
      setDraftMessages((prev) => ({ ...prev, [requestId]: '' }));
    } finally {
      setBusyId(null);
    }
  }

  async function handleBook(req: MentorshipRequest) {
    const slotLabel = selectedSlots[req.id] ?? AVAILABLE_SLOTS[0];
    const topic = (bookingTopics[req.id] ?? '').trim() || req.goal;
    setBusyId(req.id);
    try {
      await onBookSession(req.id, { slotLabel, topic });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] px-6 py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-emerald-800">
            Privacy-Gated Mentorship Connections
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#18221D]">
            My Mentors
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Once an alumnus accepts your request, you can see their contact details, message them directly, and book a 20-minute 1-on-1 call.
          </p>
        </div>
        <button
          type="button"
          onClick={onGoToDiscover}
          className="rounded-lg bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900 whitespace-nowrap shrink-0 cursor-pointer"
        >
          Find More Mentors
        </button>
      </section>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] p-5 space-y-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#EEE9DC]" />
                  <div className="space-y-2">
                    <div className="h-4 w-40 rounded bg-[#EEE9DC]" />
                    <div className="h-3 w-52 rounded bg-[#F3EFE4]" />
                  </div>
                </div>
                <div className="h-6 w-28 rounded bg-[#EEE9DC]" />
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="h-32 rounded-lg bg-[#FAF7F0]" />
                <div className="h-32 rounded-lg bg-[#FAF7F0]" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <section className="space-y-4">
            <h2 className="font-display text-base font-semibold text-[#18221D]">
              Accepted Mentors ({accepted.length})
            </h2>

            {accepted.length === 0 ? (
              <div className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] px-6 py-10 text-center">
                <h3 className="font-display text-sm font-semibold text-[#18221D]">
                  No unlocked connections yet
                </h3>
                <p className="mt-1 text-xs text-stone-500">
                  Send a mentorship request from Find Mentors. Once accepted, unlocked contact details, direct chat, and call booking will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {accepted.map((req) => (
                  <article
                    key={req.id}
                    className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] p-5 space-y-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={req.alumniName}
                          src={req.alumniAvatarUrl}
                          size="md"
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-display text-base font-semibold text-[#18221D]">
                              {req.alumniName}
                            </h3>
                            {req.unreadCount > 0 && (
                              <span className="inline-flex items-center rounded-md border border-emerald-300 bg-emerald-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-900 tabular-nums">
                                {req.unreadCount} unread
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-600">
                            {req.alumniRole}, {req.alumniCompany} · Class of{' '}
                            {req.alumniGraduationYear} {req.alumniBranch}
                          </p>
                        </div>
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
                        <span className="inline-flex items-center gap-1 self-start rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 whitespace-nowrap">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Accepted · {req.goal}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      {/* Left: Unlocked Contact + 1-on-1 Session Booking */}
                      <div className="space-y-4">
                        {req.unlockedContact && (
                          <div className="rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] p-4 space-y-2">
                            <p className="text-xs font-semibold text-[#18221D]">
                              Unlocked Direct Contact
                            </p>
                            {req.unlockedContact.email && (
                              <div className="flex items-center justify-between gap-2 text-xs text-stone-700">
                                <a
                                  href={`mailto:${req.unlockedContact.email}`}
                                  className="inline-flex items-center gap-2 hover:text-emerald-800 truncate"
                                >
                                  <Mail className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                                  <span className="truncate">
                                    {req.unlockedContact.email}
                                  </span>
                                </a>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopy(`${req.id}-email`, req.unlockedContact!.email)
                                  }
                                  className="inline-flex items-center gap-1 rounded border border-[#E5DFD0] bg-[#FFFEFA] px-2 py-1 text-[11px] font-medium text-stone-600 hover:text-[#18221D] cursor-pointer"
                                >
                                  {copiedKey === `${req.id}-email` ? (
                                    <>
                                      <Check className="h-3 w-3 text-emerald-700" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3" />
                                      Copy
                                    </>
                                  )}
                                </button>
                              </div>
                            )}

                            {req.unlockedContact.phone && (
                              <div className="flex items-center justify-between gap-2 text-xs text-stone-700">
                                <a
                                  href={`tel:${req.unlockedContact.phone}`}
                                  className="inline-flex items-center gap-2 tabular-nums hover:text-emerald-800"
                                >
                                  <Phone className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                                  <span>{req.unlockedContact.phone}</span>
                                </a>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopy(`${req.id}-phone`, req.unlockedContact!.phone)
                                  }
                                  className="inline-flex items-center gap-1 rounded border border-[#E5DFD0] bg-[#FFFEFA] px-2 py-1 text-[11px] font-medium text-stone-600 hover:text-[#18221D] cursor-pointer"
                                >
                                  {copiedKey === `${req.id}-phone` ? (
                                    <>
                                      <Check className="h-3 w-3 text-emerald-700" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3" />
                                      Copy
                                    </>
                                  )}
                                </button>
                              </div>
                            )}

                            {req.unlockedContact.linkedinUrl && (
                              <div className="pt-1">
                                <a
                                  href={req.unlockedContact.linkedinUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 hover:text-emerald-950"
                                >
                                  <span>Open LinkedIn Profile</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Book a 20-min 1-on-1 Session */}
                        <div className="rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] p-4 space-y-2.5">
                          <div className="flex items-center gap-2 text-xs font-semibold text-[#18221D]">
                            <Calendar
                              className="h-3.5 w-3.5 text-emerald-800"
                              aria-hidden="true"
                            />
                            <span>1-on-1 Mentorship Call</span>
                          </div>

                          {req.sessionBooking ? (
                            <div className="space-y-2 text-xs">
                              <div className="flex items-center justify-between gap-2">
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
                                    ? 'Confirmed by Mentor'
                                    : 'Awaiting Confirmation'}
                                </span>
                              </div>
                              <p className="text-stone-600">
                                Topic: {req.sessionBooking.topic}
                              </p>
                              <a
                                href={req.sessionBooking.meetingLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 font-medium text-emerald-800 hover:text-emerald-950"
                              >
                                <Video className="h-3.5 w-3.5" aria-hidden="true" />
                                Join Meeting Room
                                <ExternalLink className="h-3 w-3" aria-hidden="true" />
                              </a>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <select
                                aria-label="Choose a time slot"
                                value={selectedSlots[req.id] ?? AVAILABLE_SLOTS[0]}
                                onChange={(e) =>
                                  setSelectedSlots((prev) => ({
                                    ...prev,
                                    [req.id]: e.target.value,
                                  }))
                                }
                                className="w-full rounded-lg border border-[#E5DFD0] bg-white px-2.5 py-1.5 text-xs text-stone-700 focus:border-emerald-700 focus:outline-none"
                              >
                                {AVAILABLE_SLOTS.map((slot) => (
                                  <option key={slot} value={slot}>
                                    {slot}
                                  </option>
                                ))}
                              </select>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={bookingTopics[req.id] ?? ''}
                                  onChange={(e) =>
                                    setBookingTopics((prev) => ({
                                      ...prev,
                                      [req.id]: e.target.value,
                                    }))
                                  }
                                  placeholder={`Topic (e.g., ${req.goal})`}
                                  className="flex-1 rounded-lg border border-[#E5DFD0] bg-white px-2.5 py-1.5 text-xs focus:border-emerald-700 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  disabled={busyId === req.id}
                                  onClick={() => handleBook(req)}
                                  className="rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-60 whitespace-nowrap cursor-pointer"
                                >
                                  Book 20-min Call
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Direct Mentorship Messages */}
                      <div className="flex flex-col justify-between rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#18221D]">
                          <div className="flex items-center gap-2">
                            <MessageSquare
                              className="h-3.5 w-3.5 text-emerald-800"
                              aria-hidden="true"
                            />
                            <span>Direct Messages ({req.messages.length})</span>
                          </div>
                        </div>

                        <div className="max-h-48 space-y-2.5 overflow-y-auto pr-1">
                          <div className="rounded-lg border border-[#E5DFD0] bg-[#FFFEFA] px-3 py-2 text-xs">
                            <p className="font-semibold text-stone-700">
                              Your initial request
                            </p>
                            <p className="mt-0.5 text-stone-600">{req.message}</p>
                          </div>

                          {req.messages.map((m) => (
                            <div
                              key={m.id}
                              className={`rounded-lg border px-3 py-2 text-xs ${
                                m.senderRole === 'student'
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
                          ))}
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
                            placeholder="Write a message or paste your GitHub/resume link..."
                            className="flex-1 rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-xs focus:border-emerald-700 focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={busyId === req.id}
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
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-base font-semibold text-[#18221D]">
              Outgoing Requests ({pendingOrDeclined.length})
            </h2>

            {pendingOrDeclined.length === 0 ? (
              <div className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] px-6 py-8 text-center text-xs text-stone-500">
                No pending mentorship requests right now.
              </div>
            ) : (
              <div className="divide-y divide-[#EEE9DC] rounded-xl border border-[#E5DFD0] bg-[#FFFEFA]">
                {pendingOrDeclined.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar
                        name={req.alumniName}
                        src={req.alumniAvatarUrl}
                        size="sm"
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-display text-sm font-semibold text-[#18221D]">
                            {req.alumniName}
                          </span>
                          <span className="text-xs text-stone-500">
                            {req.alumniRole}, {req.alumniCompany}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-stone-600">
                          <span className="font-medium text-[#18221D]">{req.goal}:</span>{' '}
                          {req.message}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="inline-flex items-center gap-1 rounded-md border border-[#E5DFD0] bg-[#FAF7F0] px-2 py-1 text-xs text-stone-600">
                        <Lock className="h-3 w-3" aria-hidden="true" />
                        Gated
                      </span>
                      {req.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md border border-[#E5DFD0] bg-[#F3EFE4] px-2.5 py-1 text-xs font-medium text-stone-600">
                          <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                          Declined
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
