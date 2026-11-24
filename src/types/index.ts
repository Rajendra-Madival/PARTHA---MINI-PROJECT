export type UserRole = 'student' | 'alumni' | 'admin';

export type VerificationStatus = 'verified' | 'pending' | 'rejected';

export type MentorshipGoal =
  | 'Career Guidance'
  | 'Resume Review'
  | 'Internship Referral'
  | 'Project Help';

export type MentorshipStatus = 'pending' | 'accepted' | 'declined';

export type OpportunityType =
  | 'Internship'
  | 'Full-time Job'
  | 'Collaborative Project';

export type BranchCode = 'CSE' | 'ISE' | 'ECE' | 'ME' | 'EEE';

export interface AuthUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  subtitle: string;
  isAdminAccount?: boolean;
  verificationStatus?: VerificationStatus;
  studentProfile?: StudentTargetProfile;
}

export interface AlumniContact {
  email: string;
  phone: string;
  linkedinUrl: string;
}

export interface AlumniHighlight {
  guideId: string;
  title: string;
  upvotes: number;
}

export interface AlumniProfile {
  id: string;
  ownerUid: string;
  name: string;
  graduationYear: number;
  branch: BranchCode;
  role: string;
  company: string;
  domain: string;
  skills: string[];
  location: string;
  openToInternshipReferrals: boolean;
  openToProjectMentoring: boolean;
  sharedProjectGuidesCount: number;
  bio: string;
  avatarUrl?: string;
  verificationStatus: VerificationStatus;
  regNumber: string;
  source: 'self-registered' | 'google-form' | 'admin-added';
  submittedAt: string;
  topHighlight?: AlumniHighlight;
  contact: AlumniContact | null;
  isContactGated: boolean;
}

export interface StudentTargetProfile {
  id: string;
  name: string;
  email: string;
  usn: string;
  branch: BranchCode;
  semester: number;
  targetSkills: string[];
  targetDomain: string;
  targetCompany: string;
  lookingForInternship: boolean;
  lookingForProjectHelp: boolean;
}

export interface MatchResult {
  alumni: AlumniProfile;
  score: number;
  matchReasons: string[];
  whyMatchedSummary: string;
}

export interface MentorshipMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  sentAt: string;
}

export interface MentorshipSessionBooking {
  id: string;
  slotLabel: string;
  topic: string;
  status: 'requested' | 'confirmed';
  meetingLink: string;
  bookedAt: string;
}

export interface MentorshipRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentBranch: BranchCode;
  studentSemester: number;
  studentUsn: string;
  alumniId: string;
  alumniOwnerUid: string;
  alumniName: string;
  alumniRole: string;
  alumniCompany: string;
  alumniBranch: BranchCode;
  alumniGraduationYear: number;
  alumniAvatarUrl?: string;
  goal: MentorshipGoal;
  message: string;
  status: MentorshipStatus;
  createdAt: string;
  respondedAt?: string;
  unlockedContact: AlumniContact | null;
  messages: MentorshipMessage[];
  sessionBooking: MentorshipSessionBooking | null;
}

export interface UserBookmarks {
  alumniIds: string[];
  opportunityIds: string[];
}

export interface Opportunity {
  id: string;
  title: string;
  company: string;
  type: OpportunityType;
  domain: string;
  location: string;
  stipendOrCtc: string;
  skills: string[];
  description: string;
  applyUrl: string;
  postedById: string;
  postedByAlumniId: string;
  postedByName: string;
  postedByRole: string;
  postedAt: string;
  isRemote: boolean;
}

export interface KnowledgeGuide {
  id: string;
  title: string;
  domain: string;
  summary: string;
  content: string;
  readTimeMinutes: number;
  authorId: string;
  authorAlumniId: string;
  authorName: string;
  authorRole: string;
  authorCompany: string;
  authorBatch: string;
  upvotes: number;
  upvotedByStudent: boolean;
  publishedAt: string;
}

export interface DomainMetric {
  domain: string;
  alumniCount: number;
  guideCount: number;
}

export interface AdminMetrics {
  totalVerifiedAlumni: number;
  pendingVerifications: number;
  activeMentorshipConnections: number;
  pendingMentorshipRequests: number;
  opportunitiesShared: number;
  knowledgeGuidesCount: number;
  totalGuideUpvotes: number;
  topDomains: DomainMetric[];
}

export interface DiscoveryFilters {
  search: string;
  skill: string;
  company: string;
  role: string;
  domain: string;
  internshipOnly: boolean;
  projectHelpOnly: boolean;
  savedOnly: boolean;
  sortBy: 'match' | 'upvotes' | 'batch';
}

export interface SeniorIntakeForm {
  formId: string;
  title: string;
  responderUri: string;
  editUri: string;
  createdByUid: string;
  createdByEmail: string;
  createdAt: string;
}

export interface FormResponsePreview {
  responseId: string;
  submittedAt: string;
  alreadyImported: boolean;
  name: string;
  regNumber: string;
  graduationYear: number;
  branch: BranchCode;
  company: string;
  role: string;
  domain: string;
  skills: string[];
  location: string;
  openToInternshipReferrals: boolean;
  openToProjectMentoring: boolean;
  bio: string;
  email: string;
  phone: string;
  linkedinUrl: string;
}
