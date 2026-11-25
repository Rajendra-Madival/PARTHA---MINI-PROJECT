import {
  AlertCircle,
  Database,
  GraduationCap,
  RefreshCw,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
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

export function AuthScreen({
  dbHealth,
  bootstrapStatus,
  checkingConnection,
  onRetryHealth,
  onAuthenticated,
}: AuthScreenProps) {
  const [role, setRole] = useState<UserRole>('student');
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
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

  function handleSelectRole(nextRole: UserRole) {
    setRole(nextRole);
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
    setMode('forgot');
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
      setMode('login');
      setIdentifier(updatedEmail);
      setPassword('');
      setLoginSuccess(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F0] flex flex-col">
      <header className="border-b border-[#E5DFD0] bg-[#FFFEFA]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="font-display text-lg font-bold tracking-tight text-emerald-950">
            PARTHA
          </span>
          <span className="text-xs font-medium text-stone-600">
            KLS VDIT Alumni Mentorship Portal
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-10 sm:px-6">
        <div className="grid w-full grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
          {/* Plain-English Intro */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <p className="text-xs font-semibold text-emerald-800">
                KLS Vishwanathrao Deshpande Institute of Technology
              </p>
              <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#18221D] sm:text-4xl [text-wrap:balance]">
                Connect with verified seniors for career &amp; project guidance
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">
                PARTHA matches KLS VDIT students with verified alumni working across engineering teams, while keeping alumni contact details private until a request is accepted.
              </p>
            </div>

            <div className="space-y-4 border-t border-[#E5DFD0] pt-5">
              <div>
                <h2 className="font-display text-sm font-semibold text-[#18221D]">
                  1. Sign in with your role
                </h2>
                <p className="mt-0.5 text-xs text-stone-600">
                  Separate login portals for Students, Alumni Mentors, and Placement Cell Admins.
                </p>
              </div>
              <div>
                <h2 className="font-display text-sm font-semibold text-[#18221D]">
                  2. Find mentors who match your skills
                </h2>
                <p className="mt-0.5 text-xs text-stone-600">
                  See why each alumnus fits your goals, read their interview guides, and send a mentorship request.
                </p>
              </div>
              <div>
                <h2 className="font-display text-sm font-semibold text-[#18221D]">
                  3. Unlock contact when accepted
                </h2>
                <p className="mt-0.5 text-xs text-stone-600">
                  Email, phone, and LinkedIn stay protected in PostgreSQL until the alumnus clicks Accept.
                </p>
              </div>
            </div>
          </div>

          {/* 3-Role Authentication Card */}
          <div className="lg:col-span-7 space-y-4">
            {dbHealth && !dbConnected && (
              <div
                role="status"
                className="rounded-xl border border-amber-300 bg-amber-50/90 p-4 text-xs text-amber-950 space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <Database className="mt-0.5 h-4 w-4 shrink-0 text-amber-800" />
                    <div>
                      <p className="font-semibold text-amber-950">
                        Connect your Supabase PostgreSQL database
                      </p>
                      <p className="mt-0.5 text-amber-900 leading-relaxed">
                        {dbHealth.databaseError ||
                          'Add DATABASE_URL (your Supabase connection pooler URI) in AI Studio Settings → Secrets, then click Retry Connection.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={checkingConnection}
                    onClick={() => void onRetryHealth()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-[#FFFEFA] px-3 py-1.5 text-[11px] font-semibold text-amber-950 hover:bg-amber-100 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <RefreshCw
                      className={`h-3 w-3 ${checkingConnection ? 'animate-spin' : ''}`}
                    />
                    Retry Connection
                  </button>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] p-6 sm:p-7">
              <div
                role="tablist"
                aria-label="Choose Account Type"
                className="grid grid-cols-3 gap-1.5 rounded-lg border border-[#E5DFD0] bg-[#F3EFE4] p-1"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={role === 'student'}
                  onClick={() => handleSelectRole('student')}
                  className={`flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    role === 'student'
                      ? 'bg-[#FFFEFA] text-emerald-800 shadow-xs'
                      : 'text-stone-600 hover:text-[#18221D]'
                  }`}
                >
                  <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                  Student
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={role === 'alumni'}
                  onClick={() => handleSelectRole('alumni')}
                  className={`flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    role === 'alumni'
                      ? 'bg-[#FFFEFA] text-emerald-800 shadow-xs'
                      : 'text-stone-600 hover:text-[#18221D]'
                  }`}
                >
                  <UserCheck className="h-3.5 w-3.5 shrink-0" />
                  Alumni
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={role === 'admin'}
                  onClick={() => handleSelectRole('admin')}
                  className={`flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    role === 'admin'
                      ? 'bg-[#FFFEFA] text-emerald-800 shadow-xs'
                      : 'text-stone-600 hover:text-[#18221D]'
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                  Admin
                </button>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-lg font-bold text-[#18221D]">
                    {role === 'student'
                      ? mode === 'login'
                        ? 'Student Sign In'
                        : mode === 'register'
                          ? 'Create Student Account'
                          : 'Reset Student Password'
                      : role === 'alumni'
                        ? mode === 'login'
                          ? 'Alumni Mentor Sign In'
                          : mode === 'register'
                            ? 'Register as KLS VDIT Alumni'
                            : 'Reset Alumni Password'
                        : needsAdminClaim
                          ? 'Initial Placement Cell Admin Setup'
                          : 'Admin Verification Portal'}
                  </h2>
                  <p className="text-xs text-stone-500">
                    {mode === 'forgot'
                      ? 'Verify your registered email with a 6-digit code to set a new password.'
                      : needsAdminClaim
                        ? 'Create the first Placement & Alumni Cell admin account for this database.'
                        : role === 'student'
                          ? 'Use your KLS VDIT email or USN to browse mentors and opportunities.'
                          : role === 'alumni'
                            ? 'Review mentorship requests and share internships or prep guides.'
                            : 'Placement & Alumni Cell access to verify alumni and manage Google Form intake.'}
                  </p>
                </div>

                {role !== 'admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setLoginSuccess(null);
                      resetForgotState();
                      setMode(mode === 'login' ? 'register' : 'login');
                    }}
                    className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 cursor-pointer whitespace-nowrap"
                  >
                    {mode === 'login'
                      ? role === 'student'
                        ? 'New student? Register'
                        : 'New alumnus? Register'
                      : mode === 'forgot'
                        ? 'Back to Sign In'
                        : 'Already registered? Sign In'}
                  </button>
                )}
              </div>

              {needsAdminClaim ? (
                <form onSubmit={handleClaimAdmin} className="mt-5 space-y-4">
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5 text-xs text-emerald-950">
                    No Placement Cell Admin exists in Supabase PostgreSQL yet. Complete this one-time setup to claim Admin access.
                  </div>

                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Admin / Placement Cell Name
                      </label>
                      <input
                        type="text"
                        required
                        value={claimName}
                        onChange={(e) => setClaimName(e.target.value)}
                        className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Primary Department
                      </label>
                      <select
                        value={claimBranch}
                        onChange={(e) => setClaimBranch(e.target.value as BranchCode)}
                        className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2 text-sm focus:border-emerald-700 focus:outline-none"
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
                        Official Admin Email
                      </label>
                      <input
                        type="email"
                        required
                        value={claimEmail}
                        onChange={(e) => setClaimEmail(e.target.value)}
                        placeholder="placement@klsvdit.edu.in"
                        className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Admin Passcode (6+ characters)
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={claimPassword}
                        onChange={(e) => setClaimPassword(e.target.value)}
                        placeholder="Choose a strong passcode"
                        className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                      />
                    </div>
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
                    className="w-full rounded-lg bg-emerald-800 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-60 cursor-pointer"
                  >
                    {loading ? 'Setting up Admin...' : 'Claim Placement Cell Admin'}
                  </button>
                </form>
              ) : mode === 'login' || role === 'admin' ? (
                <form onSubmit={handleLoginSubmit} className="mt-5 space-y-4">
                  {loginSuccess && (
                    <div
                      role="status"
                      className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-900"
                    >
                      {loginSuccess}
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="login-identifier"
                      className="block text-xs font-semibold text-stone-700 mb-1"
                    >
                      {role === 'student'
                        ? 'College Email or USN'
                        : role === 'alumni'
                          ? 'Alumni Email or USN'
                          : 'Admin Email'}
                    </label>
                    <input
                      id="login-identifier"
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={
                        role === 'student'
                          ? 'yourname@klsvdit.edu.in or 2VD23CS001'
                          : role === 'alumni'
                            ? 'alumni@company.com or 2VD19CS014'
                            : 'placement@klsvdit.edu.in'
                      }
                      className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2.5 text-sm focus:border-emerald-700 focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label
                        htmlFor="login-password"
                        className="block text-xs font-semibold text-stone-700"
                      >
                        {role === 'admin' ? 'Admin Passcode' : 'Password'}
                      </label>
                      {role !== 'admin' && (
                        <button
                          type="button"
                          onClick={handleOpenForgotPassword}
                          className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 cursor-pointer"
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
                      placeholder="Enter your password"
                      className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2.5 text-sm focus:border-emerald-700 focus:outline-none"
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
                    className="w-full rounded-lg bg-emerald-800 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-60 cursor-pointer"
                  >
                    {loading
                      ? 'Signing in...'
                      : role === 'student'
                        ? 'Sign In as Student'
                        : role === 'alumni'
                          ? 'Sign In as Alumni'
                          : 'Sign In as Admin'}
                  </button>
                </form>
              ) : mode === 'forgot' ? (
                resetStep === 'request' ? (
                  <form onSubmit={handleRequestResetCode} className="mt-5 space-y-4">
                    <div>
                      <label
                        htmlFor="forgot-email"
                        className="block text-xs font-semibold text-stone-700 mb-1"
                      >
                        Registered {role === 'student' ? 'College' : 'Alumni'} Email
                      </label>
                      <input
                        id="forgot-email"
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder={
                          role === 'student'
                            ? 'student@klsvdit.edu.in'
                            : 'alumni@company.com'
                        }
                        className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2.5 text-sm focus:border-emerald-700 focus:outline-none"
                      />
                    </div>

                    {error && (
                      <p className="text-xs font-medium text-red-600" role="alert">
                        {error}
                      </p>
                    )}

                    <div className="flex flex-col gap-2.5 pt-1 sm:flex-row">
                      <button
                        type="submit"
                        disabled={loading || !dbConnected}
                        className="flex-1 rounded-lg bg-emerald-800 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-60 cursor-pointer"
                      >
                        {loading ? 'Sending verification code...' : 'Send Reset Code'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          resetForgotState();
                          setMode('login');
                        }}
                        className="rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-[#F3EFE4] cursor-pointer whitespace-nowrap"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleConfirmReset} className="mt-5 space-y-4">
                    {resetNotice && (
                      <div
                        role="status"
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-900 space-y-1.5"
                      >
                        <p className="font-medium">{resetNotice}</p>
                        {previewResetCode && (
                          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-emerald-200/80 pt-1.5">
                            <span>
                              Preview code:{' '}
                              <span className="font-mono font-semibold text-emerald-950 tracking-wider">
                                {previewResetCode}
                              </span>
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

                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label
                            htmlFor="reset-email-confirm"
                            className="block text-xs font-semibold text-stone-700"
                          >
                            Registered Email
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setError(null);
                              setResetStep('request');
                              setResetNotice(null);
                              setPreviewResetCode(null);
                            }}
                            className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 cursor-pointer"
                          >
                            Change
                          </button>
                        </div>
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
                          6-Digit Verification Code
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
                          className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm font-mono tracking-widest focus:border-emerald-700 focus:outline-none"
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
                          placeholder="At least 4 characters"
                          className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="reset-confirm-password"
                          className="block text-xs font-semibold text-stone-700 mb-1"
                        >
                          Confirm New Password
                        </label>
                        <input
                          id="reset-confirm-password"
                          type="password"
                          required
                          minLength={4}
                          value={resetConfirmPassword}
                          onChange={(e) => setResetConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                        />
                      </div>
                    </div>

                    {error && (
                      <p className="text-xs font-medium text-red-600" role="alert">
                        {error}
                      </p>
                    )}

                    <div className="flex flex-col gap-2.5 pt-1 sm:flex-row">
                      <button
                        type="submit"
                        disabled={loading || !dbConnected}
                        className="flex-1 rounded-lg bg-emerald-800 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-60 cursor-pointer"
                      >
                        {loading ? 'Updating password...' : 'Update Password'}
                      </button>
                      <button
                        type="button"
                        disabled={loading || !dbConnected}
                        onClick={() => handleRequestResetCode()}
                        className="rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-[#F3EFE4] disabled:opacity-60 cursor-pointer whitespace-nowrap"
                      >
                        Resend code
                      </button>
                    </div>
                  </form>
                )
              ) : role === 'student' ? (
                <form onSubmit={handleStudentRegister} className="mt-5 space-y-3.5">
                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={stuName}
                        onChange={(e) => setStuName(e.target.value)}
                        placeholder="e.g., Priya Patil"
                        className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        KLS VDIT USN
                      </label>
                      <input
                        type="text"
                        required
                        value={stuUsn}
                        onChange={(e) => setStuUsn(e.target.value)}
                        placeholder="e.g., 2VD23CS045"
                        className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm font-mono focus:border-emerald-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Branch
                      </label>
                      <select
                        value={stuBranch}
                        onChange={(e) => setStuBranch(e.target.value as BranchCode)}
                        className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
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
                        className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm tabular-nums focus:border-emerald-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        College Email
                      </label>
                      <input
                        type="email"
                        required
                        value={stuEmail}
                        onChange={(e) => setStuEmail(e.target.value)}
                        placeholder="student@klsvdit.edu.in"
                        className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
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
                        className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Interest Domain
                      </label>
                      <select
                        value={stuDomain}
                        onChange={(e) => setStuDomain(e.target.value)}
                        className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
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
                        Skills You Want to Learn
                      </label>
                      <input
                        type="text"
                        value={stuSkills}
                        onChange={(e) => setStuSkills(e.target.value)}
                        className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
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
                    className="w-full rounded-lg bg-emerald-800 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-60 cursor-pointer"
                  >
                    {loading ? 'Creating account...' : 'Create Student Account'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleAlumniRegister} className="mt-5 space-y-3.5">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={aluName}
                        onChange={(e) => setAluName(e.target.value)}
                        placeholder="e.g., Siddharth Rao"
                        className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        KLS VDIT USN
                      </label>
                      <input
                        type="text"
                        required
                        value={aluUsn}
                        onChange={(e) => setAluUsn(e.target.value)}
                        placeholder="e.g., 2VD18CS022"
                        className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm font-mono focus:border-emerald-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Company
                      </label>
                      <input
                        type="text"
                        required
                        value={aluCompany}
                        onChange={(e) => setAluCompany(e.target.value)}
                        placeholder="e.g., Flipkart"
                        className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Current Role
                      </label>
                      <input
                        type="text"
                        required
                        value={aluRole}
                        onChange={(e) => setAluRole(e.target.value)}
                        placeholder="e.g., SDE II"
                        className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Graduation Year
                      </label>
                      <input
                        type="number"
                        min={1995}
                        max={2035}
                        value={aluGradYear}
                        onChange={(e) => setAluGradYear(Number(e.target.value))}
                        className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm tabular-nums focus:border-emerald-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Branch
                      </label>
                      <select
                        value={aluBranch}
                        onChange={(e) => setAluBranch(e.target.value as BranchCode)}
                        className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
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
                        Domain
                      </label>
                      <select
                        value={aluDomain}
                        onChange={(e) => setAluDomain(e.target.value)}
                        className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
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
                        Skills (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={aluSkills}
                        onChange={(e) => setAluSkills(e.target.value)}
                        className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Email (Gated until you accept)
                      </label>
                      <input
                        type="email"
                        required
                        value={aluEmail}
                        onChange={(e) => setAluEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Phone (Gated)
                      </label>
                      <input
                        type="text"
                        value={aluPhone}
                        onChange={(e) => setAluPhone(e.target.value)}
                        placeholder="+91 98..."
                        className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        LinkedIn URL (Gated)
                      </label>
                      <input
                        type="url"
                        value={aluLinkedin}
                        onChange={(e) => setAluLinkedin(e.target.value)}
                        placeholder="https://linkedin.com/in/..."
                        className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
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
                        value={aluPassword}
                        onChange={(e) => setAluPassword(e.target.value)}
                        className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-500">
                    New alumni accounts enter the Admin Verification Queue so Placement Cell can verify KLS VDIT details before listing.
                  </p>

                  {error && (
                    <p className="text-xs font-medium text-red-600" role="alert">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !dbConnected}
                    className="w-full rounded-lg bg-emerald-800 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-60 cursor-pointer"
                  >
                    {loading ? 'Submitting registration...' : 'Register for Verification'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
