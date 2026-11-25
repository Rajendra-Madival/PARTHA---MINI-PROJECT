import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  AuthUser,
  BranchCode,
  FormResponsePreview,
  MentorshipGoal,
  OpportunityType,
  UserRole,
} from './src/types/index.ts';
import { checkDatabaseHealth } from './server/db/client.ts';
import { sendParthaEmail } from './server/email.ts';
import { postgresStore, StoreError } from './server/postgresStore.ts';
import { createRateLimiter } from './server/rateLimit.ts';
import { parsePagination } from './server/validation.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

interface AuthedRequest extends Request {
  user?: AuthUser;
}

type AsyncHandler = (
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) => Promise<void>;

function asyncRoute(handler: AsyncHandler) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function requireAuth(allowedRoles?: UserRole[]) {
  return asyncRoute(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : undefined;

    const user = await postgresStore.verifyToken(token);
    if (!user) {
      res.status(401).json({ error: 'Please sign in to access this feature.' });
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      res.status(403).json({
        error: `This action requires ${allowedRoles.join(' or ')} access.`,
      });
      return;
    }

    req.user = user;
    next();
  });
}

const authLimiter = createRateLimiter({
  bucket: 'auth',
  windowMs: 15 * 60_000,
  maxRequests: 25,
  message: 'Too many authentication attempts. Please wait a few minutes and try again.',
});

