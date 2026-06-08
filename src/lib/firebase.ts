import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
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
  type Auth,
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

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _googleProvider: GoogleAuthProvider | null = null;

function getAppInstance(): FirebaseApp {
  if (_app) return _app;
  if (getApps().length > 0) {
    _app = getApp();
  } else {
    _app = initializeApp(firebaseConfig);
  }
  return _app;
}

function getAuthInstance(): Auth {
  if (_auth) return _auth;
  if (typeof window === "undefined") {
    throw new Error("Firebase Auth cannot be initialized on the server. This code should only run in the browser.");
  }
  _auth = getAuth(getAppInstance());
  return _auth;
}

function getGoogleProvider(): GoogleAuthProvider {
  if (_googleProvider) return _googleProvider;
  _googleProvider = new GoogleAuthProvider();
  return _googleProvider;
}

export { isFirebaseConfigured, getAuthInstance as auth };
export type { User, UserCredential };

export const signInWithEmailAndPassword = (email: string, password: string) => {
  if (!isFirebaseConfigured) throw new Error("Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* environment variables.");
  return _signInWithEmailAndPassword(getAuthInstance(), email, password);
};

export const createUserWithEmailAndPassword = (email: string, password: string) => {
  if (!isFirebaseConfigured) throw new Error("Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* environment variables.");
  return _createUserWithEmailAndPassword(getAuthInstance(), email, password);
};

export const firebaseSignOut = () => {
  if (!_auth) return Promise.resolve();
  return _signOut(getAuthInstance());
};

export const sendPasswordResetEmail = (email: string) => {
  if (!isFirebaseConfigured) throw new Error("Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* environment variables.");
  return _sendPasswordResetEmail(getAuthInstance(), email);
};

export const confirmPasswordReset = (oobCode: string, newPassword: string) => {
  if (!isFirebaseConfigured) throw new Error("Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* environment variables.");
  return _confirmPasswordReset(getAuthInstance(), oobCode, newPassword);
};

export const signInWithPopup = () => {
  if (!isFirebaseConfigured) throw new Error("Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* environment variables.");
  return _signInWithPopup(getAuthInstance(), getGoogleProvider());
};

export const updateUserProfile = (user: User, profile: { displayName?: string; photoURL?: string }) =>
  updateProfile(user, profile);

export { onAuthStateChanged };