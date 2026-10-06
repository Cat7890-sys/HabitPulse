-- ====================================================================
-- HabitPulse - Supabase PostgreSQL Schema & Row Level Security (RLS)
-- ====================================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Habit Champion',
  avatar TEXT DEFAULT '🦁',
  bio TEXT DEFAULT 'Building consistent daily habits one small step at a time.',
  title TEXT DEFAULT 'Consistent Striver',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  daily_habit_goal INT DEFAULT 4,
  theme_color TEXT DEFAULT 'indigo',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);


-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'indigo',
  emoji TEXT DEFAULT '🏷️',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (id, user_id)
);

-- Enable RLS for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own categories"
  ON public.categories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 3. HABITS TABLE
CREATE TABLE IF NOT EXISTS public.habits (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '✨',
  color TEXT DEFAULT 'indigo',
  frequency JSONB NOT NULL DEFAULT '{"type": "daily"}'::jsonb,
  reminder_time TEXT,
  reminder_enabled BOOLEAN DEFAULT FALSE,
  category TEXT,
  category_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  archived BOOLEAN DEFAULT FALSE,
  order_index INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (id, user_id)
);

-- Enable RLS for habits
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own habits"
  ON public.habits FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 4. HABIT COMPLETIONS TABLE (Logs)
CREATE TABLE IF NOT EXISTS public.habit_completions (
  id TEXT NOT NULL, -- Format: {habit_id}_{date_key}
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id TEXT NOT NULL,
  date_key TEXT NOT NULL,
  completed BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (id, user_id)
);

-- Enable RLS for habit_completions
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own habit completions"
  ON public.habit_completions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 5. USER SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'dark',
  accent_color TEXT DEFAULT 'indigo',
  sound_enabled BOOLEAN DEFAULT TRUE,
  haptics_enabled BOOLEAN DEFAULT TRUE,
  notifications_enabled BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own settings"
  ON public.user_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_completions_user_habit ON public.habit_completions(user_id, habit_id);
CREATE INDEX IF NOT EXISTS idx_completions_date ON public.habit_completions(user_id, date_key);
