import {
  AlertCircle,
  ArrowRight,
  Database,
  GraduationCap,
  RefreshCw,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useState, type FormEvent } from 'react';
import { parthaApi } from '../services/api';
import type {
  AdminBootstrapStatus,
  AuthSession,
  BranchCode,
  DatabaseHealthStatus,
  UserRole,
} from '../types';

interface AuthScreenProps {
  dbHealth: DatabaseHealthStatus | null;
  bootstrapStatus: AdminBootstrapStatus | null;
  checkingConnection: boolean;
  onRetryHealth: () => Promise<void>;
  onAuthenticated: (session: AuthSession) => void;
}

const BRANCHES: BranchCode[] = ['CSE', 'ISE', 'ECE', 'ME', 'EEE'];
const DOMAINS = [
  'Machine Learning & AI',
  'Cloud & Distributed Systems',
  'Full-Stack & FinTech',
  'Embedded & Robotics',
  'Data Engineering',
  'Cybersecurity & Infra',
];

const ROLE_TABS: Array<{
  id: UserRole;
  label: string;
  icon: typeof GraduationCap;
}> = [
  { id: 'student', label: 'Student', icon: GraduationCap },
  { id: 'alumni', label: 'Alumni', icon: UserCheck },
  { id: 'admin', label: 'Admin', icon: ShieldCheck },
];

const EASE_EDITORIAL = [0.22, 1, 0.36, 1] as const;

const INPUT_CLASS =
  'h-9 w-full rounded-lg border border-[#E5DFD0] bg-white px-3 text-sm text-[#18221D] placeholder:text-stone-400 transition-colors focus:border-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-800/10';

const COMPACT_INPUT_CLASS =
  'h-9 w-full rounded-lg border border-[#E5DFD0] bg-white px-3 text-[13px] text-[#18221D] placeholder:text-stone-400 transition-colors focus:border-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-800/10';

