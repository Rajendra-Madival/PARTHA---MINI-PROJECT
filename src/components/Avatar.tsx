import { useEffect, useState } from 'react';
import { createFace, FaceArt } from './kokonutui/avatar-picker';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

export function Avatar({ name, src, size = 'md' }: AvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [src]);

  const sizeClass =
    size === 'sm'
      ? 'h-9 w-9 text-xs'
      : size === 'lg'
        ? 'h-14 w-14 text-base'
        : 'h-12 w-12 text-sm';

  if (src && src.startsWith('kokonut:')) {
    const seed = src.slice('kokonut:'.length).trim() || name.toLowerCase();
    return (
      <div
        role="img"
        aria-label={`${name} avatar`}
        className={`${sizeClass} shrink-0 overflow-hidden rounded-lg border border-[#E5DFD0] bg-[#F3EFE4]`}
      >
        <FaceArt face={createFace(seed)} className="h-full w-full" />
      </div>
    );
  }

  if (src && !imgFailed) {
    return (
      <img
        src={src}
        alt={`${name} portrait`}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className={`${sizeClass} shrink-0 rounded-lg border border-[#E5DFD0] object-cover bg-[#F3EFE4]`}
      />
    );
  }

  return (
    <div
      aria-label={name}
      className={`${sizeClass} shrink-0 flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 font-display font-semibold text-emerald-800`}
    >
      {getInitials(name)}
    </div>
  );
}

