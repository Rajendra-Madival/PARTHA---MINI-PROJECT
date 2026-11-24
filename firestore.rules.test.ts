// Payload-First Security TDD specification checks for PARTHA firestore.rules
// Verifies the "Dirty Dozen" adversarial payloads outlined in security_spec.md.

export interface SecurityTestCase {
  name: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expected: 'PERMISSION_DENIED' | 'ALLOWED';
  payload?: Record<string, unknown>;
}

export const DIRTY_DOZEN_SECURITY_CASES: SecurityTestCase[] = [
  {
    name: '1. Self-Admin Escalation on user creation',
    collectionPath: 'users/student_uid_1',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { uid: 'student_uid_1', role: 'admin' },
  },
  {
    name: '2. Reading another user private profile',
    collectionPath: 'users/other_student_uid',
    operation: 'get',
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '3. Reading gated alumni contact before mentorship accepted',
    collectionPath: 'alumni/alu_1/private/contact',
    operation: 'get',
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '4. Pending alumnus self-verifying profile',
    collectionPath: 'alumni/alu_1',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { verificationStatus: 'verified' },
  },
  {
    name: '5. Spoofing studentId in mentorship creation',
    collectionPath: 'mentorships/other_uid__alu_1',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { studentId: 'other_uid', alumniId: 'alu_1', status: 'pending' },
  },
  {
    name: '6. Student accepting their own mentorship request',
    collectionPath: 'mentorships/student_uid_1__alu_1',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { status: 'accepted' },
  },
  {
    name: '7. Re-opening a declined mentorship (terminal state)',
    collectionPath: 'mentorships/student_uid_1__alu_1',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { status: 'accepted' },
  },
  {
    name: '8. Sending message before mentorship is accepted',
    collectionPath: 'mentorships/student_uid_1__alu_1/messages/msg_1',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { text: 'Hello before accept' },
  },
  {
    name: '9. Inflating guide upvotes without atomic upvote doc',
    collectionPath: 'guides/guide_1',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { upvotes: 999 },
  },
  {
    name: '10. Oversized ID poisoning (>128 chars)',
    collectionPath: `alumni/${'x'.repeat(200)}`,
    operation: 'create',
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '11. Shadow field injection on alumni update',
    collectionPath: 'alumni/alu_1',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { bio: 'Updated', isAdmin: true },
  },
  {
    name: '12. Unscoped blanket query on mentorships by student',
    collectionPath: 'mentorships',
    operation: 'list',
    expected: 'PERMISSION_DENIED',
  },
];
