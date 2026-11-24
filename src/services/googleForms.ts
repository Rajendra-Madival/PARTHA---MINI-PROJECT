import type { BranchCode, FormResponsePreview, SeniorIntakeForm } from '../types';

const FORMS_API_BASE = 'https://forms.googleapis.com/v1/forms';

interface GoogleFormQuestionItem {
  itemId?: string;
  title?: string;
  questionItem?: {
    question?: {
      questionId?: string;
    };
  };
}

interface GoogleFormResource {
  formId: string;
  info?: {
    title?: string;
    documentTitle?: string;
  };
  responderUri?: string;
  items?: GoogleFormQuestionItem[];
}

interface GoogleFormResponseAnswer {
  textAnswers?: {
    answers?: Array<{ value?: string }>;
  };
}

interface GoogleFormResponseItem {
  responseId: string;
  lastSubmittedTime?: string;
  respondentEmail?: string;
  answers?: Record<string, GoogleFormResponseAnswer>;
}

const VALID_BRANCHES: BranchCode[] = ['CSE', 'ISE', 'ECE', 'ME', 'EEE'];

function normalizeBranch(raw: string): BranchCode {
  const upper = raw.trim().toUpperCase();
  if (VALID_BRANCHES.includes(upper as BranchCode)) {
    return upper as BranchCode;
  }
  if (upper.includes('INFO')) return 'ISE';
  if (upper.includes('ELEC') && upper.includes('COMM')) return 'ECE';
  if (upper.includes('MECH')) return 'ME';
  if (upper.includes('EEE')) return 'EEE';
  return 'CSE';
}

