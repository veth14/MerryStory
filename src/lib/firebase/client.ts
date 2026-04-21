import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";

type FirebasePublicConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

function getFirebasePublicConfig(): FirebasePublicConfig {
  const config: FirebasePublicConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
  };

  const missingKeys = Object.entries(config)
    .filter(([key, value]) => key !== "measurementId" && !value)
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    throw new Error(`Missing Firebase public config keys: ${missingKeys.join(", ")}`);
  }

  return config;
}

let cachedFirebaseApp: FirebaseApp | undefined;
let cachedFirebaseAuth: Auth | undefined;

export function getFirebaseClientApp(): FirebaseApp {
  if (!cachedFirebaseApp) {
    cachedFirebaseApp = getApps().length > 0 ? getApp() : initializeApp(getFirebasePublicConfig());
  }

  return cachedFirebaseApp;
}

export function getFirebaseClientAuth(): Auth {
  if (!cachedFirebaseAuth) {
    cachedFirebaseAuth = getAuth(getFirebaseClientApp());
  }

  return cachedFirebaseAuth;
}
