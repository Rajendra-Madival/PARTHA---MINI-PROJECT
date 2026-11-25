import {
  BadgeCheck,
  Check,
  Clock,
  Lock,
  Save,
  UserCircle2,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { parthaApi } from '../services/api';
import type {
  AlumniProfile,
  AuthUser,
  BranchCode,
  StudentTargetProfile,
} from '../types';
import { DomainSelect } from './DomainSelect';
import { ProfileAvatarEditor } from './ProfileAvatarEditor';
import { SkillPicker } from './SkillPicker';
import { DOMAINS, MENTORSHIP_GOALS } from './profileOptions';

const BRANCHES: BranchCode[] = ['CSE', 'ISE', 'ECE', 'ME', 'EEE'];

interface ProfileDetailsViewProps {
  user: AuthUser;
  studentProfile: StudentTargetProfile;
  alumniProfile?: AlumniProfile;
  onSaveStudent: (updates: Partial<StudentTargetProfile>) => Promise<void>;
  onSaveAlumni: (payload: {
    name: string;
    regNumber: string;
    graduationYear: number;
    branch: BranchCode;
    role: string;
    company: string;
    domain: string;
    skills: string[];
    location: string;
    bio: string;
    openToInternshipReferrals: boolean;
    openToProjectMentoring: boolean;
    contactEmail: string;
    phone: string;
    linkedinUrl: string;
    avatarUrl?: string;
  }) => Promise<void>;
  onSaveAdmin: (payload: {
    name: string;
    subtitle: string;
    branch: BranchCode;
  }) => Promise<void>;
}

export function ProfileDetailsView({
  user,
  studentProfile,
  alumniProfile,
  onSaveStudent,
  onSaveAlumni,
  onSaveAdmin,
}: ProfileDetailsViewProps) {
  const [saving, setSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Student form state
  const [stuName, setStuName] = useState(studentProfile.name || user.name);
  const [stuUsn, setStuUsn] = useState(studentProfile.usn);
  const [stuBranch, setStuBranch] = useState<BranchCode>(studentProfile.branch);
  const [stuSemester, setStuSemester] = useState(studentProfile.semester);
  const [stuDomain, setStuDomain] = useState(studentProfile.targetDomain);
  const [stuSkills, setStuSkills] = useState(studentProfile.targetSkills);
  const [stuGoals, setStuGoals] = useState(studentProfile.mentorshipGoals);
  const [stuCustomGoal, setStuCustomGoal] = useState(
    studentProfile.customMentorshipGoal,
  );
  const [stuGithubUrl, setStuGithubUrl] = useState(studentProfile.githubUrl ?? '');
  const [stuLinkedinUrl, setStuLinkedinUrl] = useState(
    studentProfile.linkedinUrl ?? '',
  );
  const [stuLeetcodeUrl, setStuLeetcodeUrl] = useState(
    studentProfile.leetcodeUrl ?? '',
  );
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [stuCompany, setStuCompany] = useState(studentProfile.targetCompany);
  const [stuInternship, setStuInternship] = useState(
    studentProfile.lookingForInternship,
  );
  const [stuProjectHelp, setStuProjectHelp] = useState(
    studentProfile.lookingForProjectHelp,
  );

  // Alumni form state
  const [aluName, setAluName] = useState(alumniProfile?.name || user.name);
  const [aluUsn, setAluUsn] = useState(
    alumniProfile?.regNumber || studentProfile.usn || '',
  );
  const [aluGradYear, setAluGradYear] = useState(
    alumniProfile?.graduationYear ?? 2022,
  );
  const [aluBranch, setAluBranch] = useState<BranchCode>(
    alumniProfile?.branch ?? studentProfile.branch ?? 'CSE',
  );
  const [aluCompany, setAluCompany] = useState(alumniProfile?.company ?? '');
  const [aluRole, setAluRole] = useState(alumniProfile?.role ?? '');
  const [aluDomain, setAluDomain] = useState(
    alumniProfile?.domain ?? DOMAINS[2],
  );
  const [aluSkills, setAluSkills] = useState(
    (alumniProfile?.skills ?? []).join(', '),
  );
  const [aluLocation, setAluLocation] = useState(
    alumniProfile?.location || 'Bengaluru',
  );
  const [aluBio, setAluBio] = useState(alumniProfile?.bio ?? '');
  const [aluInternship, setAluInternship] = useState(
    alumniProfile?.openToInternshipReferrals ?? true,
  );
  const [aluProject, setAluProject] = useState(
    alumniProfile?.openToProjectMentoring ?? true,
  );
  const [aluContactEmail, setAluContactEmail] = useState(
    alumniProfile?.contact?.email || user.email,
  );
  const [aluPhone, setAluPhone] = useState(alumniProfile?.contact?.phone ?? '');
  const [aluLinkedin, setAluLinkedin] = useState(
    alumniProfile?.contact?.linkedinUrl ?? '',
  );
  const [aluAvatarUrl, setAluAvatarUrl] = useState(
    alumniProfile?.avatarUrl ?? user.avatarUrl ?? '',
  );

  // Admin form state
  const [admName, setAdmName] = useState(user.name);
  const [admSubtitle, setAdmSubtitle] = useState(
    user.subtitle || 'Placement & Alumni Cell · KLS VDIT',
  );
  const [admBranch, setAdmBranch] = useState<BranchCode>(
    user.branch ?? studentProfile.branch ?? 'CSE',
  );

  useEffect(() => {
    setStuName(studentProfile.name || user.name);
    setStuUsn(studentProfile.usn);
    setStuBranch(studentProfile.branch);
    setStuSemester(studentProfile.semester);
    setStuDomain(studentProfile.targetDomain || DOMAINS[0]);
    setStuSkills(studentProfile.targetSkills);
    setStuGoals(studentProfile.mentorshipGoals ?? []);
    setStuCustomGoal(studentProfile.customMentorshipGoal ?? '');
    setStuGithubUrl(studentProfile.githubUrl ?? '');
    setStuLinkedinUrl(studentProfile.linkedinUrl ?? '');
    setStuLeetcodeUrl(studentProfile.leetcodeUrl ?? '');
    setStuCompany(studentProfile.targetCompany);
    setStuInternship(studentProfile.lookingForInternship);
    setStuProjectHelp(studentProfile.lookingForProjectHelp);
  }, [studentProfile, user.name]);

  useEffect(() => {
    if (alumniProfile) {
      setAluName(alumniProfile.name);
      setAluUsn(alumniProfile.regNumber);
      setAluGradYear(alumniProfile.graduationYear);
      setAluBranch(alumniProfile.branch);
      setAluCompany(alumniProfile.company);
      setAluRole(alumniProfile.role);
      setAluDomain(alumniProfile.domain || DOMAINS[2]);
      setAluSkills(alumniProfile.skills.join(', '));
      setAluLocation(alumniProfile.location || 'Bengaluru');
      setAluBio(alumniProfile.bio);
      setAluInternship(alumniProfile.openToInternshipReferrals);
      setAluProject(alumniProfile.openToProjectMentoring);
      setAluContactEmail(alumniProfile.contact?.email || user.email);
      setAluPhone(alumniProfile.contact?.phone ?? '');
      setAluLinkedin(alumniProfile.contact?.linkedinUrl ?? '');
      setAluAvatarUrl(alumniProfile.avatarUrl ?? user.avatarUrl ?? '');
    } else {
      setAluAvatarUrl(user.avatarUrl ?? '');
    }
  }, [alumniProfile, user.email, user.avatarUrl]);

  useEffect(() => {
    setAdmName(user.name);
    setAdmSubtitle(user.subtitle || 'Placement & Alumni Cell · KLS VDIT');
    setAdmBranch(user.branch ?? studentProfile.branch ?? 'CSE');
  }, [user.name, user.subtitle, user.branch, studentProfile.branch]);

  function markSaved() {
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
  }

  async function handleStudentSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSaveStudent({
        name: stuName.trim(),
        usn: stuUsn.trim().toUpperCase(),
        branch: stuBranch,
        semester: stuSemester,
        targetDomain: stuDomain,
        targetSkills: stuSkills,
        mentorshipGoals: stuGoals,
        customMentorshipGoal: stuGoals.includes('Other') ? stuCustomGoal : '',
        targetCompany: stuCompany.trim(),
        githubUrl: stuGithubUrl.trim(),
        linkedinUrl: stuLinkedinUrl.trim(),
        leetcodeUrl: stuLeetcodeUrl.trim(),
        lookingForInternship: stuInternship,
        lookingForProjectHelp: stuProjectHelp,
      });
      markSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to save your details.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAlumniSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const parsedSkills = aluSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await onSaveAlumni({
        name: aluName.trim(),
        regNumber: aluUsn.trim().toUpperCase(),
        graduationYear: aluGradYear,
        branch: aluBranch,
        role: aluRole.trim(),
        company: aluCompany.trim(),
        domain: aluDomain,
        skills: parsedSkills.length > 0 ? parsedSkills : [aluDomain],
        location: aluLocation.trim() || 'Bengaluru',
        bio: aluBio.trim(),
        openToInternshipReferrals: aluInternship,
        openToProjectMentoring: aluProject,
        contactEmail: aluContactEmail.trim() || user.email,
        phone: aluPhone.trim(),
        linkedinUrl: aluLinkedin.trim(),
        avatarUrl: aluAvatarUrl,
      });
      markSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to save alumni details.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAlumniAvatar(nextAvatarUrl: string) {
    const parsedSkills = aluSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    setAluAvatarUrl(nextAvatarUrl);
    await onSaveAlumni({
      name: aluName.trim() || user.name,
      regNumber: aluUsn.trim().toUpperCase(),
      graduationYear: aluGradYear,
      branch: aluBranch,
      role: aluRole.trim(),
      company: aluCompany.trim(),
      domain: aluDomain,
      skills: parsedSkills.length > 0 ? parsedSkills : [aluDomain],
      location: aluLocation.trim() || 'Bengaluru',
      bio: aluBio.trim(),
      openToInternshipReferrals: aluInternship,
      openToProjectMentoring: aluProject,
      contactEmail: aluContactEmail.trim() || user.email,
      phone: aluPhone.trim(),
      linkedinUrl: aluLinkedin.trim(),
      avatarUrl: nextAvatarUrl,
    });
    markSaved();
  }

  async function handleAdminSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSaveAdmin({
        name: admName.trim(),
        subtitle: admSubtitle.trim(),
        branch: admBranch,
      });
      markSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to save admin details.',
      );
    } finally {
      setSaving(false);
    }
  }

  const roleHeading =
    user.role === 'student'
      ? 'Student Profile & Learning Goals'
      : user.role === 'alumni'
        ? 'Alumni Profile & Private Contact'
        : 'Placement Cell Admin Details';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <section className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] px-6 py-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-emerald-800">
            <UserCircle2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-medium text-emerald-800">
              My Account · {user.email}
            </p>
            <h1 className="mt-0.5 font-display text-2xl font-bold tracking-tight text-[#18221D]">
              {roleHeading}
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              {user.role === 'student'
                ? 'Keep your USN, semester, resume link, and target skills updated so PARTHA ranks the best alumni mentors for you.'
                : user.role === 'alumni'
                  ? 'Update your company, skills, and mentoring bio. Your email, phone, and LinkedIn stay private until you accept a student request.'
                  : 'Update your Placement & Alumni Cell display name and department information.'}
            </p>
          </div>
        </div>

        {user.role === 'alumni' && alumniProfile && (
          <span
            className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium ${
              alumniProfile.verificationStatus === 'verified'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
          >
            {alumniProfile.verificationStatus === 'verified' ? (
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {alumniProfile.verificationStatus === 'verified'
              ? 'Verified Alumni'
              : 'Pending Verification'}
          </span>
        )}
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-xs font-medium text-red-700"
        >
          {error}
        </div>
      )}

      {savedBanner && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-xs font-medium text-emerald-900"
        >
          <Check className="h-4 w-4 text-emerald-700" aria-hidden="true" />
          Details saved to Supabase PostgreSQL.
        </div>
      )}

      {user.role === 'student' ? (
        <div className="space-y-5">
          <ProfileAvatarEditor
            displayName={stuName || user.name}
            avatarUrl={studentProfile.avatarUrl ?? user.avatarUrl}
            roleLabel="Student"
            onSaveAvatar={async (nextAvatarUrl) => {
              await onSaveStudent({ avatarUrl: nextAvatarUrl });
              markSaved();
            }}
          />

          <form
            onSubmit={handleStudentSubmit}
            className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] p-6 space-y-5"
          >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2 text-sm focus:border-emerald-700 focus:outline-none"
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
                className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2 text-sm font-mono focus:border-emerald-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Branch
              </label>
              <select
                value={stuBranch}
                onChange={(e) => setStuBranch(e.target.value as BranchCode)}
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
                Current Semester
              </label>
              <input
                type="number"
                min={1}
                max={8}
                value={stuSemester}
                onChange={(e) => setStuSemester(Number(e.target.value))}
                className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2 text-sm tabular-nums focus:border-emerald-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Target Career Domain
              </label>
              <DomainSelect
                id="student-profile-domain"
                value={stuDomain}
                onChange={setStuDomain}
                className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2 text-sm focus:border-emerald-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Dream Company (optional)
              </label>
              <input
                type="text"
                value={stuCompany}
                onChange={(e) => setStuCompany(e.target.value)}
                placeholder="e.g., Google, Razorpay, Bosch"
                className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2 text-sm focus:border-emerald-700 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Skills You Want to Learn
              </label>
              <SkillPicker
                id="student-profile-skills"
                skills={stuSkills}
                onChange={setStuSkills}
                className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2 text-sm focus:border-emerald-700 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  LeetCode URL
                </label>
                <input
                  type="url"
                  value={stuLeetcodeUrl}
                  onChange={(e) => setStuLeetcodeUrl(e.target.value)}
                  placeholder="https://leetcode.com/username"
                  className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  GitHub URL
                </label>
                <input
                  type="url"
                  value={stuGithubUrl}
                  onChange={(e) => setStuGithubUrl(e.target.value)}
                  placeholder="https://github.com/username"
                  className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={stuLinkedinUrl}
                  onChange={(e) => setStuLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Resume PDF (max 2 MB)
              </label>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  if (
                    file &&
                    ((file.type && file.type !== 'application/pdf') ||
                      !/\.pdf$/i.test(file.name) ||
                      file.size === 0 ||
                      file.size > 2 * 1024 * 1024)
                  ) {
                    setError('Choose a non-empty PDF file up to 2 MB.');
                    event.target.value = '';
                    setResumeFile(null);
                    return;
                  }
                  setError(null);
                  setResumeFile(file);
                }}
                className="block w-full text-xs text-stone-700 file:mr-3 file:rounded-md file:border file:border-[#E5DFD0] file:bg-[#FAF7F0] file:px-3 file:py-1.5 file:text-xs"
              />
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-stone-500">
                <span>{resumeFile?.name ?? studentProfile.resumeFileName ?? 'No resume uploaded'}</span>
                {studentProfile.resumeFileName && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const blob = await parthaApi.getStudentResume();
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = studentProfile.resumeFileName ?? 'resume.pdf';
                        link.click();
                        URL.revokeObjectURL(url);
                      } catch (err) {
                        setError(
                          err instanceof Error ? err.message : 'Unable to download resume.',
                        );
                      }
                    }}
                    className="font-semibold text-emerald-800 underline"
                  >
                    Download current resume
                  </button>
                )}
              </div>
              {resumeFile && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={async () => {
                    setError(null);
                    setSaving(true);
                    try {
                      await parthaApi.uploadStudentResume(resumeFile);
                      await onSaveStudent({});
                      setResumeFile(null);
                      markSaved();
                    } catch (err) {
                      setError(
                        err instanceof Error ? err.message : 'Unable to upload resume.',
                      );
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="mt-2 rounded-lg border border-emerald-700 px-3 py-1.5 text-xs font-semibold text-emerald-900 disabled:opacity-60"
                >
                  Upload / Replace Resume
                </button>
              )}
            </div>

            <fieldset className="sm:col-span-2 space-y-2 border-t border-[#EEE9DC] pt-4">
              <legend className="text-xs font-semibold text-stone-700">
                Select Your Mentorship Goals
              </legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {MENTORSHIP_GOALS.map((goal) => (
                  <label
                    key={goal}
                    className="inline-flex items-center gap-2 text-xs text-stone-700"
                  >
                    <input
                      type="checkbox"
                      checked={stuGoals.includes(goal)}
                      onChange={(event) =>
                        setStuGoals((current) =>
                          event.target.checked
                            ? [...current, goal]
                            : current.filter((item) => item !== goal),
                        )
                      }
                      className="h-3.5 w-3.5 accent-emerald-800"
                    />
                    {goal}
                  </label>
                ))}
              </div>
              {stuGoals.includes('Other') && (
                <input
                  type="text"
                  required
                  maxLength={240}
                  value={stuCustomGoal}
                  onChange={(event) => setStuCustomGoal(event.target.value)}
                  placeholder="Describe your mentorship requirement"
                  className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                />
              )}
            </fieldset>
          </div>

          <div className="flex flex-wrap items-center gap-6 border-t border-[#EEE9DC] pt-4 text-xs text-stone-700">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={stuInternship}
                onChange={(e) => setStuInternship(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300 accent-emerald-800"
              />
              <span>Looking for internship referrals</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={stuProjectHelp}
                onChange={(e) => setStuProjectHelp(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300 accent-emerald-800"
              />
              <span>Looking for capstone / project guidance</span>
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-60 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              {saving ? 'Saving...' : 'Save Student Details'}
            </button>
          </div>
          </form>
        </div>
      ) : user.role === 'alumni' ? (
        <div className="space-y-5">
          <ProfileAvatarEditor
            displayName={aluName || user.name}
            avatarUrl={aluAvatarUrl}
            roleLabel="Alumni"
            onSaveAvatar={handleSaveAlumniAvatar}
          />

          <form onSubmit={handleAlumniSubmit} className="space-y-5">
          <div className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] p-6 space-y-4">
            <h2 className="font-display text-base font-semibold text-[#18221D]">
              Public Alumni Profile
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={aluName}
                  onChange={(e) => setAluName(e.target.value)}
                  className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2 text-sm focus:border-emerald-700 focus:outline-none"
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
                  placeholder="e.g., 2VD19CS014"
                  className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2 text-sm font-mono focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Current Company
                </label>
                <input
                  type="text"
                  required
                  value={aluCompany}
                  onChange={(e) => setAluCompany(e.target.value)}
                  placeholder="e.g., Flipkart, Google, TCS"
                  className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2 text-sm focus:border-emerald-700 focus:outline-none"
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
                  placeholder="e.g., Software Engineer II"
                  className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2 text-sm focus:border-emerald-700 focus:outline-none"
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
                  className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2 text-sm tabular-nums focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Branch
                </label>
                <select
                  value={aluBranch}
                  onChange={(e) => setAluBranch(e.target.value as BranchCode)}
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
                  Primary Technical Domain
                </label>
                <select
                  value={aluDomain}
                  onChange={(e) => setAluDomain(e.target.value)}
                  className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2 text-sm focus:border-emerald-700 focus:outline-none"
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
                  City / Location
                </label>
                <input
                  type="text"
                  value={aluLocation}
                  onChange={(e) => setAluLocation(e.target.value)}
                  className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Skills You Can Mentor On (comma-separated)
                </label>
                <input
                  type="text"
                  value={aluSkills}
                  onChange={(e) => setAluSkills(e.target.value)}
                  placeholder="TypeScript, React, System Design, DSA"
                  className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Short Bio / Advice for Juniors
                </label>
                <textarea
                  rows={3}
                  value={aluBio}
                  onChange={(e) => setAluBio(e.target.value)}
                  placeholder="Share what projects, interview rounds, or career paths you can guide juniors on..."
                  className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 border-t border-[#EEE9DC] pt-4 text-xs text-stone-700">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aluInternship}
                  onChange={(e) => setAluInternship(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 accent-emerald-800"
                />
                <span>Open to internship referrals</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aluProject}
                  onChange={(e) => setAluProject(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 accent-emerald-800"
                />
                <span>Open to project guidance</span>
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-800" aria-hidden="true" />
              <h2 className="font-display text-base font-semibold text-[#18221D]">
                Privacy-Gated Contact Details
              </h2>
            </div>
            <p className="text-xs text-stone-500">
              Protected by Supabase PostgreSQL privacy gating — only students whose mentorship request you accept can see these fields.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={aluContactEmail}
                  onChange={(e) => setAluContactEmail(e.target.value)}
                  className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  WhatsApp / Phone
                </label>
                <input
                  type="text"
                  value={aluPhone}
                  onChange={(e) => setAluPhone(e.target.value)}
                  placeholder="+91 98..."
                  className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  LinkedIn Profile URL
                </label>
                <input
                  type="url"
                  value={aluLinkedin}
                  onChange={(e) => setAluLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-60 cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
                {saving ? 'Saving...' : 'Save Alumni Details'}
              </button>
            </div>
          </div>
          </form>
        </div>
      ) : (
        <form
          onSubmit={handleAdminSubmit}
          className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] p-6 space-y-5"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Administrator / Cell Name
              </label>
              <input
                type="text"
                required
                value={admName}
                onChange={(e) => setAdmName(e.target.value)}
                className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2 text-sm focus:border-emerald-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Primary Department
              </label>
              <select
                value={admBranch}
                onChange={(e) => setAdmBranch(e.target.value as BranchCode)}
                className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2 text-sm focus:border-emerald-700 focus:outline-none"
              >
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Designation / Subtitle
              </label>
              <input
                type="text"
                required
                value={admSubtitle}
                onChange={(e) => setAdmSubtitle(e.target.value)}
                placeholder="Placement & Alumni Cell · KLS VDIT"
                className="w-full rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2 text-sm focus:border-emerald-700 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-60 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              {saving ? 'Saving...' : 'Save Admin Details'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
