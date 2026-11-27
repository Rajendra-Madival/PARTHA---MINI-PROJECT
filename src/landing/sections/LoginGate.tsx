import { useId, useState } from 'react';
import { COPY } from '../content/copy';
import { Button } from '../components/Button';
import { DwaraArchSvg } from '../components/MotifIcons';
import { PasswordField } from '../components/PasswordField';
import { useRouter } from '../lib/router';

export function LoginGate() {
  const [email, setEmail] = useState('');
  const emailId = useId();
  const { navigate } = useRouter();

  return (
    <section
      id="login-gate"
      aria-labelledby="login-gate-heading"
      className="relative min-h-screen bg-[var(--c-night-1)] flex items-center justify-center px-5 py-24 overflow-hidden"
    >
      {/* Soft radial saffron glow behind the gate */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[540px] rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(244,162,27,0.16) 0%, rgba(255,122,26,0.06) 45%, transparent 72%)',
        }}
      />

      {/* Static temple gate arch backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20 text-[var(--c-gold)]"
      >
        <DwaraArchSvg className="w-[440px] max-w-full h-auto" />
      </div>

      {/* Login glassmorphism card: full width on mobile with 20px gutters, max 440px on tablet/desktop */}
      <div className="gate-glass-card relative z-10 w-full sm:max-w-[440px] p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
        <div className="text-center mb-6">
          <p className="font-mixed text-xs uppercase tracking-[0.14em] text-[var(--c-gold)] mb-2 m-0">
            {COPY.login.sanskritSubtitle}
          </p>
          <h2 id="login-gate-heading" className="text-3xl font-bold text-[var(--c-ivory)] mb-2">
            {COPY.login.heading}
          </h2>
          <p className="text-sm text-[var(--c-ivory-dim)] m-0 mx-auto">
            {COPY.login.subheading}
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
          noValidate
          className="space-y-4"
        >
          <div>
            <label
              htmlFor={emailId}
              className="block text-sm font-medium text-[var(--c-ivory)] mb-1.5"
            >
              {COPY.login.emailLabel}
            </label>
            <input
              id={emailId}
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={COPY.login.emailPlaceholder}
              className="w-full min-h-[44px] rounded-xl px-4 py-2.5 text-base bg-[rgba(11,16,38,0.85)] text-[var(--c-ivory)] placeholder:text-[rgba(217,207,184,0.7)] border border-[rgba(212,175,55,0.4)] focus:border-[var(--c-saffron)]"
            />
          </div>

          <PasswordField />

          <div className="flex justify-end">
            <a
              href="/forgot-password"
              onClick={(e) => {
                e.preventDefault();
                navigate('/forgot-password');
              }}
              className="inline-flex items-center min-h-[44px] text-sm text-[var(--c-gold)] hover:text-[var(--c-ivory)] underline underline-offset-4 decoration-[rgba(212,175,55,0.45)]"
            >
              {COPY.login.forgotPassword}
            </a>
          </div>

          <Button type="submit" variant="primary" fullWidth>
            {COPY.login.submitIdle}
          </Button>
        </form>

        {/* Gold hairline divider with "or" */}
        <div className="my-5 flex items-center gap-3">
          <div className="gold-divider flex-1" />
          <span className="text-xs uppercase tracking-widest text-[var(--c-ivory-dim)]">
            {COPY.login.dividerOr}
          </span>
          <div className="gold-divider flex-1" />
        </div>

        {/* Secondary auth options (static in Phase 2) */}
        <div className="space-y-3">
          <Button variant="outline" fullWidth>
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path
                fill="currentColor"
                d="M21.35 11.1H12v3.2h5.35c-.25 1.45-1.55 4.25-5.35 4.25-3.2 0-5.85-2.65-5.85-5.95s2.65-5.95 5.85-5.95c1.85 0 3.05.8 3.75 1.45l2.55-2.45C16.65 4.1 14.55 3.15 12 3.15 7.05 3.15 3.05 7.15 3.05 12.1s4 8.95 8.95 8.95c5.15 0 8.6-3.65 8.6-8.75 0-.6-.05-1.05-.15-1.2z"
              />
            </svg>
            <span>{COPY.login.googleCta}</span>
          </Button>

          <Button variant="outline" fullWidth>
            <span>{COPY.login.otpCta}</span>
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-[var(--c-ivory-dim)] m-0 mx-auto">
          {COPY.login.newSeeker}{' '}
          <a
            href="/signup"
            onClick={(e) => {
              e.preventDefault();
              navigate('/signup');
            }}
            className="inline-flex items-center min-h-[44px] font-medium text-[var(--c-saffron)] hover:text-[var(--c-ivory)] underline underline-offset-4"
          >
            {COPY.login.createAccount}
          </a>
        </p>
      </div>
    </section>
  );
}
