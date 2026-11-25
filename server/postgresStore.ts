import crypto from 'crypto';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import type {
  AdminBootstrapStatus,
  AdminMetrics,
  AdminStudentRecord,
  AlumniContact,
  AlumniDiscoveryResponse,
  AlumniProfile,
  AuthSession,
  AuthUser,
  BranchCode,
  FormResponsePreview,
  GuidesPaginatedResponse,
  KnowledgeGuide,
  MentorshipGoal,
  MentorshipMessage,
  MentorshipRequest,
  MentorshipSessionBooking,
  OpportunityApplication,
  OpportunitiesPaginatedResponse,
  Opportunity,
  OpportunityType,
  ParthaNotification,
  SeniorIntakeForm,
  StudentTargetProfile,
  UserBookmarks,
  UserRole,
  VerificationStatus,
} from '../src/types/index.ts';
import { ensureDatabaseSchema, getDb } from './db/client.ts';
import {
  alumniPrivateContacts,
  alumniProfiles,
  guideUpvotes,
  importedFormResponses,
  knowledgeGuides,
  mentorshipMessages,
  mentorshipRequests,
  mentorshipSessions,
  notifications,
  opportunityApplications,
  opportunities,
  passwordResets,
  seniorIntakeForms,
  studentProfiles,
  studentResumes,
  userBookmarks,
  users,
} from './db/schema.ts';
import {
  clampText,
  isValidEmail,
  normalizeBranch,
  normalizeEmail,
  normalizeStringArray,
  VALID_BRANCHES,
  validateSafeAvatarUrl,
  validateSafeHttpUrl,
} from './validation.ts';

const TOKEN_SECRET =
  process.env.AUTH_SECRET || crypto.randomBytes(32).toString('hex');

export class StoreError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface StoredResume {
  fileName: string;
  fileData: Buffer;
}

function requireDb() {
  const db = getDb();
  if (!db) {
    throw new StoreError(
      503,
      'Supabase PostgreSQL is not connected yet. Add DATABASE_URL in AI Studio Settings → Secrets.',
    );
  }
  return db;
}

