import type {
  AdminBootstrapStatus,
  AdminMetrics,
  AlumniDiscoveryResponse,
  AlumniProfile,
  AuthSession,
  AuthUser,
  BranchCode,
  DatabaseHealthStatus,
  FormResponsePreview,
  GuidesPaginatedResponse,
  KnowledgeGuide,
  MentorshipGoal,
  MentorshipRequest,
  OpportunitiesPaginatedResponse,
  Opportunity,
  OpportunityType,
  ParthaNotification,
  SeniorIntakeForm,
  StudentTargetProfile,
  UserBookmarks,
  UserRole,
} from '../types';

// Hold Bearer session token strictly in memory (never localStorage/sessionStorage).
let memoryAuthToken: string | null = null;

export function getAuthToken(): string | null {
  return memoryAuthToken;
}

export function setAuthToken(token: string | null): void {
  memoryAuthToken = token;
}

async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    let errorMessage = `Request failed (${response.status})`;
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error) errorMessage = payload.error;
    } catch {
      // Ignore non-JSON error bodies
    }
    throw new Error(errorMessage);
  }

  return (await response.json()) as T;
}

export interface AlumniQueryParams {
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
}

export interface OpportunitiesQueryParams {
  page?: number;
  limit?: number;
  type?: string;
  domain?: string;
  savedOnly?: boolean;
}

export interface GuidesQueryParams {
  page?: number;
  limit?: number;
  domain?: string;
}

