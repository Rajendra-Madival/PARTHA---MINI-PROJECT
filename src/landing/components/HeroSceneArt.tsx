import type { CSSProperties, RefObject } from 'react';

// ART: PLACEHOLDER — replace with designer SVG (Hero Layer 3: Gopuram & Banyan silhouettes)
export function HeroSilhouettesSvg({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none relative w-full flex items-end justify-between ${className}`}
    >
      {/* Banyan tree canopy & aerial roots anchored on left across all widths */}
      <svg
        viewBox="0 0 360 240"
        preserveAspectRatio="xMinYMax meet"
        data-hero-silhouette="banyan"
        className="w-[165px] sm:w-[260px] md:w-[340px] h-auto shrink-0"
      >
        <defs>
          <linearGradient id="hero-banyan-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14382A" stopOpacity="0.86" />
            <stop offset="100%" stopColor="#0B1026" stopOpacity="0.96" />
          </linearGradient>
        </defs>
        <path
          d="M142 240V152C142 128 148 114 160 104H188C198 116 204 130 204 152V240Z"
          fill="url(#hero-banyan-grad)"
        />
        <path
          d="M78 148C40 146 18 122 28 94C38 70 70 60 100 68C118 38 160 26 200 38C236 28 278 44 294 74C326 76 348 102 338 128C328 150 296 156 268 150C238 160 200 158 170 152C140 158 104 156 78 148Z"
          fill="url(#hero-banyan-grad)"
          stroke="#D4AF37"
          strokeOpacity="0.24"
          strokeWidth="1.2"
        />
        <path
          d="M74 146V240M106 150V240M236 150V240M274 148V240"
          stroke="#14382A"
          strokeWidth="3"
          strokeOpacity="0.72"
        />
      </svg>

      {/* Distant temple gopuram silhouette anchored on right across all widths */}
      <svg
        viewBox="0 0 380 240"
        preserveAspectRatio="xMaxYMax meet"
        data-hero-silhouette="gopuram"
        className="w-[155px] sm:w-[250px] md:w-[340px] h-auto shrink-0"
      >
        <defs>
          <linearGradient id="hero-gopuram-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14382A" stopOpacity="0.86" />
            <stop offset="100%" stopColor="#0B1026" stopOpacity="0.96" />
          </linearGradient>
        </defs>
        <path
          d="M20 240H360M44 240V196H104V240M276 240V196H336V240M114 240V172H266V240M134 172V132H246V172M152 132V96H228V132M166 96V66H214V96M176 66L190 38L204 66Z"
          fill="url(#hero-gopuram-grad)"
          stroke="#D4AF37"
          strokeOpacity="0.28"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path
          d="M172 240V190C172 178 180 170 190 170C200 170 208 178 208 190V240"
          fill="#0B1026"
          fillOpacity="0.88"
          stroke="#D4AF37"
          strokeOpacity="0.34"
          strokeWidth="1.1"
        />
        <path d="M190 26V38" stroke="#D4AF37" strokeOpacity="0.42" strokeWidth="1.2" />
      </svg>
    </div>
  );
}

// ART: PLACEHOLDER — replace with designer SVG (Hero Layer 5: Generic Chariot + two horses + wheel group)
export function ChariotSvg({
  wheelRef,
  className = '',
}: {
  wheelRef?: RefObject<SVGGElement | null>;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 260 120"
      className={className}
      fill="none"
    >
      {/* Yoke pole & reins */}
      <path
        d="M112 76L172 64M110 62L168 48"
        stroke="#D4AF37"
        strokeWidth="1.4"
        strokeOpacity="0.65"
        strokeLinecap="round"
      />

      {/* Two generic horses pulling right */}
      <g data-chariot-part="horses">
        {/* Back horse silhouette */}
        <path
          d="M168 72C176 58 192 54 206 58L216 40C220 35 228 36 232 42L236 52L224 58L218 72L228 96H222L210 78H186L174 96H168L176 76Z"
          fill="#1B1F4B"
          stroke="#D4AF37"
          strokeWidth="1"
          strokeOpacity="0.45"
        />
        {/* Lead horse silhouette */}
        <path
          d="M178 76C188 60 206 56 220 60L232 42C236 37 244 38 248 45L252 54L240 60L234 74L246 98H239L226 80H198L186 98H179L188 78Z"
          fill="#141838"
          stroke="#D4AF37"
          strokeWidth="1.2"
          strokeOpacity="0.68"
        />
      </g>

      {/* Generic chariot (ratha) carriage body */}
      <g data-chariot-part="body">
        <path
          d="M16 82H116L108 54C104 42 94 36 80 36H34C24 36 18 44 16 56Z"
          fill="#1B1F4B"
          stroke="#D4AF37"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M28 82V48H102M46 48V82M82 48V82"
          stroke="#B5652B"
          strokeWidth="1.4"
          strokeOpacity="0.85"
        />
        {/* Plain vertical banner mast (dhvaja, no symbol) */}
        <path d="M22 54V12" stroke="#D4AF37" strokeWidth="1.4" strokeLinecap="round" />
        <path
          d="M22 14L46 21L22 28Z"
          fill="#F4A21B"
          fillOpacity="0.72"
          stroke="#D4AF37"
          strokeWidth="1"
        />
      </g>

      {/* Separate animated wheel group (rotates around hub 64,86 via transform only) */}
      <g
        ref={wheelRef}
        data-chariot-wheel="true"
        style={{ transformOrigin: '64px 86px' }}
      >
        <circle cx="64" cy="86" r="22" fill="#0B1026" stroke="#D4AF37" strokeWidth="2.2" />
        <circle cx="64" cy="86" r="17" stroke="#B5652B" strokeWidth="1.2" strokeOpacity="0.8" />
        <circle cx="64" cy="86" r="4" fill="#F4A21B" />
        <path
          d="M64 64V108M42 86H86M48.5 70.5L79.5 101.5M79.5 70.5L48.5 101.5"
          stroke="#D4AF37"
          strokeWidth="1.3"
          strokeOpacity="0.88"
        />
      </g>
    </svg>
  );
}

// ART: PLACEHOLDER — replace with designer SVG (Hero Layer 6: Anonymous standing archer + bow + bowstring)
export function ArcherSvg({
  bowstringRef,
  drawn = false,
  className = '',
}: {
  bowstringRef?: RefObject<SVGGElement | null>;
  drawn?: boolean;
  className?: string;
}) {
  const stringStyle: CSSProperties = {
    transform: drawn ? 'matrix(6, 0, 0, 1, -400, 0)' : 'none',
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 110 110"
      className={className}
      fill="none"
    >
      {/* Standing anonymous archer silhouette (no face detail, no crown/halo) */}
      <g data-archer-part="figure">
        {/* Subtle quiver on back */}
        <path
          d="M33 40L24 58L30 61L39 43Z"
          fill="#8C6A3B"
          stroke="#D4AF37"
          strokeWidth="1"
        />
        <circle cx="46" cy="24" r="8" fill="#0B1026" stroke="#D4AF37" strokeWidth="1.2" />
        <path
          d="M38 36C38 32 42 30 47 30C52 30 56 33 56 38L58 68L63 102H53L48 72L42 102H32L37 66Z"
          fill="#0B1026"
          stroke="#D4AF37"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        {/* Extended bow arm + drawing arm */}
        <path
          d="M52 39L78 42M48 41L62 43"
          stroke="#D4AF37"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeOpacity="0.85"
        />
      </g>

      {/* Separate bow group */}
      <g data-archer-part="bow">
        <path
          d="M80 12C95 26 95 58 80 72"
          stroke="#F4A21B"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <circle cx="80" cy="12" r="1.6" fill="#D4AF37" />
        <circle cx="80" cy="72" r="1.6" fill="#D4AF37" />
      </g>

      {/* Separate bowstring path animated via scaleX transform from bow tips (x=80) */}
      <g ref={bowstringRef} data-archer-bowstring="true" style={stringStyle}>
        <path
          d="M80 12L77.5 42L80 72"
          stroke="#F5EEDC"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </g>
    </svg>
  );
}

// ART: PLACEHOLDER — replace with designer SVG (Hero Layer 7: Flying golden arrow)
export function HeroArrowSvg({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 74 16"
      className={className}
      fill="none"
    >
      {/* Fletching */}
      <path
        d="M2 3L14 8L2 13L6 8Z"
        fill="#F4A21B"
        stroke="#F5EEDC"
        strokeWidth="0.9"
      />
      {/* Shaft */}
      <path
        d="M8 8H64"
        stroke="#F5EEDC"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Tip right at x=73, y=8 */}
      <path
        d="M61 3.5L73 8L61 12.5L64 8Z"
        fill="#F4A21B"
        stroke="#D4AF37"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
