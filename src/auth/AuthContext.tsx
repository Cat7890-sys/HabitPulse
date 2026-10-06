import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { syncManager, SyncStatus } from '../sync/syncManager';
import { idbStorage } from '../storage/db';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  syncStatus: SyncStatus;
  showMigrationPrompt: boolean;
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
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncManager.getStatus());
  const [showMigrationPrompt, setShowMigrationPrompt] = useState(false);
  const isConfigured = isSupabaseConfigured();

  // Listen to sync manager status changes
  useEffect(() => {
    const unsubscribe = syncManager.subscribe((status) => {
      setSyncStatus(status);
    });
    return unsubscribe;
  }, []);

  // Initialize auth session
  useEffect(() => {
    if (!isConfigured || !supabase) {
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      if (session?.user) {
        syncManager.processQueue();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      if (event === 'SIGNED_IN' && session?.user) {
        // Check if there is pre-existing local data to prompt migration
        const habits = await idbStorage.getHabits();
        if (habits && habits.length > 0) {
          setShowMigrationPrompt(true);
        } else {
          await syncManager.pullFromCloud(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setShowMigrationPrompt(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [isConfigured]);

  const signUp = async (email: string, pass: string) => {
    if (!isConfigured || !supabase) {
      return { success: false, error: 'Supabase is not configured yet. Check your .env file.' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'An unexpected authentication error occurred.' };
    }
  };

  const signIn = async (email: string, pass: string) => {
    if (!isConfigured || !supabase) {
      return { success: false, error: 'Supabase is not configured yet. Check your .env file.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Invalid email or password.' };
    }
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setShowMigrationPrompt(false);
  };

  const migrateLocalDataToCloud = async () => {
    if (user) {
      await syncManager.pushLocalToCloud(user.id);
    }
    setShowMigrationPrompt(false);
  };

  const startFreshCloud = async () => {
    if (user) {
      await syncManager.pullFromCloud(user.id);
    }
    setShowMigrationPrompt(false);
  };

  const dismissMigrationPrompt = () => {
    setShowMigrationPrompt(false);
  };

  const triggerManualSync = async () => {
    if (user) {
      await syncManager.processQueue();
      await syncManager.pullFromCloud(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isConfigured,
        syncStatus,
        showMigrationPrompt,
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
