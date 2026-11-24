# PARTHA Firestore Security Specification

## 1. Data Invariants
- Every user document `/users/{userId}` can only be created or read by its authenticated owner (`request.auth.uid == userId`) or a verified Admin. Non-admin users can never set `role: 'admin'`.
- Alumni PII (`email`, `phone`, `linkedinUrl`) lives strictly inside `/alumni/{alumniId}/private/contact` and can only be read by the alumnus owner, an Admin, or a student whose `/mentorships/{studentUid}__{alumniId}` document has `status == 'accepted'`.
- Students can only create mentorship requests with deterministic ID `{studentUid}__{alumniId}`, `status == 'pending'`, targeting an existing `'verified'` alumnus.
- Mentorship messages under `/mentorships/{mentorshipId}/messages/{messageId}` can only be read or created when the parent mentorship exists, `status == 'accepted'`, and the caller is either `studentId` or `alumniOwnerUid`.
- Guide upvote counters on `/guides/{guideId}` and upvote marker documents `/guides/{guideId}/upvotes/{userId}` are updated together atomically (`existsAfter`/`getAfter`), changing `upvotes` strictly by `+1` or `-1`.
- Google Form intake records (`/seniorForms/{formId}`) are restricted to their creator (`createdByUid`) or Admin.

## 2. Adversarial ("Dirty Dozen") Payloads Blocked by Rules
1. **Self-Admin Escalation**: `setDoc(doc(db, 'users', uid), { role: 'admin', ... })` by non-admin user -> `PERMISSION_DENIED`.
2. **Reading Another Student's Profile**: `getDoc(doc(db, 'users', otherUid))` -> `PERMISSION_DENIED`.
3. **Scraping Gated Alumni Contact Before Acceptance**: `getDoc(doc(db, 'alumni', aluId, 'private', 'contact'))` before `status == 'accepted'` -> `PERMISSION_DENIED`.
4. **Pending Alumnus Self-Verification**: `updateDoc(doc(db, 'alumni', aluId), { verificationStatus: 'verified' })` by non-admin -> `PERMISSION_DENIED`.
5. **Unverified Student Spoofing Mentorship Request**: `setDoc(doc(db, 'mentorships', 'otherUid__alu1'), { studentId: 'otherUid', status: 'accepted', ... })` -> `PERMISSION_DENIED`.
6. **Student Accepting Own Mentorship Request**: `updateDoc(doc(db, 'mentorships', myId), { status: 'accepted' })` -> `PERMISSION_DENIED`.
7. **Mutating Declined Mentorship (Terminal State Bypass)**: `updateDoc(doc(db, 'mentorships', declinedId), { status: 'accepted' })` -> `PERMISSION_DENIED`.
8. **Messaging on Pending Mentorship**: `setDoc(doc(db, 'mentorships', pendingId, 'messages', 'm1'), { ... })` -> `PERMISSION_DENIED`.
9. **Inflating Guide Upvotes Without Marker Doc**: `updateDoc(doc(db, 'guides', g1), { upvotes: 999 })` -> `PERMISSION_DENIED`.
10. **Oversized ID Poisoning**: `setDoc(doc(db, 'alumni', 'a'.repeat(500)), { ... })` -> `PERMISSION_DENIED`.
11. **Shadow Field Injection on Alumni Update**: `updateDoc(doc(db, 'alumni', aluId), { bio: 'ok', isAdmin: true })` -> `PERMISSION_DENIED`.
12. **Blanket Unscoped Query on Pending Alumni / Mentorships**: `getDocs(collection(db, 'mentorships'))` without matching `studentId` or `alumniOwnerUid` -> `PERMISSION_DENIED`.
