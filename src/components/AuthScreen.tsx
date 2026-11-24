import type { User } from 'firebase/auth';
import { ExternalLink, GraduationCap, LogOut, ShieldCheck, UserCheck } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import {
  formatFirebaseAuthError,
  isEmailPasswordDisabledError,
  registerWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOutFromFirebase,
} from '../lib/firebase';
import {
  BOOTSTRAP_ADMIN_EMAIL,
  fetchUserAccount,
  isUserAdminAccount,
  registerAlumniAccount,
  registerStudentAccount,
  setupAdminAccount,
  switchUserActiveRole,
} from '../services/parthaFirestore';
import type { AuthUser, BranchCode, UserRole } from '../types';

const FIREBASE_AUTH_PROVIDERS_URL =
  'https://console.firebase.google.com/project/gen-lang-client-0110235521/authentication/providers';

interface AuthScreenProps {
  firebaseUser: User | null;
  externalError?: string | null;
  onClearExternalError?: () => void;
  onBeforeAuth?: (role: UserRole) => void;
  onProfileCreated: (user: AuthUser) => Promise<void> | void;
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

function GoogleMark() {
  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export function AuthScreen({
  firebaseUser,
  externalError,
  onClearExternalError,
  onBeforeAuth,
  onProfileCreated,
}: AuthScreenProps) {
  const [role, setRole] = useState<UserRole>('student');
  const [mode, setMode] = useState<'login' | 'register'>(() =>
    firebaseUser ? 'register' : 'login',
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [emailPasswordDisabled, setEmailPasswordDisabled] = useState(false);
  const [canSelectAdmin, setCanSelectAdmin] = useState(false);

  // Login form fields (clean Email & Password for all 3 roles)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Shared registration credentials (used when registering with Email & Password)
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Student form fields
  const [stuName, setStuName] = useState(firebaseUser?.displayName ?? '');
  const [stuUsn, setStuUsn] = useState('');
  const [stuBranch, setStuBranch] = useState<BranchCode>('CSE');
  const [stuSemester, setStuSemester] = useState(6);
  const [stuSkills, setStuSkills] = useState('Python, Machine Learning');
  const [stuDomain, setStuDomain] = useState(DOMAINS[0]);

  // Alumni form fields
  const [aluName, setAluName] = useState(firebaseUser?.displayName ?? '');
  const [aluUsn, setAluUsn] = useState('');
  const [aluGradYear, setAluGradYear] = useState(2022);
  const [aluBranch, setAluBranch] = useState<BranchCode>('CSE');
  const [aluCompany, setAluCompany] = useState('');
  const [aluRole, setAluRole] = useState('');
  const [aluDomain, setAluDomain] = useState(DOMAINS[2]);
  const [aluSkills, setAluSkills] = useState('TypeScript, React, Node.js');
  const [aluLocation, setAluLocation] = useState('Bengaluru');
  const [aluPhone, setAluPhone] = useState('');
  const [aluLinkedin, setAluLinkedin] = useState('');
  const [aluBio, setAluBio] = useState('');

  // Admin form fields
  const [adminName, setAdminName] = useState(
    firebaseUser?.displayName || 'Placement & Alumni Cell',
  );

  useEffect(() => {
    if (!firebaseUser) {
      setCanSelectAdmin(false);
      return;
    }

    setMode('register');
    setStuName((prev) => prev || firebaseUser.displayName || '');
    setAluName((prev) => prev || firebaseUser.displayName || '');
    setAdminName((prev) =>
      prev && prev !== 'Placement & Alumni Cell'
        ? prev
        : firebaseUser.displayName || 'Placement & Alumni Cell',
    );

    const isBootstrap =
      firebaseUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL;
    if (isBootstrap) {
      setCanSelectAdmin(true);
      return;
    }

    void isUserAdminAccount(firebaseUser.uid, firebaseUser.email).then(
      (allowed) => {
        setCanSelectAdmin(allowed);
      },
    );
  }, [firebaseUser]);

  function clearMessages() {
    setError(null);
    setNotice(null);
    setEmailPasswordDisabled(false);
    onClearExternalError?.();
  }

  async function finalizeExistingAccount(fbUser: User) {
    const existing = await fetchUserAccount(fbUser.uid, fbUser.email);
    if (!existing) return false;

    if (existing.isAdminAccount && existing.role !== role) {
      const switched = await switchUserActiveRole(existing, role);
      await onProfileCreated(switched);
    } else {
      await onProfileCreated(existing);
    }
    return true;
  }

  async function createProfileForUser(fbUser: User) {
    const email = fbUser.email || regEmail.trim();
    if (!email) {
      throw new Error('A valid email address is required.');
    }

    if (role === 'student') {
      const created = await registerStudentAccount(fbUser.uid, email, {
        name: stuName || fbUser.displayName || 'KLS VDIT Student',
        usn: stuUsn,
        branch: stuBranch,
        semester: stuSemester,
        targetSkills: stuSkills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        targetDomain: stuDomain,
      });
      await onProfileCreated(created);
    } else if (role === 'alumni') {
      const created = await registerAlumniAccount(fbUser.uid, email, {
        name: aluName || fbUser.displayName || 'KLS VDIT Alumnus',
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
        location: aluLocation,
        bio: aluBio,
      });
      await onProfileCreated(created);
    } else {
      if (!fbUser.emailVerified) {
        throw new Error(
          'Admin access requires a verified Google account. Click Sign out above and continue with Google.',
        );
      }
      const isAllowedAdmin = await isUserAdminAccount(fbUser.uid, email);
      if (!isAllowedAdmin) {
        throw new Error(
          'Admin access is restricted to authorized Placement Cell accounts. Choose Student or Alumni above.',
        );
      }
      const created = await setupAdminAccount(
        fbUser.uid,
        email,
        adminName || fbUser.displayName || 'Placement & Alumni Cell',
      );
      await onProfileCreated(created);
    }
  }

  async function handleEmailLoginSubmit(e: FormEvent) {
    e.preventDefault();
    clearMessages();
    setBusy(true);
    onBeforeAuth?.(role);
    try {
      const fbUser = await signInWithEmail(loginEmail, loginPassword);
      const found = await finalizeExistingAccount(fbUser);
      if (!found) {
        setMode('register');
        setNotice(
          'Signed in! Complete your profile details below to enter PARTHA.',
        );
      }
    } catch (err) {
      setEmailPasswordDisabled(isEmailPasswordDisabledError(err));
      setError(formatFirebaseAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleLogin() {
    clearMessages();
    setBusy(true);
    onBeforeAuth?.(role);
    try {
      const { user: fbUser } = await signInWithGoogle();
      const found = await finalizeExistingAccount(fbUser);
      if (!found) {
        setMode('register');
        setNotice(
          role === 'admin'
            ? 'Google account connected! Confirm your Admin name below to open the portal.'
            : 'Google account connected! Fill in your details below to complete registration.',
        );
      }
    } catch (err) {
      setError(formatFirebaseAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleRegisterWithEmailSubmit(e: FormEvent) {
    e.preventDefault();
    clearMessages();
    setBusy(true);
    onBeforeAuth?.(role);
    try {
      let activeFbUser = firebaseUser;
      if (!activeFbUser) {
        activeFbUser = await registerWithEmail(regEmail, regPassword);
      }

      const found = await finalizeExistingAccount(activeFbUser);
      if (!found) {
        await createProfileForUser(activeFbUser);
      }
    } catch (err) {
      setEmailPasswordDisabled(isEmailPasswordDisabledError(err));
      setError(formatFirebaseAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleRegisterWithGoogle() {
    clearMessages();
    setBusy(true);
    onBeforeAuth?.(role);
    try {
      const { user: fbUser } = await signInWithGoogle();
      const found = await finalizeExistingAccount(fbUser);
      if (found) return;

      if (role === 'student' && (!stuName.trim() || !stuUsn.trim())) {
        setMode('register');
        setNotice(
          'Google account connected! Enter your Name and USN above, then click Save Student Details.',
        );
        return;
      }
      if (
        role === 'alumni' &&
        (!aluName.trim() || !aluUsn.trim() || !aluCompany.trim() || !aluRole.trim())
      ) {
        setMode('register');
        setNotice(
          'Google account connected! Complete your Name, USN, Company, and Role above to submit.',
        );
        return;
      }

      await createProfileForUser(fbUser);
    } catch (err) {
      setError(formatFirebaseAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleSwitchGoogleAccount() {
    clearMessages();
    await signOutFromFirebase();
    setMode('login');
  }

  const activeError = error ?? externalError ?? null;

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
                Choose Student, Alumni, or Admin to sign in or register. You can enter your details during registration and update them anytime inside My Details.
              </p>
            </div>

            <div className="space-y-4 border-t border-[#E5DFD0] pt-5">
              <div>
                <h2 className="font-display text-sm font-semibold text-[#18221D]">
                  1. Same simple Login &amp; Register for all three roles
                </h2>
                <p className="mt-0.5 text-xs text-stone-600">
                  Separate portals for Students, Alumni Mentors, and Placement Cell Admins.
                </p>
              </div>
              <div>
                <h2 className="font-display text-sm font-semibold text-[#18221D]">
                  2. Enter your details simply
                </h2>
                <p className="mt-0.5 text-xs text-stone-600">
                  Add your USN, branch, skills, or company details during registration or edit anytime in My Details.
                </p>
              </div>
              <div>
                <h2 className="font-display text-sm font-semibold text-[#18221D]">
                  3. Privacy-gated contact details
                </h2>
                <p className="mt-0.5 text-xs text-stone-600">
                  Alumni email, WhatsApp, and LinkedIn stay protected until the alumnus accepts a mentorship request.
                </p>
              </div>
            </div>
          </div>

          {/* 3-Role Login & Register Card */}
          <div className="lg:col-span-7">
            <div className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] p-6 sm:p-7 space-y-5">
              {/* Role Tabs */}
              <div
                role="tablist"
                aria-label="Choose Account Type"
                className="grid grid-cols-3 gap-1.5 rounded-lg border border-[#E5DFD0] bg-[#F3EFE4] p-1"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={role === 'student'}
                  onClick={() => {
                    clearMessages();
                    setRole('student');
                  }}
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
                  onClick={() => {
                    clearMessages();
                    setRole('alumni');
                  }}
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
                  onClick={() => {
                    clearMessages();
                    setRole('admin');
                  }}
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

              {notice && (
                <div
                  role="status"
                  className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5 text-xs font-medium text-emerald-950"
                >
                  {notice}
                </div>
              )}

              {firebaseUser && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5 text-xs">
                  <span className="text-emerald-950">
                    Signed in as{' '}
                    <strong className="font-semibold">{firebaseUser.email}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleSwitchGoogleAccount}
                    className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:text-emerald-950 cursor-pointer"
                  >
                    <LogOut className="h-3 w-3" aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              )}

              {/* Title + Login / Register Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEE9DC] pb-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-[#18221D]">
                    {role === 'student'
                      ? mode === 'login'
                        ? 'Student Login'
                        : 'Student Registration'
                      : role === 'alumni'
                        ? mode === 'login'
                          ? 'Alumni Mentor Login'
                          : 'Alumni Registration'
                        : mode === 'login'
                          ? 'Admin Login'
                          : 'Admin Registration'}
                  </h2>
                  <p className="text-xs text-stone-500">
                    {role === 'student'
                      ? mode === 'login'
                        ? 'Sign in to discover mentors and opportunities.'
                        : 'Create your KLS VDIT student profile below.'
                      : role === 'alumni'
                        ? mode === 'login'
                          ? 'Sign in to manage student requests and post updates.'
                          : 'Enter your graduation and company details below.'
                        : 'Placement & Alumni Cell access.'}
                  </p>
                </div>

                {!firebaseUser && (
                  <div className="flex items-center gap-1 rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] p-1 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        clearMessages();
                        setMode('login');
                      }}
                      className={`rounded-md px-3 py-1 cursor-pointer transition-colors ${
                        mode === 'login'
                          ? 'bg-emerald-800 text-white'
                          : 'text-stone-600 hover:text-[#18221D]'
                      }`}
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        clearMessages();
                        setMode('register');
                      }}
                      className={`rounded-md px-3 py-1 cursor-pointer transition-colors ${
                        mode === 'register'
                          ? 'bg-emerald-800 text-white'
                          : 'text-stone-600 hover:text-[#18221D]'
                      }`}
                    >
                      Register
                    </button>
                  </div>
                )}
              </div>

              {/* Login Form — Same Clean Input Pattern as Register */}
              {mode === 'login' && !firebaseUser ? (
                <div className="space-y-4">
                  <form onSubmit={handleEmailLoginSubmit} className="space-y-3.5">
                    <div>
                      <label
                        htmlFor="login-email"
                        className="block text-xs font-semibold text-stone-700 mb-1"
                      >
                        {role === 'student'
                          ? 'Student Email'
                          : role === 'alumni'
                            ? 'Alumni Email'
                            : 'Admin Email'}
                      </label>
                      <input
                        id="login-email"
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder={
                          role === 'student'
                            ? 'student@klsvdit.edu.in'
                            : role === 'alumni'
                              ? 'senior@company.com'
                              : 'admin@klsvdit.edu.in'
                        }
                        className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2.5 text-sm focus:border-emerald-700 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="login-password"
                        className="block text-xs font-semibold text-stone-700 mb-1"
                      >
                        Password
                      </label>
                      <input
                        id="login-password"
                        type="password"
                        required
                        minLength={6}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2.5 text-sm focus:border-emerald-700 focus:outline-none"
                      />
                    </div>

                    {activeError && (
                      <div
                        role="alert"
                        className={`rounded-lg border px-3.5 py-2.5 text-xs space-y-2 ${
                          emailPasswordDisabled
                            ? 'border-amber-200 bg-amber-50/80 text-amber-950'
                            : 'border-red-200 bg-red-50 text-red-700'
                        }`}
                      >
                        <p className="font-medium leading-relaxed">{activeError}</p>
                        {emailPasswordDisabled && (
                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={handleGoogleLogin}
                              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-800 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-900 cursor-pointer"
                            >
                              Sign in with Google Now
                            </button>
                            <a
                              href={FIREBASE_AUTH_PROVIDERS_URL}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:text-emerald-950 underline"
                            >
                              Enable Email/Password in Firebase Console
                              <ExternalLink className="h-3 w-3" aria-hidden="true" />
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={busy}
                      className="w-full rounded-lg bg-emerald-800 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-60 cursor-pointer"
                    >
                      {busy
                        ? 'Signing in...'
                        : role === 'student'
                          ? 'Sign In as Student'
                          : role === 'alumni'
                            ? 'Sign In as Alumni'
                            : 'Sign In as Admin'}
                    </button>
                  </form>

                  <div className="relative flex items-center py-1">
                    <div className="flex-grow border-t border-[#E5DFD0]" />
                    <span className="mx-3 text-[11px] font-medium text-stone-400">
                      OR
                    </span>
                    <div className="flex-grow border-t border-[#E5DFD0]" />
                  </div>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleGoogleLogin}
                    className="inline-flex w-full items-center justify-center gap-2.5 rounded-lg border border-[#747775] bg-white px-4 py-2.5 text-xs font-medium text-[#1F1F1F] hover:bg-[#F7F8F9] disabled:opacity-60 cursor-pointer"
                  >
                    <GoogleMark />
                    <span>
                      Continue with Google as{' '}
                      {role === 'student'
                        ? 'Student'
                        : role === 'alumni'
                          ? 'Alumni'
                          : 'Admin'}
                    </span>
                  </button>
                </div>
              ) : (
                /* Register Form */
                <div className="space-y-4">
                  <form
                    onSubmit={handleRegisterWithEmailSubmit}
                    className="space-y-3.5"
                  >
                    {role === 'student' ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                            className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
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
                            placeholder="Python, React, ML"
                            className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                          />
                        </div>
                      </div>
                    ) : role === 'alumni' ? (
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
                            className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
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
                            City / Location
                          </label>
                          <input
                            type="text"
                            value={aluLocation}
                            onChange={(e) => setAluLocation(e.target.value)}
                            className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            WhatsApp / Phone (Gated)
                          </label>
                          <input
                            type="text"
                            value={aluPhone}
                            onChange={(e) => setAluPhone(e.target.value)}
                            placeholder="+91 98..."
                            className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                          />
                        </div>
                        <div className="sm:col-span-2">
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
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Short Bio
                          </label>
                          <textarea
                            rows={2}
                            value={aluBio}
                            onChange={(e) => setAluBio(e.target.value)}
                            placeholder="Briefly mention areas you mentor students on..."
                            className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Administrator / Placement Cell Name
                          </label>
                          <input
                            type="text"
                            required
                            value={adminName}
                            onChange={(e) => setAdminName(e.target.value)}
                            className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                          />
                        </div>
                        <p className="text-xs text-stone-600 leading-relaxed">
                          {firebaseUser && !canSelectAdmin
                            ? 'Your signed-in Google account is not on the Placement Admin list. Select Student or Alumni above.'
                            : 'Admin registration is reserved for verified Placement Cell Google accounts.'}
                        </p>
                      </div>
                    )}

                    {/* Email & Password inputs for direct registration when not signed in via Google yet */}
                    {!firebaseUser && role !== 'admin' && (
                      <div className="grid grid-cols-1 gap-3 border-t border-[#EEE9DC] pt-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Email Address
                          </label>
                          <input
                            type="email"
                            required
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            placeholder={
                              role === 'student'
                                ? 'student@klsvdit.edu.in'
                                : 'senior@company.com'
                            }
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
                            minLength={6}
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="Min 6 characters"
                            className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {activeError && (
                      <div
                        role="alert"
                        className={`rounded-lg border px-3.5 py-2.5 text-xs space-y-2 ${
                          emailPasswordDisabled
                            ? 'border-amber-200 bg-amber-50/80 text-amber-950'
                            : 'border-red-200 bg-red-50 text-red-700'
                        }`}
                      >
                        <p className="font-medium leading-relaxed">{activeError}</p>
                        {emailPasswordDisabled && !firebaseUser && (
                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={handleRegisterWithGoogle}
                              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-800 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-900 cursor-pointer"
                            >
                              Continue with Google Instead
                            </button>
                            <a
                              href={FIREBASE_AUTH_PROVIDERS_URL}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:text-emerald-950 underline"
                            >
                              Enable Email/Password in Firebase Console
                              <ExternalLink className="h-3 w-3" aria-hidden="true" />
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {(firebaseUser || role !== 'admin') && (
                      <button
                        type="submit"
                        disabled={
                          busy ||
                          (role === 'admin' &&
                            Boolean(firebaseUser) &&
                            !canSelectAdmin)
                        }
                        className="w-full rounded-lg bg-emerald-800 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-60 cursor-pointer"
                      >
                        {busy
                          ? 'Saving...'
                          : firebaseUser
                            ? role === 'student'
                              ? 'Save Student Details & Enter'
                              : role === 'alumni'
                                ? 'Submit Alumni Profile & Enter'
                                : 'Open Admin Portal'
                            : role === 'student'
                              ? 'Create Student Account'
                              : 'Submit Alumni Profile'}
                      </button>
                    )}
                  </form>

                  {!firebaseUser && (
                    <>
                      <div className="relative flex items-center py-0.5">
                        <div className="flex-grow border-t border-[#E5DFD0]" />
                        <span className="mx-3 text-[11px] font-medium text-stone-400">
                          OR
                        </span>
                        <div className="flex-grow border-t border-[#E5DFD0]" />
                      </div>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={handleRegisterWithGoogle}
                        className="inline-flex w-full items-center justify-center gap-2.5 rounded-lg border border-[#747775] bg-white px-4 py-2.5 text-xs font-medium text-[#1F1F1F] hover:bg-[#F7F8F9] disabled:opacity-60 cursor-pointer"
                      >
                        <GoogleMark />
                        <span>
                          {role === 'admin'
                            ? 'Continue with Google as Admin'
                            : 'Register with Google (saves details above)'}
                        </span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
