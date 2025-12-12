import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

let app: App | null = null;
let firebaseAuth: Auth | null = null;
let initializationError: string | null = null;

export function initializeFirebaseAdmin(): { app: App | null; auth: Auth | null; error: string | null } {
  if (initializationError) {
    return { app: null, auth: null, error: initializationError };
  }
  
  if (app && firebaseAuth) {
    return { app, auth: firebaseAuth, error: null };
  }

  if (getApps().length > 0) {
    app = getApps()[0];
    firebaseAuth = getAuth(app);
    return { app, auth: firebaseAuth, error: null };
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountKey) {
    initializationError = "FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Firebase token verification is disabled.";
    console.warn(initializationError);
    console.warn("To enable server-side Firebase token verification:");
    console.warn("1. Go to Firebase Console > Project Settings > Service Accounts");
    console.warn("2. Click 'Generate new private key' to download the JSON file");
    console.warn("3. Set the FIREBASE_SERVICE_ACCOUNT_KEY secret with the JSON content");
    return { app: null, auth: null, error: initializationError };
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    app = initializeApp({
      credential: cert(serviceAccount),
    });
    firebaseAuth = getAuth(app);
    console.log("Firebase Admin SDK initialized successfully");
    return { app, auth: firebaseAuth, error: null };
  } catch (error) {
    initializationError = `Failed to initialize Firebase Admin: ${error}`;
    console.error(initializationError);
    return { app: null, auth: null, error: initializationError };
  }
}

export async function verifyFirebaseToken(idToken: string): Promise<{ uid: string; phone?: string; email?: string } | null> {
  const { auth, error } = initializeFirebaseAdmin();
  
  if (error || !auth) {
    console.error("Firebase Admin not configured:", error);
    return null;
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return {
      uid: decodedToken.uid,
      phone: decodedToken.phone_number,
      email: decodedToken.email,
    };
  } catch (error) {
    console.error("Error verifying Firebase token:", error);
    return null;
  }
}
