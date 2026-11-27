import { useEffect, useRef, useState } from 'react';
import type { SceneArtworkConfig } from '../content/scenes';

export function SceneProps({
  config,
  eager = false,
}: {
  config: SceneArtworkConfig;
  eager?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(Boolean(eager));

  useEffect(() => {
    if (eager) {
      setShouldLoad(true);
      return;
    }
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [eager]);

  // Lazy preload secondary swap assets (lotus-open) when scene comes near viewport
  useEffect(() => {
    if (!shouldLoad) return;
    for (const prop of config.props) {
      if (prop.preloadExtraSrc) {
        const img = new Image();
        img.decoding = 'async';
        img.src = prop.preloadExtraSrc;
      }
    }
  }, [config.props, shouldLoad]);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      data-scene-props={config.id}
      className="pointer-events-none absolute inset-0 z-[4] overflow-hidden"
    >
      {shouldLoad &&
        config.props.map((prop) => (
          <img
            key={prop.id}
            data-prop={prop.id}
            src={prop.src}
            width={prop.width}
            height={prop.height}
            alt=""
            loading={prop.eager || eager ? 'eager' : 'lazy'}
            decoding={prop.eager || eager ? 'sync' : 'async'}
            fetchPriority={prop.eager || eager ? 'high' : undefined}
            className="pointer-events-none absolute select-none"
            style={{
              left: `${prop.xPercent}%`,
              top: `${prop.yPercent}%`,
              transform: 'translate(-50%, -100%)',
              width: prop.widthPercent !== undefined ? `${prop.widthPercent}%` : 'auto',
              minWidth: prop.minWidthPx !== undefined ? `${prop.minWidthPx}px` : undefined,
              height: prop.heightPercent !== undefined ? `${prop.heightPercent}%` : 'auto',
              aspectRatio: `${prop.width} / ${prop.height}`,
            }}
          />
        ))}

      {/* Scene 5 gate wrapper (transform-origin at doorway center 50% 65% for V3-5 zoom) */}
      {shouldLoad && config.gate && (
        <div
          data-gate-wrapper="true"
          className="pointer-events-none absolute inset-x-0 bottom-0"
          style={{
            transformOrigin: '50% 65%',
            aspectRatio: `${config.gate.closed.width} / ${config.gate.closed.height}`,
          }}
        >
          <img
            data-gate-layer="closed"
            src={config.gate.closed.src}
            srcSet={config.gate.closed.srcSet}
            sizes={config.gate.closed.sizes}
            width={config.gate.closed.width}
            height={config.gate.closed.height}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-bottom"
          />
          <img
            data-gate-layer="open"
            src={config.gate.open.src}
            srcSet={config.gate.open.srcSet}
            sizes={config.gate.open.sizes}
            width={config.gate.open.width}
            height={config.gate.open.height}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover object-bottom opacity-0"
          />
        </div>
      )}
    </div>
  );
}