export const parthaApi = {
  getHealth(): Promise<DatabaseHealthStatus> {
    return requestJson<DatabaseHealthStatus>('/api/health');
  },

  getBootstrapStatus(): Promise<AdminBootstrapStatus> {
    return requestJson<AdminBootstrapStatus>('/api/auth/bootstrap-status');
  },

  async claimAdmin(payload: {
    name: string;
    email: string;
    password: string;
    branch: BranchCode;
  }): Promise<AuthSession> {
    const session = await requestJson<AuthSession>('/api/auth/claim-admin', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setAuthToken(session.token);
    return session;
  },

  async login(payload: {
    role: UserRole;
    identifier: string;
    password: string;
  }): Promise<AuthSession> {
    const session = await requestJson<AuthSession>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setAuthToken(session.token);
    return session;
  },

  async registerStudent(payload: {
    name: string;
    email: string;
    usn: string;
    branch: BranchCode;
    semester: number;
    targetSkills: string[];
    targetDomain: string;
    password: string;
  }): Promise<AuthSession> {
    const session = await requestJson<AuthSession>('/api/auth/register-student', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setAuthToken(session.token);
    return session;
  },

  async registerAlumni(payload: {
    name: string;
    email: string;
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
    password: string;
  }): Promise<AuthSession> {
    const session = await requestJson<AuthSession>('/api/auth/register-alumni', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setAuthToken(session.token);
    return session;
  },

  requestPasswordReset(payload: {
    role: 'student' | 'alumni';
    email: string;
  }): Promise<{ message: string; previewCode?: string }> {
    return requestJson<{ message: string; previewCode?: string }>(
      '/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
  },

  resetPassword(payload: {
    role: 'student' | 'alumni';
    email: string;
    code: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    return requestJson<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getMe(): Promise<AuthUser> {
    const res = await requestJson<{ user: AuthUser }>('/api/auth/me');
    return res.user;
  },

  logout(): void {
    setAuthToken(null);
  },

  updateStudentProfile(
    updates: Partial<StudentTargetProfile>,
  ): Promise<StudentTargetProfile> {
    return requestJson<StudentTargetProfile>('/api/student-profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  updateAlumniDetails(payload: {
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
  }): Promise<{ user: AuthUser; alumni: AlumniProfile }> {
    return requestJson<{ user: AuthUser; alumni: AlumniProfile }>(
      '/api/alumni/me',
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
    );
  },

  updateAlumniAvailability(updates: {
    openToInternshipReferrals?: boolean;
    openToProjectMentoring?: boolean;
  }): Promise<AlumniProfile> {
    return requestJson<AlumniProfile>('/api/alumni/me/availability', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async updateAdminDetails(payload: {
    name: string;
    subtitle: string;
    branch: BranchCode;
  }): Promise<AuthUser> {
    const res = await requestJson<{ user: AuthUser }>('/api/admin/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.user;
  },

  getAlumni(options: AlumniQueryParams = {}): Promise<AlumniDiscoveryResponse> {
    const params = new URLSearchParams();
    if (options.includeAll) params.set('includeAll', 'true');
    if (options.page) params.set('page', String(options.page));
    if (options.limit) params.set('limit', String(options.limit));
    if (options.search) params.set('search', options.search);
    if (options.skill && options.skill !== 'All') params.set('skill', options.skill);
    if (options.company && options.company !== 'All') {
      params.set('company', options.company);
    }
    if (options.role && options.role !== 'All') params.set('role', options.role);
    if (options.domain && options.domain !== 'All') params.set('domain', options.domain);
    if (options.internshipOnly) params.set('internshipOnly', 'true');
    if (options.projectHelpOnly) params.set('projectHelpOnly', 'true');
    if (options.savedOnly) params.set('savedOnly', 'true');
    if (options.sortBy) params.set('sortBy', options.sortBy);
    const query = params.toString();
    return requestJson<AlumniDiscoveryResponse>(
      `/api/alumni${query ? `?${query}` : ''}`,
    );
  },

  verifyAlumni(alumniId: string): Promise<AlumniProfile> {
    return requestJson<AlumniProfile>(`/api/alumni/${alumniId}/verify`, {
      method: 'POST',
    });
  },

  rejectAlumni(alumniId: string): Promise<AlumniProfile> {
    return requestJson<AlumniProfile>(`/api/alumni/${alumniId}/reject`, {
      method: 'POST',
    });
  },

  getMentorships(): Promise<MentorshipRequest[]> {
    return requestJson<MentorshipRequest[]>('/api/mentorships');
  },

  createMentorshipRequest(payload: {
    alumniId: string;
    goal: MentorshipGoal;
    message: string;
  }): Promise<MentorshipRequest> {
    return requestJson<MentorshipRequest>('/api/mentorships', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  respondToMentorship(
    requestId: string,
    decision: 'accepted' | 'declined',
  ): Promise<MentorshipRequest> {
    return requestJson<MentorshipRequest>(`/api/mentorships/${requestId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ decision }),
    });
  },

  markMentorshipRead(requestId: string): Promise<{ ok: boolean }> {
    return requestJson<{ ok: boolean }>(`/api/mentorships/${requestId}/mark-read`, {
      method: 'POST',
    });
  },

  sendMentorshipMessage(
    requestId: string,
    text: string,
  ): Promise<MentorshipRequest> {
    return requestJson<MentorshipRequest>(`/api/mentorships/${requestId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  bookMentorshipSession(
    requestId: string,
    payload: { slotLabel: string; topic: string },
  ): Promise<MentorshipRequest> {
    return requestJson<MentorshipRequest>(
      `/api/mentorships/${requestId}/book-session`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
  },

  confirmMentorshipSession(requestId: string): Promise<MentorshipRequest> {
    return requestJson<MentorshipRequest>(
      `/api/mentorships/${requestId}/confirm-session`,
      { method: 'POST' },
    );
  },

  getBookmarks(): Promise<UserBookmarks> {
    return requestJson<UserBookmarks>('/api/bookmarks');
  },

  toggleBookmark(
    kind: 'alumni' | 'opportunity',
    targetId: string,
  ): Promise<UserBookmarks> {
    return requestJson<UserBookmarks>('/api/bookmarks/toggle', {
      method: 'POST',
      body: JSON.stringify({ kind, targetId }),
    });
  },

  getOpportunities(
    options: OpportunitiesQueryParams = {},
  ): Promise<OpportunitiesPaginatedResponse> {
    const params = new URLSearchParams();
    if (options.page) params.set('page', String(options.page));
    if (options.limit) params.set('limit', String(options.limit));
    if (options.type && options.type !== 'All') params.set('type', options.type);
    if (options.domain && options.domain !== 'All') params.set('domain', options.domain);
    if (options.savedOnly) params.set('savedOnly', 'true');
    const query = params.toString();
    return requestJson<OpportunitiesPaginatedResponse>(
      `/api/opportunities${query ? `?${query}` : ''}`,
    );
  },

  createOpportunity(payload: {
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
  }): Promise<Opportunity> {
    return requestJson<Opportunity>('/api/opportunities', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getGuides(options: GuidesQueryParams = {}): Promise<GuidesPaginatedResponse> {
    const params = new URLSearchParams();
    if (options.page) params.set('page', String(options.page));
    if (options.limit) params.set('limit', String(options.limit));
    if (options.domain && options.domain !== 'All') params.set('domain', options.domain);
    const query = params.toString();
    return requestJson<GuidesPaginatedResponse>(
      `/api/guides${query ? `?${query}` : ''}`,
    );
  },

  createGuide(payload: {
    title: string;
    domain: string;
    summary: string;
    content: string;
    readTimeMinutes: number;
  }): Promise<KnowledgeGuide> {
    return requestJson<KnowledgeGuide>('/api/guides', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  toggleGuideUpvote(guideId: string): Promise<KnowledgeGuide> {
    return requestJson<KnowledgeGuide>(`/api/guides/${guideId}/upvote`, {
      method: 'POST',
    });
  },

  getNotifications(): Promise<ParthaNotification[]> {
    return requestJson<ParthaNotification[]>('/api/notifications');
  },

  markNotificationsRead(): Promise<{ ok: boolean }> {
    return requestJson<{ ok: boolean }>('/api/notifications/mark-read', {
      method: 'POST',
    });
  },

  listSeniorIntakeForms(): Promise<SeniorIntakeForm[]> {
    return requestJson<SeniorIntakeForm[]>('/api/senior-forms');
  },

  saveSeniorIntakeForm(form: {
    formId: string;
    title: string;
    responderUri: string;
    editUri: string;
  }): Promise<SeniorIntakeForm> {
    return requestJson<SeniorIntakeForm>('/api/senior-forms', {
      method: 'POST',
      body: JSON.stringify(form),
    });
  },

  async listImportedResponseIds(formId: string): Promise<Set<string>> {
    const res = await requestJson<{ responseIds: string[] }>(
      `/api/senior-forms/${encodeURIComponent(formId)}/imported-ids`,
    );
    return new Set(res.responseIds);
  },

  importSeniorFormResponses(
    formId: string,
    responses: FormResponsePreview[],
    autoVerify: boolean,
  ): Promise<{ importedCount: number }> {
    return requestJson<{ importedCount: number }>(
      `/api/senior-forms/${encodeURIComponent(formId)}/import`,
      {
        method: 'POST',
        body: JSON.stringify({ responses, autoVerify }),
      },
    );
  },

  getAdminMetrics(): Promise<AdminMetrics> {
    return requestJson<AdminMetrics>('/api/admin/metrics');
  },
};