export function AuthScreen({
  dbHealth,
  bootstrapStatus,
  checkingConnection,
  onRetryHealth,
  onAuthenticated,
}: AuthScreenProps) {
  const prefersReducedMotion = useReducedMotion();
  const [role, setRole] = useState<UserRole>('student');
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // First-run Admin Claim state
  const [claimName, setClaimName] = useState('Placement & Alumni Cell');
  const [claimEmail, setClaimEmail] = useState('');
  const [claimBranch, setClaimBranch] = useState<BranchCode>('CSE');
  const [claimPassword, setClaimPassword] = useState('');

  // Forgot password state
  const [resetStep, setResetStep] = useState<'request' | 'verify'>('request');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const [previewResetCode, setPreviewResetCode] = useState<string | null>(null);

  // Student registration state
  const [stuName, setStuName] = useState('');
  const [stuUsn, setStuUsn] = useState('');
  const [stuBranch, setStuBranch] = useState<BranchCode>('CSE');
  const [stuSemester, setStuSemester] = useState(6);
  const [stuEmail, setStuEmail] = useState('');
  const [stuSkills, setStuSkills] = useState('Python, Machine Learning');
  const [stuDomain, setStuDomain] = useState(DOMAINS[0]);
  const [stuPassword, setStuPassword] = useState('');

  // Alumni registration state
  const [aluName, setAluName] = useState('');
  const [aluUsn, setAluUsn] = useState('');
  const [aluGradYear, setAluGradYear] = useState(2022);
  const [aluBranch, setAluBranch] = useState<BranchCode>('CSE');
  const [aluCompany, setAluCompany] = useState('');
  const [aluRole, setAluRole] = useState('');
  const [aluDomain, setAluDomain] = useState(DOMAINS[2]);
  const [aluSkills, setAluSkills] = useState('TypeScript, React, Node.js');
  const [aluEmail, setAluEmail] = useState('');
  const [aluPhone, setAluPhone] = useState('');
  const [aluLinkedin, setAluLinkedin] = useState('');
  const [aluPassword, setAluPassword] = useState('');

  const dbConnected = Boolean(dbHealth?.databaseConnected);
  const needsAdminClaim =
    role === 'admin' && dbConnected && bootstrapStatus && !bootstrapStatus.hasAdmin;

  function resetForgotState() {
    setResetStep('request');
    setResetCode('');
    setResetNewPassword('');
    setResetConfirmPassword('');
    setResetNotice(null);
    setPreviewResetCode(null);
  }

  function switchAuthMode(nextMode: 'login' | 'register' | 'forgot') {
    const order: Record<'login' | 'register' | 'forgot', number> = {
      login: 0,
      register: 1,
      forgot: 2,
    };
    setSlideDirection(order[nextMode] >= order[mode] ? 1 : -1);
    setMode(nextMode);
  }

  function handleSelectRole(nextRole: UserRole) {
    setRole(nextRole);
    setSlideDirection(-1);
    setMode('login');
    setError(null);
    setLoginSuccess(null);
    setIdentifier('');
    setPassword('');
    resetForgotState();
  }

  function handleOpenForgotPassword() {
    if (role === 'admin') return;
    setError(null);
    setLoginSuccess(null);
    resetForgotState();
    setResetEmail(identifier.includes('@') ? identifier.trim() : '');
    switchAuthMode('forgot');
  }

  async function handleLoginSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const session = await parthaApi.login({
        role,
        identifier,
        password,
      });
      onAuthenticated(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  }

  async function handleClaimAdmin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const session = await parthaApi.claimAdmin({
        name: claimName,
        email: claimEmail,
        password: claimPassword,
        branch: claimBranch,
      });
      onAuthenticated(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create Admin account.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStudentRegister(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const session = await parthaApi.registerStudent({
        name: stuName,
        email: stuEmail,
        usn: stuUsn,
        branch: stuBranch,
        semester: stuSemester,
        targetSkills: stuSkills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        targetDomain: stuDomain,
        password: stuPassword,
      });
      onAuthenticated(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAlumniRegister(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const session = await parthaApi.registerAlumni({
        name: aluName,
        email: aluEmail,
        phone: aluPhone,
        linkedinUrl: aluLinkedin,
        regNumber: aluUsn,
        graduationYear: aluGradYear,
        branch: aluBranch,
        role: aluRole,
        company: aluCompany,
        domain: aluDomain,
        skills: aluSkills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        location: 'Bengaluru',
        bio: '',
        password: aluPassword,
      });
      onAuthenticated(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestResetCode(e?: FormEvent) {
    if (e) e.preventDefault();
    if (role === 'admin') return;
    setError(null);
    setLoading(true);
    try {
      const res = await parthaApi.requestPasswordReset({
        role,
        email: resetEmail,
      });
      setResetNotice(res.message);
      setPreviewResetCode(res.previewCode ?? null);
      setResetStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset code.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmReset(e: FormEvent) {
    e.preventDefault();
    if (role === 'admin') return;
    setError(null);

    if (resetNewPassword !== resetConfirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await parthaApi.resetPassword({
        role,
        email: resetEmail,
        code: resetCode,
        newPassword: resetNewPassword,
      });
      const updatedEmail = resetEmail.trim();
      resetForgotState();
      switchAuthMode('login');
      setIdentifier(updatedEmail);
      setPassword('');
      setLoginSuccess(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  }

  const isRegisterView = mode === 'register' && role !== 'admin';
  const cardWidth = isRegisterView ? 'max-w-[540px]' : 'max-w-[420px]';
  const viewKey = `${role}-${needsAdminClaim ? 'claim' : mode}-${mode === 'forgot' ? resetStep : ''}`;

  const headingTitle =
    role === 'student'
      ? mode === 'login'
        ? 'Student Sign In'
        : mode === 'register'
          ? 'Student Registration'
          : 'Reset Password'
      : role === 'alumni'
        ? mode === 'login'
          ? 'Alumni Sign In'
          : mode === 'register'
            ? 'Alumni Registration'
            : 'Reset Password'
        : needsAdminClaim
          ? 'Admin Setup'
          : 'Admin Sign In';

  const authCardContent = (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_EDITORIAL }}
      className={`pointer-events-auto relative z-10 w-full ${cardWidth} space-y-4 transition-[max-width] duration-300 ease-out`}
    >
        {/* Prominent Institutional Signature */}
        <div className="flex items-center justify-center gap-4 px-2">
          <span className="h-px flex-1 bg-[#E5DFD0]" aria-hidden="true" />
          <p className="font-display text-lg font-bold tracking-[0.22em] text-emerald-950 sm:text-xl">
            KLS VDIT
          </p>
          <span className="h-px flex-1 bg-[#E5DFD0]" aria-hidden="true" />
        </div>

        {dbHealth && !dbConnected && (
          <div
            role="status"
            className="rounded-xl border border-amber-300 bg-amber-50/95 p-3.5 text-xs text-amber-950"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <Database className="mt-0.5 h-4 w-4 shrink-0 text-amber-800" />
                <p className="leading-relaxed">
                  {dbHealth.databaseError ||
                    'Add DATABASE_URL in Settings → Secrets, then click Retry.'}
                </p>
              </div>
              <button
                type="button"
                disabled={checkingConnection}
                onClick={() => void onRetryHealth()}
                className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-[#FFFEFA] px-2.5 py-1 text-[11px] font-semibold text-amber-950 hover:bg-amber-100 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RefreshCw
                  className={`h-3 w-3 ${checkingConnection ? 'animate-spin' : ''}`}
                />
                Retry
              </button>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-[#E5DFD0] bg-[#FFFEFA]/95 p-6 shadow-[0_20px_50px_-24px_rgba(24,34,29,0.16)] backdrop-blur-md sm:p-7">
          {/* Tactile Animated Role Switcher */}
          <div
            role="tablist"
            aria-label="Choose Account Type"
            className="grid grid-cols-3 gap-1 rounded-xl border border-[#E5DFD0] bg-[#F3EFE4] p-1"
          >
            {ROLE_TABS.map((tab) => {
              const Icon = tab.icon;
              const isSelected = role === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => handleSelectRole(tab.id)}
                  className={`relative z-10 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800 ${
                    isSelected
                      ? 'text-emerald-900'
                      : 'text-stone-600 hover:text-[#18221D]'
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="auth-role-indicator"
                      transition={
                        prefersReducedMotion
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 420, damping: 34 }
                      }
                      className="absolute inset-0 -z-10 rounded-lg border border-[#E5DFD0]/80 bg-[#FFFEFA] shadow-xs"
                    />
                  )}
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 border-b border-[#EEE9DC] pb-3.5">
            <AnimatePresence mode="wait" initial={false}>
              <motion.h1
                key={headingTitle}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: EASE_EDITORIAL }}
                className="font-display text-lg font-bold tracking-tight text-[#18221D]"
              >
                {headingTitle}
              </motion.h1>
            </AnimatePresence>

            {role !== 'admin' &&
              (mode === 'forgot' ? (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setLoginSuccess(null);
                    resetForgotState();
                    switchAuthMode('login');
                  }}
                  className="text-xs font-semibold text-emerald-800 underline-offset-4 hover:text-emerald-950 hover:underline cursor-pointer whitespace-nowrap"
                >
                  Back to Sign In
                </button>
              ) : (
                <div
                  role="tablist"
                  aria-label="Authentication Mode"
                  className="inline-flex items-center rounded-lg border border-[#E5DFD0] bg-[#F3EFE4] p-0.5"
                >
                  {(
                    [
                      { id: 'login', label: 'Sign In' },
                      { id: 'register', label: 'Register' },
                    ] as const
                  ).map((item) => {
                    const active = mode === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => {
                          if (mode === item.id) return;
                          setError(null);
                          setLoginSuccess(null);
                          resetForgotState();
                          switchAuthMode(item.id);
                        }}
                        className={`relative z-10 rounded-md px-3 py-1 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                          active
                            ? 'text-emerald-900'
                            : 'text-stone-600 hover:text-[#18221D]'
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="auth-mode-indicator"
                            transition={
                              prefersReducedMotion
                                ? { duration: 0 }
                                : { type: 'spring', stiffness: 420, damping: 32 }
                            }
                            className="absolute inset-0 -z-10 rounded-md border border-[#E5DFD0]/80 bg-[#FFFEFA] shadow-xs"
                          />
                        )}
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              ))}
          </div>

          <div className="mt-4 overflow-hidden">
            <AnimatePresence mode="wait" initial={false} custom={slideDirection}>
              <motion.div
                key={viewKey}
                custom={slideDirection}
                variants={
                  prefersReducedMotion
                    ? {
                        enter: { opacity: 0 },
                        center: { opacity: 1 },
                        exit: { opacity: 0 },
                      }
                    : {
                        enter: (dir: 1 | -1) => ({
                          opacity: 0,
                          x: dir * 28,
                        }),
                        center: {
                          opacity: 1,
                          x: 0,
                        },
                        exit: (dir: 1 | -1) => ({
                          opacity: 0,
                          x: dir * -28,
                        }),
                      }
                }
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: EASE_EDITORIAL }}
                className="flex flex-col gap-4"
              >
                {needsAdminClaim ? (
                  <form onSubmit={handleClaimAdmin} className="space-y-3.5 pt-0.5">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Admin Name
                    </label>
                    <input
                      type="text"
                      required
                      value={claimName}
                      onChange={(e) => setClaimName(e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Department
                      </label>
                      <select
                        value={claimBranch}
                        onChange={(e) => setClaimBranch(e.target.value as BranchCode)}
                        className={INPUT_CLASS}
                      >
                        {BRANCHES.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={claimEmail}
                        onChange={(e) => setClaimEmail(e.target.value)}
                        placeholder="placement@klsvdit.edu.in"
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Passcode
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={claimPassword}
                      onChange={(e) => setClaimPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className={INPUT_CLASS}
                    />
                  </div>

                  {error && (
                    <p
                      className="flex items-center gap-1.5 text-xs font-medium text-red-600"
                      role="alert"
                    >
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !dbConnected}
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-emerald-900 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                  >
                    <span>{loading ? 'Setting up...' : 'Create Admin Account'}</span>
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </button>
                </form>
              ) : mode === 'login' || role === 'admin' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-3.5 pt-0.5">
                  {loginSuccess && (
                    <div
                      role="status"
                      className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-medium text-emerald-900"
                    >
                      {loginSuccess}
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="login-identifier"
                      className="block text-xs font-semibold text-stone-700 mb-1"
                    >
                      {role === 'admin' ? 'Email' : 'Email or USN'}
                    </label>
                    <input
                      id="login-identifier"
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={
                        role === 'admin' ? 'placement@klsvdit.edu.in' : 'Email or USN'
                      }
                      className={INPUT_CLASS}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label
                        htmlFor="login-password"
                        className="block text-xs font-semibold text-stone-700"
                      >
                        {role === 'admin' ? 'Passcode' : 'Password'}
                      </label>
                      {role !== 'admin' && (
                        <button
                          type="button"
                          onClick={handleOpenForgotPassword}
                          className="text-xs font-semibold text-emerald-800 underline-offset-4 hover:text-emerald-950 hover:underline cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <input
                      id="login-password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className={INPUT_CLASS}
                    />
                  </div>

                  {error && (
                    <p
                      className="flex items-center gap-1.5 text-xs font-medium text-red-600"
                      role="alert"
                    >
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !dbConnected}
                    className="group inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 text-xs font-semibold text-white transition-all hover:bg-emerald-900 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                  >
                    <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </button>
                </form>
              ) : mode === 'forgot' ? (
                resetStep === 'request' ? (
                  <form onSubmit={handleRequestResetCode} className="space-y-4">
                    <div>
                      <label
                        htmlFor="forgot-email"
                        className="block text-xs font-semibold text-stone-700 mb-1.5"
                      >
                        Registered Email
                      </label>
                      <input
                        id="forgot-email"
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={INPUT_CLASS}
                      />
                    </div>

                    {error && (
                      <p className="text-xs font-medium text-red-600" role="alert">
                        {error}
                      </p>
                    )}

                    <div className="flex gap-2.5">
                      <button
                        type="submit"
                        disabled={loading || !dbConnected}
                        className="flex-1 rounded-lg bg-emerald-800 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-emerald-900 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                      >
                        {loading ? 'Sending...' : 'Send Code'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          resetForgotState();
                          switchAuthMode('login');
                        }}
                        className="rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-[#F3EFE4] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleConfirmReset} className="space-y-4">
                    {resetNotice && (
                      <div
                        role="status"
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs text-emerald-900 space-y-1.5"
                      >
                        <p>{resetNotice}</p>
                        {previewResetCode && (
                          <div className="flex items-center justify-between gap-2 border-t border-emerald-200/80 pt-1.5">
                            <span className="font-mono font-semibold tracking-wider">
                              {previewResetCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => setResetCode(previewResetCode)}
                              className="rounded border border-emerald-300 bg-[#FFFEFA] px-2 py-0.5 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100 cursor-pointer"
                            >
                              Fill code
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="reset-email-confirm"
                          className="block text-xs font-semibold text-stone-700 mb-1"
                        >
                          Email
                        </label>
                        <input
                          id="reset-email-confirm"
                          type="email"
                          required
                          readOnly
                          value={resetEmail}
                          className="w-full rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] px-3 py-2 text-sm text-stone-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="reset-code"
                          className="block text-xs font-semibold text-stone-700 mb-1"
                        >
                          6-Digit Code
                        </label>
                        <input
                          id="reset-code"
                          type="text"
                          inputMode="numeric"
                          required
                          maxLength={6}
                          value={resetCode}
                          onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="123456"
                          className={`${COMPACT_INPUT_CLASS} font-mono tracking-widest`}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="reset-new-password"
                          className="block text-xs font-semibold text-stone-700 mb-1"
                        >
                          New Password
                        </label>
                        <input
                          id="reset-new-password"
                          type="password"
                          required
                          minLength={4}
                          value={resetNewPassword}
                          onChange={(e) => setResetNewPassword(e.target.value)}
                          className={COMPACT_INPUT_CLASS}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="reset-confirm-password"
                          className="block text-xs font-semibold text-stone-700 mb-1"
                        >
                          Confirm Password
                        </label>
                        <input
                          id="reset-confirm-password"
                          type="password"
                          required
                          minLength={4}
                          value={resetConfirmPassword}
                          onChange={(e) => setResetConfirmPassword(e.target.value)}
                          className={COMPACT_INPUT_CLASS}
                        />
                      </div>
                    </div>

                    {error && (
                      <p className="text-xs font-medium text-red-600" role="alert">
                        {error}
                      </p>
                    )}

                    <div className="flex gap-2.5">
                      <button
                        type="submit"
                        disabled={loading || !dbConnected}
                        className="flex-1 rounded-lg bg-emerald-800 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-emerald-900 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                      >
                        {loading ? 'Updating...' : 'Update Password'}
                      </button>
                      <button
                        type="button"
                        disabled={loading || !dbConnected}
                        onClick={() => handleRequestResetCode()}
                        className="rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-[#F3EFE4] disabled:opacity-60 cursor-pointer whitespace-nowrap"
                      >
                        Resend
                      </button>
                    </div>
                  </form>
                )
              ) : role === 'student' ? (
                <form onSubmit={handleStudentRegister} className="my-auto space-y-3">
                  <div className="grid grid-cols-1 gap-x-3 gap-y-2.5 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={stuName}
                        onChange={(e) => setStuName(e.target.value)}
                        className={COMPACT_INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        USN
                      </label>
                      <input
                        type="text"
                        required
                        value={stuUsn}
                        onChange={(e) => setStuUsn(e.target.value)}
                        placeholder="2VD23CS045"
                        className={`${COMPACT_INPUT_CLASS} font-mono`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Branch
                      </label>
                      <select
                        value={stuBranch}
                        onChange={(e) => setStuBranch(e.target.value as BranchCode)}
                        className={COMPACT_INPUT_CLASS}
                      >
                        {BRANCHES.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Semester
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={8}
                        value={stuSemester}
                        onChange={(e) => setStuSemester(Number(e.target.value))}
                        className={`${COMPACT_INPUT_CLASS} tabular-nums`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={stuEmail}
                        onChange={(e) => setStuEmail(e.target.value)}
                        className={COMPACT_INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        minLength={4}
                        value={stuPassword}
                        onChange={(e) => setStuPassword(e.target.value)}
                        className={COMPACT_INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Domain
                      </label>
                      <select
                        value={stuDomain}
                        onChange={(e) => setStuDomain(e.target.value)}
                        className={COMPACT_INPUT_CLASS}
                      >
                        {DOMAINS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Skills
                      </label>
                      <input
                        type="text"
                        value={stuSkills}
                        onChange={(e) => setStuSkills(e.target.value)}
                        className={COMPACT_INPUT_CLASS}
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-xs font-medium text-red-600" role="alert">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !dbConnected}
                    className="group inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 text-xs font-semibold text-white transition-all hover:bg-emerald-900 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                  >
                    <span>{loading ? 'Creating account...' : 'Register'}</span>
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleAlumniRegister} className="my-auto space-y-3">
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 sm:grid-cols-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={aluName}
                        onChange={(e) => setAluName(e.target.value)}
                        className={COMPACT_INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
                        USN
                      </label>
                      <input
                        type="text"
                        required
                        value={aluUsn}
                        onChange={(e) => setAluUsn(e.target.value)}
                        placeholder="2VD19CS014"
                        className={`${COMPACT_INPUT_CLASS} font-mono`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
                        Branch
                      </label>
                      <select
                        value={aluBranch}
                        onChange={(e) => setAluBranch(e.target.value as BranchCode)}
                        className={COMPACT_INPUT_CLASS}
                      >
                        {BRANCHES.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
                        Company
                      </label>
                      <input
                        type="text"
                        required
                        value={aluCompany}
                        onChange={(e) => setAluCompany(e.target.value)}
                        className={COMPACT_INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
                        Role
                      </label>
                      <input
                        type="text"
                        required
                        value={aluRole}
                        onChange={(e) => setAluRole(e.target.value)}
                        className={COMPACT_INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
                        Grad Year
                      </label>
                      <input
                        type="number"
                        min={1995}
                        max={2035}
                        value={aluGradYear}
                        onChange={(e) => setAluGradYear(Number(e.target.value))}
                        className={`${COMPACT_INPUT_CLASS} tabular-nums`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
                        Domain
                      </label>
                      <select
                        value={aluDomain}
                        onChange={(e) => setAluDomain(e.target.value)}
                        className={COMPACT_INPUT_CLASS}
                      >
                        {DOMAINS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
                        Skills
                      </label>
                      <input
                        type="text"
                        value={aluSkills}
                        onChange={(e) => setAluSkills(e.target.value)}
                        className={COMPACT_INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
                        Phone
                      </label>
                      <input
                        type="text"
                        value={aluPhone}
                        onChange={(e) => setAluPhone(e.target.value)}
                        placeholder="+91 98..."
                        className={COMPACT_INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={aluEmail}
                        onChange={(e) => setAluEmail(e.target.value)}
                        className={COMPACT_INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
                        LinkedIn URL
                      </label>
                      <input
                        type="url"
                        value={aluLinkedin}
                        onChange={(e) => setAluLinkedin(e.target.value)}
                        placeholder="https://linkedin.com/in/..."
                        className={COMPACT_INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        minLength={4}
                        value={aluPassword}
                        onChange={(e) => setAluPassword(e.target.value)}
                        className={COMPACT_INPUT_CLASS}
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-xs font-medium text-red-600" role="alert">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !dbConnected}
                    className="group inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 text-xs font-semibold text-white transition-all hover:bg-emerald-900 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                  >
                    <span>{loading ? 'Submitting...' : 'Register'}</span>
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </button>
                </form>
              )}

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#EEE9DC] pt-3 text-xs text-stone-500">
                  {role === 'admin' ? (
                    <>
                      <span>KLS VDIT · Placement &amp; Alumni Cell</span>
                      <span className="font-medium text-stone-600">Authorized access</span>
                    </>
                  ) : mode === 'login' ? (
                    <>
                      <span>New to KLS VDIT PARTHA?</span>
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setLoginSuccess(null);
                          resetForgotState();
                          switchAuthMode('register');
                        }}
                        className="font-semibold text-emerald-800 hover:text-emerald-950 hover:underline underline-offset-4 cursor-pointer"
                      >
                        Create account
                      </button>
                    </>
                  ) : (
                    <>
                      <span>Already have an account?</span>
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setLoginSuccess(null);
                          resetForgotState();
                          switchAuthMode('login');
                        }}
                        className="font-semibold text-emerald-800 hover:text-emerald-950 hover:underline underline-offset-4 cursor-pointer"
                      >
                        Sign in instead
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
  );

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#FAF7F0] text-[#18221D]">
      <img
        src="/assets/aistudio/24506908-d5d7-4763-8b9b-3051f12b91ef_71482280.png"
        alt="PARTHA guiding your journey chariot illustration"
        referrerPolicy="no-referrer"
        className="pointer-events-none fixed inset-0 h-full w-full select-none object-cover object-left lg:object-center"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[#FAF7F0]/75 backdrop-blur-[2px] lg:bg-gradient-to-r lg:from-transparent lg:via-[#FAF7F0]/25 lg:to-[#FAF7F0]/70 lg:backdrop-blur-none"
      />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1380px] items-center justify-center px-4 py-8 sm:px-8 lg:justify-end lg:px-14 xl:px-20">
        {authCardContent}
      </div>
    </div>
  );
}
