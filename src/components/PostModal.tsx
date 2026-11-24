import { X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { AuthUser, OpportunityType } from '../types';

const DOMAINS = [
  'Machine Learning & AI',
  'Cloud & Distributed Systems',
  'Full-Stack & FinTech',
  'Embedded & Robotics',
  'Data Engineering',
  'Cybersecurity & Infra',
];

interface PostModalProps {
  isOpen: boolean;
  user: AuthUser;
  defaultMode?: 'opportunity' | 'guide';
  onClose: () => void;
  onCreateOpportunity: (payload: {
    title: string;
    company: string;
    type: OpportunityType;
    domain: string;
    location: string;
    stipendOrCtc: string;
    skills: string[];
    description: string;
    applyUrl: string;
    isRemote: boolean;
  }) => Promise<void>;
  onCreateGuide: (payload: {
    title: string;
    domain: string;
    summary: string;
    content: string;
    readTimeMinutes: number;
  }) => Promise<void>;
}

export function PostModal({
  isOpen,
  user,
  defaultMode = 'opportunity',
  onClose,
  onCreateOpportunity,
  onCreateGuide,
}: PostModalProps) {
  const [mode, setMode] = useState<'opportunity' | 'guide'>(defaultMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [oppTitle, setOppTitle] = useState('');
  const [company, setCompany] = useState('');
  const [oppType, setOppType] = useState<OpportunityType>('Internship');
  const [oppDomain, setOppDomain] = useState(DOMAINS[0]);
  const [location, setLocation] = useState('Bengaluru');
  const [stipendOrCtc, setStipendOrCtc] = useState('₹60,000 / month');
  const [skillsText, setSkillsText] = useState('Python, PyTorch, Machine Learning');
  const [oppDescription, setOppDescription] = useState('');
  const [applyUrl, setApplyUrl] = useState('https://careers.google.com/students/');
  const [isRemote, setIsRemote] = useState(false);

  const [guideTitle, setGuideTitle] = useState('');
  const [guideDomain, setGuideDomain] = useState(DOMAINS[0]);
  const [guideSummary, setGuideSummary] = useState('');
  const [guideContent, setGuideContent] = useState('');
  const [readTime, setReadTime] = useState(5);

  if (!isOpen) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === 'opportunity') {
        if (!oppTitle.trim() || !oppDescription.trim()) {
          setError('Please enter a role title and description.');
          setSubmitting(false);
          return;
        }
        await onCreateOpportunity({
          title: oppTitle,
          company,
          type: oppType,
          domain: oppDomain,
          location,
          stipendOrCtc,
          skills: skillsText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          description: oppDescription,
          applyUrl,
          isRemote,
        });
        setOppTitle('');
        setOppDescription('');
      } else {
        if (!guideTitle.trim() || !guideSummary.trim() || !guideContent.trim()) {
          setError('Please enter a title, summary, and guide body.');
          setSubmitting(false);
          return;
        }
        await onCreateGuide({
          title: guideTitle,
          domain: guideDomain,
          summary: guideSummary,
          content: guideContent,
          readTimeMinutes: readTime,
        });
        setGuideTitle('');
        setGuideSummary('');
        setGuideContent('');
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to publish item.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/40 p-4 backdrop-blur-xs"
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] shadow-xl">
        <div className="flex items-center justify-between border-b border-[#EEE9DC] px-6 py-4">
          <div>
            <h2
              id="post-modal-title"
              className="font-display text-base font-semibold text-[#18221D]"
            >
              Publish to KLS VDIT Alumni Hub
            </h2>
            <p className="text-xs text-stone-500">
              Posting as {user.name} ({user.subtitle})
            </p>
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
          <div className="flex items-center gap-1 rounded-lg border border-[#E5DFD0] bg-[#F3EFE4] p-1">
            <button
              type="button"
              onClick={() => setMode('opportunity')}
              className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                mode === 'opportunity'
                  ? 'bg-[#FFFEFA] text-emerald-800 shadow-xs'
                  : 'text-stone-600 hover:text-[#18221D]'
              }`}
            >
              Share Opportunity
            </button>
            <button
              type="button"
              onClick={() => setMode('guide')}
              className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                mode === 'guide'
                  ? 'bg-[#FFFEFA] text-emerald-800 shadow-xs'
                  : 'text-stone-600 hover:text-[#18221D]'
              }`}
            >
              Write Prep Guide
            </button>
          </div>

          {mode === 'opportunity' ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Role / Project Title
                </label>
                <input
                  type="text"
                  value={oppTitle}
                  onChange={(e) => setOppTitle(e.target.value)}
                  placeholder="e.g., Applied ML Intern — Search Quality"
                  className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Opportunity Type
                </label>
                <select
                  value={oppType}
                  onChange={(e) => setOppType(e.target.value as OpportunityType)}
                  className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                >
                  <option value="Internship">Internship</option>
                  <option value="Full-time Job">Full-time Job</option>
                  <option value="Collaborative Project">Collaborative Project</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Domain
                </label>
                <select
                  value={oppDomain}
                  onChange={(e) => setOppDomain(e.target.value)}
                  className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                >
                  {DOMAINS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Company (defaults to yours if empty)
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g., Google"
                  className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Stipend / CTC
                </label>
                <input
                  type="text"
                  value={stipendOrCtc}
                  onChange={(e) => setStipendOrCtc(e.target.value)}
                  className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Apply Link
                </label>
                <input
                  type="url"
                  value={applyUrl}
                  onChange={(e) => setApplyUrl(e.target.value)}
                  className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Required Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Description &amp; Eligibility
                </label>
                <textarea
                  rows={3}
                  value={oppDescription}
                  onChange={(e) => setOppDescription(e.target.value)}
                  placeholder="Share role scope, preferred semester/branch, and how students should apply..."
                  className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <label className="sm:col-span-2 inline-flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRemote}
                  onChange={(e) => setIsRemote(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 accent-emerald-800"
                />
                Remote or Hybrid friendly
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Guide Title
                </label>
                <input
                  type="text"
                  value={guideTitle}
                  onChange={(e) => setGuideTitle(e.target.value)}
                  placeholder="e.g., How to evaluate LLM RAG pipelines in capstone projects"
                  className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Domain Tag
                  </label>
                  <select
                    value={guideDomain}
                    onChange={(e) => setGuideDomain(e.target.value)}
                    className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                  >
                    {DOMAINS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Read Time (minutes)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={30}
                    value={readTime}
                    onChange={(e) => setReadTime(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm tabular-nums focus:border-emerald-700 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  One-Line Summary
                </label>
                <input
                  type="text"
                  value={guideSummary}
                  onChange={(e) => setGuideSummary(e.target.value)}
                  placeholder="Key takeaway students will get from reading this guide"
                  className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Guide Content
                </label>
                <textarea
                  rows={5}
                  value={guideContent}
                  onChange={(e) => setGuideContent(e.target.value)}
                  placeholder="Write actionable advice, interview patterns, or project tips..."
                  className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                />
              </div>
            </div>
          )}

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
              {submitting
                ? 'Publishing...'
                : mode === 'opportunity'
                  ? 'Publish Opportunity'
                  : 'Publish Guide'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
