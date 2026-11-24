import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type {
  AdminMetrics,
  AlumniContact,
  AlumniProfile,
  AuthUser,
  BranchCode,
  DomainMetric,
  FormResponsePreview,
  KnowledgeGuide,
  MentorshipGoal,
  MentorshipMessage,
  MentorshipRequest,
  MentorshipSessionBooking,
  Opportunity,
  OpportunityType,
  SeniorIntakeForm,
  StudentTargetProfile,
  UserBookmarks,
  UserRole,
  VerificationStatus,
} from '../types';

export const BOOTSTRAP_ADMIN_EMAIL = 'rajendramadival7@gmail.com';

function timestampToIso(val: unknown): string {
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

function timestampToShortDate(val: unknown): string {
  if (val instanceof Timestamp) {
    return val.toDate().toISOString().slice(0, 10);
  }
  if (typeof val === 'string') return val.slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

function timestampToShortTime(val: unknown): string {
  const date = val instanceof Timestamp ? val.toDate() : new Date();
  return date.toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function sanitizeId(raw: string): string {
  const clean = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100);
  return clean || `id_${Date.now()}`;
}

function clampString(val: string, maxLen: number): string {
  return val.trim().slice(0, maxLen);
}

export async function isUserAdminAccount(
  uid: string,
  email: string | null | undefined,
): Promise<boolean> {
  if (email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL) {
    return true;
  }
  try {
    const snap = await getDoc(doc(db, 'admins', uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function fetchUserAccount(
  uid: string,
  email?: string | null,
): Promise<AuthUser | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    const isAdminAccount = await isUserAdminAccount(uid, email ?? data.email);

    let verificationStatus: VerificationStatus | undefined;
    if (data.role === 'alumni') {
      try {
        const aluSnap = await getDoc(doc(db, 'alumni', uid));
        if (aluSnap.exists()) {
          verificationStatus = aluSnap.data().verificationStatus as VerificationStatus;
        }
      } catch {
        // Ignore if alumni doc not created yet
      }
    }

    const studentProfile: StudentTargetProfile = {
      id: uid,
      name: String(data.name ?? ''),
      email: String(data.email ?? ''),
      usn: String(data.usn ?? ''),
      branch: (data.branch as BranchCode) ?? 'CSE',
      semester: Number(data.semester ?? 6),
      targetSkills: Array.isArray(data.targetSkills)
        ? (data.targetSkills as string[])
        : [],
      targetDomain: String(data.targetDomain ?? 'Machine Learning & AI'),
      targetCompany: String(data.targetCompany ?? ''),
      lookingForInternship: Boolean(data.lookingForInternship),
      lookingForProjectHelp: Boolean(data.lookingForProjectHelp),
    };

    return {
      id: uid,
      role: (data.role as UserRole) ?? 'student',
      name: String(data.name ?? ''),
      email: String(data.email ?? ''),
      subtitle: String(data.subtitle ?? ''),
      isAdminAccount,
      verificationStatus,
      studentProfile,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function registerStudentAccount(
  uid: string,
  email: string,
  payload: {
    name: string;
    usn: string;
    branch: BranchCode;
    semester: number;
    targetSkills: string[];
    targetDomain: string;
  },
): Promise<AuthUser> {
  const path = `users/${uid}`;
  const cleanName = clampString(payload.name, 120) || 'KLS VDIT Student';
  const cleanUsn = clampString(payload.usn.toUpperCase(), 40);
  const subtitle = `${payload.branch} · Sem ${payload.semester} · ${cleanUsn}`;
  const cleanSkills = payload.targetSkills.slice(0, 15).map((s) => clampString(s, 40)).filter(Boolean);

  try {
    await setDoc(doc(db, 'users', uid), {
      uid,
      role: 'student',
      name: cleanName,
      email: clampString(email, 160),
      subtitle: clampString(subtitle, 160),
      usn: cleanUsn,
      branch: payload.branch,
      semester: Math.min(8, Math.max(1, Math.round(payload.semester))),
      targetSkills: cleanSkills,
      targetDomain: clampString(payload.targetDomain, 100),
      targetCompany: '',
      lookingForInternship: true,
      lookingForProjectHelp: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const created = await fetchUserAccount(uid, email);
    if (!created) throw new Error('Unable to load newly created student account.');
    return created;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function registerAlumniAccount(
  uid: string,
  email: string,
  payload: {
    name: string;
    phone: string;
    linkedinUrl: string;
    regNumber: string;
    graduationYear: number;
    branch: BranchCode;
    role: string;
    company: string;
    domain: string;
    skills: string[];
    location: string;
    bio: string;
  },
): Promise<AuthUser> {
  const cleanName = clampString(payload.name, 120) || 'KLS VDIT Alumnus';
  const cleanRole = clampString(payload.role, 120) || 'Engineer';
  const cleanCompany = clampString(payload.company, 120) || 'Company';
  const cleanUsn = clampString(payload.regNumber.toUpperCase(), 40);
  const gradYear = Math.min(2035, Math.max(1995, Math.round(payload.graduationYear)));
  const cleanSkills = payload.skills.slice(0, 20).map((s) => clampString(s, 40)).filter(Boolean);
  const subtitle = `${cleanRole}, ${cleanCompany} · Class of ${gradYear} ${payload.branch}`;

  const batch = writeBatch(db);
  batch.set(doc(db, 'users', uid), {
    uid,
    role: 'alumni',
    name: cleanName,
    email: clampString(email, 160),
    subtitle: clampString(subtitle, 160),
    usn: cleanUsn,
    branch: payload.branch,
    semester: 8,
    targetSkills: cleanSkills.slice(0, 15),
    targetDomain: clampString(payload.domain, 100),
    targetCompany: '',
    lookingForInternship: false,
    lookingForProjectHelp: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.set(doc(db, 'alumni', uid), {
    id: uid,
    ownerUid: uid,
    name: cleanName,
    graduationYear: gradYear,
    branch: payload.branch,
    role: cleanRole,
    company: cleanCompany,
    domain: clampString(payload.domain, 100),
    skills: cleanSkills,
    location: clampString(payload.location || 'Bengaluru', 100),
    openToInternshipReferrals: true,
    openToProjectMentoring: true,
    sharedProjectGuidesCount: 0,
    bio: clampString(payload.bio, 1000),
    regNumber: cleanUsn,
    verificationStatus: 'pending',
    source: 'self-registered',
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.set(doc(db, 'alumni', uid, 'private', 'contact'), {
    alumniId: uid,
    ownerUid: uid,
    email: clampString(email, 160),
    phone: clampString(payload.phone, 40),
    linkedinUrl: clampString(payload.linkedinUrl, 300),
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
    const created = await fetchUserAccount(uid, email);
    if (!created) throw new Error('Unable to load newly registered alumni account.');
    return created;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `alumni/${uid}`);
  }
}

export async function setupAdminAccount(
  uid: string,
  email: string,
  name: string,
): Promise<AuthUser> {
  const path = `users/${uid}`;
  try {
    await setDoc(doc(db, 'users', uid), {
      uid,
      role: 'admin',
      name: clampString(name || 'Placement & Alumni Cell', 120),
      email: clampString(email, 160),
      subtitle: 'Placement & Alumni Cell · KLS VDIT',
      usn: 'ADMIN',
      branch: 'CSE',
      semester: 8,
      targetSkills: ['Machine Learning', 'Python', 'React'],
      targetDomain: 'Machine Learning & AI',
      targetCompany: '',
      lookingForInternship: true,
      lookingForProjectHelp: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const created = await fetchUserAccount(uid, email);
    if (!created) throw new Error('Unable to load admin profile.');
    return created;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function switchUserActiveRole(
  user: AuthUser,
  nextRole: UserRole,
): Promise<AuthUser> {
  if (nextRole === 'admin' && !user.isAdminAccount) {
    throw new Error('Admin role requires an authorized administrator account.');
  }
  const path = `users/${user.id}`;
  try {
    await updateDoc(doc(db, 'users', user.id), {
      role: nextRole,
      updatedAt: serverTimestamp(),
    });
    const refreshed = await fetchUserAccount(user.id, user.email);
    if (!refreshed) throw new Error('User profile not found.');
    return refreshed;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateStudentProfile(
  uid: string,
  updates: Partial<StudentTargetProfile>,
): Promise<StudentTargetProfile> {
  const path = `users/${uid}`;
  try {
    const existingSnap = await getDoc(doc(db, 'users', uid));
    const existingData = existingSnap.exists() ? existingSnap.data() : {};

    const cleanPayload: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };
    if (typeof updates.name === 'string' && updates.name.trim()) {
      cleanPayload.name = clampString(updates.name, 120);
    }
    const nextBranch =
      updates.branch ?? (existingData.branch as BranchCode) ?? 'CSE';
    const nextSemester =
      typeof updates.semester === 'number'
        ? Math.min(8, Math.max(1, Math.round(updates.semester)))
        : Number(existingData.semester ?? 6);
    const nextUsn =
      typeof updates.usn === 'string'
        ? clampString(updates.usn.toUpperCase(), 40)
        : String(existingData.usn ?? '');

    if (updates.branch) {
      cleanPayload.branch = nextBranch;
    }
    if (typeof updates.semester === 'number') {
      cleanPayload.semester = nextSemester;
    }
    if (typeof updates.usn === 'string') {
      cleanPayload.usn = nextUsn;
    }
    if (
      updates.branch ||
      typeof updates.semester === 'number' ||
      typeof updates.usn === 'string'
    ) {
      const usnSuffix = nextUsn ? ` · ${nextUsn}` : '';
      cleanPayload.subtitle = clampString(
        `${nextBranch} · Sem ${nextSemester}${usnSuffix}`,
        160,
      );
    }

    if (Array.isArray(updates.targetSkills)) {
      cleanPayload.targetSkills = updates.targetSkills
        .slice(0, 15)
        .map((s) => clampString(s, 40))
        .filter(Boolean);
    }
    if (typeof updates.targetDomain === 'string') {
      cleanPayload.targetDomain = clampString(updates.targetDomain, 100);
    }
    if (typeof updates.targetCompany === 'string') {
      cleanPayload.targetCompany = clampString(updates.targetCompany, 100);
    }
    if (typeof updates.lookingForInternship === 'boolean') {
      cleanPayload.lookingForInternship = updates.lookingForInternship;
    }
    if (typeof updates.lookingForProjectHelp === 'boolean') {
      cleanPayload.lookingForProjectHelp = updates.lookingForProjectHelp;
    }

    await updateDoc(doc(db, 'users', uid), cleanPayload);
    const updatedUser = await fetchUserAccount(uid);
    if (!updatedUser?.studentProfile) {
      throw new Error('Student profile not found.');
    }
    return updatedUser.studentProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateAlumniAvailability(
  alumniId: string,
  updates: {
    openToInternshipReferrals?: boolean;
    openToProjectMentoring?: boolean;
  },
): Promise<void> {
  const path = `alumni/${alumniId}`;
  try {
    const payload: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };
    if (typeof updates.openToInternshipReferrals === 'boolean') {
      payload.openToInternshipReferrals = updates.openToInternshipReferrals;
    }
    if (typeof updates.openToProjectMentoring === 'boolean') {
      payload.openToProjectMentoring = updates.openToProjectMentoring;
    }
    await updateDoc(doc(db, 'alumni', alumniId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateAlumniProfileDetails(
  user: AuthUser,
  existingAlumni: AlumniProfile | undefined,
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
  },
): Promise<AuthUser> {
  const targetAlumniId = existingAlumni?.id ?? user.id;
  const cleanName = clampString(payload.name, 120) || user.name;
  const cleanRole = clampString(payload.role, 120) || 'Engineer';
  const cleanCompany = clampString(payload.company, 120) || 'Company';
  const cleanUsn = clampString(payload.regNumber.toUpperCase(), 40);
  const gradYear = Math.min(2035, Math.max(1995, Math.round(payload.graduationYear)));
  const cleanSkills = payload.skills
    .slice(0, 20)
    .map((s) => clampString(s, 40))
    .filter(Boolean);
  const subtitle = clampString(
    `${cleanRole}, ${cleanCompany} · Class of ${gradYear} ${payload.branch}`,
    160,
  );

  const batch = writeBatch(db);
  batch.update(doc(db, 'users', user.id), {
    name: cleanName,
    subtitle,
    usn: cleanUsn,
    branch: payload.branch,
    targetSkills: cleanSkills.slice(0, 15),
    targetDomain: clampString(payload.domain, 100),
    updatedAt: serverTimestamp(),
  });

  if (existingAlumni) {
    batch.update(doc(db, 'alumni', targetAlumniId), {
      name: cleanName,
      graduationYear: gradYear,
      branch: payload.branch,
      regNumber: cleanUsn,
      role: cleanRole,
      company: cleanCompany,
      domain: clampString(payload.domain, 100),
      skills: cleanSkills,
      location: clampString(payload.location || 'Bengaluru', 100),
      bio: clampString(payload.bio, 1000),
      openToInternshipReferrals: payload.openToInternshipReferrals,
      openToProjectMentoring: payload.openToProjectMentoring,
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.set(doc(db, 'alumni', targetAlumniId), {
      id: targetAlumniId,
      ownerUid: user.id,
      name: cleanName,
      graduationYear: gradYear,
      branch: payload.branch,
      role: cleanRole,
      company: cleanCompany,
      domain: clampString(payload.domain, 100),
      skills: cleanSkills,
      location: clampString(payload.location || 'Bengaluru', 100),
      openToInternshipReferrals: payload.openToInternshipReferrals,
      openToProjectMentoring: payload.openToProjectMentoring,
      sharedProjectGuidesCount: 0,
      bio: clampString(payload.bio, 1000),
      regNumber: cleanUsn,
      verificationStatus: user.isAdminAccount ? 'verified' : 'pending',
      source: 'self-registered',
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  batch.set(doc(db, 'alumni', targetAlumniId, 'private', 'contact'), {
    alumniId: targetAlumniId,
    ownerUid: existingAlumni?.ownerUid ?? user.id,
    email: clampString(payload.contactEmail || user.email, 160),
    phone: clampString(payload.phone, 40),
    linkedinUrl: clampString(payload.linkedinUrl, 300),
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
    const updated = await fetchUserAccount(user.id, user.email);
    if (!updated) throw new Error('Unable to refresh user account.');
    return updated;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `alumni/${targetAlumniId}`);
  }
}

export async function updateAdminProfileDetails(
  user: AuthUser,
  payload: {
    name: string;
    subtitle: string;
    branch: BranchCode;
  },
): Promise<AuthUser> {
  const path = `users/${user.id}`;
  try {
    await updateDoc(doc(db, 'users', user.id), {
      name: clampString(payload.name, 120) || user.name,
      subtitle:
        clampString(payload.subtitle, 160) ||
        'Placement & Alumni Cell · KLS VDIT',
      branch: payload.branch,
      updatedAt: serverTimestamp(),
    });
    const updated = await fetchUserAccount(user.id, user.email);
    if (!updated) throw new Error('Unable to refresh admin profile.');
    return updated;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

async function fetchPrivateContactIfAllowed(
  alumniId: string,
): Promise<AlumniContact | null> {
  try {
    const snap = await getDoc(doc(db, 'alumni', alumniId, 'private', 'contact'));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      email: String(d.email ?? ''),
      phone: String(d.phone ?? ''),
      linkedinUrl: String(d.linkedinUrl ?? ''),
    };
  } catch {
    // Expected PERMISSION_DENIED when mentorship is not accepted yet
    return null;
  }
}

export async function listAlumniProfiles(
  currentUser: AuthUser,
  guides: KnowledgeGuide[],
  mentorships: MentorshipRequest[],
): Promise<AlumniProfile[]> {
  const path = 'alumni';
  try {
    const docsById = new Map<string, Record<string, unknown>>();
    const isBootstrap =
      currentUser.email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL &&
      currentUser.role === 'admin';

    if (isBootstrap) {
      const snap = await getDocs(collection(db, 'alumni'));
      snap.forEach((d) => docsById.set(d.id, d.data()));
    } else {
      const verifiedSnap = await getDocs(
        query(collection(db, 'alumni'), where('verificationStatus', '==', 'verified')),
      );
      verifiedSnap.forEach((d) => docsById.set(d.id, d.data()));

      if (currentUser.role === 'alumni') {
        const ownSnap = await getDocs(
          query(collection(db, 'alumni'), where('ownerUid', '==', currentUser.id)),
        );
        ownSnap.forEach((d) => docsById.set(d.id, d.data()));
      }
    }

    const acceptedAlumniIds = new Set(
      mentorships.filter((m) => m.status === 'accepted').map((m) => m.alumniId),
    );

    const topGuideByAlumni = new Map<string, KnowledgeGuide>();
    for (const g of guides) {
      const existing = topGuideByAlumni.get(g.authorAlumniId);
      if (!existing || g.upvotes > existing.upvotes) {
        topGuideByAlumni.set(g.authorAlumniId, g);
      }
    }

    const profiles: AlumniProfile[] = await Promise.all(
      Array.from(docsById.values()).map(async (d) => {
        const id = String(d.id ?? '');
        const ownerUid = String(d.ownerUid ?? '');
        const shouldFetchContact =
          isBootstrap ||
          ownerUid === currentUser.id ||
          acceptedAlumniIds.has(id);

        const contact = shouldFetchContact
          ? await fetchPrivateContactIfAllowed(id)
          : null;

        const topGuide = topGuideByAlumni.get(id);

        return {
          id,
          ownerUid,
          name: String(d.name ?? ''),
          graduationYear: Number(d.graduationYear ?? 2022),
          branch: (d.branch as BranchCode) ?? 'CSE',
          role: String(d.role ?? ''),
          company: String(d.company ?? ''),
          domain: String(d.domain ?? ''),
          skills: Array.isArray(d.skills) ? (d.skills as string[]) : [],
          location: String(d.location ?? ''),
          openToInternshipReferrals: Boolean(d.openToInternshipReferrals),
          openToProjectMentoring: Boolean(d.openToProjectMentoring),
          sharedProjectGuidesCount: Number(d.sharedProjectGuidesCount ?? 0),
          bio: String(d.bio ?? ''),
          verificationStatus:
            (d.verificationStatus as VerificationStatus) ?? 'pending',
          regNumber: String(d.regNumber ?? ''),
          source:
            (d.source as AlumniProfile['source']) ?? 'self-registered',
          submittedAt: timestampToShortDate(d.submittedAt),
          topHighlight: topGuide
            ? {
                guideId: topGuide.id,
                title: topGuide.title,
                upvotes: topGuide.upvotes,
              }
            : undefined,
          contact,
          isContactGated: contact === null,
        };
      }),
    );

    return profiles.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function verifyAlumniProfile(alumniId: string): Promise<void> {
  const path = `alumni/${alumniId}`;
  try {
    await updateDoc(doc(db, 'alumni', alumniId), {
      verificationStatus: 'verified',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function rejectAlumniProfile(alumniId: string): Promise<void> {
  const path = `alumni/${alumniId}`;
  try {
    await updateDoc(doc(db, 'alumni', alumniId), {
      verificationStatus: 'rejected',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function listMentorshipsForUser(
  currentUser: AuthUser,
): Promise<MentorshipRequest[]> {
  const path = 'mentorships';
  try {
    const isBootstrap =
      currentUser.email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL &&
      currentUser.role === 'admin';

    const snap = isBootstrap
      ? await getDocs(collection(db, 'mentorships'))
      : currentUser.role === 'alumni'
        ? await getDocs(
            query(
              collection(db, 'mentorships'),
              where('alumniOwnerUid', '==', currentUser.id),
            ),
          )
        : await getDocs(
            query(
              collection(db, 'mentorships'),
              where('studentId', '==', currentUser.id),
            ),
          );

    const list: MentorshipRequest[] = await Promise.all(
      snap.docs.map(async (docSnap) => {
        const d = docSnap.data();
        const status = (d.status as MentorshipRequest['status']) ?? 'pending';
        const alumniId = String(d.alumniId ?? '');
        const studentId = String(d.studentId ?? '');
        const alumniOwnerUid = String(d.alumniOwnerUid ?? '');

        let unlockedContact: AlumniContact | null = null;
        const messages: MentorshipMessage[] = [];

        if (status === 'accepted') {
          unlockedContact = await fetchPrivateContactIfAllowed(alumniId);
          try {
            const msgQuery =
              currentUser.id === alumniOwnerUid
                ? query(
                    collection(db, 'mentorships', docSnap.id, 'messages'),
                    where('alumniOwnerUid', '==', currentUser.id),
                  )
                : currentUser.id === studentId
                  ? query(
                      collection(db, 'mentorships', docSnap.id, 'messages'),
                      where('studentId', '==', currentUser.id),
                    )
                  : collection(db, 'mentorships', docSnap.id, 'messages');

            const msgSnap = await getDocs(msgQuery);
            const rawMsgs = msgSnap.docs.map((m) => {
              const md = m.data();
              const ms =
                md.createdAt instanceof Timestamp ? md.createdAt.toMillis() : 0;
              return {
                ms,
                msg: {
                  id: m.id,
                  senderId: String(md.senderId ?? ''),
                  senderName: String(md.senderName ?? ''),
                  senderRole: (md.senderRole as UserRole) ?? 'student',
                  text: String(md.text ?? ''),
                  sentAt: timestampToShortTime(md.createdAt),
                },
              };
            });
            rawMsgs.sort((a, b) => a.ms - b.ms);
            rawMsgs.forEach((item) => messages.push(item.msg));
          } catch {
            // Skip messages if not a participant
          }
        }

        const rawBooking = d.sessionBooking as MentorshipSessionBooking | null;

        return {
          id: docSnap.id,
          studentId,
          studentName: String(d.studentName ?? ''),
          studentBranch: (d.studentBranch as BranchCode) ?? 'CSE',
          studentSemester: Number(d.studentSemester ?? 6),
          studentUsn: String(d.studentUsn ?? ''),
          alumniId,
          alumniOwnerUid,
          alumniName: String(d.alumniName ?? ''),
          alumniRole: String(d.alumniRole ?? ''),
          alumniCompany: String(d.alumniCompany ?? ''),
          alumniBranch: (d.alumniBranch as BranchCode) ?? 'CSE',
          alumniGraduationYear: Number(d.alumniGraduationYear ?? 2022),
          goal: (d.goal as MentorshipGoal) ?? 'Career Guidance',
          message: String(d.message ?? ''),
          status,
          createdAt: timestampToIso(d.createdAt),
          respondedAt: d.respondedAt ? timestampToIso(d.respondedAt) : undefined,
          unlockedContact,
          messages,
          sessionBooking: rawBooking ?? null,
        };
      }),
    );

    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createMentorshipRequest(
  studentUser: AuthUser,
  alumni: AlumniProfile,
  payload: { goal: MentorshipGoal; message: string },
): Promise<void> {
  const mentorshipId = `${studentUser.id}__${alumni.id}`;
  const path = `mentorships/${mentorshipId}`;
  const profile = studentUser.studentProfile;

  try {
    await setDoc(doc(db, 'mentorships', mentorshipId), {
      id: mentorshipId,
      studentId: studentUser.id,
      studentName: clampString(studentUser.name, 120),
      studentBranch: profile?.branch ?? 'CSE',
      studentSemester: profile?.semester ?? 6,
      studentUsn: clampString(profile?.usn ?? '', 40),
      alumniId: alumni.id,
      alumniOwnerUid: alumni.ownerUid,
      alumniName: clampString(alumni.name, 120),
      alumniRole: clampString(alumni.role, 120),
      alumniCompany: clampString(alumni.company, 120),
      alumniBranch: alumni.branch,
      alumniGraduationYear: alumni.graduationYear,
      goal: payload.goal,
      message: clampString(payload.message, 1000),
      status: 'pending',
      sessionBooking: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function respondToMentorshipRequest(
  mentorshipId: string,
  decision: 'accepted' | 'declined',
): Promise<void> {
  const path = `mentorships/${mentorshipId}`;
  try {
    await updateDoc(doc(db, 'mentorships', mentorshipId), {
      status: decision,
      respondedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function sendMentorshipMessage(
  mentorship: MentorshipRequest,
  sender: AuthUser,
  text: string,
): Promise<void> {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `mentorships/${mentorship.id}/messages/${messageId}`;
  try {
    await setDoc(doc(db, 'mentorships', mentorship.id, 'messages', messageId), {
      id: messageId,
      studentId: mentorship.studentId,
      alumniOwnerUid: mentorship.alumniOwnerUid,
      senderId: sender.id,
      senderName: clampString(sender.name, 120),
      senderRole: sender.role === 'alumni' ? 'alumni' : 'student',
      text: clampString(text, 1000),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function bookMentorshipSession(
  mentorshipId: string,
  payload: { slotLabel: string; topic: string },
): Promise<void> {
  const path = `mentorships/${mentorshipId}`;
  const booking: MentorshipSessionBooking = {
    id: `sess_${Date.now()}`,
    slotLabel: clampString(payload.slotLabel, 120),
    topic: clampString(payload.topic || 'Mentorship Discussion', 200),
    status: 'requested',
    meetingLink: `https://meet.jit.si/partha-klsvdit-${sanitizeId(mentorshipId).slice(0, 28)}`,
    bookedAt: new Date().toISOString(),
  };
  try {
    await updateDoc(doc(db, 'mentorships', mentorshipId), {
      sessionBooking: booking,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function confirmMentorshipSession(
  mentorship: MentorshipRequest,
): Promise<void> {
  if (!mentorship.sessionBooking) return;
  const path = `mentorships/${mentorship.id}`;
  try {
    await updateDoc(doc(db, 'mentorships', mentorship.id), {
      sessionBooking: {
        ...mentorship.sessionBooking,
        status: 'confirmed',
      },
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function getUserBookmarks(uid: string): Promise<UserBookmarks> {
  const path = `users/${uid}/bookmarks`;
  try {
    const snap = await getDocs(
      query(collection(db, 'users', uid, 'bookmarks'), where('ownerUid', '==', uid)),
    );
    const alumniIds: string[] = [];
    const opportunityIds: string[] = [];
    snap.forEach((d) => {
      const data = d.data();
      if (data.kind === 'alumni') alumniIds.push(String(data.targetId));
      if (data.kind === 'opportunity') opportunityIds.push(String(data.targetId));
    });
    return { alumniIds, opportunityIds };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function toggleUserBookmark(
  uid: string,
  kind: 'alumni' | 'opportunity',
  targetId: string,
): Promise<UserBookmarks> {
  const bookmarkId = sanitizeId(`${kind}_${targetId}`);
  const ref = doc(db, 'users', uid, 'bookmarks', bookmarkId);
  const path = `users/${uid}/bookmarks/${bookmarkId}`;
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await deleteDoc(ref);
    } else {
      await setDoc(ref, {
        ownerUid: uid,
        targetId: clampString(targetId, 128),
        kind,
        createdAt: serverTimestamp(),
      });
    }
    return await getUserBookmarks(uid);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function listOpportunities(): Promise<Opportunity[]> {
  const path = 'opportunities';
  try {
    const snap = await getDocs(
      query(collection(db, 'opportunities'), where('isPublished', '==', true)),
    );
    const list: Opportunity[] = snap.docs.map((docSnap) => {
      const d = docSnap.data();
      return {
        id: docSnap.id,
        title: String(d.title ?? ''),
        company: String(d.company ?? ''),
        type: (d.type as OpportunityType) ?? 'Internship',
        domain: String(d.domain ?? ''),
        location: String(d.location ?? ''),
        stipendOrCtc: String(d.stipendOrCtc ?? ''),
        skills: Array.isArray(d.skills) ? (d.skills as string[]) : [],
        description: String(d.description ?? ''),
        applyUrl: String(d.applyUrl ?? ''),
        postedById: String(d.postedById ?? ''),
        postedByAlumniId: String(d.postedByAlumniId ?? ''),
        postedByName: String(d.postedByName ?? ''),
        postedByRole: String(d.postedByRole ?? ''),
        postedAt: timestampToShortDate(d.createdAt),
        isRemote: Boolean(d.isRemote),
      };
    });
    return list.sort((a, b) => b.postedAt.localeCompare(a.postedAt));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createOpportunityPost(
  user: AuthUser,
  alumniProfile: AlumniProfile | undefined,
  payload: {
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
): Promise<void> {
  const oppId = `opp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const path = `opportunities/${oppId}`;
  try {
    await setDoc(doc(db, 'opportunities', oppId), {
      id: oppId,
      title: clampString(payload.title, 160),
      company: clampString(payload.company || alumniProfile?.company || 'Partner Team', 120),
      type: payload.type,
      domain: clampString(payload.domain, 100),
      location: clampString(payload.location || 'Bengaluru', 100),
      stipendOrCtc: clampString(payload.stipendOrCtc || 'Competitive', 80),
      skills: payload.skills.slice(0, 15).map((s) => clampString(s, 40)).filter(Boolean),
      description: clampString(payload.description, 2000),
      applyUrl: clampString(payload.applyUrl, 300),
      postedById: user.id,
      postedByAlumniId: alumniProfile?.id ?? user.id,
      postedByName: clampString(user.name, 120),
      postedByRole: clampString(
        alumniProfile
          ? `${alumniProfile.role}, ${alumniProfile.company}`
          : user.subtitle,
        120,
      ),
      isRemote: payload.isRemote,
      isPublished: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function listKnowledgeGuides(uid: string): Promise<KnowledgeGuide[]> {
  const path = 'guides';
  try {
    const snap = await getDocs(
      query(collection(db, 'guides'), where('isPublished', '==', true)),
    );

    const guides: KnowledgeGuide[] = await Promise.all(
      snap.docs.map(async (docSnap) => {
        const d = docSnap.data();
        let upvotedByStudent = false;
        try {
          const upvoteSnap = await getDoc(
            doc(db, 'guides', docSnap.id, 'upvotes', uid),
          );
          upvotedByStudent = upvoteSnap.exists();
        } catch {
          upvotedByStudent = false;
        }
        return {
          id: docSnap.id,
          title: String(d.title ?? ''),
          domain: String(d.domain ?? ''),
          summary: String(d.summary ?? ''),
          content: String(d.content ?? ''),
          readTimeMinutes: Number(d.readTimeMinutes ?? 5),
          authorId: String(d.authorId ?? ''),
          authorAlumniId: String(d.authorAlumniId ?? ''),
          authorName: String(d.authorName ?? ''),
          authorRole: String(d.authorRole ?? ''),
          authorCompany: String(d.authorCompany ?? ''),
          authorBatch: String(d.authorBatch ?? ''),
          upvotes: Number(d.upvotes ?? 0),
          upvotedByStudent,
          publishedAt: timestampToShortDate(d.createdAt),
        };
      }),
    );

    return guides.sort((a, b) => b.upvotes - a.upvotes);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createKnowledgeGuide(
  user: AuthUser,
  alumniProfile: AlumniProfile | undefined,
  payload: {
    title: string;
    domain: string;
    summary: string;
    content: string;
    readTimeMinutes: number;
  },
): Promise<void> {
  const guideId = `guide_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const path = `guides/${guideId}`;
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'guides', guideId), {
      id: guideId,
      title: clampString(payload.title, 200),
      domain: clampString(payload.domain, 100),
      summary: clampString(payload.summary, 400),
      content: clampString(payload.content, 8000),
      readTimeMinutes: Math.min(60, Math.max(1, Math.round(payload.readTimeMinutes))),
      authorId: user.id,
      authorAlumniId: alumniProfile?.id ?? user.id,
      authorName: clampString(user.name, 120),
      authorRole: clampString(alumniProfile?.role ?? 'Alumnus', 120),
      authorCompany: clampString(alumniProfile?.company ?? 'Industry Partner', 120),
      authorBatch: clampString(
        alumniProfile
          ? `${alumniProfile.graduationYear} ${alumniProfile.branch}`
          : 'KLS VDIT',
        40,
      ),
      upvotes: 0,
      isPublished: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (alumniProfile && alumniProfile.ownerUid === user.id) {
      batch.update(doc(db, 'alumni', alumniProfile.id), {
        sharedProjectGuidesCount: alumniProfile.sharedProjectGuidesCount + 1,
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function toggleKnowledgeGuideUpvote(
  guide: KnowledgeGuide,
  uid: string,
): Promise<void> {
  const path = `guides/${guide.id}`;
  const guideRef = doc(db, 'guides', guide.id);
  const upvoteRef = doc(db, 'guides', guide.id, 'upvotes', uid);

  try {
    const [latestGuideSnap, upvoteSnap] = await Promise.all([
      getDoc(guideRef),
      getDoc(upvoteRef),
    ]);
    if (!latestGuideSnap.exists()) return;
    const currentCount = Number(latestGuideSnap.data().upvotes ?? 0);

    const batch = writeBatch(db);
    if (upvoteSnap.exists()) {
      batch.update(guideRef, {
        upvotes: Math.max(0, currentCount - 1),
        updatedAt: serverTimestamp(),
      });
      batch.delete(upvoteRef);
    } else {
      batch.update(guideRef, {
        upvotes: currentCount + 1,
        updatedAt: serverTimestamp(),
      });
      batch.set(upvoteRef, {
        uid,
        createdAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function listSeniorIntakeForms(
  currentUser: AuthUser,
): Promise<SeniorIntakeForm[]> {
  const path = 'seniorForms';
  try {
    const isBootstrap =
      currentUser.email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL &&
      currentUser.role === 'admin';

    const snap = isBootstrap
      ? await getDocs(collection(db, 'seniorForms'))
      : await getDocs(
          query(
            collection(db, 'seniorForms'),
            where('createdByUid', '==', currentUser.id),
          ),
        );

    const list: SeniorIntakeForm[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        formId: String(data.formId ?? d.id),
        title: String(data.title ?? ''),
        responderUri: String(data.responderUri ?? ''),
        editUri: String(data.editUri ?? ''),
        createdByUid: String(data.createdByUid ?? ''),
        createdByEmail: String(data.createdByEmail ?? ''),
        createdAt: timestampToIso(data.createdAt),
      };
    });
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveSeniorIntakeForm(
  form: SeniorIntakeForm,
): Promise<void> {
  const path = `seniorForms/${form.formId}`;
  try {
    await setDoc(doc(db, 'seniorForms', form.formId), {
      formId: clampString(form.formId, 128),
      title: clampString(form.title, 200),
      responderUri: clampString(form.responderUri, 400),
      editUri: clampString(form.editUri, 400),
      createdByUid: form.createdByUid,
      createdByEmail: clampString(form.createdByEmail, 160),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function listImportedResponseIds(
  formId: string,
  uid: string,
): Promise<Set<string>> {
  const path = `seniorForms/${formId}/imported`;
  try {
    const snap = await getDocs(
      query(
        collection(db, 'seniorForms', formId, 'imported'),
        where('createdByUid', '==', uid),
      ),
    );
    const set = new Set<string>();
    snap.forEach((d) => set.add(String(d.data().responseId ?? d.id)));
    return set;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function importSeniorFormResponse(
  formId: string,
  response: FormResponsePreview,
  creatorUid: string,
  autoVerify: boolean,
): Promise<void> {
  const cleanRespId = sanitizeId(response.responseId);
  const alumniId = sanitizeId(`gform_${cleanRespId}`);
  const path = `alumni/${alumniId}`;

  const batch = writeBatch(db);
  batch.set(doc(db, 'alumni', alumniId), {
    id: alumniId,
    ownerUid: creatorUid,
    name: clampString(response.name, 120),
    graduationYear: Math.min(2035, Math.max(1995, response.graduationYear)),
    branch: response.branch,
    role: clampString(response.role, 120),
    company: clampString(response.company, 120),
    domain: clampString(response.domain, 100),
    skills: response.skills.slice(0, 20).map((s) => clampString(s, 40)).filter(Boolean),
    location: clampString(response.location || 'Bengaluru', 100),
    openToInternshipReferrals: response.openToInternshipReferrals,
    openToProjectMentoring: response.openToProjectMentoring,
    sharedProjectGuidesCount: 0,
    bio: clampString(response.bio, 1000),
    regNumber: clampString(response.regNumber.toUpperCase(), 40),
    verificationStatus: autoVerify ? 'verified' : 'pending',
    source: 'google-form',
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.set(doc(db, 'alumni', alumniId, 'private', 'contact'), {
    alumniId,
    ownerUid: creatorUid,
    email: clampString(response.email, 160),
    phone: clampString(response.phone, 40),
    linkedinUrl: clampString(response.linkedinUrl, 300),
    updatedAt: serverTimestamp(),
  });

  batch.set(doc(db, 'seniorForms', formId, 'imported', cleanRespId), {
    responseId: cleanRespId,
    alumniId,
    createdByUid: creatorUid,
    importedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function computeAdminMetrics(
  alumni: AlumniProfile[],
  mentorships: MentorshipRequest[],
  opportunities: Opportunity[],
  guides: KnowledgeGuide[],
): AdminMetrics {
  const verifiedAlumni = alumni.filter((a) => a.verificationStatus === 'verified');
  const pendingVerifications = alumni.filter(
    (a) => a.verificationStatus === 'pending',
  ).length;

  const domainMap = new Map<string, DomainMetric>();
  for (const a of verifiedAlumni) {
    const entry = domainMap.get(a.domain) ?? {
      domain: a.domain,
      alumniCount: 0,
      guideCount: 0,
    };
    entry.alumniCount += 1;
    domainMap.set(a.domain, entry);
  }
  for (const g of guides) {
    const entry = domainMap.get(g.domain) ?? {
      domain: g.domain,
      alumniCount: 0,
      guideCount: 0,
    };
    entry.guideCount += 1;
    domainMap.set(g.domain, entry);
  }

  const topDomains = Array.from(domainMap.values()).sort(
    (a, b) => b.alumniCount - a.alumniCount,
  );

  return {
    totalVerifiedAlumni: verifiedAlumni.length,
    pendingVerifications,
    activeMentorshipConnections: mentorships.filter(
      (m) => m.status === 'accepted',
    ).length,
    pendingMentorshipRequests: mentorships.filter(
      (m) => m.status === 'pending',
    ).length,
    opportunitiesShared: opportunities.length,
    knowledgeGuidesCount: guides.length,
    totalGuideUpvotes: guides.reduce((sum, g) => sum + g.upvotes, 0),
    topDomains,
  };
}
