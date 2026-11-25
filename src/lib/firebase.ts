import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export const GOOGLE_FORMS_SCOPES = [
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.responses.readonly',
];

// Keep Google Workspace OAuth token strictly in memory (never localStorage/sessionStorage).
let cachedWorkspaceToken: string | null = null;

export function getWorkspaceAccessToken(): string | null {
  return cachedWorkspaceToken;
}

export function clearWorkspaceAccessToken(): void {
  cachedWorkspaceToken = null;
}

export async function requestGoogleFormsPermission(): Promise<string> {
  const formsProvider = new GoogleAuthProvider();
  formsProvider.setCustomParameters({ prompt: 'select_account' });
  GOOGLE_FORMS_SCOPES.forEach((scope) => formsProvider.addScope(scope));

  const result = await signInWithPopup(auth, formsProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (!credential?.accessToken) {
    throw new Error('Could not obtain Google Forms permission. Please try again.');
  }
  cachedWorkspaceToken = credential.accessToken;
  return cachedWorkspaceToken;
}
