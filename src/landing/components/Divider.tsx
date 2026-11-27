import { LotusSvg } from './MotifIcons';

export function Divider({
  withLotus = false,
  className = '',
}: {
  withLotus?: boolean;
  className?: string;
}) {
  if (!withLotus) {
    return <hr className={`gold-divider ${className}`} />;
  }

  return (
    <div className={`flex items-center gap-4 ${className}`} aria-hidden="true">
      <div className="gold-divider flex-1" />
      <LotusSvg className="w-7 h-7 text-[var(--c-gold)] shrink-0 opacity-85" />
      <div className="gold-divider flex-1" />
    </div>
  );
}
