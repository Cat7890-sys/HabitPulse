import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
} from 'firebase/auth';
import { auth, googleAuthProvider, isFirebaseConfigured } from '../lib/firebase';
import { syncManager, SyncStatus } from '../sync/syncManager';
import { idbStorage } from '../storage/db';

interface AuthContextType {
  user: User | null;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
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

  // Listen to Firebase auth state changes
  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);

      if (currentUser) {
        // Check if there is pre-existing local data to prompt migration
        const habits = await idbStorage.getHabits();
        if (habits && habits.length > 0) {
          setShowMigrationPrompt(true);
        } else {
          await syncManager.pullFromCloud(currentUser.uid);
        }
        syncManager.processQueue();
      } else {
        setShowMigrationPrompt(false);
      }
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
