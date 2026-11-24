import type {
  AlumniProfile,
  DiscoveryFilters,
  MatchResult,
  StudentTargetProfile,
} from '../types';

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function evaluateAlumniMatch(
  alumni: AlumniProfile,
  student: StudentTargetProfile,
  filters: DiscoveryFilters,
): MatchResult {
  let score = 15;
  const reasonParts: string[] = [];

  const targetSkillsSet = new Set(student.targetSkills.map(normalize));
  if (filters.skill && filters.skill !== 'All') {
    targetSkillsSet.add(normalize(filters.skill));
  }

  const matchedSkills = alumni.skills.filter((skill) => {
    const s = normalize(skill);
    for (const target of targetSkillsSet) {
      if (s === target || s.includes(target) || target.includes(s)) {
        return true;
      }
    }
    return false;
  });

  if (matchedSkills.length > 0) {
    const skillPoints = Math.min(40, 18 + matchedSkills.length * 10);
    score += skillPoints;
    const primarySkill =
      matchedSkills[0] === 'Machine Learning' ? 'ML skill' : `${matchedSkills[0]} skill`;
    reasonParts.push(
      matchedSkills.length > 1
        ? `${primarySkill} (+${matchedSkills.length - 1} more)`
        : primarySkill,
    );
  }

  const targetCompany =
    filters.company !== 'All' ? filters.company : student.targetCompany;
  if (
    targetCompany &&
    normalize(alumni.company).includes(normalize(targetCompany))
  ) {
    score += 18;
    reasonParts.push(alumni.company);
  } else if (
    filters.role !== 'All' &&
    normalize(alumni.role).includes(normalize(filters.role))
  ) {
    score += 14;
    reasonParts.push(alumni.role);
  }

  const effectiveDomain =
    filters.domain !== 'All' ? filters.domain : student.targetDomain;
  if (effectiveDomain && normalize(alumni.domain) === normalize(effectiveDomain)) {
    score += 18;
    if (!reasonParts.some((r) => r.includes('ML skill'))) {
      reasonParts.push(alumni.domain);
    }
  }

  if (student.lookingForInternship && alumni.openToInternshipReferrals) {
    score += 5;
  }
  if (student.lookingForProjectHelp && alumni.openToProjectMentoring) {
    score += 4;
  }

  if (alumni.sharedProjectGuidesCount > 0) {
    const guidePoints = Math.min(10, alumni.sharedProjectGuidesCount * 3);
    score += guidePoints;
    reasonParts.push(
      `shared ${alumni.sharedProjectGuidesCount} project ${
        alumni.sharedProjectGuidesCount === 1 ? 'guide' : 'guides'
      }`,
    );
  }

  if (reasonParts.length === 0) {
    if (alumni.branch === student.branch) {
      reasonParts.push(`${alumni.branch} alumnus`);
    }
    if (alumni.openToInternshipReferrals) {
      reasonParts.push('open to internship referrals');
    } else {
      reasonParts.push(`${alumni.domain} mentor`);
    }
  }

  const clampedScore = Math.min(99, Math.max(35, score));

  return {
    alumni,
    score: clampedScore,
    matchReasons: reasonParts,
    whyMatchedSummary: reasonParts.slice(0, 3).join(' + '),
  };
}

export function filterAndRankAlumni(
  alumniList: AlumniProfile[],
  student: StudentTargetProfile,
  filters: DiscoveryFilters,
  savedAlumniIds: string[] = [],
): MatchResult[] {
  const query = normalize(filters.search);
  const savedSet = new Set(savedAlumniIds);

  const filtered = alumniList.filter((a) => {
    if (a.verificationStatus !== 'verified') return false;

    if (filters.savedOnly && !savedSet.has(a.id)) {
      return false;
    }

    if (query) {
      const searchable = [
        a.name,
        a.company,
        a.role,
        a.domain,
        a.branch,
        String(a.graduationYear),
        ...a.skills,
        a.topHighlight?.title ?? '',
      ]
        .join(' ')
        .toLowerCase();
      if (!searchable.includes(query)) return false;
    }

    if (
      filters.skill !== 'All' &&
      !a.skills.some((s) => normalize(s) === normalize(filters.skill))
    ) {
      return false;
    }

    if (
      filters.company !== 'All' &&
      normalize(a.company) !== normalize(filters.company)
    ) {
      return false;
    }

    if (
      filters.role !== 'All' &&
      !normalize(a.role).includes(normalize(filters.role))
    ) {
      return false;
    }

    if (
      filters.domain !== 'All' &&
      normalize(a.domain) !== normalize(filters.domain)
    ) {
      return false;
    }

    if (filters.internshipOnly && !a.openToInternshipReferrals) {
      return false;
    }

    if (filters.projectHelpOnly && !a.openToProjectMentoring) {
      return false;
    }

    return true;
  });

  const evaluated = filtered.map((a) => evaluateAlumniMatch(a, student, filters));

  if (filters.sortBy === 'upvotes') {
    return evaluated.sort(
      (x, y) =>
        (y.alumni.topHighlight?.upvotes ?? 0) -
        (x.alumni.topHighlight?.upvotes ?? 0),
    );
  }

  if (filters.sortBy === 'batch') {
    return evaluated.sort(
      (x, y) => y.alumni.graduationYear - x.alumni.graduationYear,
    );
  }

  return evaluated.sort((x, y) => {
    if (y.score !== x.score) return y.score - x.score;
    return (
      (y.alumni.topHighlight?.upvotes ?? 0) -
      (x.alumni.topHighlight?.upvotes ?? 0)
    );
  });
}
