import type { SVGProps } from 'react';
import type { MotifName } from '../content/copy';

interface MotifProps extends SVGProps<SVGSVGElement> {
  label?: string;
}

function getA11yProps(label?: string) {
  if (label) {
    return { role: 'img' as const, 'aria-label': label };
  }
  return { 'aria-hidden': true as const };
}

// Navbar lotus-and-bow mark (v2 Section 6.0)
export function LotusBowMarkSvg({ label, className = '', ...rest }: MotifProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...getA11yProps(label)}
      {...rest}
    >
      <path d="M16 14C34 22 34 42 16 50" />
      <path d="M16 14V50" />
      <path d="M38 22C33 29 33 37 38 44C43 37 43 29 38 22Z" />
      <path d="M38 44C30 41 27 33 29 26C33 29 36 36 38 44Z" />
      <path d="M38 44C46 41 49 33 47 26C43 29 40 36 38 44Z" />
      <path d="M12 32H54" />
      <path d="M49 28L54 32L49 36" />
    </svg>
  );
}

// ART: PLACEHOLDER — replace with designer SVG (Highlight motif 1: Lamp / Diya with animatable flame)
export function DiyaSvg({ label, className = '', ...rest }: MotifProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...getA11yProps(label)}
      {...rest}
    >
      <g data-motif-part="flame">
        <path d="M32 10C26.5 18 26.5 25.5 32 30.5C37.5 25.5 37.5 18 32 10Z" />
        <path d="M32 17C30 21 30 24.5 32 27.5C34 24.5 34 21 32 17Z" />
      </g>
      <path d="M12 34H52C50 45 42 50 32 50C22 50 14 45 12 34Z" />
      <path d="M24 50L22 54H42L40 50" />
    </svg>
  );
}

// ART: PLACEHOLDER — replace with designer SVG (Highlight motif 2: Lotus with animatable petals)
export function LotusSvg({ label, className = '', ...rest }: MotifProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...getA11yProps(label)}
      {...rest}
    >
      <g data-motif-part="petals">
        <path d="M32 10C26 20 26 34 32 44C38 34 38 20 32 10Z" />
        <path d="M32 44C21 40 16 28 18 18C24 22 28 32 32 44Z" />
        <path d="M32 44C43 40 48 28 46 18C40 22 36 32 32 44Z" />
        <path d="M32 44C17 44 10 36 10 27C16 29 24 35 32 44Z" />
        <path d="M32 44C47 44 54 36 54 27C48 29 40 35 32 44Z" />
      </g>
      <path d="M18 50H46" />
      <path d="M24 54H40" />
    </svg>
  );
}

// ART: PLACEHOLDER — replace with designer SVG (Highlight motif 3: Bow with animatable bowstring & arrow)
export function BowSvg({ label, className = '', ...rest }: MotifProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...getA11yProps(label)}
      {...rest}
    >
      <path d="M22 10C38 18 38 46 22 54" />
      <g data-motif-part="bowstring">
        <path d="M22 10V54" />
        <path d="M14 32H52" />
        <path d="M46 27L52 32L46 37" />
        <path d="M14 29L18 32L14 35" />
      </g>
    </svg>
  );
}

// ART: PLACEHOLDER — replace with designer SVG (Highlight motif 4: Palm-leaf manuscript with animatable leaf)
export function PalmLeafSvg({ label, className = '', ...rest }: MotifProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...getA11yProps(label)}
      {...rest}
    >
      <g data-motif-part="leaf">
        <rect x="10" y="18" width="44" height="28" rx="4" />
        <circle cx="21" cy="32" r="2.2" />
        <circle cx="43" cy="32" r="2.2" />
        <path d="M27 26H37M26 32H38M27 38H37" />
      </g>
    </svg>
  );
}

// ART: PLACEHOLDER — replace with designer SVG (Highlight motif 5: Shield with animatable sweep)
export function ShieldSvg({ label, className = '', ...rest }: MotifProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...getA11yProps(label)}
      {...rest}
    >
      <path d="M32 10L50 17V31C50 43 42 50 32 54C22 50 14 43 14 31V17L32 10Z" />
      <path d="M32 17L43 21.5V31C43 39 38 44 32 47" strokeOpacity="0.55" />
      <path data-motif-part="sweep" d="M24 33L30 39L41 25" />
    </svg>
  );
}

