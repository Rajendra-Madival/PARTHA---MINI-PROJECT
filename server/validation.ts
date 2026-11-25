import type { BranchCode, MentorshipGoal, OpportunityType } from '../src/types/index.ts';

export const VALID_BRANCHES: BranchCode[] = ['CSE', 'ISE', 'ECE', 'ME', 'EEE'];
export const VALID_GOALS: MentorshipGoal[] = [
  'Career Guidance',
  'Resume Review',
  'Internship Referral',
  'Project Help',
];
export const VALID_OPPORTUNITY_TYPES: OpportunityType[] = [
  'Internship',
  'Full-time Job',
  'Collaborative Project',
];

export function clampText(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

export function normalizeEmail(value: unknown): string {
  return clampText(value, 160).toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function normalizeBranch(value: unknown): BranchCode {
  const upper = clampText(value, 20).toUpperCase();
  if (VALID_BRANCHES.includes(upper as BranchCode)) {
    return upper as BranchCode;
  }
  return 'CSE';
}

export function normalizeStringArray(
  value: unknown,
  maxItems = 20,
  maxItemLen = 40,
): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of value) {
    const clean = clampText(item, maxItemLen);
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(clean);
    if (result.length >= maxItems) break;
  }
  return result;
}

export function validateSafeHttpUrl(raw: unknown): string | null {
  const trimmed = clampText(raw, 400);
  if (!trimmed) return '';
  const withScheme =
    /^https?:\/\//i.test(trimmed) || trimmed.includes(':')
      ? trimmed
      : `https://${trimmed}`;

  try {
    const parsed = new URL(withScheme);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function validateSafeAvatarUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('kokonut:')) {
    const seed = trimmed.slice('kokonut:'.length).trim().slice(0, 100);
    return seed ? `kokonut:${seed}` : null;
  }

  if (/^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)) {
    if (trimmed.length > 360_000) {
      return null;
    }
    return trimmed;
  }

  return validateSafeHttpUrl(trimmed);
}

export function parsePagination(
  pageRaw: unknown,
  limitRaw: unknown,
  defaultLimit = 10,
  maxLimit = 50,
): { page: number; limit: number; offset: number } {
  const parsedPage = Number.parseInt(String(pageRaw ?? '1'), 10);
  const parsedLimit = Number.parseInt(String(limitRaw ?? String(defaultLimit)), 10);
  const page = Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1;
  const limit =
    Number.isFinite(parsedLimit) && parsedLimit >= 1
      ? Math.min(maxLimit, parsedLimit)
      : defaultLimit;

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
}
