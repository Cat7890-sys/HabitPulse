import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleAuthProvider, isFirebaseConfigured } from '../lib/firebase';
import { syncManager, SyncStatus } from '../sync/syncManager';
import { idbStorage } from '../storage/db';
import { trackEvent } from '../utils/analytics';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  isConfigured: boolean;
  syncStatus: SyncStatus;
  showMigrationPrompt: boolean;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  migrateLocalDataToCloud: () => Promise<void>;
  startFreshCloud: () => Promise<void>;
  dismissMigrationPrompt: () => void;
  triggerManualSync: () => Promise<void>;
  refreshAdminStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Bootstrapped Administrator for HabitPulse platform
const BOOTSTRAPPED_ADMIN_EMAIL = 'matimbangobeni78@gmail.com';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncManager.getStatus());
  const [showMigrationPrompt, setShowMigrationPrompt] = useState(false);
  const isConfigured = isFirebaseConfigured();

  // Listen to sync manager status changes
  useEffect(() => {
    const unsubscribe = syncManager.subscribe((status) => {
      setSyncStatus(status);
    });
    return unsubscribe;
  }, []);

  // Track app_open aggregate event on initial mount
  useEffect(() => {
    trackEvent('app_open');
  }, []);

  // Verify administrator privilege using Firebase custom claims and trusted records
  const verifyAdminPrivilege = async (currentUser: User): Promise<boolean> => {
    try {
      // 1. Check custom claim on ID token
      const idTokenResult = await currentUser.getIdTokenResult(true);
      if (idTokenResult.claims.admin === true) {
        return true;
      }

      // 2. Check if verified bootstrap owner account
      if (
        currentUser.email &&
        currentUser.email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()
      ) {
        return true;
      }

      // 3. Check trusted admins collection in Firestore
      const adminDocSnap = await getDoc(doc(db, 'admins', currentUser.uid)).catch(() => null);
      if (adminDocSnap && adminDocSnap.exists()) {
        return true;
      }

      return false;
    } catch (e) {
      console.debug('Admin authorization verification note:', e);
      return false;
    }
  };

  const refreshAdminStatus = async (): Promise<boolean> => {
    if (!auth.currentUser) {
      setIsAdmin(false);
      return false;
    }
    const adminState = await verifyAdminPrivilege(auth.currentUser);
    setIsAdmin(adminState);
    return adminState;
  };

  // Register minimum public profile in Firestore directory
  const syncRegisteredProfile = async (currentUser: User) => {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef).catch(() => null);

      if (!userDoc || !userDoc.exists()) {
        const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'HabitPulse User';
        await setDoc(
          userRef,
          {
            userId: currentUser.uid,
            name: displayName,
            email: currentUser.email || null,
            avatar: '👤',
            bio: '',
            title: 'Consistent Striver',
            accountStatus: 'active',
            joinedAt: new Date().toISOString(),
            dailyHabitGoal: 4,
            themeColor: 'indigo',
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        ).catch(() => null);
      }
    } catch {
      // Profile sync is non-blocking
    }
  };

  // Listen to Firebase auth state changes
  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Verify administrator authorization
        const adminState = await verifyAdminPrivilege(currentUser);
        setIsAdmin(adminState);

        // Ensure user is registered in the public profiles directory
        syncRegisteredProfile(currentUser);

        // Check if there is pre-existing local data to prompt migration
        const habits = await idbStorage.getHabits();
        if (habits && habits.length > 0) {
          setShowMigrationPrompt(true);
        } else {
          await syncManager.pullFromCloud(currentUser.uid);
        }
        syncManager.processQueue();
      } else {
        setIsAdmin(false);
        setShowMigrationPrompt(false);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isConfigured]);

  const signInWithGoogle = async () => {
    if (!isConfigured) {
      return { success: false, error: 'Firebase is not configured.' };
    }
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      setUser(result.user);
      trackEvent('sign_in');
      await refreshAdminStatus();
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
      return { success: false, error: msg };
    }
  };

  const signUp = async (email: string, pass: string) => {
    if (!isConfigured) {
      return { success: false, error: 'Firebase is not configured.' };
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      setUser(cred.user);
      trackEvent('sign_up');
      await refreshAdminStatus();
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not create account.';
      return { success: false, error: msg };
    }
  };

  const signIn = async (email: string, pass: string) => {
    if (!isConfigured) {
      return { success: false, error: 'Firebase is not configured.' };
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      setUser(cred.user);
      trackEvent('sign_in');
      await refreshAdminStatus();
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid email or password.';
      return { success: false, error: msg };
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.error('Sign out error:', e);
    }
    setUser(null);
    setIsAdmin(false);
    setShowMigrationPrompt(false);
  };

  const migrateLocalDataToCloud = async () => {
    if (user) {
      await syncManager.pushLocalToCloud(user.uid);
    }
    setShowMigrationPrompt(false);
  };

  const startFreshCloud = async () => {
    if (user) {
      await syncManager.pullFromCloud(user.uid);
    }
    setShowMigrationPrompt(false);
  };

  const dismissMigrationPrompt = () => {
    setShowMigrationPrompt(false);
  };

  const triggerManualSync = async () => {
    if (user) {
      await syncManager.processQueue();
      await syncManager.pullFromCloud(user.uid);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        isConfigured,
        syncStatus,
        showMigrationPrompt,
        signInWithGoogle,
        signUp,
        signIn,
        signOut,
        migrateLocalDataToCloud,
        startFreshCloud,
        dismissMigrationPrompt,
        triggerManualSync,
        refreshAdminStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
