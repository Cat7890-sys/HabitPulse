/**
 * @file authGuard.ts
 * Secure utility to verify user custom claims via Firebase Auth and AuthGuard wrapper.
 */

import React, { ReactNode } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const BOOTSTRAPPED_ADMIN_EMAIL = 'matimbangobeni78@gmail.com';

/**
 * Securely verify if a Firebase Auth user has administrator custom claims or authorization.
 */
export async function verifyUserAdminClaim(user: User | null): Promise<boolean> {
  if (!user) return false;

  try {
    const idTokenResult = await user.getIdTokenResult(true);

    if (idTokenResult.claims.admin === true) {
      return true;
    }

    if (
      user.email &&
      user.email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()
    ) {
      return true;
    }

    const adminDocRef = doc(db, 'admins', user.uid);
    const adminDocSnap = await getDoc(adminDocRef).catch(() => null);

    if (adminDocSnap && adminDocSnap.exists()) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error verifying user admin custom claims:', error);
    return false;
  }
}

interface AuthGuardProps {
  user: User | null;
  isAdmin: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * AuthGuard component to restrict access to administrator sections.
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  user,
  isAdmin,
  children,
  fallback,
}) => {
  if (!user || !isAdmin) {
    if (fallback) {
      return React.createElement(React.Fragment, null, fallback);
    }

    return React.createElement(
      'div',
      { className: 'rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center shadow-xl space-y-4 max-w-md mx-auto my-12' },
      React.createElement(
        'div',
        { className: 'mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900' },
        React.createElement('span', { className: 'text-xl font-black' }, '!')
      ),
      React.createElement(
        'div',
        null,
        React.createElement('h3', { className: 'text-base font-black text-slate-900 dark:text-white' }, 'Restricted Admin Area'),
        React.createElement('p', { className: 'mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed' }, 'You must be signed in with a verified administrator account to view this content.')
      )
    );
  }

  return React.createElement(React.Fragment, null, children);
};
