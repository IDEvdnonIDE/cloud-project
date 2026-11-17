import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../services/firebase';

const AuthContext = createContext(null);
const googleProvider = new GoogleAuthProvider();

// Build a consistent user object from the Firebase user record.
function mapUser(firebaseUser) {
  if (!firebaseUser) return null;
  return {
    uid: firebaseUser.uid,
    id: firebaseUser.uid, // alias kept for compatibility with existing components
    name: firebaseUser.displayName || 'Anonymous',
    email: firebaseUser.email,
    avatar: firebaseUser.photoURL || '🙂',
    // Role management will come with Firestore (default to 'user' for now).
    role: 'user',
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until Firebase checks session

  // Listen for auth state changes (login, logout, page refresh).
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      setUser(mapUser(fbUser));
      setLoading(false);
    });
    return unsub;
  }, []);

  // Email + password login.
  const login = useCallback(async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return mapUser(cred.user);
  }, []);

  // Email + password registration.
  const register = useCallback(async ({ name, email, password }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    const mapped = mapUser({ ...cred.user, displayName: name });
    setUser(mapped);
    return mapped;
  }, []);

  // Google popup login.
  const loginWithGoogle = useCallback(async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    return mapUser(cred.user);
  }, []);

  // Sign out.
  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, loginWithGoogle, logout }),
    [user, loading, login, register, loginWithGoogle, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
