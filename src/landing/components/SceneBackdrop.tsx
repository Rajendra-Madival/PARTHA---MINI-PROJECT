interface SceneBackdropProps {
  gradientClass: string;
  src?: string;
  alt?: string;
}

export function SceneBackdrop({ gradientClass, src, alt = '' }: SceneBackdropProps) {
  return (
    <div
      aria-hidden={alt ? undefined : true}
      className={`pointer-events-none absolute inset-0 overflow-hidden ${gradientClass}`}
    >
      {src && (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover opacity-85"
          loading="lazy"
        />
      )}
    </div>
  );
}
