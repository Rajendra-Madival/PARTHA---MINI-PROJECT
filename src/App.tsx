import type { User } from 'firebase/auth';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AdminDashboardView } from './components/AdminDashboardView';
import { AlumniDashboardView } from './components/AlumniDashboardView';
import { AuthScreen } from './components/AuthScreen';
import { ConnectionsView } from './components/ConnectionsView';
import { GuideReaderModal } from './components/GuideReaderModal';
import { MentorshipModal } from './components/MentorshipModal';
import { Navbar, type ActiveTab } from './components/Navbar';
import { OpportunitiesFeedView } from './components/OpportunitiesFeedView';
import { PostModal } from './components/PostModal';
import { ProfileDetailsView } from './components/ProfileDetailsView';
import { SeniorIntakeFormPanel } from './components/SeniorIntakeFormPanel';
import { StudentDiscoveryView } from './components/StudentDiscoveryView';
import {
  formatFirebaseAuthError,
  signOutFromFirebase,
  subscribeToAuth,
} from './lib/firebase';
import {
  bookMentorshipSession,
  computeAdminMetrics,
  confirmMentorshipSession,
  createKnowledgeGuide,
  createMentorshipRequest,
  createOpportunityPost,
  fetchUserAccount,
  getUserBookmarks,
  listAlumniProfiles,
  listKnowledgeGuides,
  listMentorshipsForUser,
  listOpportunities,
  listSeniorIntakeForms,
  rejectAlumniProfile,
  respondToMentorshipRequest,
  sendMentorshipMessage,
  switchUserActiveRole,
  toggleKnowledgeGuideUpvote,
  toggleUserBookmark,
  updateAdminProfileDetails,
  updateAlumniAvailability,
  updateAlumniProfileDetails,
  updateStudentProfile,
  verifyAlumniProfile,
} from './services/parthaFirestore';
import type {
  AdminMetrics,
  AlumniProfile,
  AuthUser,
  BranchCode,
  KnowledgeGuide,
  MentorshipGoal,
  MentorshipRequest,
  Opportunity,
  OpportunityType,
  SeniorIntakeForm,
  StudentTargetProfile,
  UserBookmarks,
  UserRole,
} from './types';

