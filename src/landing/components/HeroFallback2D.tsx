interface HeroFallback2DProps {
  scrollProgress: number;
  reducedMotion: boolean;
  is3DReady: boolean;
}

const FALLBACK_STARS = Array.from({ length: 42 }, (_, idx) => ({
  id: idx,
  cx: ((idx * 173 + 47) % 1380) + 30,
  cy: ((idx * 97 + 29) % 540) + 24,
  r: (idx % 3 === 0 ? 1.8 : 1.1),
  opacity: 0.28 + (idx % 5) * 0.12,
}));

export function HeroFallback2D({
  scrollProgress,
  reducedMotion,
  is3DReady,
}: HeroFallback2DProps) {
  // Section 6.1: Gopuram moves at 0.4x scroll speed inside the fixed viewport layer
  const gopuramOffsetVh = reducedMotion ? 0 : -scrollProgress * 40;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Layer 1: Sky gradient SVG + static star points */}
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        data-hero-layer="sky"
      >
        <defs>
          <linearGradient id="hero-sky-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0B1026" />
            <stop offset="58%" stopColor="#13183E" />
            <stop offset="100%" stopColor="#1B1F4B" />
          </linearGradient>
          <radialGradient id="hero-sky-aura" cx="50%" cy="62%" r="48%">
            <stop offset="0%" stopColor="#F4A21B" stopOpacity="0.16" />
            <stop offset="45%" stopColor="#FF7A1A" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#0B1026" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1440" height="900" fill="url(#hero-sky-gradient)" />
        <rect width="1440" height="900" fill="url(#hero-sky-aura)" />
        <g
          className="transition-opacity duration-500"
          style={{ opacity: is3DReady ? 0 : 1 }}
        >
          {FALLBACK_STARS.map((star) => (
            <circle
              key={star.id}
              cx={star.cx}
              cy={star.cy}
              r={star.r}
              fill={star.id % 4 === 0 ? '#D4AF37' : '#FFF6E3'}
              fillOpacity={star.opacity}
            />
          ))}
        </g>
      </svg>

      {/* Layer 2: Gopuram silhouette SVG (always 2D SVG, 0.4x scroll speed) */}
      <div
        data-hero-layer="gopuram"
        className="absolute inset-x-0 bottom-0 flex justify-center will-change-transform"
        style={{
          transform: `translate3d(0, ${gopuramOffsetVh}vh, 0)`,
        }}
      >
        <svg
          viewBox="0 0 1200 320"
          preserveAspectRatio="xMidYMax meet"
          className="w-full max-w-6xl h-[220px] sm:h-[280px] md:h-[320px]"
        >
          <defs>
            <linearGradient id="hero-gopuram-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#12173A" stopOpacity="0.72" />
              <stop offset="100%" stopColor="#0B1026" stopOpacity="0.92" />
            </linearGradient>
          </defs>
          {/* Outer temple silhouette */}
          <path
            d="M40 320H1160M170 320V268H260V320M940 320V268H1030V320M310 320V236H890V320M365 236V180H835V236M420 180V130H780V180M472 130V86H728V130M524 86V52H676V86M560 52L600 16L640 52Z"
            fill="url(#hero-gopuram-fill)"
            stroke="#D4AF37"
            strokeOpacity="0.26"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Central arched gateway outline */}
          <path
            d="M554 320V220C554 195 574 176 600 176C626 176 646 195 646 220V320"
            fill="#0B1026"
            fillOpacity="0.88"
            stroke="#D4AF37"
            strokeOpacity="0.34"
            strokeWidth="1.5"
          />
          {/* Kalasha finial */}
          <path
            d="M600 6V16"
            stroke="#D4AF37"
            strokeOpacity="0.45"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle
            cx="600"
            cy="26"
            r="5"
            fill="none"
            stroke="#D4AF37"
            strokeOpacity="0.38"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      {/* Layers 3 & 4 (2D Fallback): Layered Lotus + Diya Glow SVGs (visible until 3D is ready) */}
      <div
        data-hero-layer="fallback-motifs"
        className="absolute inset-x-0 bottom-[6%] sm:bottom-[8%] flex flex-col items-center justify-end transition-opacity duration-500"
        style={{ opacity: is3DReady ? 0 : 1 }}
      >
        <svg
          viewBox="0 0 360 240"
          className="w-[280px] sm:w-[340px] md:w-[380px] h-auto overflow-visible"
        >
          <defs>
            <radialGradient id="fallback-diya-glow" cx="50%" cy="76%" r="48%">
              <stop offset="0%" stopColor="#FFF6E3" stopOpacity="0.55" />
              <stop offset="28%" stopColor="#F4A21B" stopOpacity="0.32" />
              <stop offset="65%" stopColor="#FF7A1A" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#FF7A1A" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="fallback-lotus-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFD166" stopOpacity="0.32" />
              <stop offset="55%" stopColor="#F4A21B" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#FF7A1A" stopOpacity="0.14" />
            </linearGradient>
            <linearGradient id="fallback-flame-grad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#FF7A1A" stopOpacity="0.95" />
              <stop offset="55%" stopColor="#F4A21B" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#FFF6E3" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Soft diya radial glow */}
          <circle cx="180" cy="176" r="118" fill="url(#fallback-diya-glow)" />

          {/* Layered 8-petal 2D Lotus */}
          <g
            stroke="#D4AF37"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="url(#fallback-lotus-grad)"
          >
            {/* Outer wide petals */}
            <path d="M180 144C132 142 96 118 88 86C118 92 152 114 180 144Z" strokeOpacity="0.52" />
            <path d="M180 144C228 142 264 118 272 86C242 92 208 114 180 144Z" strokeOpacity="0.52" />
            {/* Mid lateral petals */}
            <path d="M180 144C144 132 118 98 118 60C144 74 166 108 180 144Z" strokeOpacity="0.68" />
            <path d="M180 144C216 132 242 98 242 60C216 74 194 108 180 144Z" strokeOpacity="0.68" />
            {/* Inner upright petals */}
            <path d="M180 144C158 120 148 82 156 46C172 68 178 106 180 144Z" strokeOpacity="0.82" />
            <path d="M180 144C202 120 212 82 204 46C188 68 182 106 180 144Z" strokeOpacity="0.82" />
            {/* Center petal */}
            <path d="M180 34C164 68 164 112 180 144C196 112 196 68 180 34Z" strokeOpacity="0.9" />
            {/* Base water ripple */}
            <path d="M128 152H232" fill="none" strokeOpacity="0.45" />
          </g>

          {/* Layered 2D Diya (bowl + glowing flame) */}
          <g transform="translate(180 184)">
            <path
              d="M0 -34C-8 -20 -8 -8 0 -1C8 -8 8 -20 0 -34Z"
              fill="url(#fallback-flame-grad)"
              stroke="#FFF6E3"
              strokeOpacity="0.7"
              strokeWidth="1.2"
            />
            <path
              d="M-32 4H32C28 20 16 28 0 28C-16 28 -28 20 -32 4Z"
              fill="#262B63"
              fillOpacity="0.85"
              stroke="#D4AF37"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M-12 28L-15 34H15L12 28"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}
