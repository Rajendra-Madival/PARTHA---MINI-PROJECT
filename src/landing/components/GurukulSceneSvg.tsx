// ART: PLACEHOLDER — replace with designer SVG
// Anonymous silhouettes only (v2 Section 9): thatched hut, banyan canopy, seated guru with palm-leaf book, and three separate student groups.

export function GurukulSceneSvg({ label }: { label: string }) {
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox="0 0 720 300"
      className="w-full h-auto"
      fill="none"
    >
      {/* Ground / courtyard base */}
      <path
        d="M36 276H684"
        stroke="var(--c-forest-900)"
        strokeOpacity="0.4"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Thatched Gurukul Hut (left background) */}
      <g data-gurukul-part="hut">
        <path
          d="M54 176L134 114L214 176H54Z"
          fill="var(--c-terracotta)"
          fillOpacity="0.22"
          stroke="var(--c-bronze)"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M72 176V276H196V176"
          fill="var(--c-parchment)"
          fillOpacity="0.55"
          stroke="var(--c-bronze)"
          strokeWidth="1.6"
        />
        <path
          d="M114 276V214C114 202 123 194 134 194C145 194 154 202 154 214V276"
          fill="var(--c-forest-900)"
          fillOpacity="0.2"
          stroke="var(--c-bronze)"
          strokeWidth="1.5"
        />
      </g>

      {/* Banyan Tree Silhouette (right & canopy) */}
      <g data-gurukul-part="banyan">
        {/* Canopy */}
        <path
          d="M270 116C258 74 304 42 368 48C404 22 478 24 512 58C568 54 612 88 594 132C620 156 592 188 548 184C510 194 468 186 446 176C392 186 320 182 288 158C262 150 256 128 270 116Z"
          fill="var(--c-forest)"
          fillOpacity="0.18"
          stroke="var(--c-forest)"
          strokeWidth="1.6"
        />
        {/* Trunk & prop roots */}
        <path
          d="M448 176C454 214 452 248 440 276H496C484 248 482 214 488 176"
          fill="var(--c-bronze)"
          fillOpacity="0.28"
          stroke="var(--c-forest-900)"
          strokeWidth="1.6"
        />
        <path
          d="M342 178V276M382 178V276M546 182V276"
          stroke="var(--c-forest)"
          strokeOpacity="0.45"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>

      {/* Guru Silhouette seated on low wooden platform holding a palm-leaf book */}
      <g data-gurukul-part="guru" transform="translate(262, 182)">
        {/* Low platform */}
        <rect
          x="0"
          y="78"
          width="102"
          height="16"
          rx="4"
          fill="var(--c-terracotta)"
          fillOpacity="0.35"
          stroke="var(--c-bronze)"
          strokeWidth="1.5"
        />
        {/* Seated anonymous silhouette */}
        <circle cx="51" cy="24" r="13" fill="var(--c-forest-900)" />
        <path
          d="M26 78C28 52 36 42 51 42C66 42 74 52 76 78H26Z"
          fill="var(--c-forest-900)"
        />
        {/* Palm-leaf book in hands */}
        <path
          d="M66 56L90 50L94 60L70 66Z"
          fill="var(--c-parchment)"
          stroke="var(--c-gold)"
          strokeWidth="1.4"
        />
      </g>

      {/* Three separate Student Silhouette groups on mats */}
      {[
        { idx: 0, x: 422, y: 214 },
        { idx: 1, x: 506, y: 214 },
        { idx: 2, x: 590, y: 214 },
      ].map((stu) => (
        <g
          key={stu.idx}
          data-student-group={stu.idx}
          transform={`translate(${stu.x}, ${stu.y})`}
        >
          {/* Woven mat */}
          <rect
            x="-6"
            y="54"
            width="64"
            height="8"
            rx="3"
            fill="var(--c-terracotta)"
            fillOpacity="0.28"
            stroke="var(--c-bronze)"
            strokeWidth="1.2"
          />
          {/* Seated student silhouette */}
          <circle cx="26" cy="14" r="10" fill="var(--c-ink)" />
          <path
            d="M8 54C10 34 16 28 26 28C36 28 42 34 44 54H8Z"
            fill="var(--c-ink)"
          />
        </g>
      ))}
    </svg>
  );
}
