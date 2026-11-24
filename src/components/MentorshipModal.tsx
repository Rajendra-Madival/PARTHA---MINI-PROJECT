import { Lock, Sparkles, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { AlumniProfile, MentorshipGoal } from '../types';
import { Avatar } from './Avatar';

const GOALS: MentorshipGoal[] = [
  'Career Guidance',
  'Resume Review',
  'Internship Referral',
  'Project Help',
];

function getTemplateMessage(goal: MentorshipGoal, alumni: AlumniProfile): string {
  const firstName = alumni.name.split(' ')[0];
  if (goal === 'Resume Review') {
    return `Hi ${firstName}, I am currently studying at KLS VDIT and preparing for upcoming roles in ${alumni.domain}. Could you share quick feedback on my 1-page resume and project bullets?`;
  }
  if (goal === 'Internship Referral') {
    return `Hi ${firstName}, I have been building projects using ${alumni.skills.slice(0, 2).join(' and ')} and am keen on internship opportunities at ${alumni.company}. I would love your guidance on applying and preparing.`;
  }
  if (goal === 'Project Help') {
    return `Hi ${firstName}, my team at KLS VDIT is working on a ${alumni.domain} project. Could we get 15 minutes of your advice on our architecture and evaluation plan?`;
  }
  return `Hi ${firstName}, I read your journey from KLS VDIT to ${alumni.company} and would be grateful for 15 minutes of career guidance on entering ${alumni.domain}.`;
}

interface MentorshipModalProps {
  alumni: AlumniProfile | null;
  onClose: () => void;
  onSubmit: (payload: {
    alumniId: string;
    goal: MentorshipGoal;
    message: string;
  }) => Promise<void>;
}

export function MentorshipModal({
  alumni,
  onClose,
  onSubmit,
}: MentorshipModalProps) {
  const [goal, setGoal] = useState<MentorshipGoal>('Career Guidance');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!alumni) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!alumni) return;
    if (message.trim().length < 12) {
      setError('Please write a brief note (at least 12 characters) explaining your goal.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        alumniId: alumni.id,
        goal,
        message: message.trim(),
      });
      setMessage('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mentorship-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/40 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-lg rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] shadow-xl">
        <div className="flex items-start justify-between border-b border-[#EEE9DC] px-6 py-4">
          <div className="flex items-center gap-3">
            <Avatar name={alumni.name} src={alumni.avatarUrl} size="sm" />
            <div>
              <h2
                id="mentorship-modal-title"
                className="font-display text-base font-semibold text-[#18221D]"
              >
                Request Mentorship from {alumni.name}
              </h2>
              <p className="text-xs text-stone-500">
                {alumni.role}, {alumni.company} · Class of {alumni.graduationYear} {alumni.branch}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-stone-400 hover:bg-[#F3EFE4] hover:text-stone-700 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-2">
              Select Mentorship Goal
            </label>
            <div className="grid grid-cols-2 gap-2">
              {GOALS.map((item) => {
                const active = goal === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setGoal(item)}
                    className={`rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition-colors cursor-pointer ${
                      active
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                        : 'border-[#E5DFD0] bg-white text-stone-700 hover:border-emerald-300'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="mentorship-message"
                className="block text-xs font-semibold text-stone-700"
              >
                Short Note to {alumni.name.split(' ')[0]}
              </label>
              <button
                type="button"
                onClick={() => setMessage(getTemplateMessage(goal, alumni))}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 cursor-pointer"
              >
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                Use starter message
              </button>
            </div>
            <textarea
              id="mentorship-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Introduce your current semester, relevant projects, and what you hope to learn regarding ${goal.toLowerCase()}...`}
              className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2.5 text-sm text-[#18221D] placeholder:text-stone-400 focus:border-emerald-700 focus:outline-none"
            />
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] px-3.5 py-2.5 text-xs text-stone-600">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-500" aria-hidden="true" />
            <span>
              Contact details remain gated until {alumni.name} accepts your request.
            </span>
          </div>

          {error && (
            <p className="text-xs font-medium text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-[#EEE9DC] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] px-4 py-2 text-xs font-medium text-stone-700 hover:bg-[#F3EFE4] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'Sending...' : 'Send Mentorship Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
