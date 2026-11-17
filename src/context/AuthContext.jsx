import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const AuthContext = createContext(null);
const googleProvider = new GoogleAuthProvider();

async function loadProfile(firebaseUser) {
  if (!firebaseUser) return null;
  const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
  const profile = snap.exists() ? snap.data() : {};
  return {
    uid: firebaseUser.uid,
    id: firebaseUser.uid,
    name: profile.name || firebaseUser.displayName || 'Anonymous',
    email: firebaseUser.email,
    avatar: profile.avatar || firebaseUser.photoURL || '🙂',
    role: profile.role || 'user',
    bio: profile.bio || '',
    dateOfBirth: profile.dateOfBirth || '',
    favourites: profile.favourites || [],
  };
}

export async function saveProfile(uid, data) {
  await setDoc(doc(db, 'users', uid), data, { merge: true });
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const skipNextAuth = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (skipNextAuth.current) {
        skipNextAuth.current = false;
        setLoading(false);
        return;
      }
      const profile = await loadProfile(fbUser);
      setUser(profile);
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = useCallback(async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const profile = await loadProfile(cred.user);
    setUser(profile);
    return profile;
  }, []);

  const register = useCallback(async ({ name, email, password, role, date_of_birth }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    const profileData = {
      name,
      email,
      role: role === 'creator' ? 'creator' : 'user',
      avatar: role === 'creator' ? '🧑‍🍳' : '🙂',
      bio: '',
      dateOfBirth: date_of_birth || '',
      favourites: [],
      joinedAt: new Date().toISOString(),
    };
    await saveProfile(cred.user.uid, profileData);
    const profile = { uid: cred.user.uid, id: cred.user.uid, ...profileData };
    setUser(profile);
    return profile;
  }, []);

  const loginWithGoogle = useCallback(async () => {
    skipNextAuth.current = true;
    const cred = await signInWithPopup(auth, googleProvider);
    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    const isNew = !snap.exists();
    if (!isNew) {
      const profile = await loadProfile(cred.user);
      setUser(profile);
      return { profile, isNew: false };
    }
    return {
      profile: {
        uid: cred.user.uid,
        id: cred.user.uid,
        name: cred.user.displayName || '',
        email: cred.user.email,
        avatar: cred.user.photoURL || '🙂',
        role: 'user',
      },
      isNew: true,
    };
  }, []);

  const completeGoogleSignUp = useCallback(async ({ name, role, dateOfBirth }) => {
    const fbUser = auth.currentUser;
    if (!fbUser) throw new Error('Not signed in.');
    if (name) await updateProfile(fbUser, { displayName: name });
    const profileData = {
      name: name || fbUser.displayName || 'Anonymous',
      email: fbUser.email,
      role: role === 'creator' ? 'creator' : 'user',
      avatar: fbUser.photoURL || (role === 'creator' ? '🧑‍🍳' : '🙂'),
      bio: '',
      dateOfBirth: dateOfBirth || '',
      favourites: [],
      joinedAt: new Date().toISOString(),
    };
    await saveProfile(fbUser.uid, profileData);
    const profile = { uid: fbUser.uid, id: fbUser.uid, ...profileData };
    setUser(profile);
    return profile;
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, loginWithGoogle, completeGoogleSignUp, logout }),
    [user, loading, login, register, loginWithGoogle, completeGoogleSignUp, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}