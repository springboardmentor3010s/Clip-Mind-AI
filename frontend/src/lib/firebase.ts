import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";

// Firebase web config is not a secret — it identifies the project to
// Firebase's client SDK, it does not authorize anything by itself. Real
// access control happens server-side, verifying the ID token this SDK
// issues (see backend app/core/firebase.py).
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBZ7eld7TQ_gwujf9ggMK6tNJkDB6i-a0U",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "clipmind-ai-firebase-gagana.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "clipmind-ai-firebase-gagana",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "clipmind-ai-firebase-gagana.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "968326698597",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:968326698597:web:b5f09652faa5fe6d0dd88c",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
};
