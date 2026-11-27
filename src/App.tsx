import { Bell, X } from 'lucide-react';
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdminDashboardView } from './components/AdminDashboardView';
import { AlumniDashboardView } from './components/AlumniDashboardView';
import { AuthScreen } from './components/AuthScreen';
import { ConnectionsView } from './components/ConnectionsView';
import { GuideReaderModal } from './components/GuideReaderModal';
import { MentorshipModal } from './components/MentorshipModal';
import { Navbar, type ActiveTab } from './components/Navbar';
import { OpportunitiesFeedView } from './components/OpportunitiesFeedView';
import { ParthaLandingPage } from './components/ParthaLandingPage';

const LandingPage = lazy(() =>
  import('./landing/LandingPage').then((mod) => ({ default: mod.LandingPage })),
);
import { PostModal } from './components/PostModal';
import { ProfileDetailsView } from './components/ProfileDetailsView';
import { SeniorIntakeFormPanel } from './components/SeniorIntakeFormPanel';
import {
  DEFAULT_DISCOVERY_FILTERS,
  StudentDiscoveryView,
} from './components/StudentDiscoveryView';
import { clearWorkspaceAccessToken } from './lib/firebase';
import { parthaApi } from './services/api';
import type {
  AdminBootstrapStatus,
  AdminMetrics,
  AdminStudentRecord,
  AlumniDiscoveryResponse,
  AlumniProfile,
  AuthSession,
  AuthUser,
  BranchCode,
  DatabaseHealthStatus,
  DiscoveryFilters,
  GuidesPaginatedResponse,
  KnowledgeGuide,
  MentorshipGoal,
  MentorshipRequest,
  OpportunitiesPaginatedResponse,
  OpportunityApplication,
  OpportunityType,
  ParthaNotification,
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

const EMPTY_DISCOVERY: AlumniDiscoveryResponse = {
  items: [],
  total: 0,
  page: 1,
  limit: 8,
  totalPages: 1,
  hasMore: false,
  facets: { skills: [], companies: [], roles: [], domains: [] },
};

const EMPTY_OPPORTUNITIES: OpportunitiesPaginatedResponse = {
  items: [],
  total: 0,
  page: 1,
  limit: 8,
  totalPages: 1,
  hasMore: false,
  domains: [],
};

const EMPTY_GUIDES: GuidesPaginatedResponse = {
  items: [],
  total: 0,
  page: 1,
  limit: 8,
  totalPages: 1,
  hasMore: false,
  domains: [],
};

export default function App() {
  const [dbHealth, setDbHealth] = useState<DatabaseHealthStatus | null>(null);
  const [bootstrapStatus, setBootstrapStatus] =
    useState<AdminBootstrapStatus | null>(null);
  const [checkingConnection, setCheckingConnection] = useState(true);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [authGateMode, setAuthGateMode] = useState<'login' | 'register' | null>(null);
  const [gateAuthRequest, setGateAuthRequest] = useState<{
    mode: 'login' | 'register';
    nonce: number;
  }>({ mode: 'login', nonce: 0 });
  const [activeTab, setActiveTab] = useState<ActiveTab>('discover');
  const [studentProfile, setStudentProfile] =
    useState<StudentTargetProfile | null>(null);
  const [ownAlumniProfile, setOwnAlumniProfile] = useState<
    AlumniProfile | undefined
  >(undefined);
  const [adminAlumniList, setAdminAlumniList] = useState<AlumniProfile[]>([]);
  const [adminStudentList, setAdminStudentList] = useState<AdminStudentRecord[]>([]);

  // Paginated discovery state
  const [discoveryFilters, setDiscoveryFilters] = useState<DiscoveryFilters>(
    DEFAULT_DISCOVERY_FILTERS,
  );
  const [alumniPage, setAlumniPage] = useState(1);
  const [discoveryData, setDiscoveryData] =
    useState<AlumniDiscoveryResponse>(EMPTY_DISCOVERY);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);

  // Paginated opportunities & guides state
  const [oppTypeFilter, setOppTypeFilter] = useState<'All' | OpportunityType>(
    'All',
  );
  const [hubDomainFilter, setHubDomainFilter] = useState('All');
  const [oppSavedOnly, setOppSavedOnly] = useState(false);
  const [oppPage, setOppPage] = useState(1);
  const [guidePage, setGuidePage] = useState(1);
  const [opportunitiesData, setOpportunitiesData] =
    useState<OpportunitiesPaginatedResponse>(EMPTY_OPPORTUNITIES);
  const [guidesData, setGuidesData] =
    useState<GuidesPaginatedResponse>(EMPTY_GUIDES);
  const [extraGuides, setExtraGuides] = useState<Record<string, KnowledgeGuide>>(
    {},
  );
  const [feedLoading, setFeedLoading] = useState(false);

  // Core workspace state
  const [mentorships, setMentorships] = useState<MentorshipRequest[]>([]);
  const [opportunityApplications, setOpportunityApplications] = useState<
    OpportunityApplication[]
  >([]);
  const [bookmarks, setBookmarks] = useState<UserBookmarks>({
    alumniIds: [],
    opportunityIds: [],
  });
  const [notifications, setNotifications] = useState<ParthaNotification[]>([]);
  const [seniorForms, setSeniorForms] = useState<SeniorIntakeForm[]>([]);
  const [adminMetrics, setAdminMetrics] = useState<AdminMetrics | null>(null);
  const [coreLoading, setCoreLoading] = useState(false);

  const [selectedAlumniId, setSelectedAlumniId] = useState<string | null>(null);
  const [activeGuideId, setActiveGuideId] = useState<string | null>(null);
  const [postModalState, setPostModalState] = useState<{
    open: boolean;
    mode: 'opportunity' | 'guide';
  }>({ open: false, mode: 'opportunity' });
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast((current) => (current === message ? null : current));
    }, 3400);
  }, []);

  const checkHealthAndBootstrap = useCallback(async () => {
    setCheckingConnection(true);
    try {
      const health = await parthaApi.getHealth();
      setDbHealth(health);
      if (health.databaseConnected) {
        const status = await parthaApi.getBootstrapStatus();
        setBootstrapStatus(status);
      } else {
        setBootstrapStatus(null);
      }
    } catch (err) {
      setDbHealth({
        status: 'error',
        platform: 'PARTHA',
        databaseConfigured: false,
        databaseConnected: false,
        databaseError:
          err instanceof Error
            ? err.message
            : 'Unable to reach PARTHA API server.',
      });
      setBootstrapStatus(null);
    } finally {
      setCheckingConnection(false);
    }
  }, []);

  useEffect(() => {
    void checkHealthAndBootstrap();
  }, [checkHealthAndBootstrap]);

  const loadDiscovery = useCallback(
    async (
      currentUser: AuthUser,
      filters: DiscoveryFilters,
      page: number,
      silent = false,
    ) => {
      if (!silent) setDiscoveryLoading(true);
      try {
        const res = await parthaApi.getAlumni({
          page,
          limit: 8,
          search: filters.search,
          skill: filters.skill,
          company: filters.company,
          role: filters.role,
          domain: filters.domain,
          internshipOnly: filters.internshipOnly,
          projectHelpOnly: filters.projectHelpOnly,
          savedOnly: filters.savedOnly,
          sortBy: filters.sortBy,
        });
        setDiscoveryData(res);
        if (currentUser.role === 'alumni') {
          const foundOwn = res.items.find((a) => a.ownerUid === currentUser.id);
          if (foundOwn) setOwnAlumniProfile(foundOwn);
        }
      } catch (err) {
        if (!silent) {
          showToast(
            err instanceof Error ? err.message : 'Unable to load alumni directory.',
          );
        }
      } finally {
        if (!silent) setDiscoveryLoading(false);
      }
    },
    [showToast],
  );

  const loadFeed = useCallback(
    async (
      typeFilter: 'All' | OpportunityType,
      domainFilter: string,
      savedOnly: boolean,
      currentOppPage: number,
      currentGuidePage: number,
      silent = false,
    ) => {
      if (!silent) setFeedLoading(true);
      try {
        const [oppRes, guideRes] = await Promise.all([
          parthaApi.getOpportunities({
            page: currentOppPage,
            limit: 8,
            type: typeFilter,
            domain: domainFilter,
            savedOnly,
          }),
          parthaApi.getGuides({
            page: currentGuidePage,
            limit: 8,
            domain: domainFilter,
          }),
        ]);
        setOpportunitiesData(oppRes);
        setGuidesData(guideRes);
      } catch (err) {
        if (!silent) {
          showToast(
            err instanceof Error
              ? err.message
              : 'Unable to load opportunities and prep guides.',
          );
        }
      } finally {
        if (!silent) setFeedLoading(false);
      }
    },
    [showToast],
  );

  const loadCoreData = useCallback(
    async (currentUser: AuthUser, silent = false) => {
      if (!silent) setCoreLoading(true);
      try {
        const [mentorshipList, bookmarkData, notificationList, applicationList] =
          await Promise.all([
            parthaApi.getMentorships(),
            parthaApi.getBookmarks(),
            parthaApi.getNotifications(),
            parthaApi.getOpportunityApplications(),
          ]);

        setMentorships(mentorshipList);
        setBookmarks(bookmarkData);
        setNotifications(notificationList);
        setOpportunityApplications(applicationList);

        if (currentUser.role === 'admin') {
          const [allAlumniRes, metricsRes, formsRes, studentsRes] = await Promise.all([
            parthaApi.getAlumni({ includeAll: true, page: 1, limit: 200 }),
            parthaApi.getAdminMetrics(),
            parthaApi.listSeniorIntakeForms(),
            parthaApi.getAdminStudents(),
          ]);
          setAdminAlumniList(allAlumniRes.items);
          setAdminMetrics(metricsRes);
          setSeniorForms(formsRes);
          setAdminStudentList(studentsRes);
        } else if (currentUser.role === 'alumni') {
          const ownRes = await parthaApi.getAlumni({
            search: currentUser.name,
            page: 1,
            limit: 50,
          });
          const own = ownRes.items.find((a) => a.ownerUid === currentUser.id);
          if (own) setOwnAlumniProfile(own);
        }
      } catch (err) {
        if (!silent) {
          showToast(
            err instanceof Error ? err.message : 'Unable to load workspace data.',
          );
        }
      } finally {
        if (!silent) setCoreLoading(false);
      }
    },
    [showToast],
  );

  // Sync discovery whenever signed-in user filters or page change
  useEffect(() => {
    if (!user) return;
    void loadDiscovery(user, discoveryFilters, alumniPage);
  }, [user, discoveryFilters, alumniPage, loadDiscovery]);

  // Sync opportunities & guides whenever filters or pages change
  useEffect(() => {
    if (!user) return;
    void loadFeed(oppTypeFilter, hubDomainFilter, oppSavedOnly, oppPage, guidePage);
  }, [user, oppTypeFilter, hubDomainFilter, oppSavedOnly, oppPage, guidePage, loadFeed]);

  // Background polling for real-time updates (new requests, chats, acceptances)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      void loadCoreData(user, true);
    }, 20_000);
    return () => clearInterval(interval);
  }, [user, loadCoreData]);

  function handleAuthenticated(session: AuthSession, notice?: string) {
    setDiscoveryLoading(true);
    setFeedLoading(true);
    setUser(session.user);
    setStudentProfile(session.user.studentProfile ?? null);
    setOwnAlumniProfile(undefined);
    setAdminAlumniList([]);
    setAdminStudentList([]);
    setDiscoveryFilters(DEFAULT_DISCOVERY_FILTERS);
    setAlumniPage(1);
    setOppTypeFilter('All');
    setHubDomainFilter('All');
    setOppSavedOnly(false);
    setOppPage(1);
    setGuidePage(1);
    setActiveTab(defaultTabForRole(session.user.role));
    void loadCoreData(session.user);
    if (notice) showToast(notice);
  }

  function handleLogout() {
    parthaApi.logout();
    clearWorkspaceAccessToken();
    setUser(null);
    setStudentProfile(null);
    setOwnAlumniProfile(undefined);
    setAdminAlumniList([]);
    setDiscoveryData(EMPTY_DISCOVERY);
    setOpportunitiesData(EMPTY_OPPORTUNITIES);
    setGuidesData(EMPTY_GUIDES);
    setExtraGuides({});
    setMentorships([]);
    setOpportunityApplications([]);
    setBookmarks({ alumniIds: [], opportunityIds: [] });
    setNotifications([]);
    setSeniorForms([]);
    setAdminMetrics(null);
    setSelectedAlumniId(null);
    setActiveGuideId(null);
    void checkHealthAndBootstrap();
  }

  async function handleUpdateStudentProfile(
    updates: Partial<StudentTargetProfile>,
  ) {
    if (!user) return;
    const updated = await parthaApi.updateStudentProfile(updates);
    setStudentProfile(updated);
    setUser((prev) =>
      prev
        ? {
            ...prev,
            name: updated.name,
            branch: updated.branch,
            subtitle: `Sem ${updated.semester} ${updated.branch}${updated.usn ? ` · ${updated.usn}` : ''}`,
            avatarUrl: updated.avatarUrl,
            studentProfile: updated,
          }
        : prev,
    );
    await loadDiscovery(user, discoveryFilters, alumniPage, true);
    showToast('Student profile saved.');
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
    avatarUrl?: string;
  }) {
    if (!user) return;
    const res = await parthaApi.updateAlumniDetails(payload);
    setUser(res.user);
    setOwnAlumniProfile(res.alumni);
    await Promise.all([
      loadDiscovery(res.user, discoveryFilters, alumniPage, true),
      loadCoreData(res.user, true),
    ]);
    showToast('Alumni profile details saved.');
  }

  async function handleSaveAdminDetails(payload: {
    name: string;
    subtitle: string;
    branch: BranchCode;
  }) {
    if (!user) return;
    const updatedUser = await parthaApi.updateAdminDetails(payload);
    setUser(updatedUser);
    showToast('Admin details saved.');
  }

  async function handleSendMentorshipRequest(payload: {
    alumniId: string;
    goal: MentorshipGoal;
    message: string;
  }) {
    if (!user) return;
    await parthaApi.createMentorshipRequest(payload);
    await loadCoreData(user, true);
    showToast('Mentorship request sent. Contact stays gated until accepted.');
  }

  async function handleRespondMentorship(
    requestId: string,
    decision: 'accepted' | 'declined',
  ) {
    if (!user) return;
    await parthaApi.respondToMentorship(requestId, decision);
    await loadCoreData(user, true);
    showToast(
      decision === 'accepted'
        ? 'Request accepted. Your contact details are now unlocked and the student was notified.'
        : 'Request declined.',
    );
  }

  async function handleMarkMentorshipRead(requestId: string) {
    if (!user) return;
    const currentReq = mentorships.find((m) => m.id === requestId);
    if (!currentReq || currentReq.unreadCount === 0) return;

    setMentorships((prev) =>
      prev.map((m) => (m.id === requestId ? { ...m, unreadCount: 0 } : m)),
    );
    try {
      await parthaApi.markMentorshipRead(requestId);
    } catch {
      // Non-blocking read marker
    }
  }

  async function handleSendMentorshipMessage(requestId: string, text: string) {
    if (!user) return;
    const updated = await parthaApi.sendMentorshipMessage(requestId, text);
    setMentorships((prev) =>
      prev.map((m) => (m.id === requestId ? updated : m)),
    );
  }

  async function handleBookSession(
    requestId: string,
    payload: { slotLabel: string; topic: string },
  ) {
    if (!user) return;
    const updated = await parthaApi.bookMentorshipSession(requestId, payload);
    setMentorships((prev) =>
      prev.map((m) => (m.id === requestId ? updated : m)),
    );
    showToast('1-on-1 call slot requested. Waiting for mentor confirmation.');
  }

  async function handleConfirmSession(requestId: string) {
    if (!user) return;
    const updated = await parthaApi.confirmMentorshipSession(requestId);
    setMentorships((prev) =>
      prev.map((m) => (m.id === requestId ? updated : m)),
    );
    showToast('1-on-1 call confirmed.');
  }

  async function handleVerifyAlumni(alumniId: string) {
    if (!user) return;
    const target = adminAlumniList.find((a) => a.id === alumniId);
    await parthaApi.verifyAlumni(alumniId);
    await Promise.all([
      loadCoreData(user, true),
      loadDiscovery(user, discoveryFilters, alumniPage, true),
    ]);
    showToast(`${target?.name ?? 'Alumnus'} is now verified and live for students.`);
  }

  async function handleRejectAlumni(alumniId: string) {
    if (!user) return;
    const target = adminAlumniList.find((a) => a.id === alumniId);
    await parthaApi.rejectAlumni(alumniId);
    await Promise.all([
      loadCoreData(user, true),
      loadDiscovery(user, discoveryFilters, alumniPage, true),
    ]);
    showToast(`${target?.name ?? 'Alumnus'} was removed from the verification queue.`);
  }

  async function handleAdminAccountActive(userId: string, isActive: boolean) {
    if (!user) return;
    await parthaApi.setAdminAccountActive(userId, isActive);
    await Promise.all([
      loadCoreData(user, true),
      loadDiscovery(user, discoveryFilters, alumniPage, true),
    ]);
    showToast(isActive ? 'Account reactivated.' : 'Account suspended.');
  }

  async function handleToggleUpvote(guideId: string) {
    if (!user) return;
    const updated = await parthaApi.toggleGuideUpvote(guideId);
    setGuidesData((prev) => ({
      ...prev,
      items: prev.items.map((g) => (g.id === guideId ? updated : g)),
    }));
    setExtraGuides((prev) =>
      prev[guideId] ? { ...prev, [guideId]: updated } : prev,
    );
    await loadDiscovery(user, discoveryFilters, alumniPage, true);
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
    await parthaApi.createOpportunity(payload);
    setOppPage(1);
    await Promise.all([
      loadFeed(oppTypeFilter, hubDomainFilter, oppSavedOnly, 1, guidePage),
      loadCoreData(user, true),
    ]);
    showToast('Opportunity published.');
  }

  async function handleApplyToOpportunity(opportunityId: string, file: File) {
    if (!user) return;
    const application = await parthaApi.submitOpportunityApplication(
      opportunityId,
      file,
    );
    setOpportunityApplications((current) => [
      application,
      ...current.filter((item) => item.id !== application.id),
    ]);
    showToast('Your application and resume were submitted.');
  }

  async function handleUpdateApplicationStatus(
    applicationId: string,
    status: OpportunityApplication['status'],
  ) {
    const updated = await parthaApi.updateOpportunityApplicationStatus(
      applicationId,
      status,
    );
    setOpportunityApplications((current) =>
      current.map((item) => (item.id === applicationId ? updated : item)),
    );
    showToast('Application status updated.');
  }

  async function handleDownloadApplicationResume(applicationId: string) {
    const blob = await parthaApi.getOpportunityApplicationResume(applicationId);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'application-resume.pdf';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function handleDownloadStudentResume(studentId: string) {
    const blob = await parthaApi.getAdminStudentResume(studentId);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'student-resume.pdf';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function handleCreateGuide(payload: {
    title: string;
    domain: string;
    summary: string;
    content: string;
    readTimeMinutes: number;
  }) {
    if (!user) return;
    await parthaApi.createGuide(payload);
    setGuidePage(1);
    await Promise.all([
      loadFeed(oppTypeFilter, hubDomainFilter, oppSavedOnly, oppPage, 1),
      loadDiscovery(user, discoveryFilters, alumniPage, true),
      loadCoreData(user, true),
    ]);
    showToast('Prep guide published.');
  }

  async function handleToggleSaveAlumni(alumniId: string) {
    if (!user) return;
    const updated = await parthaApi.toggleBookmark('alumni', alumniId);
    setBookmarks(updated);
    const saved = updated.alumniIds.includes(alumniId);
    if (discoveryFilters.savedOnly) {
      await loadDiscovery(user, discoveryFilters, alumniPage, true);
    }
    showToast(
      saved ? 'Mentor saved to your shortlist.' : 'Removed from saved mentors.',
    );
  }

  async function handleToggleSaveOpportunity(opportunityId: string) {
    if (!user) return;
    const updated = await parthaApi.toggleBookmark('opportunity', opportunityId);
    setBookmarks(updated);
    const saved = updated.opportunityIds.includes(opportunityId);
    if (oppSavedOnly) {
      await loadFeed(oppTypeFilter, hubDomainFilter, oppSavedOnly, oppPage, guidePage);
    }
    showToast(
      saved ? 'Opportunity saved.' : 'Removed from saved opportunities.',
    );
  }

  async function handleToggleAlumniAvailability(updates: {
    openToInternshipReferrals?: boolean;
    openToProjectMentoring?: boolean;
  }) {
    if (!user) return;
    const updatedProfile = await parthaApi.updateAlumniAvailability(updates);
    setOwnAlumniProfile(updatedProfile);
    await loadDiscovery(user, discoveryFilters, alumniPage, true);
    showToast('Mentoring availability updated.');
  }

  async function handleOpenGuide(guideId: string) {
    setActiveGuideId(guideId);
    const inCurrent =
      guidesData.items.find((g) => g.id === guideId) ?? extraGuides[guideId];
    if (!inCurrent) {
      try {
        const res = await parthaApi.getGuides({ page: 1, limit: 50 });
        const found = res.items.find((g) => g.id === guideId);
        if (found) {
          setExtraGuides((prev) => ({ ...prev, [found.id]: found }));
        }
      } catch {
        // Ignore lookup error
      }
    }
  }

  async function handleDismissNotifications(openConnections?: boolean) {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    if (openConnections) {
      setActiveTab('connections');
    }
    try {
      await parthaApi.markNotificationsRead();
    } catch {
      // Ignore dismiss failure
    }
  }

  const availableHubDomains = useMemo(() => {
    const merged = new Set<string>([
      ...opportunitiesData.domains,
      ...guidesData.domains,
    ]);
    return Array.from(merged).sort();
  }, [opportunitiesData.domains, guidesData.domains]);

  if (!user) {
    void ParthaLandingPage;
    if (authGateMode !== null) {
      return (
        <div className="min-h-screen bg-[#FAF7F0] text-[#18221D]">
          <div className="mx-auto max-w-5xl px-4 pt-4">
            <button
              type="button"
              onClick={() => setAuthGateMode(null)}
              className="inline-flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium text-[#14382A] hover:bg-[#ECFDF5] cursor-pointer"
            >
              &larr; Back to Partha
            </button>
          </div>
          <AuthScreen
            dbHealth={dbHealth}
            bootstrapStatus={bootstrapStatus}
            checkingConnection={checkingConnection}
            onRetryHealth={checkHealthAndBootstrap}
            onAuthenticated={(session, notice) => {
              setAuthGateMode(null);
              handleAuthenticated(session, notice);
            }}
            initialMode={authGateMode}
          />
        </div>
      );
    }

    return (
      <Suspense fallback={<div className="min-h-screen bg-[#FAF7F0]" />}>
        <LandingPage
          onOpenAuth={(mode) => setAuthGateMode(mode)}
          onSelectGateMode={(mode) =>
            setGateAuthRequest((prev) => ({ mode, nonce: prev.nonce + 1 }))
          }
          gateAuthSlot={
            <AuthScreen
              embedded
              dbHealth={dbHealth}
              bootstrapStatus={bootstrapStatus}
              checkingConnection={checkingConnection}
              onRetryHealth={checkHealthAndBootstrap}
              onAuthenticated={handleAuthenticated}
              initialMode={gateAuthRequest.mode}
              modeNonce={gateAuthRequest.nonce}
            />
          }
        />
      </Suspense>
    );
  }

  const selectedAlumni =
    discoveryData.items.find((a) => a.id === selectedAlumniId) ??
    adminAlumniList.find((a) => a.id === selectedAlumniId) ??
    null;

  const activeGuide =
    guidesData.items.find((g) => g.id === activeGuideId) ??
    (activeGuideId ? extraGuides[activeGuideId] : undefined) ??
    null;

  const fallbackStudentProfile: StudentTargetProfile = studentProfile ?? {
    id: user.id,
    name: user.name,
    email: user.email,
    usn: '',
    branch: user.branch ?? 'CSE',
    semester: 6,
    targetSkills: ['Machine Learning', 'Python'],
    targetDomain: 'Machine Learning & AI',
    mentorshipGoals: [],
    customMentorshipGoal: '',
    targetCompany: '',
    resumeUrl: '',
    lookingForInternship: true,
    lookingForProjectHelp: true,
  };

  const unreadMentorshipsCount = mentorships.reduce(
    (sum, m) => sum + (m.unreadCount || 0),
    0,
  );
  const pendingRequestsCount =
    user.role === 'alumni'
      ? mentorships.filter((m) => m.status === 'pending').length
      : 0;
  const pendingVerificationsCount =
    user.role === 'admin'
      ? (adminMetrics?.pendingVerifications ??
          adminAlumniList.filter((a) => a.verificationStatus === 'pending').length)
      : 0;

  const canAlumniPost =
    user.role === 'alumni' &&
    (ownAlumniProfile?.verificationStatus ?? user.verificationStatus) ===
      'verified';

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const latestNotification = unreadNotifications[0] ?? null;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F0] text-[#18221D]">
      <Navbar
        user={user}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onLogout={handleLogout}
        unreadMentorshipsCount={unreadMentorshipsCount}
        pendingRequestsCount={pendingRequestsCount}
        pendingVerificationsCount={pendingVerificationsCount}
      />

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 pb-20 sm:px-6 md:pb-6 lg:px-8 space-y-5">
        {latestNotification && (
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-xs text-emerald-950"
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <Bell className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800" aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-semibold text-emerald-950">
                  {latestNotification.title}
                  {unreadNotifications.length > 1 && (
                    <span className="ml-1.5 font-mono text-[11px] text-emerald-800">
                      (+{unreadNotifications.length - 1} more)
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-emerald-900">{latestNotification.body}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {user.role === 'student' && activeTab !== 'connections' && (
                <button
                  type="button"
                  onClick={() => void handleDismissNotifications(true)}
                  className="rounded-lg bg-emerald-800 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-900 cursor-pointer"
                >
                  Open My Connections
                </button>
              )}
              <button
                type="button"
                onClick={() => void handleDismissNotifications(false)}
                aria-label="Dismiss notification"
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-[#FFFEFA] px-2.5 py-1.5 text-[11px] font-medium text-emerald-900 hover:bg-emerald-100 cursor-pointer"
              >
                <X className="h-3 w-3" aria-hidden="true" />
                Dismiss
              </button>
            </div>
          </div>
        )}

        {activeTab === 'discover' && (
          <StudentDiscoveryView
            alumni={discoveryData.items}
            totalCount={discoveryData.total}
            page={discoveryData.page}
            totalPages={discoveryData.totalPages}
            facets={discoveryData.facets}
            filters={discoveryFilters}
            onFiltersChange={(next) => {
              setDiscoveryFilters(next);
              setAlumniPage(1);
            }}
            onPageChange={setAlumniPage}
            studentProfile={fallbackStudentProfile}
            mentorships={mentorships}
            savedAlumniIds={bookmarks.alumniIds}
            role={user.role}
            loading={discoveryLoading}
            onUpdateStudentProfile={handleUpdateStudentProfile}
            onToggleSaveAlumni={handleToggleSaveAlumni}
            onRequestMentorship={(id) => setSelectedAlumniId(id)}
            onOpenGuide={(guideId) => void handleOpenGuide(guideId)}
          />
        )}

        {activeTab === 'connections' && (
          <ConnectionsView
            mentorships={mentorships}
            loading={coreLoading}
            onGoToDiscover={() => setActiveTab('discover')}
            onSendMessage={handleSendMentorshipMessage}
            onBookSession={handleBookSession}
            onMarkRead={handleMarkMentorshipRead}
          />
        )}

        {(activeTab === 'opportunities' || activeTab === 'guides') && (
          <OpportunitiesFeedView
            initialFeed={activeTab === 'guides' ? 'guides' : 'opportunities'}
            role={user.role}
            canAlumniPost={canAlumniPost}
            loading={feedLoading}
            opportunities={opportunitiesData.items}
            opportunitiesTotal={opportunitiesData.total}
            opportunitiesPage={opportunitiesData.page}
            opportunitiesTotalPages={opportunitiesData.totalPages}
            appliedOpportunityIds={opportunityApplications
              .filter((application) => application.studentId === user.id)
              .map((application) => application.opportunityId)}
            myApplications={opportunityApplications.filter(
              (application) => application.studentId === user.id,
            )}
            guides={guidesData.items}
            guidesTotal={guidesData.total}
            guidesPage={guidesData.page}
            guidesTotalPages={guidesData.totalPages}
            oppTypeFilter={oppTypeFilter}
            domainFilter={hubDomainFilter}
            savedOnly={oppSavedOnly}
            availableDomains={availableHubDomains}
            savedOpportunityIds={bookmarks.opportunityIds}
            onChangeOppType={(type) => {
              setOppTypeFilter(type);
              setOppPage(1);
            }}
            onChangeDomain={(domain) => {
              setHubDomainFilter(domain);
              setOppPage(1);
              setGuidePage(1);
            }}
            onChangeSavedOnly={(saved) => {
              setOppSavedOnly(saved);
              setOppPage(1);
            }}
            onOpportunitiesPageChange={setOppPage}
            onGuidesPageChange={setGuidePage}
            onToggleSaveOpportunity={handleToggleSaveOpportunity}
            onApply={handleApplyToOpportunity}
            onToggleUpvote={handleToggleUpvote}
            onOpenGuide={(guideId) => void handleOpenGuide(guideId)}
            onOpenPostModal={(mode) => setPostModalState({ open: true, mode })}
          />
        )}

        {activeTab === 'alumni-inbox' && (
          <AlumniDashboardView
            user={user}
            alumniProfile={ownAlumniProfile}
            requests={mentorships}
            applications={opportunityApplications}
            loading={coreLoading}
            onRespond={handleRespondMentorship}
            onOpenPostModal={(mode) => setPostModalState({ open: true, mode })}
            onToggleAvailability={handleToggleAlumniAvailability}
            onSendMessage={handleSendMentorshipMessage}
            onConfirmSession={handleConfirmSession}
            onMarkRead={handleMarkMentorshipRead}
            onEditDetails={() => setActiveTab('profile')}
            onUpdateApplicationStatus={handleUpdateApplicationStatus}
            onDownloadApplicationResume={handleDownloadApplicationResume}
          />
        )}

        {activeTab === 'admin-queue' && (
          <AdminDashboardView
            allAlumni={adminAlumniList}
            allStudents={adminStudentList}
            mentorships={mentorships}
            metrics={adminMetrics}
            applications={opportunityApplications}
            loading={coreLoading}
            onVerify={handleVerifyAlumni}
            onReject={handleRejectAlumni}
            onSetAccountActive={handleAdminAccountActive}
            onOpenSeniorForm={() => setActiveTab('senior-form')}
            onUpdateApplicationStatus={handleUpdateApplicationStatus}
            onDownloadApplicationResume={handleDownloadApplicationResume}
            onDownloadStudentResume={handleDownloadStudentResume}
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
            onDataImported={async () => {
              await Promise.all([
                loadCoreData(user, true),
                loadDiscovery(user, discoveryFilters, alumniPage, true),
              ]);
            }}
            onNotify={showToast}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileDetailsView
            user={user}
            studentProfile={fallbackStudentProfile}
            alumniProfile={ownAlumniProfile}
            onSaveStudent={handleUpdateStudentProfile}
            onSaveAlumni={handleSaveAlumniDetails}
            onSaveAdmin={handleSaveAdminDetails}
          />
        )}
      </main>

      <footer className="mb-14 md:mb-0 border-t border-[#E5DFD0] bg-[#FFFEFA] py-5">
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
          className="fixed bottom-20 right-4 z-50 rounded-lg border border-emerald-950 bg-emerald-900 px-4 py-2.5 text-xs font-medium text-[#FAF7F0] shadow-lg md:bottom-5 md:right-5"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