function hashPassword(password: string, salt?: string): string {
  const usedSalt = salt ?? crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, usedSalt, 32).toString('hex');
  return `${usedSalt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, keyHex] = storedHash.split(':');
  if (!salt || !keyHex) return false;
  const derived = crypto.scryptSync(password, salt, 32);
  const stored = Buffer.from(keyHex, 'hex');
  if (derived.length !== stored.length) return false;
  return crypto.timingSafeEqual(derived, stored);
}

function hashResetCode(email: string, role: string, code: string): string {
  return crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(`${role}:${email.toLowerCase()}:${code.trim()}`)
    .digest('hex');
}

function formatShortDate(date: Date | string | null | undefined): string {
  const d = date instanceof Date ? date : date ? new Date(date) : new Date();
  return d.toISOString().slice(0, 10);
}

function formatMessageTime(date: Date): string {
  return date.toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function computeServerMatchScore(
  alumni: {
    branch: string;
    skills: string[];
    company: string;
    role: string;
    domain: string;
    openToInternshipReferrals: boolean;
    openToProjectMentoring: boolean;
    sharedProjectGuidesCount: number;
  },
  student: StudentTargetProfile,
  skillFilter: string,
  companyFilter: string,
  roleFilter: string,
  domainFilter: string,
): number {
  let score = 15;
  const targetSkills = new Set(student.targetSkills.map((s) => s.trim().toLowerCase()));
  if (skillFilter && skillFilter !== 'All') {
    targetSkills.add(skillFilter.trim().toLowerCase());
  }

  const matchedCount = alumni.skills.filter((sk) => {
    const s = sk.trim().toLowerCase();
    for (const target of targetSkills) {
      if (s === target || s.includes(target) || target.includes(s)) return true;
    }
    return false;
  }).length;

  if (matchedCount > 0) {
    score += Math.min(40, 18 + matchedCount * 10);
  }

  const targetCompany = companyFilter !== 'All' ? companyFilter : student.targetCompany;
  if (
    targetCompany &&
    alumni.company.toLowerCase().includes(targetCompany.trim().toLowerCase())
  ) {
    score += 18;
  } else if (
    roleFilter !== 'All' &&
    alumni.role.toLowerCase().includes(roleFilter.trim().toLowerCase())
  ) {
    score += 14;
  }

  const effectiveDomain = domainFilter !== 'All' ? domainFilter : student.targetDomain;
  if (
    effectiveDomain &&
    alumni.domain.trim().toLowerCase() === effectiveDomain.trim().toLowerCase()
  ) {
    score += 18;
  }

  const goals = new Set(student.mentorshipGoals.map((goal) => goal.toLowerCase()));
  if (
    goals.has('career guidance & referrals') &&
    alumni.openToInternshipReferrals
  ) {
    score += 8;
  }
  if (
    student.mentorshipGoals.some((goal) =>
      ['resume review', 'project review', 'interview preparation', 'technical guidance']
        .includes(goal.toLowerCase()),
    ) &&
    alumni.openToProjectMentoring
  ) {
    score += 6;
  }

  if (student.lookingForInternship && alumni.openToInternshipReferrals) score += 5;
  if (student.lookingForProjectHelp && alumni.openToProjectMentoring) score += 4;
  if (alumni.branch === student.branch) score += 3;
  if (alumni.sharedProjectGuidesCount > 0) {
    score += Math.min(10, alumni.sharedProjectGuidesCount * 3);
  }

  return Math.min(99, Math.max(35, score));
}

interface TokenPayload {
  userId: string;
  role: UserRole;
  exp: number;
}

class PostgresParthaStore {
  signToken(userId: string, role: UserRole): string {
    const payload: TokenPayload = {
      userId,
      role,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
    };
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(encoded)
      .digest('base64url');
    return `${encoded}.${sig}`;
  }

  async verifyToken(token: string | undefined): Promise<AuthUser | null> {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encoded, sig] = parts;
    const expectedSig = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(encoded)
      .digest('base64url');

    if (sig.length !== expectedSig.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      return null;
    }

    try {
      const payload = JSON.parse(
        Buffer.from(encoded, 'base64url').toString('utf8'),
      ) as TokenPayload;
      if (!payload.userId || !payload.role || payload.exp < Date.now()) {
        return null;
      }
      return await this.getAuthUserById(payload.userId, payload.role);
    } catch {
      return null;
    }
  }

  async getAdminBootstrapStatus(): Promise<AdminBootstrapStatus> {
    await ensureDatabaseSchema();
    const db = requireDb();
    const rows = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'admin'))
      .limit(1);

    return {
      hasAdmin: rows.length > 0,
      passcodeConfigured: Boolean(process.env.ADMIN_PASSCODE?.trim()),
    };
  }

  async claimFirstAdmin(input: {
    name: string;
    email: string;
    password: string;
    branch?: BranchCode;
  }): Promise<AuthSession> {
    await ensureDatabaseSchema();
    const db = requireDb();

    const cleanName = clampText(input.name, 120) || 'Placement & Alumni Cell';
    const cleanEmail = normalizeEmail(input.email);
    const cleanBranch = normalizeBranch(input.branch);

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      throw new StoreError(400, 'Please enter a valid college email for Admin setup.');
    }
    if (!input.password || input.password.length < 6) {
      throw new StoreError(400, 'Admin passcode must be at least 6 characters long.');
    }

    const adminId = `adm-${crypto.randomUUID().slice(0, 12)}`;

    await db.transaction(async (tx) => {
      const existingAdmins = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, 'admin'))
        .limit(1);

      if (existingAdmins.length > 0) {
        throw new StoreError(
          409,
          'An Admin account already exists. Please sign in with your Admin credentials.',
        );
      }

      await tx.insert(users).values({
        id: adminId,
        role: 'admin',
        email: cleanEmail,
        name: cleanName,
        subtitle: 'Placement & Alumni Cell · KLS VDIT',
        branch: cleanBranch,
        passwordHash: hashPassword(input.password),
      });
    });

    const user = await this.getAuthUserById(adminId, 'admin');
    if (!user) throw new StoreError(500, 'Unable to load newly created admin profile.');
    return { token: this.signToken(adminId, 'admin'), user };
  }

  async getAuthUserById(userId: string, role?: UserRole): Promise<AuthUser | null> {
    await ensureDatabaseSchema();
    const db = requireDb();

    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const u = userRows[0];
    if (!u || !u.isActive) return null;

    const effectiveRole = (role ?? u.role) as UserRole;
    if (effectiveRole !== u.role) return null;

    if (u.role === 'student') {
      const spRows = await db
        .select()
        .from(studentProfiles)
        .where(eq(studentProfiles.userId, u.id))
        .limit(1);
      const sp = spRows[0];
      const studentProfile: StudentTargetProfile = {
        id: u.id,
        name: u.name,
        email: u.email,
        usn: sp?.usn ?? '',
        branch: normalizeBranch(sp?.branch ?? u.branch),
        semester: sp?.semester ?? 6,
        targetSkills: sp?.targetSkills ?? ['Python'],
        targetDomain: sp?.targetDomain ?? 'Machine Learning & AI',
        mentorshipGoals: sp?.mentorshipGoals ?? [],
        customMentorshipGoal: sp?.customMentorshipGoal ?? '',
        targetCompany: sp?.targetCompany ?? '',
        resumeUrl: sp?.resumeUrl ?? '',
        resumeFileName: sp?.resumeFileName ?? '',
        resumeText: sp?.resumeText ?? '',
        githubUrl: sp?.githubUrl ?? '',
        linkedinUrl: sp?.linkedinUrl ?? '',
        leetcodeUrl: sp?.leetcodeUrl ?? '',
        avatarUrl: sp?.avatarUrl || undefined,
        lookingForInternship: sp?.lookingForInternship ?? true,
        lookingForProjectHelp: sp?.lookingForProjectHelp ?? true,
      };
      return {
        id: u.id,
        role: 'student',
        name: u.name,
        email: u.email,
        isActive: u.isActive,
        subtitle: u.subtitle || `Sem ${studentProfile.semester} ${studentProfile.branch}`,
        branch: studentProfile.branch,
        avatarUrl: sp?.avatarUrl || undefined,
        studentProfile,
      };
    }

    if (u.role === 'alumni') {
      const aluRows = await db
        .select()
        .from(alumniProfiles)
        .where(eq(alumniProfiles.ownerUid, u.id))
        .limit(1);
      const a = aluRows[0];
      return {
        id: u.id,
        role: 'alumni',
        name: u.name,
        email: u.email,
        isActive: u.isActive,
        subtitle:
          a
            ? `${a.role}, ${a.company} · ${a.graduationYear} ${a.branch}`
            : u.subtitle,
        branch: normalizeBranch(a?.branch ?? u.branch),
        avatarUrl: a?.avatarUrl || undefined,
        verificationStatus: (a?.verificationStatus as VerificationStatus) ?? 'pending',
      };
    }

    return {
      id: u.id,
      role: 'admin',
      name: u.name,
      email: u.email,
      isActive: u.isActive,
      subtitle: u.subtitle || 'Placement & Alumni Cell · KLS VDIT',
      branch: normalizeBranch(u.branch),
      isAdminAccount: true,
    };
  }

  async login(input: {
    role: UserRole;
    identifier: string;
    password: string;
  }): Promise<AuthSession> {
    await ensureDatabaseSchema();
    const db = requireDb();

    const cleanId = clampText(input.identifier, 160).toLowerCase();
    if (!cleanId || !input.password) {
      throw new StoreError(400, 'Please enter both your email/USN and password.');
    }

    if (input.role === 'student') {
      let targetUserId: string | null = null;
      const byEmail = await db
        .select()
        .from(users)
        .where(and(eq(users.role, 'student'), eq(users.email, cleanId)))
        .limit(1);

      if (byEmail[0]) {
        if (!verifyPassword(input.password, byEmail[0].passwordHash)) {
          throw new StoreError(401, 'Invalid Student email/USN or password.');
        }
        targetUserId = byEmail[0].id;
      } else {
        const byUsn = await db
          .select({ userId: studentProfiles.userId })
          .from(studentProfiles)
          .where(sql`UPPER(${studentProfiles.usn}) = ${cleanId.toUpperCase()}`)
          .limit(1);
        if (byUsn[0]) {
          const uRows = await db
            .select()
            .from(users)
            .where(and(eq(users.id, byUsn[0].userId), eq(users.role, 'student')))
            .limit(1);
          if (!uRows[0] || !verifyPassword(input.password, uRows[0].passwordHash)) {
            throw new StoreError(401, 'Invalid Student email/USN or password.');
          }
          targetUserId = uRows[0].id;
        }
      }

      if (!targetUserId) {
        throw new StoreError(401, 'Invalid Student email/USN or password.');
      }

      const activeRows = await db
        .select({ isActive: users.isActive })
        .from(users)
        .where(eq(users.id, targetUserId))
        .limit(1);
      if (!activeRows[0]?.isActive) {
        throw new StoreError(403, 'This Student account is suspended. Contact an administrator.');
      }

      const authUser = await this.getAuthUserById(targetUserId, 'student');
      if (!authUser) throw new StoreError(401, 'Student account not found.');
      return { token: this.signToken(targetUserId, 'student'), user: authUser };
    }

    if (input.role === 'alumni') {
      let targetUserId: string | null = null;
      const byEmail = await db
        .select()
        .from(users)
        .where(and(eq(users.role, 'alumni'), eq(users.email, cleanId)))
        .limit(1);

      if (byEmail[0]) {
        if (!verifyPassword(input.password, byEmail[0].passwordHash)) {
          throw new StoreError(401, 'Invalid Alumni email/USN or password.');
        }
        targetUserId = byEmail[0].id;
      } else {
        const byUsn = await db
          .select({ ownerUid: alumniProfiles.ownerUid })
          .from(alumniProfiles)
          .where(sql`UPPER(${alumniProfiles.regNumber}) = ${cleanId.toUpperCase()}`)
          .limit(1);
        if (byUsn[0]) {
          const uRows = await db
            .select()
            .from(users)
            .where(and(eq(users.id, byUsn[0].ownerUid), eq(users.role, 'alumni')))
            .limit(1);
          if (!uRows[0] || !verifyPassword(input.password, uRows[0].passwordHash)) {
            throw new StoreError(401, 'Invalid Alumni email/USN or password.');
          }
          targetUserId = uRows[0].id;
        }
      }

      if (!targetUserId) {
        throw new StoreError(401, 'Invalid Alumni email/USN or password.');
      }

      const activeRows = await db
        .select({ isActive: users.isActive })
        .from(users)
        .where(eq(users.id, targetUserId))
        .limit(1);
      if (!activeRows[0]?.isActive) {
        throw new StoreError(403, 'This Alumni account is suspended. Contact an administrator.');
      }

      const authUser = await this.getAuthUserById(targetUserId, 'alumni');
      if (!authUser) throw new StoreError(401, 'Alumni account not found.');
      return { token: this.signToken(targetUserId, 'alumni'), user: authUser };
    }

    const adminRows = await db
      .select()
      .from(users)
      .where(and(eq(users.role, 'admin'), eq(users.email, cleanId)))
      .limit(1);
    const admin = adminRows[0];
    if (!admin) {
      throw new StoreError(401, 'Invalid Admin email or passcode.');
    }

    const envPasscode = process.env.ADMIN_PASSCODE?.trim();
    const matchesEnvPasscode = Boolean(
      envPasscode &&
        envPasscode.length === input.password.length &&
        crypto.timingSafeEqual(
          Buffer.from(envPasscode),
          Buffer.from(input.password),
        ),
    );
    const matchesHash = verifyPassword(input.password, admin.passwordHash);

    if (!matchesEnvPasscode && !matchesHash) {
      throw new StoreError(401, 'Invalid Admin email or passcode.');
    }

    const authUser = await this.getAuthUserById(admin.id, 'admin');
    if (!authUser) throw new StoreError(401, 'Admin account not found.');
    return { token: this.signToken(admin.id, 'admin'), user: authUser };
  }

  async registerStudent(input: {
    name: string;
    email: string;
    usn: string;
    branch: BranchCode;
    semester: number;
    targetSkills: string[];
    targetDomain: string;
    mentorshipGoals?: string[];
    customMentorshipGoal?: string;
    resumeText?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    leetcodeUrl?: string;
    password: string;
  }): Promise<AuthSession> {
    await ensureDatabaseSchema();
    const db = requireDb();

    const email = normalizeEmail(input.email);
    const usn = clampText(input.usn, 40).toUpperCase();
    const name = clampText(input.name, 120);
    const branch = normalizeBranch(input.branch);
    const semester = Math.min(8, Math.max(1, Math.round(Number(input.semester) || 6)));
    const skills = normalizeStringArray(input.targetSkills, 15, 40);
    const targetDomain = clampText(input.targetDomain, 100) || 'Machine Learning & AI';
    const mentorshipGoals = normalizeStringArray(input.mentorshipGoals ?? [], 8, 80);
    const customMentorshipGoal = clampText(input.customMentorshipGoal ?? '', 240);
    const resumeText = clampText(input.resumeText ?? '', 5000);
    const githubUrl = validateSafeHttpUrl(input.githubUrl ?? '');
    const linkedinUrl = validateSafeHttpUrl(input.linkedinUrl ?? '');
    const leetcodeUrl = validateSafeHttpUrl(input.leetcodeUrl ?? '');

    if (githubUrl === null || linkedinUrl === null || leetcodeUrl === null) {
      throw new StoreError(400, 'Professional profile links must use http:// or https://.');
    }
    if (mentorshipGoals.includes('Other') && !customMentorshipGoal) {
      throw new StoreError(400, 'Describe your custom mentorship goal.');
    }

    if (!name || !email || !isValidEmail(email) || !usn || !input.password || input.password.length < 4) {
      throw new StoreError(
        400,
        'Valid name, email, USN, and password (4+ characters) are required.',
      );
    }

    const existingEmail = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.role, 'student'), eq(users.email, email)))
      .limit(1);
    const existingUsn = await db
      .select({ userId: studentProfiles.userId })
      .from(studentProfiles)
      .where(sql`UPPER(${studentProfiles.usn}) = ${usn}`)
      .limit(1);

    if (existingEmail.length > 0 || existingUsn.length > 0) {
      throw new StoreError(409, 'A student account with this email or USN already exists.');
    }

    const id = `stu-${crypto.randomUUID().slice(0, 12)}`;
    const subtitle = `Sem ${semester} ${branch} · ${usn}`;

    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id,
        role: 'student',
        email,
        name,
        subtitle,
        branch,
        passwordHash: hashPassword(input.password),
      });
      await tx.insert(studentProfiles).values({
        userId: id,
        usn,
        branch,
        semester,
        targetSkills: skills.length > 0 ? skills : ['Python', 'Machine Learning'],
        targetDomain,
        mentorshipGoals,
        customMentorshipGoal,
        targetCompany: '',
        resumeUrl: '',
        resumeText,
        githubUrl,
        linkedinUrl,
        leetcodeUrl,
        lookingForInternship: true,
        lookingForProjectHelp: true,
      });
    });

    const user = await this.getAuthUserById(id, 'student');
    if (!user) throw new StoreError(500, 'Unable to load new student profile.');
    return { token: this.signToken(id, 'student'), user };
  }

  async registerAlumni(input: {
    name: string;
    email: string;
    phone?: string;
    regNumber: string;
    graduationYear: number;
    branch: BranchCode;
    password: string;
  }): Promise<AuthSession> {
    await ensureDatabaseSchema();
    const db = requireDb();

    const email = normalizeEmail(input.email);
    const reg = clampText(input.regNumber, 40).toUpperCase();
    const name = clampText(input.name, 120);
    const gradYear = Math.min(2035, Math.max(1995, Math.round(Number(input.graduationYear) || 2022)));
    const branch = normalizeBranch(input.branch);
    const roleTitle = 'Software Professional';
    const company = 'Alumni Network';
    const domain = 'Full-Stack & FinTech';
    const location = 'Bengaluru';
    const bio = `KLS VDIT Class of ${gradYear} ${branch}.`;

    if (
      !name ||
      !email ||
      !isValidEmail(email) ||
      !reg ||
      !input.password ||
      input.password.length < 4
    ) {
      throw new StoreError(
        400,
        'Name, valid email, USN, and password (4+ characters) are required.',
      );
    }

    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.role, 'alumni'), eq(users.email, email)))
      .limit(1);
    const existingReg = await db
      .select({ id: alumniProfiles.id })
      .from(alumniProfiles)
      .where(sql`UPPER(${alumniProfiles.regNumber}) = ${reg}`)
      .limit(1);

    if (existingUser.length > 0 || existingReg.length > 0) {
      throw new StoreError(409, 'An alumni account with this email or USN already exists.');
    }

    const id = `alu-${crypto.randomUUID().slice(0, 12)}`;
    const subtitle = `${roleTitle}, ${company} · ${gradYear} ${branch}`;

    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id,
        role: 'alumni',
        email,
        name,
        subtitle,
        branch,
        passwordHash: hashPassword(input.password),
      });
      await tx.insert(alumniProfiles).values({
        id,
        ownerUid: id,
        name,
        graduationYear: gradYear,
        branch,
        role: roleTitle,
        company,
        domain,
        skills: ['Software Engineering'],
        location,
        bio,
        regNumber: reg,
        source: 'self-registered',
        verificationStatus: 'pending',
        openToInternshipReferrals: true,
        openToProjectMentoring: true,
        sharedProjectGuidesCount: 0,
      });
      await tx.insert(alumniPrivateContacts).values({
        alumniId: id,
        email,
        phone: clampText(input.phone ?? '', 40),
        linkedinUrl: '',
      });
    });

    const user = await this.getAuthUserById(id, 'alumni');
    if (!user) throw new StoreError(500, 'Unable to load new alumni account.');
    return { token: this.signToken(id, 'alumni'), user };
  }

  async requestPasswordReset(input: {
    role: 'student' | 'alumni';
    email: string;
  }): Promise<{ emailExists: boolean; code?: string }> {
    await ensureDatabaseSchema();
    const db = requireDb();

    const cleanEmail = normalizeEmail(input.email);
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      throw new StoreError(400, 'Please enter a valid email address.');
    }

    const accountRows = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.role, input.role), eq(users.email, cleanEmail)))
      .limit(1);

    if (accountRows.length === 0) {
      return { emailExists: false };
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    const key = `${input.role}:${cleanEmail}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const codeHash = hashResetCode(cleanEmail, input.role, code);

    await db
      .insert(passwordResets)
      .values({
        key,
        role: input.role,
        email: cleanEmail,
        codeHash,
        expiresAt,
        attempts: 0,
      })
      .onConflictDoUpdate({
        target: passwordResets.key,
        set: { codeHash, expiresAt, attempts: 0 },
      });

    return { emailExists: true, code };
  }

  async confirmPasswordReset(input: {
    role: 'student' | 'alumni';
    email: string;
    code: string;
    newPassword: string;
  }): Promise<void> {
    await ensureDatabaseSchema();
    const db = requireDb();

    const cleanEmail = normalizeEmail(input.email);
    const cleanCode = clampText(input.code, 12);
    if (!cleanEmail || !cleanCode) {
      throw new StoreError(400, 'Email and 6-digit verification code are required.');
    }
    if (!input.newPassword || input.newPassword.length < 4) {
      throw new StoreError(400, 'New password must be at least 4 characters long.');
    }

    const key = `${input.role}:${cleanEmail}`;
    const rows = await db
      .select()
      .from(passwordResets)
      .where(eq(passwordResets.key, key))
      .limit(1);
    const record = rows[0];

    if (!record || record.expiresAt.getTime() < Date.now()) {
      await db.delete(passwordResets).where(eq(passwordResets.key, key));
      throw new StoreError(
        400,
        'Reset code is invalid or has expired. Please request a new code.',
      );
    }

    const expectedHash = hashResetCode(cleanEmail, input.role, cleanCode);
    const actualBuf = Buffer.from(record.codeHash, 'hex');
    const candidateBuf = Buffer.from(expectedHash, 'hex');

    if (
      actualBuf.length !== candidateBuf.length ||
      !crypto.timingSafeEqual(actualBuf, candidateBuf)
    ) {
      const nextAttempts = record.attempts + 1;
      if (nextAttempts >= 5) {
        await db.delete(passwordResets).where(eq(passwordResets.key, key));
        throw new StoreError(
          400,
          'Too many incorrect attempts. Please request a new reset code.',
        );
      }
      await db
        .update(passwordResets)
        .set({ attempts: nextAttempts })
        .where(eq(passwordResets.key, key));
      throw new StoreError(
        400,
        'Incorrect verification code. Please check and try again.',
      );
    }

    const updated = await db
      .update(users)
      .set({
        passwordHash: hashPassword(input.newPassword),
        updatedAt: new Date(),
      })
      .where(and(eq(users.role, input.role), eq(users.email, cleanEmail)))
      .returning({ id: users.id });

    await db.delete(passwordResets).where(eq(passwordResets.key, key));

    if (updated.length === 0) {
      throw new StoreError(404, 'Account not found.');
    }
  }

  async updateStudentProfile(
    studentId: string,
    updates: Partial<StudentTargetProfile>,
  ): Promise<AuthUser> {
    await ensureDatabaseSchema();
    const db = requireDb();

    const currentRows = await db
      .select()
      .from(users)
      .where(and(eq(users.id, studentId), eq(users.role, 'student')))
      .limit(1);
    if (!currentRows[0]) {
      throw new StoreError(404, 'Student account not found.');
    }

    const spRows = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, studentId))
      .limit(1);
    const existingSp = spRows[0];

    const nextName =
      typeof updates.name === 'string' && updates.name.trim()
        ? clampText(updates.name, 120)
        : currentRows[0].name;
    const nextUsn =
      typeof updates.usn === 'string'
        ? clampText(updates.usn, 40).toUpperCase()
        : existingSp?.usn ?? '';
    if (nextUsn) {
      const duplicateUsn = await db
        .select({ userId: studentProfiles.userId })
        .from(studentProfiles)
        .where(
          sql`UPPER(${studentProfiles.usn}) = ${nextUsn} AND ${studentProfiles.userId} <> ${studentId}`,
        )
        .limit(1);
      if (duplicateUsn.length > 0) {
        throw new StoreError(409, 'A student account with this USN already exists.');
      }
    }
    const nextBranch = updates.branch
      ? normalizeBranch(updates.branch)
      : normalizeBranch(existingSp?.branch ?? currentRows[0].branch);
    const nextSemester =
      typeof updates.semester === 'number'
        ? Math.min(8, Math.max(1, Math.round(updates.semester)))
        : existingSp?.semester ?? 6;
    const nextSkills = Array.isArray(updates.targetSkills)
      ? normalizeStringArray(updates.targetSkills, 15, 40)
      : existingSp?.targetSkills ?? ['Python'];
    const nextDomain =
      typeof updates.targetDomain === 'string'
        ? clampText(updates.targetDomain, 100) || 'Machine Learning & AI'
        : existingSp?.targetDomain ?? 'Machine Learning & AI';
    const nextMentorshipGoals = Array.isArray(updates.mentorshipGoals)
      ? normalizeStringArray(updates.mentorshipGoals, 8, 80)
      : existingSp?.mentorshipGoals ?? [];
    const nextCustomMentorshipGoal =
      typeof updates.customMentorshipGoal === 'string'
        ? clampText(updates.customMentorshipGoal, 240)
        : existingSp?.customMentorshipGoal ?? '';
    if (nextMentorshipGoals.includes('Other') && !nextCustomMentorshipGoal) {
      throw new StoreError(400, 'Describe your custom mentorship goal.');
    }
    const nextCompany =
      typeof updates.targetCompany === 'string'
        ? clampText(updates.targetCompany, 100)
        : existingSp?.targetCompany ?? '';
    const nextResumeUrl =
      typeof updates.resumeUrl === 'string'
        ? validateSafeHttpUrl(updates.resumeUrl)
        : existingSp?.resumeUrl ?? '';

    if (nextResumeUrl === null) {
      throw new StoreError(400, 'Resume / Portfolio URL must use http:// or https://.');
    }

    const nextResumeText =
      typeof updates.resumeText === 'string'
        ? clampText(updates.resumeText, 5000)
        : existingSp?.resumeText ?? '';
    const nextGithubUrl =
      typeof updates.githubUrl === 'string'
        ? validateSafeHttpUrl(updates.githubUrl)
        : existingSp?.githubUrl ?? '';
    const nextLinkedinUrl =
      typeof updates.linkedinUrl === 'string'
        ? validateSafeHttpUrl(updates.linkedinUrl)
        : existingSp?.linkedinUrl ?? '';
    const nextLeetcodeUrl =
      typeof updates.leetcodeUrl === 'string'
        ? validateSafeHttpUrl(updates.leetcodeUrl)
        : existingSp?.leetcodeUrl ?? '';

    if (nextGithubUrl === null || nextLinkedinUrl === null || nextLeetcodeUrl === null) {
      throw new StoreError(400, 'Professional profile links must use http:// or https://.');
    }
    const nextAvatarUrl =
      typeof updates.avatarUrl === 'string'
        ? validateSafeAvatarUrl(updates.avatarUrl)
        : existingSp?.avatarUrl ?? '';

    if (nextAvatarUrl === null) {
      throw new StoreError(
        400,
        'Avatar must be a PNG/JPG/WEBP photo (under 250KB), Kokonut avatar, or valid http(s) URL.',
      );
    }

    const nextInternship =
      typeof updates.lookingForInternship === 'boolean'
        ? updates.lookingForInternship
        : existingSp?.lookingForInternship ?? true;
    const nextProjectHelp =
      typeof updates.lookingForProjectHelp === 'boolean'
        ? updates.lookingForProjectHelp
        : existingSp?.lookingForProjectHelp ?? true;

    const subtitle = `Sem ${nextSemester} ${nextBranch}${nextUsn ? ` · ${nextUsn}` : ''}`;

    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ name: nextName, branch: nextBranch, subtitle, updatedAt: new Date() })
        .where(eq(users.id, studentId));

      await tx
        .insert(studentProfiles)
        .values({
          userId: studentId,
          usn: nextUsn,
          branch: nextBranch,
          semester: nextSemester,
          targetSkills: nextSkills.length > 0 ? nextSkills : ['Python'],
          targetDomain: nextDomain,
          mentorshipGoals: nextMentorshipGoals,
          customMentorshipGoal: nextCustomMentorshipGoal,
          targetCompany: nextCompany,
          resumeUrl: nextResumeUrl,
          resumeText: nextResumeText,
          githubUrl: nextGithubUrl,
          linkedinUrl: nextLinkedinUrl,
          leetcodeUrl: nextLeetcodeUrl,
          avatarUrl: nextAvatarUrl,
          lookingForInternship: nextInternship,
          lookingForProjectHelp: nextProjectHelp,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: studentProfiles.userId,
          set: {
            usn: nextUsn,
            branch: nextBranch,
            semester: nextSemester,
            targetSkills: nextSkills.length > 0 ? nextSkills : ['Python'],
            targetDomain: nextDomain,
            mentorshipGoals: nextMentorshipGoals,
            customMentorshipGoal: nextCustomMentorshipGoal,
            targetCompany: nextCompany,
            resumeUrl: nextResumeUrl,
            resumeText: nextResumeText,
            githubUrl: nextGithubUrl,
            linkedinUrl: nextLinkedinUrl,
            leetcodeUrl: nextLeetcodeUrl,
            avatarUrl: nextAvatarUrl,
            lookingForInternship: nextInternship,
            lookingForProjectHelp: nextProjectHelp,
            updatedAt: new Date(),
          },
        });
    });

    const refreshed = await this.getAuthUserById(studentId, 'student');
    if (!refreshed) throw new StoreError(404, 'Student profile not found.');
    return refreshed;
  }

  async saveStudentResume(
    studentId: string,
    fileName: string,
    fileData: Buffer,
  ): Promise<{ fileName: string }> {
    await ensureDatabaseSchema();
    const db = requireDb();
    const safeName = fileName
      .replace(/[\\/\u0000-\u001f\u007f]/g, '_')
      .trim()
      .slice(0, 120);
    if (!safeName || fileData.length < 5 || fileData.subarray(0, 5).toString() !== '%PDF-') {
      throw new StoreError(400, 'Please upload a valid PDF resume.');
    }

    await db.transaction(async (tx) => {
      await tx
        .insert(studentResumes)
        .values({
          userId: studentId,
          fileName: safeName,
          fileData,
          extractedData: {},
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: studentResumes.userId,
          set: {
            fileName: safeName,
            fileData,
            extractedData: {},
            updatedAt: new Date(),
          },
        });
      await tx
        .update(studentProfiles)
        .set({
          resumeFileName: safeName,
          resumeUrl: '/api/student-profile/resume',
          updatedAt: new Date(),
        })
        .where(eq(studentProfiles.userId, studentId));
    });

    return { fileName: safeName };
  }

  async getStudentResume(
    studentId: string,
    viewer: AuthUser,
  ): Promise<StoredResume> {
    await ensureDatabaseSchema();
    if (viewer.role !== 'admin' && viewer.id !== studentId) {
      throw new StoreError(403, 'You are not allowed to access this resume.');
    }
    const db = requireDb();
    const rows = await db
      .select({
        fileName: studentResumes.fileName,
        fileData: studentResumes.fileData,
      })
      .from(studentResumes)
      .where(eq(studentResumes.userId, studentId))
      .limit(1);
    if (!rows[0]) throw new StoreError(404, 'No resume has been uploaded.');
    return rows[0];
  }

  async updateAlumniDetails(
    alumniUser: AuthUser,
    payload: {
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
    },
  ): Promise<{ user: AuthUser; alumni: AlumniProfile }> {
    await ensureDatabaseSchema();
    const db = requireDb();

    const safeLinkedin = payload.linkedinUrl
      ? validateSafeHttpUrl(payload.linkedinUrl)
      : '';
    if (safeLinkedin === null) {
      throw new StoreError(400, 'LinkedIn URL must start with http:// or https://.');
    }

    const cleanName = clampText(payload.name, 120) || alumniUser.name;
    const cleanReg = clampText(payload.regNumber, 40).toUpperCase();
    const cleanRole = clampText(payload.role, 120) || 'Engineer';
    const cleanCompany = clampText(payload.company, 120) || 'Company';
    const cleanDomain = clampText(payload.domain, 100) || 'Full-Stack & FinTech';
    const cleanBranch = normalizeBranch(payload.branch);
    const gradYear = Math.min(2035, Math.max(1995, Math.round(Number(payload.graduationYear) || 2022)));
    const cleanSkills = normalizeStringArray(payload.skills, 20, 40);
    const cleanLocation = clampText(payload.location, 100) || 'Bengaluru';
    const cleanBio = clampText(payload.bio, 1000);
    const cleanContactEmail = normalizeEmail(payload.contactEmail) || alumniUser.email;
    const cleanPhone = clampText(payload.phone, 40);
    const subtitle = `${cleanRole}, ${cleanCompany} · ${gradYear} ${cleanBranch}`;

    const existingRows = await db
      .select()
      .from(alumniProfiles)
      .where(eq(alumniProfiles.ownerUid, alumniUser.id))
      .limit(1);
    const targetAlumniId = existingRows[0]?.id ?? alumniUser.id;
    if (cleanReg) {
      const duplicateReg = await db
        .select({ id: alumniProfiles.id })
        .from(alumniProfiles)
        .where(
          sql`UPPER(${alumniProfiles.regNumber}) = ${cleanReg} AND ${alumniProfiles.id} <> ${targetAlumniId}`,
        )
        .limit(1);
      if (duplicateReg.length > 0) {
        throw new StoreError(409, 'An alumni account with this USN already exists.');
      }
    }

    let nextAvatarUrl: string | null = existingRows[0]?.avatarUrl ?? null;
    if (typeof payload.avatarUrl === 'string') {
      const validatedAvatar = validateSafeAvatarUrl(payload.avatarUrl);
      if (validatedAvatar === null) {
        throw new StoreError(
          400,
          'Avatar must be a PNG/JPG/WEBP photo (under 250KB), Kokonut avatar, or valid http(s) URL.',
        );
      }
      nextAvatarUrl = validatedAvatar || null;
    }

    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ name: cleanName, branch: cleanBranch, subtitle, updatedAt: new Date() })
        .where(eq(users.id, alumniUser.id));

      await tx
        .insert(alumniProfiles)
        .values({
          id: targetAlumniId,
          ownerUid: alumniUser.id,
          name: cleanName,
          graduationYear: gradYear,
          branch: cleanBranch,
          role: cleanRole,
          company: cleanCompany,
          domain: cleanDomain,
          skills: cleanSkills.length > 0 ? cleanSkills : [cleanDomain],
          location: cleanLocation,
          bio: cleanBio,
          avatarUrl: nextAvatarUrl,
          regNumber: cleanReg,
          source: existingRows[0]?.source ?? 'self-registered',
          verificationStatus: existingRows[0]?.verificationStatus ?? 'pending',
          openToInternshipReferrals: Boolean(payload.openToInternshipReferrals),
          openToProjectMentoring: Boolean(payload.openToProjectMentoring),
          sharedProjectGuidesCount: existingRows[0]?.sharedProjectGuidesCount ?? 0,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: alumniProfiles.id,
          set: {
            name: cleanName,
            graduationYear: gradYear,
            branch: cleanBranch,
            role: cleanRole,
            company: cleanCompany,
            domain: cleanDomain,
            skills: cleanSkills.length > 0 ? cleanSkills : [cleanDomain],
            location: cleanLocation,
            bio: cleanBio,
            avatarUrl: nextAvatarUrl,
            regNumber: cleanReg,
            openToInternshipReferrals: Boolean(payload.openToInternshipReferrals),
            openToProjectMentoring: Boolean(payload.openToProjectMentoring),
            updatedAt: new Date(),
          },
        });

      if (typeof payload.avatarUrl === 'string') {
        await tx
          .update(mentorshipRequests)
          .set({ alumniAvatarUrl: nextAvatarUrl })
          .where(eq(mentorshipRequests.alumniId, targetAlumniId));
      }

      await tx
        .insert(alumniPrivateContacts)
        .values({
          alumniId: targetAlumniId,
          email: cleanContactEmail,
          phone: cleanPhone,
          linkedinUrl: safeLinkedin,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: alumniPrivateContacts.alumniId,
          set: {
            email: cleanContactEmail,
            phone: cleanPhone,
            linkedinUrl: safeLinkedin,
            updatedAt: new Date(),
          },
        });
    });

    const refreshedUser = await this.getAuthUserById(alumniUser.id, 'alumni');
    const profileRes = await this.listAlumni(alumniUser, {
      includeAll: false,
      page: 1,
      limit: 50,
    });
    const ownProfile = profileRes.items.find((a) => a.id === targetAlumniId);
    if (!refreshedUser || !ownProfile) {
      throw new StoreError(404, 'Alumni profile not found.');
    }
    return { user: refreshedUser, alumni: ownProfile };
  }

  async updateAlumniAvailability(
    alumniUser: AuthUser,
    updates: {
      openToInternshipReferrals?: boolean;
      openToProjectMentoring?: boolean;
    },
  ): Promise<AlumniProfile> {
    await ensureDatabaseSchema();
    const db = requireDb();

    const rows = await db
      .select()
      .from(alumniProfiles)
      .where(eq(alumniProfiles.ownerUid, alumniUser.id))
      .limit(1);
    const existing = rows[0];
    if (!existing) {
      throw new StoreError(404, 'Alumni profile not found.');
    }

    await db
      .update(alumniProfiles)
      .set({
        openToInternshipReferrals:
          typeof updates.openToInternshipReferrals === 'boolean'
            ? updates.openToInternshipReferrals
            : existing.openToInternshipReferrals,
        openToProjectMentoring:
          typeof updates.openToProjectMentoring === 'boolean'
            ? updates.openToProjectMentoring
            : existing.openToProjectMentoring,
        updatedAt: new Date(),
      })
      .where(eq(alumniProfiles.id, existing.id));

    const res = await this.listAlumni(alumniUser, { page: 1, limit: 50 });
    const found = res.items.find((a) => a.id === existing.id);
    if (!found) throw new StoreError(404, 'Alumni profile not found.');
    return found;
  }

  async updateAdminDetails(
    adminUser: AuthUser,
    payload: { name: string; subtitle: string; branch: BranchCode },
  ): Promise<AuthUser> {
    await ensureDatabaseSchema();
    const db = requireDb();

    const cleanName = clampText(payload.name, 120) || adminUser.name;
    const cleanSubtitle =
      clampText(payload.subtitle, 160) || 'Placement & Alumni Cell · KLS VDIT';
    const cleanBranch = normalizeBranch(payload.branch);

    await db
      .update(users)
      .set({
        name: cleanName,
        subtitle: cleanSubtitle,
        branch: cleanBranch,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, adminUser.id), eq(users.role, 'admin')));

    const refreshed = await this.getAuthUserById(adminUser.id, 'admin');
    if (!refreshed) throw new StoreError(404, 'Admin profile not found.');
    return refreshed;
  }

  async listAlumni(
    viewer: AuthUser,
    options: {
      includeAll?: boolean;
      page?: number;
      limit?: number;
      search?: string;
      skill?: string;
      company?: string;
      role?: string;
      domain?: string;
      internshipOnly?: boolean;
      projectHelpOnly?: boolean;
      savedOnly?: boolean;
      sortBy?: 'match' | 'upvotes' | 'batch';
    } = {},
  ): Promise<AlumniDiscoveryResponse> {
    await ensureDatabaseSchema();
    const db = requireDb();

    const showAllStatuses = Boolean(options.includeAll && viewer.role === 'admin');
    const allRows = await db.select().from(alumniProfiles);
    const accountRows = await db
      .select({ id: users.id, isActive: users.isActive })
      .from(users)
      .where(eq(users.role, 'alumni'));
    const activeAccounts = new Map(accountRows.map((row) => [row.id, row.isActive]));

    const visibleBase = showAllStatuses
      ? allRows
      : allRows.filter(
          (a) =>
            activeAccounts.get(a.ownerUid) === true &&
            (a.verificationStatus === 'verified' ||
              (viewer.role === 'alumni' && a.ownerUid === viewer.id)),
        );

    const guidesRows = await db.select().from(knowledgeGuides);
    const topGuideByAlumni = new Map<
      string,
      { guideId: string; title: string; upvotes: number }
    >();
    for (const g of guidesRows) {
      const existing = topGuideByAlumni.get(g.authorAlumniId);
      if (!existing || g.upvotes > existing.upvotes) {
        topGuideByAlumni.set(g.authorAlumniId, {
          guideId: g.id,
          title: g.title,
          upvotes: g.upvotes,
        });
      }
    }

    // Build facets across all verified profiles
    const verifiedPool = allRows.filter(
      (a) =>
        activeAccounts.get(a.ownerUid) === true &&
        a.verificationStatus === 'verified',
    );
    const skillSet = new Set<string>();
    const companySet = new Set<string>();
    const roleSet = new Set<string>();
    const domainSet = new Set<string>();
    for (const a of verifiedPool) {
      a.skills.forEach((s) => skillSet.add(s));
      companySet.add(a.company);
      roleSet.add(a.role);
      domainSet.add(a.domain);
    }

    // Saved bookmarks for savedOnly filter
    const savedRows = await db
      .select({ targetId: userBookmarks.targetId })
      .from(userBookmarks)
      .where(
        and(eq(userBookmarks.userId, viewer.id), eq(userBookmarks.kind, 'alumni')),
      );
    const savedSet = new Set(savedRows.map((r) => r.targetId));

    // Accepted mentorships for PII contact unlocking
    const acceptedSet = new Set<string>();
    if (viewer.role === 'student') {
      const acceptedRows = await db
        .select({ alumniId: mentorshipRequests.alumniId })
        .from(mentorshipRequests)
        .where(
          and(
            eq(mentorshipRequests.studentId, viewer.id),
            eq(mentorshipRequests.status, 'accepted'),
          ),
        );
      acceptedRows.forEach((r) => acceptedSet.add(r.alumniId));
    }

    // Filter rows
    const query = (options.search ?? '').trim().toLowerCase();
    const skill = options.skill ?? 'All';
    const company = options.company ?? 'All';
    const roleFilter = options.role ?? 'All';
    const domain = options.domain ?? 'All';

    const filtered = visibleBase.filter((a) => {
      if (!showAllStatuses && activeAccounts.get(a.ownerUid) !== true) return false;
      if (!showAllStatuses && viewer.role === 'student' && a.verificationStatus !== 'verified') {
        return false;
      }
      if (options.savedOnly && !savedSet.has(a.id)) return false;
      if (skill !== 'All' && !a.skills.some((s) => s.toLowerCase() === skill.toLowerCase())) {
        return false;
      }
      if (company !== 'All' && a.company.toLowerCase() !== company.toLowerCase()) {
        return false;
      }
      if (roleFilter !== 'All' && !a.role.toLowerCase().includes(roleFilter.toLowerCase())) {
        return false;
      }
      if (domain !== 'All' && a.domain.toLowerCase() !== domain.toLowerCase()) {
        return false;
      }
      if (options.internshipOnly && !a.openToInternshipReferrals) return false;
      if (options.projectHelpOnly && !a.openToProjectMentoring) return false;

      if (query) {
        const highlight = topGuideByAlumni.get(a.id)?.title ?? '';
        const haystack = [
          a.name,
          a.company,
          a.role,
          a.domain,
          a.branch,
          String(a.graduationYear),
          ...a.skills,
          highlight,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });

    // Sort filtered rows before server pagination
    const sortBy = options.sortBy ?? 'match';
    const studentProfile: StudentTargetProfile = viewer.studentProfile ?? {
      id: viewer.id,
      name: viewer.name,
      email: viewer.email,
      usn: '',
      branch: 'CSE',
      semester: 6,
      targetSkills: ['Python', 'Machine Learning'],
      targetDomain: 'Machine Learning & AI',
      mentorshipGoals: [],
      customMentorshipGoal: '',
      targetCompany: '',
      resumeUrl: '',
      lookingForInternship: true,
      lookingForProjectHelp: true,
    };

    const sorted = [...filtered].sort((a, b) => {
      if (showAllStatuses) {
        return b.submittedAt.getTime() - a.submittedAt.getTime();
      }
      if (sortBy === 'upvotes') {
        return (
          (topGuideByAlumni.get(b.id)?.upvotes ?? 0) -
          (topGuideByAlumni.get(a.id)?.upvotes ?? 0)
        );
      }
      if (sortBy === 'batch') {
        return b.graduationYear - a.graduationYear;
      }
      const scoreA = computeServerMatchScore(
        a,
        studentProfile,
        skill,
        company,
        roleFilter,
        domain,
      );
      const scoreB = computeServerMatchScore(
        b,
        studentProfile,
        skill,
        company,
        roleFilter,
        domain,
      );
      if (scoreB !== scoreA) return scoreB - scoreA;
      return (
        (topGuideByAlumni.get(b.id)?.upvotes ?? 0) -
        (topGuideByAlumni.get(a.id)?.upvotes ?? 0)
      );
    });

    const total = sorted.length;
    const limit = showAllStatuses
      ? Math.max(1, options.limit ?? 100)
      : Math.max(1, options.limit ?? 8);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(totalPages, Math.max(1, options.page ?? 1));
    const offset = (page - 1) * limit;
    const pageRows = sorted.slice(offset, offset + limit);

    // Fetch gated contacts ONLY for authorized rows in this page
    const authorizedContactIds = pageRows
      .filter(
        (a) =>
          viewer.role === 'admin' ||
          (viewer.role === 'alumni' && a.ownerUid === viewer.id) ||
          (viewer.role === 'student' && acceptedSet.has(a.id)),
      )
      .map((a) => a.id);

    const contactMap = new Map<string, AlumniContact>();
    if (authorizedContactIds.length > 0) {
      const contactRows = await db
        .select()
        .from(alumniPrivateContacts)
        .where(inArray(alumniPrivateContacts.alumniId, authorizedContactIds));
      for (const c of contactRows) {
        contactMap.set(c.alumniId, {
          email: c.email,
          phone: c.phone,
          linkedinUrl: c.linkedinUrl,
        });
      }
    }

    const items: AlumniProfile[] = pageRows.map((a) => {
      const contact = contactMap.get(a.id) ?? null;
      return {
        id: a.id,
        ownerUid: a.ownerUid,
        accountActive: activeAccounts.get(a.ownerUid) === true,
        name: a.name,
        graduationYear: a.graduationYear,
        branch: normalizeBranch(a.branch),
        role: a.role,
        company: a.company,
        domain: a.domain,
        skills: a.skills,
        location: a.location,
        openToInternshipReferrals: a.openToInternshipReferrals,
        openToProjectMentoring: a.openToProjectMentoring,
        sharedProjectGuidesCount: a.sharedProjectGuidesCount,
        bio: a.bio,
        avatarUrl: a.avatarUrl ?? undefined,
        verificationStatus: a.verificationStatus as VerificationStatus,
        regNumber: a.regNumber,
        source: a.source as AlumniProfile['source'],
        submittedAt: formatShortDate(a.submittedAt),
        topHighlight: topGuideByAlumni.get(a.id),
        contact,
        isContactGated: contact === null,
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
      facets: {
        skills: Array.from(skillSet).sort(),
        companies: Array.from(companySet).sort(),
        roles: Array.from(roleSet).sort(),
        domains: Array.from(domainSet).sort(),
      },
    };
  }

  async setAlumniVerificationStatus(
    alumniId: string,
    status: 'verified' | 'rejected',
    admin: AuthUser,
  ): Promise<AlumniProfile> {
    await ensureDatabaseSchema();
    const db = requireDb();

    const updated = await db
      .update(alumniProfiles)
      .set({ verificationStatus: status, updatedAt: new Date() })
      .where(eq(alumniProfiles.id, alumniId))
      .returning();

    if (updated.length === 0) {
      throw new StoreError(404, 'Alumni profile not found.');
    }

    const res = await this.listAlumni(admin, { includeAll: true, limit: 200 });
    const found = res.items.find((a) => a.id === alumniId);
    if (!found) throw new StoreError(404, 'Alumni profile not found.');
    return found;
  }

  async listMentorships(viewer: AuthUser): Promise<MentorshipRequest[]> {
    await ensureDatabaseSchema();
    const db = requireDb();

    const rows =
      viewer.role === 'student'
        ? await db
            .select()
            .from(mentorshipRequests)
            .where(eq(mentorshipRequests.studentId, viewer.id))
            .orderBy(desc(mentorshipRequests.createdAt))
        : viewer.role === 'alumni'
          ? await db
              .select()
              .from(mentorshipRequests)
              .where(eq(mentorshipRequests.alumniOwnerUid, viewer.id))
              .orderBy(desc(mentorshipRequests.createdAt))
          : await db
              .select()
              .from(mentorshipRequests)
              .orderBy(desc(mentorshipRequests.createdAt));

    if (rows.length === 0) return [];

    const requestIds = rows.map((r) => r.id);
    const [msgRows, sessionRows] = await Promise.all([
      db
        .select()
        .from(mentorshipMessages)
        .where(inArray(mentorshipMessages.mentorshipId, requestIds))
        .orderBy(mentorshipMessages.createdAt),
      db
        .select()
        .from(mentorshipSessions)
        .where(inArray(mentorshipSessions.mentorshipId, requestIds)),
    ]);

    const acceptedAlumniIds = Array.from(
      new Set(
        rows
          .filter(
            (r) =>
              r.status === 'accepted' ||
              viewer.role === 'admin' ||
              (viewer.role === 'alumni' && r.alumniOwnerUid === viewer.id),
          )
          .map((r) => r.alumniId),
      ),
    );

    const contactMap = new Map<string, AlumniContact>();
    if (acceptedAlumniIds.length > 0) {
      const contacts = await db
        .select()
        .from(alumniPrivateContacts)
        .where(inArray(alumniPrivateContacts.alumniId, acceptedAlumniIds));
      for (const c of contacts) {
        contactMap.set(c.alumniId, {
          email: c.email,
          phone: c.phone,
          linkedinUrl: c.linkedinUrl,
        });
      }
    }

    const msgsByReq = new Map<string, typeof msgRows>();
    for (const m of msgRows) {
      const list = msgsByReq.get(m.mentorshipId) ?? [];
      list.push(m);
      msgsByReq.set(m.mentorshipId, list);
    }

    const sessionByReq = new Map<string, MentorshipSessionBooking>();
    for (const s of sessionRows) {
      sessionByReq.set(s.mentorshipId, {
        id: s.id,
        slotLabel: s.slotLabel,
        topic: s.topic,
        status: s.status as 'requested' | 'confirmed',
        meetingLink: s.meetingLink,
        bookedAt: s.bookedAt.toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric',
        }),
      });
    }

    return rows.map((r) => {
      const threadMsgs = msgsByReq.get(r.id) ?? [];
      const lastRead =
        viewer.role === 'student' ? r.studentLastReadAt : r.alumniLastReadAt;

      let unreadCount = 0;
      if (viewer.role === 'student' || viewer.role === 'alumni') {
        unreadCount = threadMsgs.filter(
          (m) =>
            m.senderId !== viewer.id &&
            (!lastRead || m.createdAt.getTime() > lastRead.getTime()),
        ).length;
        if (viewer.role === 'alumni' && r.status === 'pending' && !r.alumniLastReadAt) {
          unreadCount += 1;
        }
      }

      const canUnlock =
        r.status === 'accepted' ||
        viewer.role === 'admin' ||
        (viewer.role === 'alumni' && r.alumniOwnerUid === viewer.id);

      const formattedMsgs: MentorshipMessage[] = threadMsgs.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        senderName: m.senderName,
        senderRole: m.senderRole as UserRole,
        text: m.text,
        sentAt: formatMessageTime(m.createdAt),
        createdAt: m.createdAt.toISOString(),
      }));

      return {
        id: r.id,
        studentId: r.studentId,
        studentName: r.studentName,
        studentBranch: normalizeBranch(r.studentBranch),
        studentSemester: r.studentSemester,
        studentUsn: r.studentUsn,
        alumniId: r.alumniId,
        alumniOwnerUid: r.alumniOwnerUid,
        alumniName: r.alumniName,
        alumniRole: r.alumniRole,
        alumniCompany: r.alumniCompany,
        alumniBranch: normalizeBranch(r.alumniBranch),
        alumniGraduationYear: r.alumniGraduationYear,
        alumniAvatarUrl: r.alumniAvatarUrl ?? undefined,
        goal: r.goal as MentorshipGoal,
        message: r.message,
        status: r.status as MentorshipRequest['status'],
        createdAt: r.createdAt.toISOString(),
        respondedAt: r.respondedAt?.toISOString(),
        unreadCount,
        unlockedContact: canUnlock ? contactMap.get(r.alumniId) ?? null : null,
        messages: formattedMsgs,
        sessionBooking: sessionByReq.get(r.id) ?? null,
      };
    });
  }

  async createMentorshipRequest(
    studentUser: AuthUser,
    input: { alumniId: string; goal: MentorshipGoal; message: string },
  ): Promise<MentorshipRequest> {
    await ensureDatabaseSchema();
    const db = requireDb();

    const sp = studentUser.studentProfile;
    const aluRows = await db
      .select()
      .from(alumniProfiles)
      .where(
        and(
          eq(alumniProfiles.id, input.alumniId),
          eq(alumniProfiles.verificationStatus, 'verified'),
        ),
      )
      .limit(1);
    const alumnus = aluRows[0];
    if (!alumnus) {
      throw new StoreError(404, 'Verified alumnus not found.');
    }

    const existing = await db
      .select()
      .from(mentorshipRequests)
      .where(
        and(
          eq(mentorshipRequests.studentId, studentUser.id),
          eq(mentorshipRequests.alumniId, alumnus.id),
        ),
      );
    if (existing.some((m) => m.status === 'pending' || m.status === 'accepted')) {
      throw new StoreError(
        409,
        'You already have an active or pending request with this mentor.',
      );
    }

    const reqId = `mr-${crypto.randomUUID().slice(0, 12)}`;
    const now = new Date();
    await db.insert(mentorshipRequests).values({
      id: reqId,
      studentId: studentUser.id,
      studentName: studentUser.name,
      studentBranch: sp?.branch ?? 'CSE',
      studentSemester: sp?.semester ?? 6,
      studentUsn: sp?.usn ?? '',
      alumniId: alumnus.id,
      alumniOwnerUid: alumnus.ownerUid,
      alumniName: alumnus.name,
      alumniRole: alumnus.role,
      alumniCompany: alumnus.company,
      alumniBranch: alumnus.branch,
      alumniGraduationYear: alumnus.graduationYear,
      alumniAvatarUrl: alumnus.avatarUrl,
      goal: input.goal,
      message: clampText(input.message, 1000),
      status: 'pending',
      studentLastReadAt: now,
    });

    const list = await this.listMentorships(studentUser);
    const created = list.find((m) => m.id === reqId);
    if (!created) throw new StoreError(500, 'Failed to create mentorship request.');
    return created;
  }

  async respondToMentorship(
    alumniUser: AuthUser,
    requestId: string,
    decision: 'accepted' | 'declined',
  ): Promise<{
    request: MentorshipRequest;
    studentEmail?: string;
    studentName?: string;
    notificationId?: string;
  }> {
    await ensureDatabaseSchema();
    const db = requireDb();

    const rows = await db
      .select()
      .from(mentorshipRequests)
      .where(eq(mentorshipRequests.id, requestId))
      .limit(1);
    const req = rows[0];
    if (!req) throw new StoreError(404, 'Mentorship request not found.');
    if (req.alumniOwnerUid !== alumniUser.id) {
      throw new StoreError(
        403,
        'You can only respond to requests addressed to your profile.',
      );
    }

    const now = new Date();
    let notificationId: string | undefined;

    await db.transaction(async (tx) => {
      await tx
        .update(mentorshipRequests)
        .set({
          status: decision,
          respondedAt: now,
          alumniLastReadAt: now,
        })
        .where(eq(mentorshipRequests.id, requestId));

      if (decision === 'accepted') {
        notificationId = `notif-${crypto.randomUUID().slice(0, 12)}`;
        await tx.insert(notifications).values({
          id: notificationId,
          userId: req.studentId,
          kind: 'mentorship_accepted',
          title: `${req.alumniName} accepted your mentorship request`,
          body: `Direct contact details for ${req.alumniName} (${req.alumniRole}, ${req.alumniCompany}) are now unlocked in My Mentors.`,
          emailSent: false,
          isRead: false,
        });
      }
    });

    let studentEmail: string | undefined;
    let studentName: string | undefined;
    if (decision === 'accepted') {
      const stuRows = await db
        .select({ email: users.email, name: users.name })
        .from(users)
        .where(eq(users.id, req.studentId))
        .limit(1);
      studentEmail = stuRows[0]?.email;
      studentName = stuRows[0]?.name;
    }

    const list = await this.listMentorships(alumniUser);
    const updated = list.find((m) => m.id === requestId);
    if (!updated) throw new StoreError(404, 'Mentorship request not found.');

    return { request: updated, studentEmail, studentName, notificationId };
  }

  async markNotificationEmailSent(notificationId: string): Promise<void> {
    await ensureDatabaseSchema();
    const db = requireDb();
    await db
      .update(notifications)
      .set({ emailSent: true })
      .where(eq(notifications.id, notificationId));
  }

  async markMentorshipRead(viewer: AuthUser, requestId: string): Promise<void> {
    await ensureDatabaseSchema();
    const db = requireDb();

    const rows = await db
      .select()
      .from(mentorshipRequests)
      .where(eq(mentorshipRequests.id, requestId))
      .limit(1);
    const req = rows[0];
    if (!req) throw new StoreError(404, 'Mentorship connection not found.');

    const now = new Date();
    if (viewer.role === 'student' && req.studentId === viewer.id) {
      await db
        .update(mentorshipRequests)
        .set({ studentLastReadAt: now })
        .where(eq(mentorshipRequests.id, requestId));
      return;
    }
    if (viewer.role === 'alumni' && req.alumniOwnerUid === viewer.id) {
      await db
        .update(mentorshipRequests)
        .set({ alumniLastReadAt: now })
        .where(eq(mentorshipRequests.id, requestId));
      return;
    }
    throw new StoreError(403, 'Not authorized to mark this thread as read.');
  }

  async addMentorshipMessage(
    sender: AuthUser,
    requestId: string,
    text: string,
  ): Promise<MentorshipRequest> {
    await ensureDatabaseSchema();
    const db = requireDb();

    const rows = await db
      .select()
      .from(mentorshipRequests)
      .where(eq(mentorshipRequests.id, requestId))
      .limit(1);
    const req = rows[0];
    if (!req) throw new StoreError(404, 'Mentorship connection not found.');
    if (req.status !== 'accepted') {
      throw new StoreError(
        400,
        'Messaging unlocks once the alumnus accepts the mentorship request.',
      );
    }

    const isParticipant =
      (sender.role === 'student' && req.studentId === sender.id) ||
      (sender.role === 'alumni' && req.alumniOwnerUid === sender.id);
    if (!isParticipant) {
      throw new StoreError(403, 'Only participants in this mentorship can send messages.');
    }

    const cleanText = clampText(text, 1000);
    if (!cleanText) throw new StoreError(400, 'Message cannot be empty.');

    const now = new Date();
    await db.transaction(async (tx) => {
      await tx.insert(mentorshipMessages).values({
        id: `msg-${crypto.randomUUID().slice(0, 12)}`,
        mentorshipId: requestId,
        senderId: sender.id,
        senderName: sender.name,
        senderRole: sender.role,
        text: cleanText,
        createdAt: now,
      });

      if (sender.role === 'student') {
        await tx
          .update(mentorshipRequests)
          .set({ studentLastReadAt: now })
          .where(eq(mentorshipRequests.id, requestId));
      } else {
        await tx
          .update(mentorshipRequests)
          .set({ alumniLastReadAt: now })
          .where(eq(mentorshipRequests.id, requestId));
      }
    });

    const list = await this.listMentorships(sender);
    const updated = list.find((m) => m.id === requestId);
    if (!updated) throw new StoreError(404, 'Mentorship connection not found.');
    return updated;
  }

  async bookMentorshipSession(
    studentUser: AuthUser,
    requestId: string,
    input: { slotLabel: string; topic: string },
  ): Promise<MentorshipRequest> {
    await ensureDatabaseSchema();
    const db = requireDb();

    const rows = await db
      .select()
      .from(mentorshipRequests)
      .where(eq(mentorshipRequests.id, requestId))
      .limit(1);
    const req = rows[0];
    if (!req) throw new StoreError(404, 'Mentorship connection not found.');
    if (req.studentId !== studentUser.id || req.status !== 'accepted') {
      throw new StoreError(403, 'You can only book calls with accepted mentors.');
    }

    const slotLabel = clampText(input.slotLabel, 120);
    if (!slotLabel) throw new StoreError(400, 'Please select a time slot.');
    const topic = clampText(input.topic, 200) || req.goal;
    const meetingLink = `https://meet.jit.si/partha-klsvdit-${req.id.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 24)}`;

    await db
      .insert(mentorshipSessions)
      .values({
        id: `sess-${crypto.randomUUID().slice(0, 10)}`,
        mentorshipId: requestId,
        slotLabel,
        topic,
        status: 'requested',
        meetingLink,
      })
      .onConflictDoUpdate({
        target: mentorshipSessions.mentorshipId,
        set: {
          slotLabel,
          topic,
          status: 'requested',
          bookedAt: new Date(),
        },
      });

    const list = await this.listMentorships(studentUser);
    const updated = list.find((m) => m.id === requestId);
    if (!updated) throw new StoreError(404, 'Mentorship connection not found.');
    return updated;
  }

  async confirmMentorshipSession(
    alumniUser: AuthUser,
    requestId: string,
  ): Promise<MentorshipRequest> {
    await ensureDatabaseSchema();
    const db = requireDb();

    const reqRows = await db
      .select()
      .from(mentorshipRequests)
      .where(eq(mentorshipRequests.id, requestId))
      .limit(1);
    const req = reqRows[0];
    if (!req) throw new StoreError(404, 'Mentorship connection not found.');
    if (req.alumniOwnerUid !== alumniUser.id) {
      throw new StoreError(403, 'Only the mentor can confirm this session.');
    }

    const updated = await db
      .update(mentorshipSessions)
      .set({ status: 'confirmed' })
      .where(eq(mentorshipSessions.mentorshipId, requestId))
      .returning();
    if (updated.length === 0) {
      throw new StoreError(404, 'No session request found.');
    }

    const list = await this.listMentorships(alumniUser);
    const found = list.find((m) => m.id === requestId);
    if (!found) throw new StoreError(404, 'Mentorship connection not found.');
    return found;
  }

  async getBookmarks(userId: string): Promise<UserBookmarks> {
    await ensureDatabaseSchema();
    const db = requireDb();
    const rows = await db
      .select()
      .from(userBookmarks)
      .where(eq(userBookmarks.userId, userId));
    return {
      alumniIds: rows.filter((r) => r.kind === 'alumni').map((r) => r.targetId),
      opportunityIds: rows.filter((r) => r.kind === 'opportunity').map((r) => r.targetId),
    };
  }

  async toggleBookmark(
    userId: string,
    kind: 'alumni' | 'opportunity',
    targetId: string,
  ): Promise<UserBookmarks> {
    await ensureDatabaseSchema();
    const db = requireDb();
    const cleanTarget = clampText(targetId, 120);
    if (!cleanTarget) throw new StoreError(400, 'Invalid bookmark target.');

    const existing = await db
      .select()
      .from(userBookmarks)
      .where(
        and(
          eq(userBookmarks.userId, userId),
          eq(userBookmarks.kind, kind),
          eq(userBookmarks.targetId, cleanTarget),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .delete(userBookmarks)
        .where(
          and(
            eq(userBookmarks.userId, userId),
            eq(userBookmarks.kind, kind),
            eq(userBookmarks.targetId, cleanTarget),
          ),
        );
    } else {
      await db.insert(userBookmarks).values({
        userId,
        kind,
        targetId: cleanTarget,
      });
    }

    return this.getBookmarks(userId);
  }

  async listOpportunities(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      type?: string;
      domain?: string;
      savedOnly?: boolean;
    } = {},
  ): Promise<OpportunitiesPaginatedResponse> {
    await ensureDatabaseSchema();
    const db = requireDb();

    const [storedRows, accountRows] = await Promise.all([
      db
      .select()
      .from(opportunities)
      .orderBy(desc(opportunities.createdAt)),
      db.select({ id: users.id, isActive: users.isActive }).from(users),
    ]);
    const activeAccounts = new Map(accountRows.map((row) => [row.id, row.isActive]));
    const allRows = storedRows.filter(
      (opportunity) => activeAccounts.get(opportunity.postedById) === true,
    );

    const domainSet = new Set<string>();
    allRows.forEach((o) => domainSet.add(o.domain));

    let savedSet: Set<string> | null = null;
    if (options.savedOnly) {
      const bm = await db
        .select({ targetId: userBookmarks.targetId })
        .from(userBookmarks)
        .where(
          and(
            eq(userBookmarks.userId, userId),
            eq(userBookmarks.kind, 'opportunity'),
          ),
        );
      savedSet = new Set(bm.map((r) => r.targetId));
    }

    const filtered = allRows.filter((o) => {
      if (options.type && options.type !== 'All' && o.type !== options.type) {
        return false;
      }
      if (options.domain && options.domain !== 'All' && o.domain !== options.domain) {
        return false;
      }
      if (savedSet && !savedSet.has(o.id)) {
        return false;
      }
      return true;
    });

    const total = filtered.length;
    const limit = Math.max(1, options.limit ?? 8);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(totalPages, Math.max(1, options.page ?? 1));
    const offset = (page - 1) * limit;

    const items: Opportunity[] = filtered.slice(offset, offset + limit).map((o) => ({
      id: o.id,
      title: o.title,
      company: o.company,
      type: o.type as OpportunityType,
      domain: o.domain,
      location: o.location,
      stipendOrCtc: o.stipendOrCtc,
      skills: o.skills,
      description: o.description,
      applyUrl: o.applyUrl,
      postedById: o.postedById,
      postedByAlumniId: o.postedByAlumniId,
      postedByName: o.postedByName,
      postedByRole: o.postedByRole,
      postedAt: formatShortDate(o.createdAt),
      isRemote: o.isRemote,
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
      domains: Array.from(domainSet).sort(),
    };
  }

  async createOpportunity(
    user: AuthUser,
    input: {
      title: string;
      company: string;
      type: OpportunityType;
      domain: string;
      location: string;
      stipendOrCtc: string;
      skills: string[];
      description: string;
      applyUrl: string;
      isRemote: boolean;
    },
  ): Promise<Opportunity> {
    await ensureDatabaseSchema();
    const db = requireDb();

    let alumniId = user.id;
    let defaultCompany = 'Partner Team';
    let postedByRole = user.subtitle;

    if (user.role === 'alumni') {
      const rows = await db
        .select()
        .from(alumniProfiles)
        .where(eq(alumniProfiles.ownerUid, user.id))
        .limit(1);
      const author = rows[0];
      if (!author || author.verificationStatus !== 'verified') {
        throw new StoreError(403, 'Only verified alumni can post opportunities.');
      }
      alumniId = author.id;
      defaultCompany = author.company;
      postedByRole = `${author.role} · ${author.company}`;
    }

    const safeApplyUrl = validateSafeHttpUrl(input.applyUrl);
    if (safeApplyUrl === null) {
      throw new StoreError(400, 'Apply URL must use http:// or https://.');
    }

    const oppId = `opp-${crypto.randomUUID().slice(0, 12)}`;
    const inserted = await db
      .insert(opportunities)
      .values({
        id: oppId,
        title: clampText(input.title, 160),
        company: clampText(input.company, 120) || defaultCompany,
        type: input.type,
        domain: clampText(input.domain, 100),
        location: clampText(input.location, 100) || 'Bengaluru',
        stipendOrCtc: clampText(input.stipendOrCtc, 80) || 'Competitive',
        skills: normalizeStringArray(input.skills, 15, 40),
        description: clampText(input.description, 2000),
        applyUrl: safeApplyUrl || '',
        postedById: user.id,
        postedByAlumniId: alumniId,
        postedByName: user.name,
        postedByRole,
        isRemote: Boolean(input.isRemote),
      })
      .returning();

    const o = inserted[0];
    return {
      id: o.id,
      title: o.title,
      company: o.company,
      type: o.type as OpportunityType,
      domain: o.domain,
      location: o.location,
      stipendOrCtc: o.stipendOrCtc,
      skills: o.skills,
      description: o.description,
      applyUrl: o.applyUrl,
      postedById: o.postedById,
      postedByAlumniId: o.postedByAlumniId,
      postedByName: o.postedByName,
      postedByRole: o.postedByRole,
      postedAt: formatShortDate(o.createdAt),
      isRemote: o.isRemote,
    };
  }

  async submitOpportunityApplication(
    student: AuthUser,
    opportunityId: string,
    fileName: string,
    resumeData: Buffer,
  ): Promise<OpportunityApplication> {
    await ensureDatabaseSchema();
    if (student.role !== 'student') {
      throw new StoreError(403, 'Only students can apply to opportunities.');
    }
    if (resumeData.length < 5 || resumeData.subarray(0, 5).toString() !== '%PDF-') {
      throw new StoreError(400, 'Please upload a valid PDF resume.');
    }

    const db = requireDb();
    const opportunity = await db
      .select({ id: opportunities.id })
      .from(opportunities)
      .where(eq(opportunities.id, opportunityId))
      .limit(1);
    if (!opportunity[0]) throw new StoreError(404, 'Opportunity not found.');

    const safeName = fileName
      .replace(/[\\/\u0000-\u001f\u007f]/g, '_')
      .trim()
      .slice(0, 120);
    if (!safeName) throw new StoreError(400, 'Resume filename is required.');

    const applicationId = `app-${crypto.randomUUID().slice(0, 12)}`;
    const inserted = await db
      .insert(opportunityApplications)
      .values({
        id: applicationId,
        opportunityId,
        studentId: student.id,
        resumeFileName: safeName,
        resumeData,
        extractedData: {},
      })
      .onConflictDoNothing({
        target: [
          opportunityApplications.opportunityId,
          opportunityApplications.studentId,
        ],
      })
      .returning({ id: opportunityApplications.id });
    if (!inserted[0]) {
      throw new StoreError(409, 'You have already applied to this opportunity.');
    }
    const applications = await this.listOpportunityApplications(student);
    const created = applications.find((item) => item.id === inserted[0].id);
    if (!created) throw new StoreError(500, 'Unable to load your submitted application.');
    return created;
  }

  async listOpportunityApplications(
    viewer: AuthUser,
  ): Promise<OpportunityApplication[]> {
    await ensureDatabaseSchema();
    const db = requireDb();
    const base = db
      .select({
        id: opportunityApplications.id,
        opportunityId: opportunityApplications.opportunityId,
        opportunityTitle: opportunities.title,
        studentId: opportunityApplications.studentId,
        studentName: users.name,
        studentEmail: users.email,
        studentBranch: studentProfiles.branch,
        studentSemester: studentProfiles.semester,
        status: opportunityApplications.status,
        resumeFileName: opportunityApplications.resumeFileName,
        createdAt: opportunityApplications.createdAt,
      })
      .from(opportunityApplications)
      .innerJoin(
        opportunities,
        eq(opportunities.id, opportunityApplications.opportunityId),
      )
      .innerJoin(users, eq(users.id, opportunityApplications.studentId))
      .leftJoin(studentProfiles, eq(studentProfiles.userId, users.id))
      .orderBy(desc(opportunityApplications.createdAt));

    const rows =
      viewer.role === 'admin'
        ? await base
        : viewer.role === 'student'
          ? await base.where(eq(opportunityApplications.studentId, viewer.id))
          : await base.where(eq(opportunities.postedById, viewer.id));

    return rows.map((row) => ({
      id: row.id,
      opportunityId: row.opportunityId,
      opportunityTitle: row.opportunityTitle,
      studentId: row.studentId,
      studentName: row.studentName,
      studentEmail: row.studentEmail,
      studentBranch: normalizeBranch(row.studentBranch ?? 'CSE'),
      studentSemester: row.studentSemester ?? 6,
      status: row.status as OpportunityApplication['status'],
      resumeFileName: row.resumeFileName,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async getOpportunityApplicationResume(
    applicationId: string,
    viewer: AuthUser,
  ): Promise<StoredResume> {
    await ensureDatabaseSchema();
    const db = requireDb();
    const rows = await db
      .select({
        fileName: opportunityApplications.resumeFileName,
        fileData: opportunityApplications.resumeData,
        studentId: opportunityApplications.studentId,
        postedById: opportunities.postedById,
      })
      .from(opportunityApplications)
      .innerJoin(
        opportunities,
        eq(opportunities.id, opportunityApplications.opportunityId),
      )
      .where(eq(opportunityApplications.id, applicationId))
      .limit(1);
    const application = rows[0];
    if (!application) throw new StoreError(404, 'Application not found.');
    if (
      viewer.role !== 'admin' &&
      viewer.id !== application.studentId &&
      !(viewer.role === 'alumni' && viewer.id === application.postedById)
    ) {
      throw new StoreError(403, 'You are not allowed to access this resume.');
    }
    return {
      fileName: application.fileName,
      fileData: application.fileData,
    };
  }

  async updateOpportunityApplicationStatus(
    applicationId: string,
    viewer: AuthUser,
    status: OpportunityApplication['status'],
  ): Promise<OpportunityApplication> {
    await ensureDatabaseSchema();
    if (!['reviewed', 'accepted', 'declined'].includes(status)) {
      throw new StoreError(400, 'Choose a valid application status.');
    }
    const db = requireDb();
    const rows = await db
      .select({
        id: opportunityApplications.id,
        opportunityId: opportunityApplications.opportunityId,
        opportunityTitle: opportunities.title,
        studentId: opportunityApplications.studentId,
        studentName: users.name,
        studentEmail: users.email,
        studentBranch: studentProfiles.branch,
        studentSemester: studentProfiles.semester,
        resumeFileName: opportunityApplications.resumeFileName,
        createdAt: opportunityApplications.createdAt,
        postedById: opportunities.postedById,
      })
      .from(opportunityApplications)
      .innerJoin(
        opportunities,
        eq(opportunities.id, opportunityApplications.opportunityId),
      )
      .innerJoin(users, eq(users.id, opportunityApplications.studentId))
      .leftJoin(studentProfiles, eq(studentProfiles.userId, users.id))
      .where(eq(opportunityApplications.id, applicationId))
      .limit(1);
    const application = rows[0];
    if (!application) throw new StoreError(404, 'Application not found.');
    if (
      viewer.role !== 'admin' &&
      !(viewer.role === 'alumni' && viewer.id === application.postedById)
    ) {
      throw new StoreError(403, 'Only the opportunity poster or an admin can review applications.');
    }
    await db
      .update(opportunityApplications)
      .set({ status, updatedAt: new Date() })
      .where(eq(opportunityApplications.id, applicationId));
    return {
      id: application.id,
      opportunityId: application.opportunityId,
      opportunityTitle: application.opportunityTitle,
      studentId: application.studentId,
      studentName: application.studentName,
      studentEmail: application.studentEmail,
      studentBranch: normalizeBranch(application.studentBranch ?? 'CSE'),
      studentSemester: application.studentSemester ?? 6,
      status,
      resumeFileName: application.resumeFileName,
      createdAt: application.createdAt.toISOString(),
    };
  }

  async listGuides(
    userId: string,
    options: { page?: number; limit?: number; domain?: string } = {},
  ): Promise<GuidesPaginatedResponse> {
    await ensureDatabaseSchema();
    const db = requireDb();

    const [storedRows, upvoteRows, accountRows] = await Promise.all([
      db
        .select()
        .from(knowledgeGuides)
        .orderBy(desc(knowledgeGuides.upvotes), desc(knowledgeGuides.createdAt)),
      db
        .select({ guideId: guideUpvotes.guideId })
        .from(guideUpvotes)
        .where(eq(guideUpvotes.userId, userId)),
      db.select({ id: users.id, isActive: users.isActive }).from(users),
    ]);
    const activeAccounts = new Map(accountRows.map((row) => [row.id, row.isActive]));
    const allRows = storedRows.filter(
      (guide) => activeAccounts.get(guide.authorId) === true,
    );

    const domainSet = new Set<string>();
    allRows.forEach((g) => domainSet.add(g.domain));

    const upvotedSet = new Set(upvoteRows.map((u) => u.guideId));
    const filtered = allRows.filter(
      (g) => !options.domain || options.domain === 'All' || g.domain === options.domain,
    );

    const total = filtered.length;
    const limit = Math.max(1, options.limit ?? 8);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(totalPages, Math.max(1, options.page ?? 1));
    const offset = (page - 1) * limit;

    const items: KnowledgeGuide[] = filtered.slice(offset, offset + limit).map((g) => ({
      id: g.id,
      title: g.title,
      domain: g.domain,
      summary: g.summary,
      content: g.content,
      readTimeMinutes: g.readTimeMinutes,
      authorId: g.authorId,
      authorAlumniId: g.authorAlumniId,
      authorName: g.authorName,
      authorRole: g.authorRole,
      authorCompany: g.authorCompany,
      authorBatch: g.authorBatch,
      upvotes: g.upvotes,
      upvotedByStudent: upvotedSet.has(g.id),
      publishedAt: formatShortDate(g.createdAt),
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
      domains: Array.from(domainSet).sort(),
    };
  }

  async createGuide(
    user: AuthUser,
    input: {
      title: string;
      domain: string;
      summary: string;
      content: string;
      readTimeMinutes: number;
    },
  ): Promise<KnowledgeGuide> {
    await ensureDatabaseSchema();
    const db = requireDb();

    let alumniId = user.id;
    let authorRole = 'Placement Cell';
    let authorCompany = 'KLS VDIT';
    let authorBatch = 'KLS VDIT';

    if (user.role === 'alumni') {
      const rows = await db
        .select()
        .from(alumniProfiles)
        .where(eq(alumniProfiles.ownerUid, user.id))
        .limit(1);
      const author = rows[0];
      if (!author || author.verificationStatus !== 'verified') {
        throw new StoreError(403, 'Only verified alumni can publish guides.');
      }
      alumniId = author.id;
      authorRole = author.role;
      authorCompany = author.company;
      authorBatch = `${author.graduationYear} ${author.branch}`;
    }

    const guideId = `guide-${crypto.randomUUID().slice(0, 12)}`;
    const readTime = Math.min(60, Math.max(2, Math.round(Number(input.readTimeMinutes) || 5)));

    const created = await db.transaction(async (tx) => {
      const rows = await tx
        .insert(knowledgeGuides)
        .values({
          id: guideId,
          title: clampText(input.title, 200),
          domain: clampText(input.domain, 100),
          summary: clampText(input.summary, 400),
          content: clampText(input.content, 8000),
          readTimeMinutes: readTime,
          authorId: user.id,
          authorAlumniId: alumniId,
          authorName: user.name,
          authorRole,
          authorCompany,
          authorBatch,
          upvotes: 0,
        })
        .returning();

      if (user.role === 'alumni') {
        await tx
          .update(alumniProfiles)
          .set({
            sharedProjectGuidesCount: sql`${alumniProfiles.sharedProjectGuidesCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(alumniProfiles.id, alumniId));
      }

      return rows[0];
    });

    return {
      id: created.id,
      title: created.title,
      domain: created.domain,
      summary: created.summary,
      content: created.content,
      readTimeMinutes: created.readTimeMinutes,
      authorId: created.authorId,
      authorAlumniId: created.authorAlumniId,
      authorName: created.authorName,
      authorRole: created.authorRole,
      authorCompany: created.authorCompany,
      authorBatch: created.authorBatch,
      upvotes: created.upvotes,
      upvotedByStudent: false,
      publishedAt: formatShortDate(created.createdAt),
    };
  }

  async toggleGuideUpvote(guideId: string, userId: string): Promise<KnowledgeGuide> {
    await ensureDatabaseSchema();
    const db = requireDb();

    const result = await db.transaction(async (tx) => {
      const guideRows = await tx
        .select()
        .from(knowledgeGuides)
        .where(eq(knowledgeGuides.id, guideId))
        .limit(1);
      const guide = guideRows[0];
      if (!guide) throw new StoreError(404, 'Knowledge guide not found.');

      const existing = await tx
        .select()
        .from(guideUpvotes)
        .where(
          and(
            eq(guideUpvotes.guideId, guideId),
            eq(guideUpvotes.userId, userId),
          ),
        )
        .limit(1);

      let nextUpvotes = guide.upvotes;
      let upvotedByStudent = false;

      if (existing.length > 0) {
        await tx
          .delete(guideUpvotes)
          .where(
            and(
              eq(guideUpvotes.guideId, guideId),
              eq(guideUpvotes.userId, userId),
            ),
          );
        nextUpvotes = Math.max(0, guide.upvotes - 1);
      } else {
        await tx.insert(guideUpvotes).values({ guideId, userId });
        nextUpvotes = guide.upvotes + 1;
        upvotedByStudent = true;
      }

      const [updated] = await tx
        .update(knowledgeGuides)
        .set({ upvotes: nextUpvotes })
        .where(eq(knowledgeGuides.id, guideId))
        .returning();

      return { updated, upvotedByStudent };
    });

    const g = result.updated;
    return {
      id: g.id,
      title: g.title,
      domain: g.domain,
      summary: g.summary,
      content: g.content,
      readTimeMinutes: g.readTimeMinutes,
      authorId: g.authorId,
      authorAlumniId: g.authorAlumniId,
      authorName: g.authorName,
      authorRole: g.authorRole,
      authorCompany: g.authorCompany,
      authorBatch: g.authorBatch,
      upvotes: g.upvotes,
      upvotedByStudent: result.upvotedByStudent,
      publishedAt: formatShortDate(g.createdAt),
    };
  }

  async listNotifications(userId: string): Promise<ParthaNotification[]> {
    await ensureDatabaseSchema();
    const db = requireDb();

    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(20);

    return rows.map((n) => ({
      id: n.id,
      userId: n.userId,
      kind: n.kind,
      title: n.title,
      body: n.body,
      emailSent: n.emailSent,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    }));
  }

  async markNotificationsRead(userId: string): Promise<void> {
    await ensureDatabaseSchema();
    const db = requireDb();
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async listSeniorIntakeForms(): Promise<SeniorIntakeForm[]> {
    await ensureDatabaseSchema();
    const db = requireDb();

    const rows = await db
      .select()
      .from(seniorIntakeForms)
      .orderBy(desc(seniorIntakeForms.createdAt));

    return rows.map((r) => ({
      formId: r.formId,
      title: r.title,
      responderUri: r.responderUri,
      editUri: r.editUri,
      createdByUid: r.createdByUid,
      createdByEmail: r.createdByEmail,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async saveSeniorIntakeForm(
    admin: AuthUser,
    input: {
      formId: string;
      title: string;
      responderUri: string;
      editUri: string;
    },
  ): Promise<SeniorIntakeForm> {
    await ensureDatabaseSchema();
    const db = requireDb();

    const safeResponder = validateSafeHttpUrl(input.responderUri);
    const safeEdit = validateSafeHttpUrl(input.editUri);
    if (!input.formId?.trim() || safeResponder === null || safeEdit === null) {
      throw new StoreError(400, 'Valid Google Form metadata is required.');
    }

    const [saved] = await db
      .insert(seniorIntakeForms)
      .values({
        formId: clampText(input.formId, 128),
        title: clampText(input.title, 200) || 'PARTHA — KLS VDIT Alumni Mentor Intake',
        responderUri: safeResponder,
        editUri: safeEdit,
        createdByUid: admin.id,
        createdByEmail: admin.email,
      })
      .onConflictDoUpdate({
        target: seniorIntakeForms.formId,
        set: {
          title: clampText(input.title, 200) || 'PARTHA — KLS VDIT Alumni Mentor Intake',
          responderUri: safeResponder,
          editUri: safeEdit,
        },
      })
      .returning();

    return {
      formId: saved.formId,
      title: saved.title,
      responderUri: saved.responderUri,
      editUri: saved.editUri,
      createdByUid: saved.createdByUid,
      createdByEmail: saved.createdByEmail,
      createdAt: saved.createdAt.toISOString(),
    };
  }

  async listImportedResponseIds(formId: string): Promise<string[]> {
    await ensureDatabaseSchema();
    const db = requireDb();

    const rows = await db
      .select({ responseId: importedFormResponses.responseId })
      .from(importedFormResponses)
      .where(eq(importedFormResponses.formId, formId));

    return rows.map((r) => r.responseId);
  }

  async importSeniorFormResponses(
    formId: string,
    admin: AuthUser,
    responses: FormResponsePreview[],
    autoVerify: boolean,
  ): Promise<{ importedCount: number }> {
    await ensureDatabaseSchema();
    const db = requireDb();

    const cleanFormId = clampText(formId, 128);
    if (!cleanFormId || !Array.isArray(responses) || responses.length === 0) {
      throw new StoreError(400, 'Form ID and at least one response are required.');
    }

    let importedCount = 0;

    await db.transaction(async (tx) => {
      for (const row of responses) {
        const cleanRespId = clampText(row.responseId, 128);
        if (!cleanRespId) continue;

        const safeLinkedin = row.linkedinUrl
          ? validateSafeHttpUrl(row.linkedinUrl) ?? ''
          : '';
        const alumniId = `gform-${cleanRespId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64)}`;
        const regNumber = clampText(row.regNumber, 40).toUpperCase() || '2VD';
        const gradYear = Math.min(2035, Math.max(1995, Math.round(Number(row.graduationYear) || 2022)));
        const branch = normalizeBranch(row.branch);
        const domain = clampText(row.domain, 100) || 'Full-Stack & FinTech';
        const skills = normalizeStringArray(row.skills, 20, 40);

        await tx
          .insert(alumniProfiles)
          .values({
            id: alumniId,
            ownerUid: admin.id,
            name: clampText(row.name, 120) || 'KLS VDIT Senior',
            graduationYear: gradYear,
            branch,
            role: clampText(row.role, 120) || 'Engineer',
            company: clampText(row.company, 120) || 'Industry Partner',
            domain,
            skills: skills.length > 0 ? skills : [domain],
            location: clampText(row.location, 100) || 'Bengaluru',
            bio: clampText(row.bio, 1000),
            regNumber,
            source: 'google-form',
            verificationStatus: autoVerify ? 'verified' : 'pending',
            openToInternshipReferrals: Boolean(row.openToInternshipReferrals),
            openToProjectMentoring: Boolean(row.openToProjectMentoring),
            sharedProjectGuidesCount: 0,
          })
          .onConflictDoNothing();

        await tx
          .insert(alumniPrivateContacts)
          .values({
            alumniId,
            email: normalizeEmail(row.email),
            phone: clampText(row.phone, 40),
            linkedinUrl: safeLinkedin,
          })
          .onConflictDoNothing();

        await tx
          .insert(importedFormResponses)
          .values({
            formId: cleanFormId,
            responseId: cleanRespId,
            alumniId,
            importedByUid: admin.id,
          })
          .onConflictDoNothing();

        importedCount += 1;
      }
    });

    return { importedCount };
  }

  async getAdminMetrics(): Promise<AdminMetrics> {
    await ensureDatabaseSchema();
    const db = requireDb();

    const [
      allAlumni,
      allMentorships,
      allSessions,
      allOpps,
      allGuides,
      allStudents,
    ] =
      await Promise.all([
        db.select().from(alumniProfiles),
        db.select().from(mentorshipRequests),
        db.select().from(mentorshipSessions),
        db.select().from(opportunities),
        db.select().from(knowledgeGuides),
        db.select().from(studentProfiles),
      ]);

    const verified = allAlumni.filter((a) => a.verificationStatus === 'verified');
    const pending = allAlumni.filter((a) => a.verificationStatus === 'pending');
    const rejected = allAlumni.filter((a) => a.verificationStatus === 'rejected');

    const acceptedMentorships = allMentorships.filter((m) => m.status === 'accepted');
    const pendingMentorships = allMentorships.filter((m) => m.status === 'pending');
    const declinedMentorships = allMentorships.filter((m) => m.status === 'declined');

    const domainMap = new Map<
      string,
      { alumniCount: number; guideCount: number; studentCount: number }
    >();
    for (const a of verified) {
      const cur = domainMap.get(a.domain) ?? {
        alumniCount: 0,
        guideCount: 0,
        studentCount: 0,
      };
      cur.alumniCount += 1;
      domainMap.set(a.domain, cur);
    }
    for (const g of allGuides) {
      const cur = domainMap.get(g.domain) ?? {
        alumniCount: 0,
        guideCount: 0,
        studentCount: 0,
      };
      cur.guideCount += 1;
      domainMap.set(g.domain, cur);
    }
    for (const student of allStudents) {
      const cur = domainMap.get(student.targetDomain) ?? {
        alumniCount: 0,
        guideCount: 0,
        studentCount: 0,
      };
      cur.studentCount += 1;
      domainMap.set(student.targetDomain, cur);
    }

    const topDomains = Array.from(domainMap.entries())
      .map(([domain, counts]) => ({
        domain,
        alumniCount: counts.alumniCount,
        guideCount: counts.guideCount,
        studentCount: counts.studentCount,
      }))
      .sort(
        (a, b) =>
          b.alumniCount + b.guideCount + b.studentCount -
          (a.alumniCount + a.guideCount + a.studentCount),
      )
      .slice(0, 6);

    const goalMap = new Map<string, number>();
    for (const request of allMentorships) {
      goalMap.set(request.goal, (goalMap.get(request.goal) ?? 0) + 1);
    }
    for (const student of allStudents) {
      for (const goal of student.mentorshipGoals) {
        goalMap.set(goal, (goalMap.get(goal) ?? 0) + 1);
      }
    }
    const mentorshipGoalBreakdown = Array.from(goalMap.entries())
      .map(([goal, requestCount]) => ({ goal, requestCount }))
      .sort((a, b) => b.requestCount - a.requestCount)
      .slice(0, 10);

    const branchMap = new Map<BranchCode, number>();
    for (const b of VALID_BRANCHES) branchMap.set(b, 0);
    for (const a of verified) {
      const b = normalizeBranch(a.branch);
      branchMap.set(b, (branchMap.get(b) ?? 0) + 1);
    }

    const branchBreakdown = VALID_BRANCHES.map((branch) => ({
      branch,
      alumniCount: branchMap.get(branch) ?? 0,
    }));

    return {
      totalVerifiedAlumni: verified.length,
      pendingVerifications: pending.length,
      rejectedVerifications: rejected.length,
      activeMentorshipConnections: acceptedMentorships.length,
      pendingMentorshipRequests: pendingMentorships.length,
      declinedMentorshipRequests: declinedMentorships.length,
      totalSessionsBooked: allSessions.length,
      confirmedSessionsCount: allSessions.filter((s) => s.status === 'confirmed').length,
      opportunitiesShared: allOpps.length,
      knowledgeGuidesCount: allGuides.length,
      totalGuideUpvotes: allGuides.reduce((sum, g) => sum + g.upvotes, 0),
      topDomains,
      mentorshipGoalBreakdown,
      branchBreakdown,
    };
  }

  async getAdminStudentProfiles(): Promise<AdminStudentRecord[]> {
    await ensureDatabaseSchema();
    const db = requireDb();
    const rows = await db
      .select({
        id: users.id,
        accountActive: users.isActive,
        name: users.name,
        email: users.email,
        registeredAt: users.createdAt,
        usn: studentProfiles.usn,
        branch: studentProfiles.branch,
        semester: studentProfiles.semester,
        targetSkills: studentProfiles.targetSkills,
        targetDomain: studentProfiles.targetDomain,
        mentorshipGoals: studentProfiles.mentorshipGoals,
        customMentorshipGoal: studentProfiles.customMentorshipGoal,
        targetCompany: studentProfiles.targetCompany,
        resumeUrl: studentProfiles.resumeUrl,
        resumeFileName: studentProfiles.resumeFileName,
        resumeText: studentProfiles.resumeText,
        githubUrl: studentProfiles.githubUrl,
        linkedinUrl: studentProfiles.linkedinUrl,
        leetcodeUrl: studentProfiles.leetcodeUrl,
        avatarUrl: studentProfiles.avatarUrl,
        lookingForInternship: studentProfiles.lookingForInternship,
        lookingForProjectHelp: studentProfiles.lookingForProjectHelp,
      })
      .from(users)
      .innerJoin(studentProfiles, eq(studentProfiles.userId, users.id))
      .where(eq(users.role, 'student'))
      .orderBy(desc(users.createdAt));

    return rows.map((row) => ({
      profile: {
        id: row.id,
        name: row.name,
        email: row.email,
        usn: row.usn,
        branch: normalizeBranch(row.branch),
        semester: row.semester,
        targetSkills: row.targetSkills,
        targetDomain: row.targetDomain,
        mentorshipGoals: row.mentorshipGoals,
        customMentorshipGoal: row.customMentorshipGoal,
        targetCompany: row.targetCompany,
        resumeUrl: row.resumeUrl,
        resumeFileName: row.resumeFileName,
        resumeText: row.resumeText,
        githubUrl: row.githubUrl,
        linkedinUrl: row.linkedinUrl,
        leetcodeUrl: row.leetcodeUrl,
        avatarUrl: row.avatarUrl || undefined,
        lookingForInternship: row.lookingForInternship,
        lookingForProjectHelp: row.lookingForProjectHelp,
      },
      registeredAt: row.registeredAt.toISOString(),
      accountActive: row.accountActive,
    }));
  }

  async setAccountActive(
    targetUserId: string,
    isActive: boolean,
    admin: AuthUser,
  ): Promise<{ userId: string; isActive: boolean }> {
    if (admin.role !== 'admin') {
      throw new StoreError(403, 'Only administrators can change account status.');
    }

    await ensureDatabaseSchema();
    const db = requireDb();
    const rows = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(
        and(
          eq(users.id, clampText(targetUserId, 120)),
          inArray(users.role, ['student', 'alumni']),
        ),
      )
      .returning({ id: users.id, isActive: users.isActive });
    const updated = rows[0];
    if (!updated) throw new StoreError(404, 'Student or Alumni account not found.');

    return { userId: updated.id, isActive: updated.isActive };
  }
}

export const postgresStore = new PostgresParthaStore();
