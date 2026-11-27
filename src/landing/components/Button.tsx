import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'outline';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'text-[var(--c-night-0)] font-semibold bg-[linear-gradient(135deg,var(--c-saffron),var(--c-marigold))] shadow-[0_0_24px_rgba(244,162,27,0.25)] hover:shadow-[0_0_32px_rgba(244,162,27,0.45)]',
  ghost: 'landing-btn-ghost border',
  outline: 'landing-btn-outline border',
};

export function Button({
  variant = 'primary',
  fullWidth = false,
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        'inline-flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] px-5 py-2.5 rounded-xl',
        'text-[15px] tracking-wide cursor-pointer select-none',
        'transition-colors duration-200 active:scale-[0.98]',
        'disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100',
        VARIANT_CLASSES[variant],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
