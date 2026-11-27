import { useId } from 'react';

// Original geometric Rangoli border tile for section edges and card corners (v2 Section 4.6 & 10)
export function RangoliBorder({ className = '' }: { className?: string }) {
  const patternId = useId();
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none w-full h-5 ${className}`}
      preserveAspectRatio="none"
    >
      <defs>
        <pattern id={patternId} width="48" height="20" patternUnits="userSpaceOnUse">
          <path
            d="M0 10 Q12 2 24 10 T48 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeOpacity="0.45"
          />
          <circle cx="12" cy="10" r="1.8" fill="currentColor" fillOpacity="0.55" />
          <circle cx="24" cy="4.5" r="1.3" fill="currentColor" fillOpacity="0.45" />
          <circle cx="36" cy="10" r="1.8" fill="currentColor" fillOpacity="0.55" />
          <path d="M0 18H48" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.25" />
        </pattern>
      </defs>
      <rect width="100%" height="20" fill={`url(#${patternId})`} />
    </svg>
  );
}

// Original Kalamkari-inspired paisley and vine tile (v2 Section 4.6 & 10)
export function KalamkariVineTile({
  opacity = 0.07,
  className = '',
}: {
  opacity?: number;
  className?: string;
}) {
  const patternId = useId();
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 w-full h-full ${className}`}
      style={{ opacity }}
    >
      <defs>
        <pattern id={patternId} width="120" height="120" patternUnits="userSpaceOnUse">
          <path
            d="M10 120 C 35 90, 25 45, 60 20 C 85 45, 75 90, 110 120"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <path
            d="M60 20 C 66 8, 78 12, 74 24 C 71 32, 62 30, 60 20 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <path
            d="M34 74 C 18 70, 16 54, 30 52 C 38 51, 40 64, 34 74 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <path
            d="M86 68 C 102 64, 104 48, 90 46 C 82 45, 80 58, 86 68 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <circle cx="60" cy="64" r="2.2" fill="currentColor" />
          <circle cx="24" cy="24" r="1.5" fill="currentColor" />
          <circle cx="96" cy="96" r="1.5" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}

// Jharokha arch outline for framing the Gurukul scene (v2 Section 4.6 & 6.3)
export function JharokhaArchSvg({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 640 340"
      preserveAspectRatio="none"
      fill="none"
      className={`pointer-events-none ${className}`}
    >
      <path
        d="M28 332V122C28 72 78 36 168 36C236 36 286 18 320 6C354 18 404 36 472 36C562 36 612 72 612 122V332"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.65"
      />
      <path
        d="M42 332V128C42 84 88 52 172 52C236 52 284 35 320 22C356 35 404 52 468 52C552 52 598 84 598 128V332"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeOpacity="0.4"
      />
      <circle cx="320" cy="14" r="4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M16 332H624" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" />
    </svg>
  );
}

// Original circular Mandala medallion for Epic Path & Footer watermark (v2 Section 4.6 & 10)
export function MandalaMedallionSvg({ className = '' }: { className?: string }) {
  const spokes = Array.from({ length: 12 }, (_, idx) => idx * 30);
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 240 240"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      className={`pointer-events-none ${className}`}
    >
      <circle cx="120" cy="120" r="108" strokeOpacity="0.45" />
      <circle cx="120" cy="120" r="88" strokeDasharray="4 6" strokeOpacity="0.55" />
      <circle cx="120" cy="120" r="56" strokeOpacity="0.6" />
      <circle cx="120" cy="120" r="22" strokeOpacity="0.7" />
      {spokes.map((deg) => (
        <g key={deg} transform={`rotate(${deg} 120 120)`}>
          <path d="M120 12V32" strokeOpacity="0.6" />
          <path d="M120 34C128 50 128 66 120 82C112 66 112 50 120 34Z" strokeOpacity="0.48" />
          <circle cx="120" cy="96" r="2.2" fill="currentColor" fillOpacity="0.55" />
        </g>
      ))}
    </svg>
  );
}