const writeLimiter = createRateLimiter({
  bucket: 'write',
  windowMs: 60_000,
  maxRequests: 30,
  keyByUser: (req) => (req as AuthedRequest).user?.id,
  message: 'You are sending updates too quickly. Please pause a moment and try again.',
});

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '1mb' }));

  // Health & DB connectivity check
  app.get(
    '/api/health',
    asyncRoute(async (_req, res) => {
      const dbHealth = await checkDatabaseHealth();
      res.json({
        status: 'ok',
        platform: 'PARTHA',
        ...dbHealth,
      });
    }),
  );

  // Admin first-run bootstrap status & atomic setup
  app.get(
    '/api/auth/bootstrap-status',
    asyncRoute(async (_req, res) => {
      const status = await postgresStore.getAdminBootstrapStatus();
      res.json(status);
    }),
  );

  app.post(
    '/api/auth/claim-admin',
    authLimiter,
    asyncRoute(async (req, res) => {
      const body = req.body as {
        name?: string;
        email?: string;
        password?: string;
        branch?: BranchCode;
      };
      const session = await postgresStore.claimFirstAdmin({
        name: body.name ?? '',
        email: body.email ?? '',
        password: body.password ?? '',
        branch: body.branch,
      });
      res.status(201).json(session);
    }),
  );

  // Authentication Routes
  app.post(
    '/api/auth/login',
    authLimiter,
    asyncRoute(async (req, res) => {
      const { role, identifier, password } = req.body as {
        role?: UserRole;
        identifier?: string;
        password?: string;
      };

      if (!role || !['student', 'alumni', 'admin'].includes(role)) {
        res.status(400).json({ error: 'Please choose Student, Alumni, or Admin login.' });
        return;
      }

      const session = await postgresStore.login({
        role,
        identifier: identifier ?? '',
        password: password ?? '',
      });
      res.json(session);
    }),
  );

  app.post(
    '/api/auth/register-student',
    authLimiter,
    asyncRoute(async (req, res) => {
      const body = req.body as {
        name?: string;
        email?: string;
        usn?: string;
        branch?: BranchCode;
        semester?: number;
        targetSkills?: string[];
        targetDomain?: string;
        password?: string;
      };

      const session = await postgresStore.registerStudent({
        name: body.name ?? '',
        email: body.email ?? '',
        usn: body.usn ?? '',
        branch: body.branch ?? 'CSE',
        semester: body.semester ?? 6,
        targetSkills: Array.isArray(body.targetSkills) ? body.targetSkills : ['Python'],
        targetDomain: body.targetDomain ?? 'Machine Learning & AI',
        password: body.password ?? '',
      });
      res.status(201).json(session);
    }),
  );

  app.post(
    '/api/auth/register-alumni',
    authLimiter,
    asyncRoute(async (req, res) => {
      const body = req.body as {
        name?: string;
        email?: string;
        phone?: string;
        linkedinUrl?: string;
        regNumber?: string;
        graduationYear?: number;
        branch?: BranchCode;
        role?: string;
        company?: string;
        domain?: string;
        skills?: string[];
        location?: string;
        bio?: string;
        password?: string;
      };

      const session = await postgresStore.registerAlumni({
        name: body.name ?? '',
        email: body.email ?? '',
        phone: body.phone ?? '',
        regNumber: body.regNumber ?? '',
        graduationYear: body.graduationYear ?? 2022,
        branch: body.branch ?? 'CSE',
        password: body.password ?? '',
      });
      res.status(201).json(session);
    }),
  );

  app.post(
    '/api/auth/forgot-password',
    authLimiter,
    asyncRoute(async (req, res) => {
      const { role, email } = req.body as {
        role?: UserRole;
        email?: string;
      };

      if (!role || !['student', 'alumni'].includes(role)) {
        res.status(400).json({
          error: 'Password reset via email is available for Student and Alumni accounts.',
        });
        return;
      }

      const result = await postgresStore.requestPasswordReset({
        role: role as 'student' | 'alumni',
        email: email ?? '',
      });

      const hasResend = Boolean(process.env.RESEND_API_KEY?.trim());
      if (result.emailExists && result.code && hasResend && email) {
        await sendParthaEmail({
          to: email,
          subject: 'PARTHA Password Reset Code',
          text: `Your PARTHA password reset verification code is: ${result.code}\n\nThis code expires in 15 minutes.`,
        });
      }

      const isPreviewWithoutEmailProvider =
        process.env.NODE_ENV !== 'production' && !hasResend;

      res.json({
        message:
          'If an account is registered with that email, a 6-digit verification code has been sent.',
        ...(isPreviewWithoutEmailProvider && result.emailExists && result.code
          ? { previewCode: result.code }
          : {}),
      });
    }),
  );

  app.post(
    '/api/auth/reset-password',
    authLimiter,
    asyncRoute(async (req, res) => {
      const { role, email, code, newPassword } = req.body as {
        role?: UserRole;
        email?: string;
        code?: string;
        newPassword?: string;
      };

      if (!role || !['student', 'alumni'].includes(role)) {
        res.status(400).json({
          error: 'Password reset via email is available for Student and Alumni accounts.',
        });
        return;
      }

      await postgresStore.confirmPasswordReset({
        role: role as 'student' | 'alumni',
        email: email ?? '',
        code: code ?? '',
        newPassword: newPassword ?? '',
      });

      res.json({
        message: 'Your password has been updated. You can now sign in with your new password.',
      });
    }),
  );

  app.get(
    '/api/auth/me',
    requireAuth(),
    asyncRoute(async (req, res) => {
      res.json({ user: req.user });
    }),
  );

  // Profile Management
  app.patch(
    '/api/student-profile',
    requireAuth(['student']),
    writeLimiter,
    asyncRoute(async (req, res) => {
      const updatedUser = await postgresStore.updateStudentProfile(
        req.user!.id,
        req.body ?? {},
      );
      res.json(updatedUser.studentProfile);
    }),
  );

  app.patch(
    '/api/alumni/me',
    requireAuth(['alumni']),
    writeLimiter,
    asyncRoute(async (req, res) => {
      const updated = await postgresStore.updateAlumniDetails(
        req.user!,
        req.body ?? {},
      );
      res.json(updated);
    }),
  );

  app.patch(
    '/api/alumni/me/availability',
    requireAuth(['alumni']),
    writeLimiter,
    asyncRoute(async (req, res) => {
      const updated = await postgresStore.updateAlumniAvailability(
        req.user!,
        req.body ?? {},
      );
      res.json(updated);
    }),
  );

  app.patch(
    '/api/admin/me',
    requireAuth(['admin']),
    writeLimiter,
    asyncRoute(async (req, res) => {
      const updatedUser = await postgresStore.updateAdminDetails(
        req.user!,
        req.body ?? {},
      );
      res.json({ user: updatedUser });
    }),
  );

  // Paginated & Faceted Alumni Discovery + Admin Queue
  app.get(
    '/api/alumni',
    requireAuth(),
    asyncRoute(async (req, res) => {
      const includeAll = req.query.includeAll === 'true' && req.user!.role === 'admin';
      const { page, limit } = parsePagination(
        req.query,
        includeAll ? 100 : 8,
        includeAll ? 200 : 50,
      );
      const sortRaw = String(req.query.sortBy ?? 'match');
      const sortBy =
        sortRaw === 'upvotes' || sortRaw === 'batch' ? sortRaw : 'match';

      const result = await postgresStore.listAlumni(req.user!, {
        includeAll,
        page,
        limit,
        search: typeof req.query.search === 'string' ? req.query.search : '',
        skill: typeof req.query.skill === 'string' ? req.query.skill : 'All',
        company: typeof req.query.company === 'string' ? req.query.company : 'All',
        role: typeof req.query.role === 'string' ? req.query.role : 'All',
        domain: typeof req.query.domain === 'string' ? req.query.domain : 'All',
        internshipOnly: req.query.internshipOnly === 'true',
        projectHelpOnly: req.query.projectHelpOnly === 'true',
        savedOnly: req.query.savedOnly === 'true',
        sortBy,
      });
      res.json(result);
    }),
  );

  app.post(
    '/api/alumni/:id/verify',
    requireAuth(['admin']),
    asyncRoute(async (req, res) => {
      const updated = await postgresStore.setAlumniVerificationStatus(
        String(req.params.id),
        'verified',
        req.user!,
      );
      res.json(updated);
    }),
  );

  app.post(
    '/api/alumni/:id/reject',
    requireAuth(['admin']),
    asyncRoute(async (req, res) => {
      const updated = await postgresStore.setAlumniVerificationStatus(
        String(req.params.id),
        'rejected',
        req.user!,
      );
      res.json(updated);
    }),
  );

  // Mentorship workflow, unread tracking, messaging, session booking & email alerts
  app.get(
    '/api/mentorships',
    requireAuth(),
    asyncRoute(async (req, res) => {
      const list = await postgresStore.listMentorships(req.user!);
      res.json(list);
    }),
  );

  app.post(
    '/api/mentorships',
    requireAuth(['student']),
    writeLimiter,
    asyncRoute(async (req, res) => {
      const { alumniId, goal, message } = req.body as {
        alumniId?: string;
        goal?: MentorshipGoal;
        message?: string;
      };

      if (!alumniId || !goal || !message?.trim()) {
        res.status(400).json({ error: 'Please select a goal and write a brief message.' });
        return;
      }

      const created = await postgresStore.createMentorshipRequest(req.user!, {
        alumniId,
        goal,
        message,
      });
      res.status(201).json(created);
    }),
  );

  app.post(
    '/api/mentorships/:id/respond',
    requireAuth(['alumni']),
    asyncRoute(async (req, res) => {
      const { decision } = req.body as { decision?: 'accepted' | 'declined' };
      if (decision !== 'accepted' && decision !== 'declined') {
        res.status(400).json({ error: 'Decision must be accepted or declined.' });
        return;
      }

      const result = await postgresStore.respondToMentorship(
        req.user!,
        String(req.params.id),
        decision,
      );

      if (decision === 'accepted' && result.studentEmail) {
        const contact = result.request.unlockedContact;
        const lines = [
          `Hello ${result.studentName ?? 'Student'},`,
          '',
          `${result.request.alumniName} (${result.request.alumniRole}, ${result.request.alumniCompany}) has accepted your mentorship request for "${result.request.goal}" on PARTHA.`,
          '',
          'Unlocked Contact Details:',
          contact?.email ? `- Email: ${contact.email}` : null,
          contact?.phone ? `- Phone / WhatsApp: ${contact.phone}` : null,
          contact?.linkedinUrl ? `- LinkedIn: ${contact.linkedinUrl}` : null,
          '',
          'Sign in to PARTHA and open My Mentors to message them directly or book a 20-minute 1-on-1 call.',
          '',
          '— PARTHA · KLS VDIT Mentorship Platform',
        ]
          .filter((l): l is string => l !== null)
          .join('\n');

        const sent = await sendParthaEmail({
          to: result.studentEmail,
          subject: `PARTHA: ${result.request.alumniName} accepted your mentorship request`,
          text: lines,
        });

        if (sent && result.notificationId) {
          await postgresStore
            .markNotificationEmailSent(result.notificationId)
            .catch(() => {});
        }
      }

      res.json(result.request);
    }),
  );

  app.post(
    '/api/mentorships/:id/mark-read',
    requireAuth(['student', 'alumni']),
    asyncRoute(async (req, res) => {
      await postgresStore.markMentorshipRead(req.user!, String(req.params.id));
      res.json({ ok: true });
    }),
  );

  app.post(
    '/api/mentorships/:id/messages',
    requireAuth(['student', 'alumni']),
    writeLimiter,
    asyncRoute(async (req, res) => {
      const { text } = req.body as { text?: string };
      if (!text?.trim()) {
        res.status(400).json({ error: 'Message cannot be empty.' });
        return;
      }

      const updated = await postgresStore.addMentorshipMessage(
        req.user!,
        String(req.params.id),
        text,
      );
      res.status(201).json(updated);
    }),
  );

  app.post(
    '/api/mentorships/:id/book-session',
    requireAuth(['student']),
    writeLimiter,
    asyncRoute(async (req, res) => {
      const { slotLabel, topic } = req.body as {
        slotLabel?: string;
        topic?: string;
      };
      if (!slotLabel?.trim()) {
        res.status(400).json({ error: 'Please select a time slot.' });
        return;
      }

      const updated = await postgresStore.bookMentorshipSession(
        req.user!,
        String(req.params.id),
        { slotLabel, topic: topic ?? '' },
      );
      res.status(201).json(updated);
    }),
  );

  app.post(
    '/api/mentorships/:id/confirm-session',
    requireAuth(['alumni']),
    asyncRoute(async (req, res) => {
      const updated = await postgresStore.confirmMentorshipSession(
        req.user!,
        String(req.params.id),
      );
      res.json(updated);
    }),
  );

  // Bookmarks / Saved list
  app.get(
    '/api/bookmarks',
    requireAuth(),
    asyncRoute(async (req, res) => {
      const bookmarks = await postgresStore.getBookmarks(req.user!.id);
      res.json(bookmarks);
    }),
  );

  app.post(
    '/api/bookmarks/toggle',
    requireAuth(),
    asyncRoute(async (req, res) => {
      const { kind, targetId } = req.body as {
        kind?: 'alumni' | 'opportunity';
        targetId?: string;
      };
      if (!kind || !['alumni', 'opportunity'].includes(kind) || !targetId) {
        res.status(400).json({ error: 'Valid bookmark kind and targetId are required.' });
        return;
      }
      const bookmarks = await postgresStore.toggleBookmark(
        req.user!.id,
        kind,
        targetId,
      );
      res.json(bookmarks);
    }),
  );

  // Paginated Opportunities & Knowledge Guides
  app.get(
    '/api/opportunities',
    requireAuth(),
    asyncRoute(async (req, res) => {
      const { page, limit } = parsePagination(req.query, 8, 50);
      const data = await postgresStore.listOpportunities(req.user!.id, {
        page,
        limit,
        type: typeof req.query.type === 'string' ? req.query.type : 'All',
        domain: typeof req.query.domain === 'string' ? req.query.domain : 'All',
        savedOnly: req.query.savedOnly === 'true',
      });
      res.json(data);
    }),
  );

  app.post(
    '/api/opportunities',
    requireAuth(['alumni', 'admin']),
    writeLimiter,
    asyncRoute(async (req, res) => {
      const body = req.body as {
        title?: string;
        company?: string;
        type?: OpportunityType;
        domain?: string;
        location?: string;
        stipendOrCtc?: string;
        skills?: string[];
        description?: string;
        applyUrl?: string;
        isRemote?: boolean;
      };

      if (!body.title?.trim() || !body.type || !body.domain || !body.description?.trim()) {
        res.status(400).json({ error: 'Title, type, domain, and description are required.' });
        return;
      }

      const created = await postgresStore.createOpportunity(req.user!, {
        title: body.title,
        company: body.company ?? '',
        type: body.type,
        domain: body.domain,
        location: body.location ?? 'Bengaluru',
        stipendOrCtc: body.stipendOrCtc ?? 'Competitive',
        skills: Array.isArray(body.skills) ? body.skills : [],
        description: body.description,
        applyUrl: body.applyUrl ?? '',
        isRemote: Boolean(body.isRemote),
      });
      res.status(201).json(created);
    }),
  );

  app.get(
    '/api/guides',
    requireAuth(),
    asyncRoute(async (req, res) => {
      const { page, limit } = parsePagination(req.query, 8, 50);
      const data = await postgresStore.listGuides(req.user!.id, {
        page,
        limit,
        domain: typeof req.query.domain === 'string' ? req.query.domain : 'All',
      });
      res.json(data);
    }),
  );

  app.post(
    '/api/guides',
    requireAuth(['alumni', 'admin']),
    writeLimiter,
    asyncRoute(async (req, res) => {
      const body = req.body as {
        title?: string;
        domain?: string;
        summary?: string;
        content?: string;
        readTimeMinutes?: number;
      };

      if (!body.title?.trim() || !body.domain || !body.summary?.trim() || !body.content?.trim()) {
        res.status(400).json({ error: 'Title, domain, summary, and content are required.' });
        return;
      }

      const created = await postgresStore.createGuide(req.user!, {
        title: body.title,
        domain: body.domain,
        summary: body.summary,
        content: body.content,
        readTimeMinutes: body.readTimeMinutes ?? 5,
      });
      res.status(201).json(created);
    }),
  );

  app.post(
    '/api/guides/:id/upvote',
    requireAuth(),
    asyncRoute(async (req, res) => {
      const updated = await postgresStore.toggleGuideUpvote(
        String(req.params.id),
        req.user!.id,
      );
      res.json(updated);
    }),
  );

  // Notifications
  app.get(
    '/api/notifications',
    requireAuth(),
    asyncRoute(async (req, res) => {
      const items = await postgresStore.listNotifications(req.user!.id);
      res.json(items);
    }),
  );

  app.post(
    '/api/notifications/mark-read',
    requireAuth(),
    asyncRoute(async (req, res) => {
      await postgresStore.markNotificationsRead(req.user!.id);
      res.json({ ok: true });
    }),
  );

  // WhatsApp Senior Google Form Metadata & Bulk PostgreSQL Import
  app.get(
    '/api/senior-forms',
    requireAuth(['admin']),
    asyncRoute(async (_req, res) => {
      const forms = await postgresStore.listSeniorIntakeForms();
      res.json(forms);
    }),
  );

  app.post(
    '/api/senior-forms',
    requireAuth(['admin']),
    writeLimiter,
    asyncRoute(async (req, res) => {
      const body = req.body as {
        formId?: string;
        title?: string;
        responderUri?: string;
        editUri?: string;
      };
      const saved = await postgresStore.saveSeniorIntakeForm(req.user!, {
        formId: body.formId ?? '',
        title: body.title ?? '',
        responderUri: body.responderUri ?? '',
        editUri: body.editUri ?? '',
      });
      res.status(201).json(saved);
    }),
  );

  app.get(
    '/api/senior-forms/:formId/imported-ids',
    requireAuth(['admin']),
    asyncRoute(async (req, res) => {
      const ids = await postgresStore.listImportedResponseIds(
        String(req.params.formId),
      );
      res.json({ responseIds: ids });
    }),
  );

  app.post(
    '/api/senior-forms/:formId/import',
    requireAuth(['admin']),
    writeLimiter,
    asyncRoute(async (req, res) => {
      const body = req.body as {
        responses?: FormResponsePreview[];
        autoVerify?: boolean;
      };
      const result = await postgresStore.importSeniorFormResponses(
        String(req.params.formId),
        req.user!,
        Array.isArray(body.responses) ? body.responses : [],
        body.autoVerify !== false,
      );
      res.status(201).json(result);
    }),
  );

  // Admin analytics & metrics
  app.get(
    '/api/admin/metrics',
    requireAuth(['admin']),
    asyncRoute(async (_req, res) => {
      const metrics = await postgresStore.getAdminMetrics();
      res.json(metrics);
    }),
  );

  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API route not found.' });
  });

  // Centralized API error handler
  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    if (!req.path.startsWith('/api/')) {
      res.status(500).send('Internal server error');
      return;
    }

    if (err instanceof StoreError) {
      res.status(err.status).json({ error: err.message });
      return;
    }

    const msg = err instanceof Error ? err.message : 'Unexpected server error.';
    if (
      msg.includes('DATABASE_URL') ||
      msg.includes('ECONNREFUSED') ||
      msg.includes('ENOTFOUND') ||
      msg.includes('getaddrinfo') ||
      msg.includes('password authentication')
    ) {
      res.status(503).json({
        error:
          'Unable to reach Supabase PostgreSQL. Please verify DATABASE_URL in Settings → Secrets.',
      });
      return;
    }

    console.error(`API error on ${req.method} ${req.path}:`, err);
    res.status(500).json({ error: 'Unexpected server error. Please try again.' });
  });

  const distPath = path.resolve(__dirname, 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(distPath);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PARTHA server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start PARTHA server:', err);
  process.exit(1);
});
