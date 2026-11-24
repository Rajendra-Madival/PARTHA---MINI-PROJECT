import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileSpreadsheet,
  Link2,
  MessageCircle,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  getWorkspaceAccessToken,
  requestGoogleFormsPermission,
} from '../lib/firebase';
import {
  createSeniorIntakeGoogleForm,
  fetchSeniorFormResponses,
} from '../services/googleForms';
import {
  importSeniorFormResponse,
  listImportedResponseIds,
  saveSeniorIntakeForm,
} from '../services/parthaFirestore';
import type {
  AuthUser,
  FormResponsePreview,
  SeniorIntakeForm,
} from '../types';

interface SeniorIntakeFormPanelProps {
  user: AuthUser;
  forms: SeniorIntakeForm[];
  onFormCreated: (form: SeniorIntakeForm) => void;
  onDataImported: () => Promise<void>;
  onNotify: (message: string) => void;
}

export function SeniorIntakeFormPanel({
  user,
  forms,
  onFormCreated,
  onDataImported,
  onNotify,
}: SeniorIntakeFormPanelProps) {
  const [hasToken, setHasToken] = useState<boolean>(
    () => Boolean(getWorkspaceAccessToken()),
  );
  const [selectedFormId, setSelectedFormId] = useState<string>(
    () => forms[0]?.formId ?? '',
  );
  const [customTitle, setCustomTitle] = useState(
    'PARTHA — KLS VDIT Alumni Mentor Intake',
  );
  const [creating, setCreating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importingAll, setImportingAll] = useState(false);
  const [responses, setResponses] = useState<FormResponsePreview[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<'link' | 'whatsapp' | null>(null);

  useEffect(() => {
    if (!selectedFormId && forms.length > 0) {
      setSelectedFormId(forms[0].formId);
    }
  }, [forms, selectedFormId]);

  const activeForm =
    forms.find((f) => f.formId === selectedFormId) ?? forms[0] ?? null;

  const whatsappMessage = activeForm
    ? [
        'Namaskara KLS VDIT Seniors!',
        '',
        'We have launched PARTHA, our KLS VDIT Alumni Mentorship & Opportunity Portal. Please take 2 minutes to fill out this Google Form so juniors can discover mentors by domain & skills:',
        '',
        activeForm.responderUri,
        '',
        'Privacy note: Your email, WhatsApp number, and LinkedIn stay private/gated until you accept a student request.',
        '',
        'Thank you for mentoring KLS VDIT juniors!',
      ].join('\n')
    : '';

  const [customWhatsappText, setCustomWhatsappText] = useState('');

  useEffect(() => {
    if (activeForm) {
      setCustomWhatsappText(whatsappMessage);
      setResponses(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeForm?.formId, activeForm?.responderUri]);

  async function ensureToken(): Promise<string> {
    const existing = getWorkspaceAccessToken();
    if (existing) {
      setHasToken(true);
      return existing;
    }
    const fresh = await requestGoogleFormsPermission();
    setHasToken(true);
    return fresh;
  }

  async function handleConnectGoogleForms() {
    setError(null);
    try {
      await requestGoogleFormsPermission();
      setHasToken(true);
      onNotify('Google Forms access connected.');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not connect Google Forms permission.',
      );
    }
  }

  async function handleCreateForm() {
    setError(null);
    setCreating(true);
    try {
      const token = await ensureToken();
      const form = await createSeniorIntakeGoogleForm(
        token,
        { uid: user.id, email: user.email },
        customTitle,
      );
      await saveSeniorIntakeForm(form);
      onFormCreated(form);
      setSelectedFormId(form.formId);
      onNotify('Live Google Form created! Copy or float it on WhatsApp now.');
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Unable to create Google Form.';
      if (msg.includes('401') || msg.includes('403')) {
        setHasToken(false);
      }
      setError(msg);
    } finally {
      setCreating(false);
    }
  }

  async function handleFetchResponses() {
    if (!activeForm) return;
    setError(null);
    setSyncing(true);
    try {
      const token = await ensureToken();
      const importedIds = await listImportedResponseIds(
        activeForm.formId,
        user.id,
      );
      const list = await fetchSeniorFormResponses(
        token,
        activeForm.formId,
        importedIds,
      );
      setResponses(list);
      onNotify(
        list.length === 0
          ? 'No responses submitted on this Google Form yet.'
          : `Loaded ${list.length} response${list.length === 1 ? '' : 's'} from Google Forms.`,
      );
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Unable to fetch form responses.';
      if (msg.includes('401') || msg.includes('403')) {
        setHasToken(false);
      }
      setError(msg);
    } finally {
      setSyncing(false);
    }
  }

  async function handleImportRow(
    row: FormResponsePreview,
    autoVerify: boolean,
  ) {
    if (!activeForm) return;
    setError(null);
    setImportingId(row.responseId);
    try {
      await importSeniorFormResponse(
        activeForm.formId,
        row,
        user.id,
        autoVerify,
      );
      setResponses((prev) =>
        prev
          ? prev.map((r) =>
              r.responseId === row.responseId
                ? { ...r, alreadyImported: true }
                : r,
            )
          : prev,
      );
      await onDataImported();
      onNotify(
        autoVerify
          ? `${row.name} verified & added to PARTHA mentor directory.`
          : `${row.name} added to Verification Queue.`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to import response.',
      );
    } finally {
      setImportingId(null);
    }
  }

  async function handleImportAllNew() {
    if (!activeForm || !responses) return;
    const pendingRows = responses.filter((r) => !r.alreadyImported);
    if (pendingRows.length === 0) return;

    setError(null);
    setImportingAll(true);
    try {
      for (const row of pendingRows) {
        await importSeniorFormResponse(activeForm.formId, row, user.id, true);
      }
      setResponses((prev) =>
        prev ? prev.map((r) => ({ ...r, alreadyImported: true })) : prev,
      );
      await onDataImported();
      onNotify(
        `Verified & imported ${pendingRows.length} alumni profile${pendingRows.length === 1 ? '' : 's'} into PARTHA.`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed while importing senior responses.',
      );
    } finally {
      setImportingAll(false);
    }
  }

  async function handleCopy(kind: 'link' | 'whatsapp', text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(kind);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      onNotify('Copy blocked by browser. You can select and copy the text directly.');
    }
  }

  const unimportedCount =
    responses?.filter((r) => !r.alreadyImported).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] px-6 py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-emerald-800">
            Live Google Forms API · WhatsApp Alumni Outreach
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#18221D]">
            Senior Intake Google Form
          </h1>
          <p className="mt-1 text-sm text-stone-600 max-w-2xl">
            Generate a live Google Form in your Google account, float the WhatsApp invite in KLS VDIT senior groups, and sync replies straight into PARTHA.
          </p>
        </div>

        {!hasToken && (
          <button
            type="button"
            onClick={handleConnectGoogleForms}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-700 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            Connect Google Forms
          </button>
        )}
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-5 py-3.5 text-xs font-medium text-red-700"
        >
          {error}
        </div>
      )}

      {/* Step 1: Create Live Google Form */}
      <section className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-semibold text-[#18221D]">
              1. Generate Senior Intake Google Form
            </h2>
            <p className="mt-0.5 text-xs text-stone-500">
              Creates a 14-question form (Name, USN, Batch, Branch, Company, Role, Domain, Skills, Bio, plus private Email, WhatsApp &amp; LinkedIn).
            </p>
          </div>
          {forms.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              {forms.length} Form{forms.length === 1 ? '' : 's'} Saved
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            aria-label="Google Form title"
            placeholder="PARTHA — KLS VDIT Alumni Mentor Intake"
            className="flex-1 rounded-lg border border-[#E5DFD0] bg-white px-3.5 py-2.5 text-sm text-[#18221D] focus:border-emerald-700 focus:outline-none"
          />
          <button
            type="button"
            disabled={creating}
            onClick={handleCreateForm}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {creating ? 'Creating Google Form...' : 'Create Live Google Form'}
          </button>
        </div>

        {forms.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-[#EEE9DC] pt-3">
            <span className="text-xs font-medium text-stone-500">
              Active form:
            </span>
            {forms.map((f) => (
              <button
                key={f.formId}
                type="button"
                onClick={() => setSelectedFormId(f.formId)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                  activeForm?.formId === f.formId
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                    : 'border-[#E5DFD0] bg-[#FAF7F0] text-stone-600 hover:border-emerald-300'
                }`}
              >
                {f.title}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Step 2 & 3: Share on WhatsApp + Sync Responses */}
      {activeForm && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* WhatsApp Share Box */}
          <section className="lg:col-span-6 rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-semibold text-[#18221D]">
                  2. Float Form in Alumni WhatsApp Groups
                </h2>
                <p className="mt-0.5 text-xs text-stone-500">
                  Share the live link or send the ready-to-post WhatsApp message below.
                </p>
              </div>
              <a
                href={activeForm.editUri}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800 hover:text-emerald-950 whitespace-nowrap shrink-0"
              >
                Edit Form
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </div>

            <div className="rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#18221D]">
                <Link2 className="h-3.5 w-3.5 text-emerald-800" aria-hidden="true" />
                <span>Live Form Link (for Seniors)</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={activeForm.responderUri}
                  aria-label="Live Google Form URL"
                  className="flex-1 rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 font-mono text-xs text-stone-700"
                />
                <button
                  type="button"
                  onClick={() => handleCopy('link', activeForm.responderUri)}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-[#F3EFE4] whitespace-nowrap cursor-pointer"
                >
                  {copiedKey === 'link' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-700" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </>
                  )}
                </button>
                <a
                  href={activeForm.responderUri}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-[#E5DFD0] bg-white px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 whitespace-nowrap"
                >
                  Open
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="whatsapp-invite-box"
                className="block text-xs font-semibold text-stone-700"
              >
                WhatsApp Message Preview (editable)
              </label>
              <textarea
                id="whatsapp-invite-box"
                rows={8}
                value={customWhatsappText}
                onChange={(e) => setCustomWhatsappText(e.target.value)}
                className="w-full rounded-lg border border-[#E5DFD0] bg-white p-3 text-xs leading-relaxed text-stone-800 focus:border-emerald-700 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(customWhatsappText)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-900 whitespace-nowrap"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Float on WhatsApp
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
              <button
                type="button"
                onClick={() => handleCopy('whatsapp', customWhatsappText)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-[#F3EFE4] whitespace-nowrap cursor-pointer"
              >
                {copiedKey === 'whatsapp' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-700" />
                    Message Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy Message
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Sync Responses Box */}
          <section className="lg:col-span-6 rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-base font-semibold text-[#18221D]">
                    3. Import Senior Responses into PARTHA
                  </h2>
                  <p className="mt-0.5 text-xs text-stone-500">
                    Pull live submissions from Google Forms and add them to your mentor directory.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={syncing}
                  onClick={handleFetchResponses}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-60 whitespace-nowrap cursor-pointer"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  {syncing ? 'Syncing...' : 'Sync Responses'}
                </button>
              </div>

              {responses === null ? (
                <div className="rounded-lg border border-dashed border-[#D8D0BE] bg-[#FAF7F0] px-5 py-10 text-center space-y-2">
                  <Sparkles
                    className="mx-auto h-5 w-5 text-emerald-800"
                    aria-hidden="true"
                  />
                  <p className="text-xs font-semibold text-[#18221D]">
                    Ready to sync senior replies
                  </p>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    Once seniors fill out your Google Form from WhatsApp, click{' '}
                    <strong className="text-stone-700">Sync Responses</strong> above to preview and verify their profiles.
                  </p>
                </div>
              ) : responses.length === 0 ? (
                <div className="rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] px-5 py-10 text-center">
                  <p className="text-xs font-semibold text-[#18221D]">
                    No responses yet
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    Float the link in your WhatsApp senior groups and click Sync Responses again once replies arrive.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {unimportedCount > 1 && (
                    <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5 text-xs">
                      <span className="font-medium text-emerald-950">
                        {unimportedCount} new senior submissions ready
                      </span>
                      <button
                        type="button"
                        disabled={importingAll}
                        onClick={handleImportAllNew}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-800 px-3 py-1.5 font-semibold text-white hover:bg-emerald-900 disabled:opacity-60 cursor-pointer"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {importingAll ? 'Importing...' : 'Verify & Import All'}
                      </button>
                    </div>
                  )}

                  <div className="max-h-[380px] space-y-2.5 overflow-y-auto pr-1">
                    {responses.map((row) => {
                      const busy = importingId === row.responseId || importingAll;
                      return (
                        <article
                          key={row.responseId}
                          className="rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] p-3.5 space-y-2"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <h3 className="font-display text-sm font-semibold text-[#18221D]">
                                {row.name}
                              </h3>
                              <p className="text-xs text-stone-700">
                                {row.role} at {row.company}
                              </p>
                              <p className="text-[11px] text-stone-500 tabular-nums">
                                Class of {row.graduationYear} {row.branch} · USN{' '}
                                <span className="font-mono">{row.regNumber}</span> ·{' '}
                                {row.domain}
                              </p>
                            </div>

                            {row.alreadyImported ? (
                              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                                <CheckCircle2 className="h-3 w-3" />
                                Imported
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => handleImportRow(row, false)}
                                  className="inline-flex items-center gap-1 rounded-md border border-[#E5DFD0] bg-white px-2.5 py-1.5 text-[11px] font-medium text-stone-700 hover:bg-[#F3EFE4] disabled:opacity-60 cursor-pointer"
                                >
                                  <UserPlus className="h-3 w-3" />
                                  Pending
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => handleImportRow(row, true)}
                                  className="inline-flex items-center gap-1 rounded-md bg-emerald-800 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-900 disabled:opacity-60 cursor-pointer"
                                >
                                  <Check className="h-3 w-3" />
                                  Verify &amp; Add
                                </button>
                              </div>
                            )}
                          </div>

                          <p className="text-[11px] text-stone-600">
                            <span className="font-medium text-stone-700">Skills:</span>{' '}
                            {row.skills.join(' · ')}
                          </p>
                        </article>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <p className="text-[11px] text-stone-500 border-t border-[#EEE9DC] pt-3">
              Imported contact fields (Email, WhatsApp, LinkedIn) are automatically stored in Firestore&apos;s privacy-gated subcollection and remain hidden from students until mentorship acceptance.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
