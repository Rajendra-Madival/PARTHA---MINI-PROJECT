import { ThumbsUp, X } from 'lucide-react';
import type { KnowledgeGuide } from '../types';

interface GuideReaderModalProps {
  guide: KnowledgeGuide | null;
  onClose: () => void;
  onToggleUpvote: (guideId: string) => void;
}

export function GuideReaderModal({
  guide,
  onClose,
  onToggleUpvote,
}: GuideReaderModalProps) {
  if (!guide) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-reader-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/40 p-4 backdrop-blur-xs"
    >
      <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#EEE9DC] px-6 py-5">
          <div>
            <p className="text-xs font-medium text-emerald-800">
              {guide.domain}
              <span aria-hidden="true" className="mx-1.5 text-stone-300">
                ·
              </span>
              <span className="text-stone-500">{guide.readTimeMinutes} min read</span>
            </p>
            <h2
              id="guide-reader-title"
              className="mt-1 font-display text-xl font-bold text-[#18221D]"
            >
              {guide.title}
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              By {guide.authorName} ({guide.authorRole}, {guide.authorCompany} · Class of{' '}
              {guide.authorBatch}) · {guide.publishedAt}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close guide"
            className="rounded-lg p-1.5 text-stone-400 hover:bg-[#F3EFE4] hover:text-stone-700 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <p className="rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] px-4 py-3 text-sm font-medium text-[#18221D]">
            {guide.summary}
          </p>
          <p className="text-sm leading-7 text-stone-700 whitespace-pre-line">
            {guide.content}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-[#EEE9DC] px-6 py-4">
          <button
            type="button"
            onClick={() => onToggleUpvote(guide.id)}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              guide.upvotedByStudent
                ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                : 'border-[#E5DFD0] bg-[#FAF7F0] text-stone-700 hover:border-emerald-300'
            }`}
          >
            <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{guide.upvotedByStudent ? 'Upvoted' : 'Upvote Guide'}</span>
            <span className="font-mono tabular-nums">({guide.upvotes})</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-emerald-800 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-900 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