function defaultTabForRole(role: UserRole): ActiveTab {
  if (role === 'student') return 'discover';
  if (role === 'alumni') return 'alumni-inbox';
  return 'admin-queue';
}

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const initialAuthDoneRef = useRef(false);
  const preferredRoleRef = useRef<UserRole | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('discover');

  const [studentProfile, setStudentProfile] =
    useState<StudentTargetProfile | null>(null);
  const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
  const [mentorships, setMentorships] = useState<MentorshipRequest[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [guides, setGuides] = useState<KnowledgeGuide[]>([]);
  const [seniorForms, setSeniorForms] = useState<SeniorIntakeForm[]>([]);
  const [adminMetrics, setAdminMetrics] = useState<AdminMetrics | null>(null);
  const [bookmarks, setBookmarks] = useState<UserBookmarks>({
    alumniIds: [],
    opportunityIds: [],
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [selectedAlumniId, setSelectedAlumniId] = useState<string | null>(null);
  const [activeGuideId, setActiveGuideId] = useState<string | null>(null);
  const [postModalState, setPostModalState] = useState<{
    open: boolean;
    mode: 'opportunity' | 'guide';
  }>({ open: false, mode: 'opportunity' });

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => {
      setToast((current) => (current === message ? null : current));
    }, 3200);
  }, []);

  const refreshData = useCallback(
    async (currentUser: AuthUser) => {
      setLoading(true);
      try {
        const [guideData, mentorshipData, oppData, bookmarksData, formData] =
          await Promise.all([
            listKnowledgeGuides(currentUser.id),
            listMentorshipsForUser(currentUser),
            listOpportunities(),
            getUserBookmarks(currentUser.id),
            currentUser.role === 'admin'
              ? listSeniorIntakeForms(currentUser)
              : Promise.resolve([] as SeniorIntakeForm[]),
          ]);

        const alumniData = await listAlumniProfiles(
          currentUser,
          guideData,
          mentorshipData,
        );

        setGuides(guideData);
        setMentorships(mentorshipData);
        setOpportunities(oppData);
        setBookmarks(bookmarksData);
        setAlumni(alumniData);
        setSeniorForms(formData);
        setAdminMetrics(
          currentUser.role === 'admin'
            ? computeAdminMetrics(alumniData, mentorshipData, oppData, guideData)
            : null,
        );
        if (currentUser.studentProfile) {
          setStudentProfile(currentUser.studentProfile);
        }
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : 'Failed to load platform data.',
        );
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    const unsubscribe = subscribeToAuth((fbUser) => {
      setFirebaseUser(fbUser);
      if (!fbUser) {
        setUser(null);
        setStudentProfile(null);
        setAlumni([]);
        setMentorships([]);
        setOpportunities([]);
        setGuides([]);
        setSeniorForms([]);
        setBookmarks({ alumniIds: [], opportunityIds: [] });
        setAdminMetrics(null);
        setCheckingAuth(false);
        initialAuthDoneRef.current = true;
        return;
      }

      void (async () => {
        if (!initialAuthDoneRef.current) {
          setCheckingAuth(true);
        }
        try {
          setAuthError(null);
          let account = await fetchUserAccount(fbUser.uid, fbUser.email);
          const wantedRole = preferredRoleRef.current;
          preferredRoleRef.current = null;
          if (account) {
            if (account.isAdminAccount && wantedRole && account.role !== wantedRole) {
              account = await switchUserActiveRole(account, wantedRole);
            }
            setUser(account);
            setStudentProfile(account.studentProfile ?? null);
            setActiveTab(defaultTabForRole(account.role));
            await refreshData(account);
          } else {
            setUser(null);
          }
        } catch (err) {
          setAuthError(formatFirebaseAuthError(err));
          setUser(null);
        } finally {
          setCheckingAuth(false);
          initialAuthDoneRef.current = true;
        }
      })();
    });

    return () => unsubscribe();
  }, [refreshData]);

  async function handleProfileCreated(account: AuthUser) {
    preferredRoleRef.current = null;
    setAuthError(null);
    setUser(account);
    setStudentProfile(account.studentProfile ?? null);
    setActiveTab(defaultTabForRole(account.role));
    await refreshData(account);
  }

  async function handleLogout() {
    preferredRoleRef.current = null;
    setAuthError(null);
    await signOutFromFirebase();
  }

  async function handleSwitchRole(nextRole: UserRole) {
    if (!user) return;
    try {
      const updated = await switchUserActiveRole(user, nextRole);
      setUser(updated);
      setStudentProfile(updated.studentProfile ?? null);
      setActiveTab(defaultTabForRole(updated.role));
      await refreshData(updated);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Could not switch portal view.',
      );
    }
  }

  async function handleUpdateStudentProfile(
    updates: Partial<StudentTargetProfile>,
  ) {
    if (!user) return;
    const updated = await updateStudentProfile(user.id, updates);
    const refreshed = await fetchUserAccount(user.id, user.email);
    setStudentProfile(updated);
    if (refreshed) {
      setUser(refreshed);
    } else {
      setUser((prev) => (prev ? { ...prev, studentProfile: updated } : prev));
    }
    showToast('Your student details were updated.');
  }

  async function handleSaveAlumniDetails(payload: {
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
  }) {
    if (!user) return;
    const existingAlumni = alumni.find((a) => a.ownerUid === user.id);
    const updatedUser = await updateAlumniProfileDetails(
      user,
      existingAlumni,
      payload,
    );
    setUser(updatedUser);
    await refreshData(updatedUser);
    showToast('Your alumni details were saved.');
  }

  async function handleSaveAdminDetails(payload: {
    name: string;
    subtitle: string;
    branch: BranchCode;
  }) {
    if (!user) return;
    const updatedUser = await updateAdminProfileDetails(user, payload);
    setUser(updatedUser);
    showToast('Admin details saved.');
  }

  async function handleSendMentorshipRequest(payload: {
    alumniId: string;
    goal: MentorshipGoal;
    message: string;
  }) {
    if (!user) return;
    const targetAlumni = alumni.find((a) => a.id === payload.alumniId);
    if (!targetAlumni) {
      showToast('Selected alumnus could not be found.');
      return;
    }
    await createMentorshipRequest(user, targetAlumni, {
      goal: payload.goal,
      message: payload.message,
    });
    await refreshData(user);
    showToast('Mentorship request sent. Contact stays gated until accepted.');
  }

  async function handleRespondMentorship(
    requestId: string,
    decision: 'accepted' | 'declined',
  ) {
    if (!user) return;
    await respondToMentorshipRequest(requestId, decision);
    await refreshData(user);
    showToast(
      decision === 'accepted'
        ? 'Request accepted. Your contact details are now unlocked for this student.'
        : 'Request declined.',
    );
  }

  async function handleVerifyAlumni(alumniId: string) {
    if (!user) return;
    const target = alumni.find((a) => a.id === alumniId);
    await verifyAlumniProfile(alumniId);
    await refreshData(user);
    showToast(`${target?.name ?? 'Alumnus'} is now verified and live for students.`);
  }

  async function handleRejectAlumni(alumniId: string) {
    if (!user) return;
    const target = alumni.find((a) => a.id === alumniId);
    await rejectAlumniProfile(alumniId);
    await refreshData(user);
    showToast(
      `${target?.name ?? 'Alumnus'} was removed from the verification queue.`,
    );
  }

  async function handleToggleUpvote(guideId: string) {
    if (!user) return;
    const guide = guides.find((g) => g.id === guideId);
    if (!guide) return;
    await toggleKnowledgeGuideUpvote(guide, user.id);
    await refreshData(user);
  }

  async function handleCreateOpportunity(payload: {
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
  }) {
    if (!user) return;
    const currentAlumniRecord = alumni.find((a) => a.ownerUid === user.id);
    await createOpportunityPost(user, currentAlumniRecord, payload);
    await refreshData(user);
    showToast('Opportunity published.');
  }

  async function handleCreateGuide(payload: {
    title: string;
    domain: string;
    summary: string;
    content: string;
    readTimeMinutes: number;
  }) {
    if (!user) return;
    const currentAlumniRecord = alumni.find((a) => a.ownerUid === user.id);
    await createKnowledgeGuide(user, currentAlumniRecord, payload);
    await refreshData(user);
    showToast('Prep guide published.');
  }

  async function handleToggleSaveAlumni(alumniId: string) {
    if (!user) return;
    const updated = await toggleUserBookmark(user.id, 'alumni', alumniId);
    setBookmarks(updated);
    const saved = updated.alumniIds.includes(alumniId);
    showToast(
      saved ? 'Mentor saved to your shortlist.' : 'Removed from saved mentors.',
    );
  }

  async function handleToggleSaveOpportunity(opportunityId: string) {
    if (!user) return;
    const updated = await toggleUserBookmark(
      user.id,
      'opportunity',
      opportunityId,
    );
    setBookmarks(updated);
    const saved = updated.opportunityIds.includes(opportunityId);
    showToast(
      saved ? 'Opportunity saved.' : 'Removed from saved opportunities.',
    );
  }

  async function handleSendMentorshipMessage(requestId: string, text: string) {
    if (!user) return;
    const req = mentorships.find((m) => m.id === requestId);
    if (!req) return;
    await sendMentorshipMessage(req, user, text);
    await refreshData(user);
  }

  async function handleBookSession(
    requestId: string,
    payload: { slotLabel: string; topic: string },
  ) {
    if (!user) return;
    await bookMentorshipSession(requestId, payload);
    await refreshData(user);
    showToast('1-on-1 call slot requested. Waiting for mentor confirmation.');
  }

  async function handleConfirmSession(requestId: string) {
    if (!user) return;
    const req = mentorships.find((m) => m.id === requestId);
    if (!req) return;
    await confirmMentorshipSession(req);
    await refreshData(user);
    showToast('1-on-1 call confirmed.');
  }

  async function handleToggleAlumniAvailability(updates: {
    openToInternshipReferrals?: boolean;
    openToProjectMentoring?: boolean;
  }) {
    if (!user) return;
    const targetAlumni = alumni.find((a) => a.ownerUid === user.id);
    if (!targetAlumni) return;
    await updateAlumniAvailability(targetAlumni.id, updates);
    await refreshData(user);
    showToast('Mentoring availability updated.');
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#FAF7F0] flex items-center justify-center text-sm text-stone-600">
        Loading PARTHA...
      </div>
    );
  }

  if (!firebaseUser || !user) {
    return (
      <AuthScreen
        firebaseUser={firebaseUser}
        externalError={authError}
        onClearExternalError={() => setAuthError(null)}
        onBeforeAuth={(selectedRole) => {
          preferredRoleRef.current = selectedRole;
        }}
        onProfileCreated={handleProfileCreated}
      />
    );
  }

  const selectedAlumni =
    alumni.find((a) => a.id === selectedAlumniId) ?? null;
  const activeGuide = guides.find((g) => g.id === activeGuideId) ?? null;
  const currentAlumniRecord =
    user.role === 'alumni'
      ? alumni.find((a) => a.ownerUid === user.id)
      : undefined;

  const fallbackStudentProfile: StudentTargetProfile = studentProfile ?? {
    id: user.id,
    name: user.name,
    email: user.email,
    usn: '',
    branch: 'CSE',
    semester: 6,
    targetSkills: ['Machine Learning', 'Python'],
    targetDomain: 'Machine Learning & AI',
    targetCompany: '',
    lookingForInternship: true,
    lookingForProjectHelp: true,
  };

  const pendingAlumniRequestsCount =
    user.role === 'alumni'
      ? mentorships.filter((m) => m.status === 'pending').length
      : 0;
  const pendingVerificationsCount =
    adminMetrics?.pendingVerifications ??
    alumni.filter((a) => a.verificationStatus === 'pending').length;

  const canAlumniPost =
    user.role === 'alumni' &&
    (currentAlumniRecord?.verificationStatus ?? user.verificationStatus) ===
      'verified';

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F0] text-[#18221D]">
      <Navbar
        user={user}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onSwitchRole={user.isAdminAccount ? handleSwitchRole : undefined}
        onLogout={handleLogout}
        pendingRequestsCount={pendingAlumniRequestsCount}
        pendingVerificationsCount={pendingVerificationsCount}
      />

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {activeTab === 'discover' && (
          <StudentDiscoveryView
            alumni={alumni}
            studentProfile={fallbackStudentProfile}
            mentorships={mentorships}
            savedAlumniIds={bookmarks.alumniIds}
            role={user.role}
            loading={loading}
            onUpdateStudentProfile={handleUpdateStudentProfile}
            onToggleSaveAlumni={handleToggleSaveAlumni}
            onRequestMentorship={(id) => setSelectedAlumniId(id)}
            onOpenGuide={(guideId) => setActiveGuideId(guideId)}
          />
        )}

        {activeTab === 'connections' && (
          <ConnectionsView
            mentorships={mentorships}
            onGoToDiscover={() => setActiveTab('discover')}
            onSendMessage={handleSendMentorshipMessage}
            onBookSession={handleBookSession}
          />
        )}

        {(activeTab === 'opportunities' || activeTab === 'guides') && (
          <OpportunitiesFeedView
            initialFeed={activeTab === 'guides' ? 'guides' : 'opportunities'}
            role={user.role}
            canAlumniPost={canAlumniPost}
            opportunities={opportunities}
            guides={guides}
            savedOpportunityIds={bookmarks.opportunityIds}
            onToggleSaveOpportunity={handleToggleSaveOpportunity}
            onToggleUpvote={handleToggleUpvote}
            onOpenGuide={(guideId) => setActiveGuideId(guideId)}
            onOpenPostModal={(mode) => setPostModalState({ open: true, mode })}
          />
        )}

        {activeTab === 'alumni-inbox' && (
          <AlumniDashboardView
            user={user}
            alumniProfile={currentAlumniRecord}
            requests={mentorships}
            onRespond={handleRespondMentorship}
            onOpenPostModal={(mode) => setPostModalState({ open: true, mode })}
            onToggleAvailability={handleToggleAlumniAvailability}
            onSendMessage={handleSendMentorshipMessage}
            onConfirmSession={handleConfirmSession}
            onEditDetails={() => setActiveTab('profile')}
          />
        )}

        {activeTab === 'admin-queue' && (
          <AdminDashboardView
            allAlumni={alumni}
            metrics={adminMetrics}
            onVerify={handleVerifyAlumni}
            onReject={handleRejectAlumni}
            onOpenSeniorForm={() => setActiveTab('senior-form')}
          />
        )}

        {activeTab === 'senior-form' && (
          <SeniorIntakeFormPanel
            user={user}
            forms={seniorForms}
            onFormCreated={(createdForm) =>
              setSeniorForms((prev) => [
                createdForm,
                ...prev.filter((f) => f.formId !== createdForm.formId),
              ])
            }
            onDataImported={() => refreshData(user)}
            onNotify={showToast}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileDetailsView
            user={user}
            studentProfile={fallbackStudentProfile}
            alumniProfile={alumni.find((a) => a.ownerUid === user.id)}
            onSaveStudent={handleUpdateStudentProfile}
            onSaveAlumni={handleSaveAlumniDetails}
            onSaveAdmin={handleSaveAdminDetails}
          />
        )}
      </main>

      <footer className="border-t border-[#E5DFD0] bg-[#FFFEFA] py-5">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-2 px-4 text-xs text-stone-500 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <span>
            PARTHA — Alumni Mentorship &amp; Opportunity Platform · KLS VDIT Haliyal
          </span>
          <span>Privacy-gated mentorship &amp; verified alumni directory</span>
        </div>
      </footer>

      <MentorshipModal
        alumni={selectedAlumni}
        onClose={() => setSelectedAlumniId(null)}
        onSubmit={handleSendMentorshipRequest}
      />

      <PostModal
        isOpen={postModalState.open}
        user={user}
        defaultMode={postModalState.mode}
        onClose={() => setPostModalState((prev) => ({ ...prev, open: false }))}
        onCreateOpportunity={handleCreateOpportunity}
        onCreateGuide={handleCreateGuide}
      />

      <GuideReaderModal
        guide={activeGuide}
        onClose={() => setActiveGuideId(null)}
        onToggleUpvote={handleToggleUpvote}
      />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 rounded-lg border border-emerald-950 bg-emerald-900 px-4 py-2.5 text-xs font-medium text-[#FAF7F0] shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
