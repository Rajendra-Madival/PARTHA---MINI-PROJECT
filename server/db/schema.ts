import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    role: text('role').notNull(), // 'student' | 'alumni' | 'admin'
    email: text('email').notNull(),
    name: text('name').notNull(),
    subtitle: text('subtitle').notNull().default(''),
    branch: text('branch').notNull().default('CSE'),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('users_role_email_idx').on(table.role, table.email)],
);

export const studentProfiles = pgTable('student_profiles', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  usn: text('usn').notNull().default(''),
  branch: text('branch').notNull().default('CSE'),
  semester: integer('semester').notNull().default(6),
  targetSkills: text('target_skills').array().notNull().default([]),
  targetDomain: text('target_domain').notNull().default('Machine Learning & AI'),
  targetCompany: text('target_company').notNull().default(''),
  resumeUrl: text('resume_url').notNull().default(''),
  lookingForInternship: boolean('looking_for_internship').notNull().default(true),
  lookingForProjectHelp: boolean('looking_for_project_help').notNull().default(true),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const alumniProfiles = pgTable('alumni_profiles', {
  id: text('id').primaryKey(),
  ownerUid: text('owner_uid').notNull(),
  name: text('name').notNull(),
  graduationYear: integer('graduation_year').notNull().default(2022),
  branch: text('branch').notNull().default('CSE'),
  role: text('role').notNull(),
  company: text('company').notNull(),
  domain: text('domain').notNull(),
  skills: text('skills').array().notNull().default([]),
  location: text('location').notNull().default('Bengaluru'),
  bio: text('bio').notNull().default(''),
  avatarUrl: text('avatar_url'),
  regNumber: text('reg_number').notNull(),
  source: text('source').notNull().default('self-registered'), // 'self-registered' | 'google-form' | 'admin-added'
  verificationStatus: text('verification_status').notNull().default('pending'), // 'pending' | 'verified' | 'rejected'
  openToInternshipReferrals: boolean('open_to_internship_referrals').notNull().default(true),
  openToProjectMentoring: boolean('open_to_project_mentoring').notNull().default(true),
  sharedProjectGuidesCount: integer('shared_project_guides_count').notNull().default(0),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const alumniPrivateContacts = pgTable('alumni_private_contacts', {
  alumniId: text('alumni_id')
    .primaryKey()
    .references(() => alumniProfiles.id, { onDelete: 'cascade' }),
  email: text('email').notNull().default(''),
  phone: text('phone').notNull().default(''),
  linkedinUrl: text('linkedin_url').notNull().default(''),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const mentorshipRequests = pgTable('mentorship_requests', {
  id: text('id').primaryKey(),
  studentId: text('student_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  studentName: text('student_name').notNull(),
  studentBranch: text('student_branch').notNull().default('CSE'),
  studentSemester: integer('student_semester').notNull().default(6),
  studentUsn: text('student_usn').notNull().default(''),
  alumniId: text('alumni_id')
    .notNull()
    .references(() => alumniProfiles.id, { onDelete: 'cascade' }),
  alumniOwnerUid: text('alumni_owner_uid').notNull(),
  alumniName: text('alumni_name').notNull(),
  alumniRole: text('alumni_role').notNull(),
  alumniCompany: text('alumni_company').notNull(),
  alumniBranch: text('alumni_branch').notNull().default('CSE'),
  alumniGraduationYear: integer('alumni_graduation_year').notNull().default(2022),
  alumniAvatarUrl: text('alumni_avatar_url'),
  goal: text('goal').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('pending'), // 'pending' | 'accepted' | 'declined'
  studentLastReadAt: timestamp('student_last_read_at', { withTimezone: true }),
  alumniLastReadAt: timestamp('alumni_last_read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  respondedAt: timestamp('responded_at', { withTimezone: true }),
});

export const mentorshipMessages = pgTable('mentorship_messages', {
  id: text('id').primaryKey(),
  mentorshipId: text('mentorship_id')
    .notNull()
    .references(() => mentorshipRequests.id, { onDelete: 'cascade' }),
  senderId: text('sender_id').notNull(),
  senderName: text('sender_name').notNull(),
  senderRole: text('sender_role').notNull(),
  text: text('text').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const mentorshipSessions = pgTable('mentorship_sessions', {
  id: text('id').primaryKey(),
  mentorshipId: text('mentorship_id')
    .notNull()
    .unique()
    .references(() => mentorshipRequests.id, { onDelete: 'cascade' }),
  slotLabel: text('slot_label').notNull(),
  topic: text('topic').notNull(),
  status: text('status').notNull().default('requested'), // 'requested' | 'confirmed'
  meetingLink: text('meeting_link').notNull(),
  bookedAt: timestamp('booked_at', { withTimezone: true }).notNull().defaultNow(),
});

export const opportunities = pgTable('opportunities', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  company: text('company').notNull(),
  type: text('type').notNull(),
  domain: text('domain').notNull(),
  location: text('location').notNull().default('Bengaluru'),
  stipendOrCtc: text('stipend_or_ctc').notNull().default('Competitive'),
  skills: text('skills').array().notNull().default([]),
  description: text('description').notNull(),
  applyUrl: text('apply_url').notNull().default(''),
  postedById: text('posted_by_id').notNull(),
  postedByAlumniId: text('posted_by_alumni_id').notNull(),
  postedByName: text('posted_by_name').notNull(),
  postedByRole: text('posted_by_role').notNull(),
  isRemote: boolean('is_remote').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const knowledgeGuides = pgTable('knowledge_guides', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  domain: text('domain').notNull(),
  summary: text('summary').notNull(),
  content: text('content').notNull(),
  readTimeMinutes: integer('read_time_minutes').notNull().default(5),
  authorId: text('author_id').notNull(),
  authorAlumniId: text('author_alumni_id').notNull(),
  authorName: text('author_name').notNull(),
  authorRole: text('author_role').notNull(),
  authorCompany: text('author_company').notNull(),
  authorBatch: text('author_batch').notNull(),
  upvotes: integer('upvotes').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const guideUpvotes = pgTable(
  'guide_upvotes',
  {
    guideId: text('guide_id')
      .notNull()
      .references(() => knowledgeGuides.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.guideId, table.userId] })],
);

export const userBookmarks = pgTable(
  'user_bookmarks',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(), // 'alumni' | 'opportunity'
    targetId: text('target_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.kind, table.targetId] })],
);

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  kind: text('kind').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  emailSent: boolean('email_sent').notNull().default(false),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const passwordResets = pgTable('password_resets', {
  key: text('key').primaryKey(),
  role: text('role').notNull(),
  email: text('email').notNull(),
  codeHash: text('code_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  attempts: integer('attempts').notNull().default(0),
});

export const seniorIntakeForms = pgTable('senior_intake_forms', {
  formId: text('form_id').primaryKey(),
  title: text('title').notNull(),
  responderUri: text('responder_uri').notNull(),
  editUri: text('edit_uri').notNull(),
  createdByUid: text('created_by_uid').notNull(),
  createdByEmail: text('created_by_email').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const importedFormResponses = pgTable(
  'imported_form_responses',
  {
    formId: text('form_id')
      .notNull()
      .references(() => seniorIntakeForms.formId, { onDelete: 'cascade' }),
    responseId: text('response_id').notNull(),
    alumniId: text('alumni_id').notNull(),
    importedByUid: text('imported_by_uid').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.formId, table.responseId] })],
);
