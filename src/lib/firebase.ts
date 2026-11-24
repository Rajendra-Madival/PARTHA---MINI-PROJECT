import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const configWithDb = firebaseConfig as typeof firebaseConfig & {
  firestoreDatabaseId?: string;
};

const app = initializeApp(firebaseConfig);
export const db = configWithDb.firestoreDatabaseId
  ? getFirestore(app, configWithDb.firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);

export const GOOGLE_FORMS_SCOPES = [
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.responses.readonly',
];

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Keep Google Workspace OAuth token strictly in memory (never localStorage/sessionStorage).
let cachedWorkspaceToken: string | null = null;

export function getWorkspaceAccessToken(): string | null {
  return cachedWorkspaceToken;
}

export function clearWorkspaceAccessToken(): void {
  cachedWorkspaceToken = null;
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, (firebaseUser) => {
    if (!firebaseUser) {
      cachedWorkspaceToken = null;
    }
    callback(firebaseUser);
  });
}

export async function signInWithGoogle(): Promise<{
  user: User;
  accessToken: string | null;
}> {
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (credential?.accessToken) {
    cachedWorkspaceToken = credential.accessToken;
  }
  return {
    user: result.user,
    accessToken: cachedWorkspaceToken,
  };
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  return result.user;
}

export async function registerWithEmail(
  email: string,
  password: string,
): Promise<User> {
  const result = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );
  void sendEmailVerification(result.user).catch(() => {
    // Best-effort verification email
  });
  return result.user;
}

export function isEmailPasswordDisabledError(error: unknown): boolean {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';
  const msg = error instanceof Error ? error.message : String(error ?? '');
  return (
    code === 'auth/operation-not-allowed' ||
    msg.includes('operation-not-allowed') ||
    msg.includes('PASSWORD_LOGIN_DISABLED')
  );
}

export function formatFirebaseAuthError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';

  if (isEmailPasswordDisabledError(error)) {
    return 'Email & Password sign-in is currently disabled in Firebase Console for this project. Use "Continue with Google" to sign in immediately, or enable Email/Password in Firebase Console → Authentication → Sign-in method.';
  }
  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found'
  ) {
    return 'Incorrect email or password. Check your credentials or use Continue with Google.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'An account with this email already exists. Switch to Login to sign in.';
  }
  if (code === 'auth/weak-password') {
    return 'Password should be at least 6 characters long.';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Sign-in popup was blocked by your browser. Please allow popups for this site and try again.';
  }
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Google sign-in popup was closed before completing. Please try again.';
  }
  if (code === 'auth/unauthorized-domain') {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
    return `Domain "${host}" is not authorized in Firebase Auth. Add it in Firebase Console → Authentication → Settings → Authorized domains.`;
  }
  if (code === 'auth/account-exists-with-different-credential') {
    return 'An account already exists with this email using a different sign-in method. Try signing in with Google.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error while connecting to Firebase Auth. Check your internet connection and try again.';
  }
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message) as { error?: string; path?: string };
      if (parsed.error) {
        return parsed.path ? `${parsed.error} (${parsed.path})` : parsed.error;
      }
    } catch {
      // Plain error string
    }
    return error.message;
  }
  return 'Unable to authenticate.';
}

export async function requestGoogleFormsPermission(): Promise<string> {
  const formsProvider = new GoogleAuthProvider();
  GOOGLE_FORMS_SCOPES.forEach((scope) => formsProvider.addScope(scope));
  if (auth.currentUser?.email) {
    formsProvider.setCustomParameters({ login_hint: auth.currentUser.email });
  }
  const result = await signInWithPopup(auth, formsProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (!credential?.accessToken) {
    throw new Error('Could not obtain Google Forms permission. Please try again.');
  }
  cachedWorkspaceToken = credential.accessToken;
  return cachedWorkspaceToken;
}

export async function signOutFromFirebase(): Promise<void> {
  cachedWorkspaceToken = null;
  await signOut(auth);
}

export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
} as const;

export type OperationTypeValue = (typeof OperationType)[keyof typeof OperationType];

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationTypeValue;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationTypeValue,
  path: string | null,
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testFirestoreConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration: client is offline.');
    }
  }
}

void testFirestoreConnection();
