// Firebase SDK initialization — single shared instance for the entire app.
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBLMKiwDnUnCiCTQaCdcZ8Yr6u2BrbMCD4",
  authDomain: "spoonful-cloud.firebaseapp.com",
  projectId: "spoonful-cloud",
  storageBucket: "spoonful-cloud.firebasestorage.app",
  messagingSenderId: "673687039250",
  appId: "1:673687039250:web:876467a18376288f6d97cb",
  measurementId: "G-TSBKSP4G39",
};

const app = initializeApp(firebaseConfig);

// Auth and Firestore instances — import these wherever needed.
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
