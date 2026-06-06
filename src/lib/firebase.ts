import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword as _signInWithEmailAndPassword,
  createUserWithEmailAndPassword as _createUserWithEmailAndPassword,
  signOut as _signOut,
  sendPasswordResetEmail as _sendPasswordResetEmail,
  confirmPasswordReset as _confirmPasswordReset,
  GoogleAuthProvider,
  signInWithPopup as _signInWithPopup,
  onAuthStateChanged,
  updateProfile,
  type User,
  type UserCredential,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId
);

let app;
let auth: ReturnType<typeof getAuth> | null;

if (isFirebaseConfigured && getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} else if (getApps().length > 0) {
  app = getApp();
  auth = getAuth(app);
} else {
  app = null;
  auth = null;
}

export { auth, isFirebaseConfigured };
export const googleProvider = new GoogleAuthProvider();

export const signInWithEmailAndPassword = (email: string, password: string) => {
  if (!isFirebaseConfigured || !auth) throw new Error("Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* environment variables.");
  return _signInWithEmailAndPassword(auth, email, password);
};

export const createUserWithEmailAndPassword = (email: string, password: string) => {
  if (!isFirebaseConfigured || !auth) throw new Error("Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* environment variables.");
  return _createUserWithEmailAndPassword(auth, email, password);
};

export const firebaseSignOut = () => {
  if (!auth) return Promise.resolve();
  return _signOut(auth);
};

export const sendPasswordResetEmail = (email: string) => {
  if (!isFirebaseConfigured || !auth) throw new Error("Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* environment variables.");
  return _sendPasswordResetEmail(auth, email);
};

export const confirmPasswordReset = (oobCode: string, newPassword: string) => {
  if (!isFirebaseConfigured || !auth) throw new Error("Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* environment variables.");
  return _confirmPasswordReset(auth, oobCode, newPassword);
};

export const signInWithPopup = () => {
  if (!isFirebaseConfigured || !auth) throw new Error("Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* environment variables.");
  return _signInWithPopup(auth, googleProvider);
};

export const updateUserProfile = (user: User, profile: { displayName?: string; photoURL?: string }) =>
  updateProfile(user, profile);

export { onAuthStateChanged };
export type { User };
export type { UserCredential };