// ART: PLACEHOLDER — replace with designer SVG (Highlight motif 6: Conch horn with animatable pulse)
export function ConchSvg({ label, className = '', ...rest }: MotifProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...getA11yProps(label)}
      {...rest}
    >
      <g data-motif-part="pulse">
        <path d="M32 10C43 16 48 28 44 40C41 48 35 54 28 54C20 54 16 47 18 38C20 29 24 18 32 10Z" />
        <path d="M26 24C31 24 36 27 37 33C38 38 34 43 29 43C25 43 23 39 24 35" />
        <path d="M30 33C31 33 32 34 32 36" />
      </g>
    </svg>
  );
}

export function ChakraSvg({ label, className = '', ...rest }: MotifProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...getA11yProps(label)}
      {...rest}
    >
      <circle cx="32" cy="32" r="21" />
      <circle cx="32" cy="32" r="5" />
      <path d="M32 11V27M32 37V53M11 32H27M37 32H53" />
      <path d="M17.2 17.2L28.5 28.5M35.5 35.5L46.8 46.8M46.8 17.2L35.5 28.5M28.5 35.5L17.2 46.8" />
    </svg>
  );
}

// ART: PLACEHOLDER — replace with designer SVG
export function RathaSvg({ label, className = '', ...rest }: MotifProps) {
  return (
    <svg
      viewBox="0 0 80 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...getA11yProps(label)}
      {...rest}
    >
      <path d="M16 40H56L62 28H24L16 40Z" />
      <path d="M24 28L32 14H48L54 28" />
      <path d="M40 8V14" />
      <path d="M40 8L50 11L40 14" />
      <circle cx="28" cy="46" r="10" />
      <circle cx="28" cy="46" r="2.5" />
      <path d="M28 36V56M18 46H38" />
      <circle cx="54" cy="46" r="8" />
      <circle cx="54" cy="46" r="2" />
    </svg>
  );
}

export function GopuramSvg({ label, className = '', ...rest }: MotifProps) {
  return (
    <svg
      viewBox="0 0 320 140"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...getA11yProps(label)}
      {...rest}
    >
      <path d="M20 136H300" />
      <path d="M74 136V104H246V136" />
      <path d="M92 104V78H228V104" />
      <path d="M110 78V54H210V78" />
      <path d="M128 54V34H192V54" />
      <path d="M144 34L160 12L176 34" />
      <path d="M146 136V96C146 88 152 82 160 82C168 82 174 88 174 96V136" />
      <path d="M160 6V12" />
      <circle cx="160" cy="18" r="2.5" />
      <path d="M44 136V116H74M246 116H276V136" />
    </svg>
  );
}

export function DwaraArchSvg({ label, className = '', ...rest }: MotifProps) {
  return (
    <svg
      viewBox="0 0 120 160"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...getA11yProps(label)}
      {...rest}
    >
      <path d="M16 152V64C16 32 38 14 60 14C82 14 104 32 104 64V152" />
      <path d="M26 152V66C26 40 43 24 60 24C77 24 94 40 94 66V152" />
      <path d="M10 152H110" />
      <circle cx="60" cy="10" r="3" />
    </svg>
  );
}

export function MotifIcon({
  name,
  label,
  className,
}: {
  name: MotifName;
  label?: string;
  className?: string;
}) {
  switch (name) {
    case 'lamp':
      return <DiyaSvg label={label} className={className} />;
    case 'lotus':
      return <LotusSvg label={label} className={className} />;
    case 'bow':
      return <BowSvg label={label} className={className} />;
    case 'palmLeaf':
      return <PalmLeafSvg label={label} className={className} />;
    case 'shield':
      return <ShieldSvg label={label} className={className} />;
    case 'conch':
      return <ConchSvg label={label} className={className} />;
    case 'chakra':
      return <ChakraSvg label={label} className={className} />;
    case 'ratha':
      return <RathaSvg label={label} className={className} />;
    case 'dwara':
      return <DwaraArchSvg label={label} className={className} />;
    case 'gopuram':
      return <GopuramSvg label={label} className={className} />;
  }
}
