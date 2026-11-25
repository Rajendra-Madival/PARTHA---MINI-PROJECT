import type { UserRole } from '../types';

export function DiscoverySkeletonGrid({ role }: { role: UserRole }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading alumni mentors"
      className="grid grid-cols-1 gap-4 md:grid-cols-2"
    >
      <span className="sr-only">Loading alumni mentors...</span>
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <div
          key={n}
          aria-hidden="true"
          className="flex flex-col justify-between rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] p-5 motion-safe:animate-pulse"
        >
          <div>
            {/* Card header: Avatar, name/verified, role/company, batch/location + match score */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <div className="h-10 w-10 shrink-0 rounded-full bg-[#EEE9DC]" />
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-36 rounded bg-[#EEE9DC]" />
                    <div className="h-5 w-16 rounded-md bg-emerald-100/70" />
                  </div>
                  <div className="h-4 w-52 max-w-full rounded bg-[#F3EFE4]" />
                  <div className="h-3 w-36 rounded bg-[#F3EFE4]" />
                </div>
              </div>

              {role === 'student' && (
                <div className="flex items-start gap-2.5 shrink-0">
                  <div className="flex flex-col items-end gap-1">
                    <div className="h-4 w-10 rounded bg-emerald-100/70" />
                    <div className="h-2.5 w-8 rounded bg-[#F3EFE4]" />
                  </div>
                  <div className="h-8 w-8 rounded-lg border border-[#E5DFD0] bg-[#FAF7F0]" />
                </div>
              )}
            </div>

            {/* Why-matched callout */}
            <div className="mt-4 rounded-lg border border-emerald-200/70 bg-emerald-50/45 px-3.5 py-2.5 space-y-1.5">
              <div className="h-3 w-11/12 rounded bg-emerald-100/80" />
              <div className="h-3 w-2/3 rounded bg-emerald-100/60" />
            </div>

            {/* Skills & mentoring availability */}
            <div className="mt-3.5 space-y-1.5">
              <div className="h-3.5 w-4/5 rounded bg-[#F3EFE4]" />
              <div className="h-3 w-44 rounded bg-[#F3EFE4]" />
            </div>

            {/* Highlighted guide */}
            <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-[#EEE9DC] pt-3">
              <div className="h-3.5 w-56 rounded bg-[#F3EFE4]" />
              <div className="h-3.5 w-10 rounded bg-[#EEE9DC]" />
            </div>
          </div>

          {/* Gated contact & CTA bar */}
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#EEE9DC] pt-3.5">
            <div className="flex items-center gap-2">
              <div className="h-5 w-16 rounded-md bg-[#EEE9DC]" />
              <div className="h-3 w-32 rounded bg-[#F3EFE4]" />
            </div>
            {role === 'student' && (
              <div className="h-8 w-36 rounded-lg bg-emerald-800/15" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function OpportunitiesSkeletonGrid() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading opportunities"
      className="grid grid-cols-1 gap-4 lg:grid-cols-2"
    >
      <span className="sr-only">Loading opportunities...</span>
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <div
          key={n}
          aria-hidden="true"
          className="flex flex-col justify-between rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] p-5 motion-safe:animate-pulse"
        >
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2 flex-1 min-w-0">
                <div className="h-3 w-48 max-w-full rounded bg-[#F3EFE4]" />
                <div className="h-5 w-60 max-w-full rounded bg-[#EEE9DC]" />
                <div className="h-4 w-32 rounded bg-[#F3EFE4]" />
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="h-7 w-24 rounded-md border border-[#E5DFD0] bg-[#FAF7F0]" />
                <div className="h-7 w-7 rounded-lg border border-[#E5DFD0] bg-[#FAF7F0]" />
              </div>
            </div>

            <div className="mt-3.5 space-y-2">
              <div className="h-3.5 w-full rounded bg-[#F3EFE4]" />
              <div className="h-3.5 w-5/6 rounded bg-[#F3EFE4]" />
            </div>

            <div className="mt-3.5 h-3 w-52 rounded bg-[#F3EFE4]" />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#EEE9DC] pt-3.5">
            <div className="space-y-1.5">
              <div className="h-3 w-36 rounded bg-[#F3EFE4]" />
              <div className="h-3 w-48 rounded bg-[#F3EFE4]" />
            </div>
            <div className="h-8 w-24 rounded-lg bg-emerald-800/15" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function GuidesSkeletonList() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading prep guides"
      className="divide-y divide-[#EEE9DC] rounded-xl border border-[#E5DFD0] bg-[#FFFEFA]"
    >
      <span className="sr-only">Loading prep guides...</span>
      {[1, 2, 3, 4].map((n) => (
        <div
          key={n}
          aria-hidden="true"
          className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between motion-safe:animate-pulse"
        >
          <div className="space-y-2 flex-1 min-w-0">
            <div className="h-3 w-44 rounded bg-[#F3EFE4]" />
            <div className="h-5 w-72 max-w-full rounded bg-[#EEE9DC]" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-full rounded bg-[#F3EFE4]" />
              <div className="h-3.5 w-4/5 rounded bg-[#F3EFE4]" />
            </div>
            <div className="pt-1 flex items-center gap-3">
              <div className="h-3 w-52 rounded bg-[#F3EFE4]" />
              <div className="h-3 w-20 rounded bg-emerald-100/80" />
            </div>
          </div>

          <div className="h-9 w-28 shrink-0 rounded-lg border border-[#E5DFD0] bg-[#FAF7F0]" />
        </div>
      ))}
    </div>
  );
}
