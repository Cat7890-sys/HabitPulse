import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Users,
  Activity,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CheckCircle,
  RefreshCw,
  LogOut,
  Sparkles,
  Lock,
  ArrowLeft,
  CalendarDays,
  Flame,
  Clock,
  Terminal,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import { collection, getDocs, doc, getDoc, query, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { useAuth } from '../../auth/useAuth';
import { DailyMetrics, AdminUserProfile } from '../../types';
import { getTodayKey, addDaysToDateKey } from '../../utils/date';

interface Props {
  onBackToApp: () => void;
}

export const AdminDashboard: React.FC<Props> = ({ onBackToApp }) => {
  const { user, isAdmin, signOut, refreshAdminStatus } = useAuth();

  // Active section inside Admin Dashboard
  const [activeSection, setActiveSection] = useState<'overview' | 'profiles' | 'analytics' | 'setup'>('overview');

  // Date range filter for analytics: '7d' or '30d'
  const [dateRange, setDateRange] = useState<'7d' | '30d'>('7d');

  // Registered profiles state
  const [profiles, setProfiles] = useState<AdminUserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [profilesError, setProfilesError] = useState<string | null>(null);
  const pageSize = 8;

  // Aggregate daily metrics state
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetrics[]>([]);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  // Today's aggregate summary metric
  const [todayMetric, setTodayMetric] = useState<DailyMetrics | null>(null);

  // Load profiles from Firestore (Users collection)
  const fetchProfiles = async () => {
    if (!isAdmin) return;
    setIsLoadingProfiles(true);
    setProfilesError(null);
    try {
      const usersCol = collection(db, 'users');
      const snap = await getDocs(usersCol);
      const list: AdminUserProfile[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          userId: d.id,
          name: data.name || 'Anonymous User',
          email: data.email || undefined,
          avatar: data.avatar || '👤',
          title: data.title || 'Habit Striver',
          joinedAt: data.joinedAt || data.updatedAt || new Date().toISOString(),
          accountStatus: data.accountStatus || 'active',
          dailyHabitGoal: data.dailyHabitGoal || 4,
        });
      });
      // Sort newest registrations first
      list.sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());
      setProfiles(list);
    } catch (err: unknown) {
      console.error('Failed to load registered profiles:', err);
      setProfilesError('Unable to load registered accounts. Ensure your account is authorized in Firestore Security Rules.');
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  // Load aggregate metrics from /daily_metrics
  const fetchMetrics = async () => {
    if (!isAdmin) return;
    setIsLoadingMetrics(true);
    setMetricsError(null);
    try {
      const metricsCol = collection(db, 'daily_metrics');
      const snap = await getDocs(metricsCol);
      const list: DailyMetrics[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          date: data.date || d.id,
          active_user_count: Number(data.active_user_count || 0),
          registration_count: Number(data.registration_count || 0),
          new_registrations_count: Number(data.new_registrations_count || 0),
          habits_created_count: Number(data.habits_created_count || 0),
          habits_completed_count: Number(data.habits_completed_count || 0),
          app_open_count: Number(data.app_open_count || 0),
          updated_at: data.updated_at || undefined,
        });
      });

      // Sort chronologically ascending
      list.sort((a, b) => a.date.localeCompare(b.date));
      setDailyMetrics(list);

      // Check today's record
      const todayKey = getTodayKey();
      const current = list.find((m) => m.date === todayKey) || null;
      setTodayMetric(current);
    } catch (err: unknown) {
      console.error('Failed to load daily metrics:', err);
      setMetricsError('Could not retrieve aggregate daily usage analytics.');
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  // Initial load when admin status is ready
  useEffect(() => {
    if (isAdmin) {
      fetchProfiles();
      fetchMetrics();
    }
  }, [isAdmin]);

  // Filtered and paginated profiles
  const filteredProfiles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return profiles;
    return profiles.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        p.userId.toLowerCase().includes(q)
    );
  }, [profiles, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredProfiles.length / pageSize));
  const paginatedProfiles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProfiles.slice(start, start + pageSize);
  }, [filteredProfiles, currentPage, pageSize]);

  // Compute metrics for selected date range (7d or 30d)
  const rangeDaysCount = dateRange === '7d' ? 7 : 30;
  const rangeMetrics = useMemo(() => {
    const today = getTodayKey();
    const result: DailyMetrics[] = [];
    const metricsMap = new Map<string, DailyMetrics>();
    dailyMetrics.forEach((m) => metricsMap.set(m.date, m));

    for (let i = rangeDaysCount - 1; i >= 0; i--) {
      const dKey = addDaysToDateKey(today, -i);
      const existing = metricsMap.get(dKey);
      if (existing) {
        result.push(existing);
      } else {
        result.push({
          date: dKey,
          active_user_count: 0,
          new_registrations_count: 0,
          habits_completed_count: 0,
          habits_created_count: 0,
          app_open_count: 0,
        });
      }
    }
    return result;
  }, [dailyMetrics, rangeDaysCount]);

  // Summary aggregates for the range
  const rangeSummary = useMemo(() => {
    let totalDau = 0;
    let totalCompletions = 0;
    let totalCreated = 0;
    let totalNewRegistrations = 0;
    let maxDau = 0;

    rangeMetrics.forEach((m) => {
      totalDau += m.active_user_count;
      totalCompletions += m.habits_completed_count || 0;
      totalCreated += m.habits_created_count || 0;
      totalNewRegistrations += m.new_registrations_count || 0;
      if (m.active_user_count > maxDau) maxDau = m.active_user_count;
    });

    const avgDau = Math.round((totalDau / rangeMetrics.length) * 10) / 10;
    return {
      totalDau,
      avgDau,
      totalCompletions,
      totalCreated,
      totalNewRegistrations,
      maxDau,
    };
  }, [rangeMetrics]);

  // Check if all metrics are zero (useful empty state)
  const hasZeroAnalyticsData = useMemo(() => {
    return (
      rangeSummary.totalDau === 0 &&
      rangeSummary.totalCompletions === 0 &&
      rangeSummary.totalNewRegistrations === 0
    );
  }, [rangeSummary]);

  // If user is not authorized, render Access Denied Screen
  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 text-center shadow-xl space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
            <Lock className="h-8 w-8" />
          </div>

          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Administrator Access Required
            </h2>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              This dashboard is strictly restricted to verified platform administrators. Your authenticated account (
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {user?.email || 'Guest'}
              </span>
              ) does not have active administrative privileges.
            </p>
          </div>

          <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 p-3.5 border border-amber-200 dark:border-amber-900 text-left text-xs text-amber-800 dark:text-amber-300 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
              <span>How to authorize admin access:</span>
            </p>
            <p className="text-[11px] opacity-90 leading-relaxed">
              1. Sign in with the primary administrator email (<code className="font-mono bg-amber-100 dark:bg-amber-900/60 px-1 rounded">matimbangobeni78@gmail.com</code>).
            </p>
            <p className="text-[11px] opacity-90 leading-relaxed">
              2. Or assign the Firebase custom claim <code className="font-mono bg-amber-100 dark:bg-amber-900/60 px-1 rounded">admin: true</code> via the Firebase Admin SDK.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => refreshAdminStatus()}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 text-xs font-bold shadow-md shadow-indigo-600/30 transition cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Re-check Privilege</span>
            </button>

            <button
              onClick={onBackToApp}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2.5 text-xs font-bold transition cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Return to HabitPulse</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Admin Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToApp}
            title="Return to Habit Tracker"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                HabitPulse Admin Console
              </h1>
              <span className="rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                Verified Admin
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Secure Aggregate Analytics &amp; Directory ({user?.email})
            </p>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-2xl bg-slate-100/80 dark:bg-slate-900/80 p-1 border border-slate-200/60 dark:border-slate-800 shrink-0">
          <button
            onClick={() => setActiveSection('overview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeSection === 'overview'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveSection('profiles')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeSection === 'profiles'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Registered Profiles ({profiles.length})
          </button>
          <button
            onClick={() => setActiveSection('analytics')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeSection === 'analytics'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Daily Analytics
          </button>
          <button
            onClick={() => setActiveSection('setup')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeSection === 'setup'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Admin CLI
          </button>
        </div>
      </div>

      {/* SECTION 1: OVERVIEW */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Registered Accounts */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Total Users
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {profiles.length}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Registered platform accounts
              </p>
            </div>

            {/* Daily Active Users (Today) */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Active Users (Today)
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <Activity className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {todayMetric?.active_user_count || 1}
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                Unique active sessions today
              </p>
            </div>

            {/* Aggregate Completions (Today) */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Completions (Today)
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  <CheckCircle className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {todayMetric?.habits_completed_count || 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Aggregate habit milestones hit
              </p>
            </div>

            {/* Platform Privacy Gate */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Privacy Guard
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  <ShieldCheck className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span>Active &amp; Hardened</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Zero-Trust isolated subcollections
              </p>
            </div>
          </div>

          {/* Privacy Constitution Banner */}
          <div className="rounded-3xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shrink-0 shadow-md shadow-indigo-600/30">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Zero-Knowledge User Habit Architecture
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                  By design, administrators cannot view or query individual users&apos; habit titles, schedules, completion histories, goals, or private logs. All metrics shown are aggregate platform totals.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                fetchProfiles();
                fetchMetrics();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer shrink-0"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingMetrics || isLoadingProfiles ? 'animate-spin' : ''}`} />
              <span>Refresh Data</span>
            </button>
          </div>

          {/* Quick Analytics & Recent Profiles preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 7-Day Activity Mini-Trend */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    7-Day Activity Trend
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Daily active users over the past week
                  </p>
                </div>
                <button
                  onClick={() => setActiveSection('analytics')}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  View Details &rarr;
                </button>
              </div>

              {/* Mini Trend Bars */}
              <div className="flex items-end justify-between gap-2 h-28 pt-4 px-2">
                {rangeMetrics.slice(-7).map((m) => {
                  const dayName = new Date(m.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' });
                  const heightPct = rangeSummary.maxDau > 0 ? Math.max(12, Math.round((m.active_user_count / rangeSummary.maxDau) * 100)) : 12;
                  return (
                    <div key={m.date} className="flex-1 flex flex-col items-center gap-1.5 group">
                      <span className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition">
                        {m.active_user_count}
                      </span>
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full rounded-lg bg-gradient-to-t from-indigo-600 to-indigo-400 dark:from-indigo-700 dark:to-indigo-500 transition-all group-hover:scale-105"
                      />
                      <span className="text-[10px] font-bold text-slate-400">
                        {dayName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Registered Profiles Preview */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Recent Registrations
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Latest user accounts joined
                  </p>
                </div>
                <button
                  onClick={() => setActiveSection('profiles')}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  View Directory &rarr;
                </button>
              </div>

              <div className="space-y-2">
                {profiles.slice(0, 3).map((p) => (
                  <div
                    key={p.userId}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-sm">
                        {p.avatar || '👤'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {p.name}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {p.email || 'No email provided'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 shrink-0">
                      {new Date(p.joinedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}

                {profiles.length === 0 && (
                  <p className="text-center text-xs text-slate-400 py-4">
                    No registered accounts found yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: REGISTERED PROFILES DIRECTORY */}
      {activeSection === 'profiles' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Registered User Directory
              </h2>
              <p className="text-[11px] text-slate-400">
                Minimum necessary account records (privacy-preserving, no habit data)
              </p>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by name, email, or ID..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {profilesError && (
            <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/60 p-3 text-xs text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
              {profilesError}
            </div>
          )}

          {/* Profiles Table / List */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">User Profile</th>
                  <th className="px-4 py-3">Account Email</th>
                  <th className="px-4 py-3">Registration Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">User ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {paginatedProfiles.map((p) => (
                  <tr key={p.userId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-sm">
                          {p.avatar || '👤'}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {p.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {p.title || 'Habit Striver'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {p.email || <span className="italic text-slate-400">No email attached</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {new Date(p.joinedAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {p.accountStatus || 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[10px] text-slate-400">
                      {p.userId.slice(0, 10)}...
                    </td>
                  </tr>
                ))}

                {paginatedProfiles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                      {searchQuery ? 'No accounts matching your search.' : 'No registered accounts found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Page {currentPage} of {totalPages} ({filteredProfiles.length} total)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: DAILY USAGE ANALYTICS */}
      {activeSection === 'analytics' && (
        <div className="space-y-5">
          {/* Controls: Date range selector (7d vs 30d) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Aggregate App Usage Analytics
              </h2>
              <p className="text-[11px] text-slate-400">
                Daily active users, new registrations &amp; aggregate completion trends
              </p>
            </div>

            <div className="flex items-center gap-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 p-1">
              <button
                onClick={() => setDateRange('7d')}
                className={`px-3 py-1 text-xs font-bold rounded-xl transition cursor-pointer ${
                  dateRange === '7d'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setDateRange('30d')}
                className={`px-3 py-1 text-xs font-bold rounded-xl transition cursor-pointer ${
                  dateRange === '30d'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                30 Days
              </button>
            </div>
          </div>

          {metricsError && (
            <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/60 p-3 text-xs text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
              {metricsError}
            </div>
          )}

          {/* Metric Summary Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 shadow-2xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Average DAU</p>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {rangeSummary.avgDau}
              </p>
              <p className="text-[10px] text-slate-400">Users / day in {dateRange}</p>
            </div>

            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 shadow-2xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase">New Registrations</p>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {rangeSummary.totalNewRegistrations}
              </p>
              <p className="text-[10px] text-slate-400">Accounts created in {dateRange}</p>
            </div>

            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 shadow-2xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Habits Completed</p>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {rangeSummary.totalCompletions}
              </p>
              <p className="text-[10px] text-slate-400">Aggregate completions</p>
            </div>

            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 shadow-2xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Returning Trend</p>
              <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                {profiles.length > 0
                  ? `${Math.min(100, Math.round((rangeSummary.totalDau / (profiles.length * rangeDaysCount || 1)) * 100))}%`
                  : 'N/A'}
              </p>
              <p className="text-[10px] text-slate-400">Active engagement ratio</p>
            </div>
          </div>

          {/* Interactive Aggregate Trend Graph */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Activity &amp; Registration Trends ({dateRange})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Unique daily active users vs. completed habits
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-indigo-600" />
                  <span>Daily Active Users</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                  <span>Completions</span>
                </span>
              </div>
            </div>

            {hasZeroAnalyticsData ? (
              <div className="py-12 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 p-6 space-y-2">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No Historical Analytics Recorded Yet
                </h4>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                  HabitPulse tracks aggregate daily events privacy-consciously without personal data. As user activity occurs, daily usage charts and registration curves will populate here in real-time.
                </p>
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                {/* SVG Visual Chart */}
                <div className="h-48 w-full flex items-end gap-1 sm:gap-2 px-2 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800">
                  {rangeMetrics.map((m) => {
                    const dauHeight = rangeSummary.maxDau > 0 ? Math.max(6, Math.round((m.active_user_count / rangeSummary.maxDau) * 80)) : 6;
                    const compHeight = rangeSummary.maxDau > 0 ? Math.max(4, Math.round(((m.habits_completed_count || 0) / (rangeSummary.maxDau * 2 || 1)) * 80)) : 4;
                    const dateFormatted = new Date(m.date + 'T00:00:00').toLocaleDateString(undefined, {
                      month: 'numeric',
                      day: 'numeric',
                    });

                    return (
                      <div
                        key={m.date}
                        title={`Date: ${m.date}\nDAU: ${m.active_user_count}\nCompletions: ${m.habits_completed_count || 0}\nNew Registrations: ${m.new_registrations_count || 0}`}
                        className="flex-1 flex flex-col items-center justify-end h-full gap-1 group cursor-pointer"
                      >
                        <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-full">
                          {/* DAU bar */}
                          <div
                            style={{ height: `${dauHeight}%` }}
                            className="w-1/2 max-w-[14px] rounded-t-sm bg-indigo-600 dark:bg-indigo-500 group-hover:brightness-110 transition-all"
                          />
                          {/* Completions bar */}
                          <div
                            style={{ height: `${compHeight}%` }}
                            className="w-1/2 max-w-[14px] rounded-t-sm bg-emerald-500 dark:bg-emerald-400 group-hover:brightness-110 transition-all"
                          />
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 truncate max-w-full">
                          {dateRange === '7d' ? dateFormatted : (m.date.endsWith('01') || m.date.endsWith('15') ? dateFormatted : '')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 4: ADMIN CLI & CUSTOM CLAIM GUIDE */}
      {activeSection === 'setup' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div>
            <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Terminal className="h-4 w-4 text-indigo-600" />
              <span>Firebase Administrator Authorization Setup</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Secure admin custom claims and trusted backend configuration
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-3">
            <p className="font-bold text-slate-900 dark:text-white">
              1. Assign Admin Custom Claim using Firebase Admin SDK:
            </p>
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              Run this script in a trusted environment (Node.js backend or Cloud Function) with your service account credentials. Never bundle this in client code:
            </p>
            <pre className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto">
{`const admin = require('firebase-admin');
admin.initializeApp();

async function setAdminPrivilege(uid) {
  // Set custom user claim { admin: true }
  await admin.auth().setCustomUserClaims(uid, { admin: true });
  console.log(\`Successfully granted administrator custom claim to user: \${uid}\`);
}

// Replace with target user's Firebase UID:
setAdminPrivilege('${user?.uid || 'TARGET_FIREBASE_UID'}');`}
            </pre>

            <p className="font-bold text-slate-900 dark:text-white pt-2">
              2. Or Authorize via Firestore Trusted Collection:
            </p>
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              Create a document in the <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono">admins</code> collection in the Firebase Console:
            </p>
            <ul className="list-disc list-inside text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
              <li>Path: <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">/admins/{user?.uid || 'YOUR_USER_UID'}</code></li>
              <li>Fields: <code className="font-mono">role: &quot;superadmin&quot;</code>, <code className="font-mono">email: &quot;{user?.email || 'admin@example.com'}&quot;</code></li>
            </ul>
          </div>

          {/* Admin Account Controls */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Signed in as <span className="font-bold text-slate-900 dark:text-white">{user?.email}</span>
            </div>
            <button
              onClick={() => {
                signOut();
                onBackToApp();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-900 hover:bg-rose-100 dark:hover:bg-rose-900 transition cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Admin Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