export async function createSeniorIntakeGoogleForm(
  accessToken: string,
  creator: { uid: string; email: string },
  customTitle?: string,
): Promise<SeniorIntakeForm> {
  const title =
    customTitle?.trim() || 'PARTHA — KLS VDIT Alumni Mentor Intake';

  const createRes = await fetch(FORMS_API_BASE, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      info: {
        title,
        documentTitle: title,
      },
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Google Forms create failed (${createRes.status}): ${errText}`);
  }

  const created = (await createRes.json()) as GoogleFormResource;
  const safeFormId = encodeURIComponent(created.formId.trim());

  const requests = [
    {
      updateFormInfo: {
        info: {
          description:
            'Dear KLS VDIT Seniors — share your current role, domain, and skills to mentor juniors on PARTHA. Your email, phone number, and LinkedIn stay private/gated until you personally accept a student mentorship request.',
        },
        updateMask: 'description',
      },
    },
    {
      createItem: {
        item: {
          title: 'Full Name',
          questionItem: {
            question: { required: true, textQuestion: { paragraph: false } },
          },
        },
        location: { index: 0 },
      },
    },
    {
      createItem: {
        item: {
          title: 'KLS VDIT USN (e.g., 2VD19CS014)',
          questionItem: {
            question: { required: true, textQuestion: { paragraph: false } },
          },
        },
        location: { index: 1 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Graduation Year (e.g., 2021)',
          questionItem: {
            question: { required: true, textQuestion: { paragraph: false } },
          },
        },
        location: { index: 2 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Branch',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'DROP_DOWN',
                options: [
                  { value: 'CSE' },
                  { value: 'ISE' },
                  { value: 'ECE' },
                  { value: 'ME' },
                  { value: 'EEE' },
                ],
              },
            },
          },
        },
        location: { index: 3 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Current Company / Organization',
          questionItem: {
            question: { required: true, textQuestion: { paragraph: false } },
          },
        },
        location: { index: 4 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Current Role / Designation',
          questionItem: {
            question: { required: true, textQuestion: { paragraph: false } },
          },
        },
        location: { index: 5 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Primary Technical Domain',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: 'Machine Learning & AI' },
                  { value: 'Cloud & Distributed Systems' },
                  { value: 'Full-Stack & FinTech' },
                  { value: 'Embedded & Robotics' },
                  { value: 'Data Engineering' },
                  { value: 'Cybersecurity & Infra' },
                ],
              },
            },
          },
        },
        location: { index: 6 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Top Skills (comma-separated, e.g., Python, React, AWS)',
          questionItem: {
            question: { required: true, textQuestion: { paragraph: false } },
          },
        },
        location: { index: 7 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Current City / Location',
          questionItem: {
            question: { required: false, textQuestion: { paragraph: false } },
          },
        },
        location: { index: 8 },
      },
    },
    {
      createItem: {
        item: {
          title: 'How would you like to mentor juniors?',
          questionItem: {
            question: {
              required: false,
              choiceQuestion: {
                type: 'CHECKBOX',
                options: [
                  { value: 'Internship referrals' },
                  { value: 'Project & capstone guidance' },
                  { value: 'Resume & interview prep' },
                ],
              },
            },
          },
        },
        location: { index: 9 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Short Bio or Advice for Juniors',
          questionItem: {
            question: { required: false, textQuestion: { paragraph: true } },
          },
        },
        location: { index: 10 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Email Address (Private until you accept a request)',
          questionItem: {
            question: { required: true, textQuestion: { paragraph: false } },
          },
        },
        location: { index: 11 },
      },
    },
    {
      createItem: {
        item: {
          title: 'WhatsApp / Phone Number (Private until you accept)',
          questionItem: {
            question: { required: false, textQuestion: { paragraph: false } },
          },
        },
        location: { index: 12 },
      },
    },
    {
      createItem: {
        item: {
          title: 'LinkedIn Profile URL (Private until you accept)',
          questionItem: {
            question: { required: false, textQuestion: { paragraph: false } },
          },
        },
        location: { index: 13 },
      },
    },
  ];

  const batchRes = await fetch(`${FORMS_API_BASE}/${safeFormId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });

  if (!batchRes.ok) {
    const errText = await batchRes.text();
    throw new Error(`Failed adding questions to Google Form (${batchRes.status}): ${errText}`);
  }

  const formRes = await fetch(`${FORMS_API_BASE}/${safeFormId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const latest = formRes.ok
    ? ((await formRes.json()) as GoogleFormResource)
    : created;

  const responderUri =
    latest.responderUri ?? `https://docs.google.com/forms/d/${created.formId}/viewform`;
  const editUri = `https://docs.google.com/forms/d/${created.formId}/edit`;

  return {
    formId: created.formId,
    title: latest.info?.title ?? title,
    responderUri,
    editUri,
    createdByUid: creator.uid,
    createdByEmail: creator.email,
    createdAt: new Date().toISOString(),
  };
}

export async function fetchSeniorFormResponses(
  accessToken: string,
  formId: string,
  importedResponseIds: Set<string>,
): Promise<FormResponsePreview[]> {
  const safeFormId = encodeURIComponent(formId.trim());

  const [formRes, respRes] = await Promise.all([
    fetch(`${FORMS_API_BASE}/${safeFormId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
    fetch(`${FORMS_API_BASE}/${safeFormId}/responses`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  ]);

  if (!formRes.ok) {
    throw new Error(`Unable to read form details (${formRes.status}).`);
  }
  if (!respRes.ok) {
    throw new Error(`Unable to read form responses (${respRes.status}).`);
  }

  const formMeta = (await formRes.json()) as GoogleFormResource;
  const respPayload = (await respRes.json()) as {
    responses?: GoogleFormResponseItem[];
  };

  const titleByQuestionId = new Map<string, string>();
  for (const item of formMeta.items ?? []) {
    const qid = item.questionItem?.question?.questionId;
    if (qid && item.title) {
      titleByQuestionId.set(qid, item.title.toLowerCase());
    }
  }

  const results: FormResponsePreview[] = [];

  for (const item of respPayload.responses ?? []) {
    const getVal = (keyword: string): string => {
      for (const [qid, answer] of Object.entries(item.answers ?? {})) {
        const qTitle = titleByQuestionId.get(qid) ?? '';
        if (qTitle.includes(keyword)) {
          const vals =
            answer.textAnswers?.answers
              ?.map((a) => a.value?.trim() ?? '')
              .filter(Boolean) ?? [];
          return vals.join(', ');
        }
      }
      return '';
    };

    const name = getVal('full name') || getVal('name') || 'KLS VDIT Senior';
    const regNumber = getVal('usn') || '2VD';
    const rawYear = Number.parseInt(getVal('graduation year'), 10);
    const graduationYear =
      Number.isFinite(rawYear) && rawYear >= 1995 && rawYear <= 2035
        ? rawYear
        : 2022;
    const branch = normalizeBranch(getVal('branch'));
    const company = getVal('company') || 'Industry Partner';
    const role = getVal('role') || 'Engineer';
    const domain = getVal('domain') || 'Full-Stack & FinTech';
    const skills = getVal('skill')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const location = getVal('city') || getVal('location') || 'Bengaluru';
    const helpRaw = getVal('mentor').toLowerCase();
    const openToInternshipReferrals = helpRaw.includes('internship');
    const openToProjectMentoring =
      helpRaw.includes('project') || helpRaw.includes('resume') || !helpRaw;
    const bio = getVal('bio') || getVal('advice');
    const email = getVal('email') || item.respondentEmail || '';
    const phone = getVal('phone') || getVal('whatsapp');
    const linkedinUrl = getVal('linkedin');

    results.push({
      responseId: item.responseId,
      submittedAt: item.lastSubmittedTime ?? new Date().toISOString(),
      alreadyImported: importedResponseIds.has(item.responseId),
      name,
      regNumber,
      graduationYear,
      branch,
      company,
      role,
      domain,
      skills: skills.length > 0 ? skills : [domain],
      location,
      openToInternshipReferrals,
      openToProjectMentoring,
      bio,
      email,
      phone,
      linkedinUrl,
    });
  }

  return results;
}
