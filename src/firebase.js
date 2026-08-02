import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Config is env-driven (VITE_FIREBASE_*) with committed fallbacks so the app
// keeps working out of the box. Override via .env.local for other projects.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCIvYCTi2TjjqN9niwAF_v_xyc4c5aEm4E",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "kabu-ai-1d6cf.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "kabu-ai-1d6cf",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "kabu-ai-1d6cf.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "311880305149",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:311880305149:web:903a0c3360d69ef5b9b194",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-0GF9EM8JNV"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
