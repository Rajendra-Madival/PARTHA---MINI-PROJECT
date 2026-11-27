import { useId, useState } from 'react';
import { COPY } from '../content/copy';

export function PasswordField() {
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState('');
  const inputId = useId();

  return (
    <div>
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-[var(--c-ivory)] mb-1.5"
      >
        {COPY.login.passwordLabel}
      </label>
      <div className="relative">
        <input
          id={inputId}
          name="password"
          type={visible ? 'text' : 'password'}
          autoComplete="current-password"
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={COPY.login.passwordPlaceholder}
          className="w-full min-h-[44px] rounded-xl px-4 pr-12 py-2.5 text-base bg-[rgba(11,16,38,0.85)] text-[var(--c-ivory)] placeholder:text-[rgba(217,207,184,0.7)] border border-[rgba(212,175,55,0.4)] focus:border-[var(--c-saffron)]"
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? COPY.login.hidePasswordLabel : COPY.login.showPasswordLabel}
          aria-pressed={visible}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg text-[var(--c-ivory-dim)] hover:text-[var(--c-gold)] cursor-pointer"
        >
          {visible ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-5 h-5" aria-hidden="true">
              <path d="M3 3l18 18" strokeLinecap="round" />
              <path d="M10.58 10.58A2 2 0 0013.42 13.42" strokeLinecap="round" />
              <path d="M9.88 5.09A9.77 9.77 0 0112 4.88c5 0 9.27 3.11 10.75 7.12a11.7 11.7 0 01-3.11 4.41M6.61 6.61A11.76 11.76 0 001.25 12c1.48 4.01 5.75 7.12 10.75 7.12 1.72 0 3.36-.37 4.82-1.03" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-5 h-5" aria-hidden="true">
              <path d="M1.25 12C2.73 7.99 7 4.88 12 4.88s9.27 3.11 10.75 7.12C21.27 16.01 17 19.12 12 19.12S2.73 16.01 1.25 12z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
