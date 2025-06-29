/*
  # Schema Cleanup and Consolidation

  This migration consolidates all previous migrations into a clean, consistent schema.
  It drops and recreates all tables, functions, and policies to ensure no conflicts.

  ## Changes Made:
  1. Drop all existing tables and functions
  2. Recreate clean schema with proper relationships
  3. Add all necessary RLS policies
  4. Create utility functions for the application
  5. Ensure proper indexing and constraints
*/

-- Drop all existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS check_video_generation_limit(UUID);
DROP FUNCTION IF EXISTS check_video_generation_limit(check_user_id UUID);
DROP FUNCTION IF EXISTS get_user_activity_stats(UUID);
DROP FUNCTION IF EXISTS get_user_activity_stats(check_user_id UUID);
DROP FUNCTION IF EXISTS get_table_columns_info();
DROP FUNCTION IF EXISTS get_foreign_key_info();
DROP FUNCTION IF EXISTS check_column_exists_in_table(text, text);
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS trigger_detect_achievements();
DROP FUNCTION IF EXISTS trigger_detect_manual_achievements();

-- Drop all existing tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS video_analytics CASCADE;
DROP TABLE IF EXISTS video_likes CASCADE;
DROP TABLE IF EXISTS video_comments CASCADE;
DROP TABLE IF EXISTS api_usage_tracking CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS imported_workouts CASCADE;
DROP TABLE IF EXISTS health_data_sources CASCADE;
DROP TABLE IF EXISTS runs CASCADE;
DROP TABLE IF EXISTS video_generations CASCADE;
DROP TABLE IF EXISTS video_templates CASCADE;
DROP TABLE IF EXISTS manual_activities CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create manual_activities table
CREATE TABLE manual_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('Running', 'Walking', 'Cycling', 'Swimming', 'Strength Training', 'Yoga', 'Other')),
  activity_name TEXT NOT NULL,
  activity_date DATE NOT NULL CHECK (activity_date <= CURRENT_DATE),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0 AND duration_seconds <= 86400),
  distance_km NUMERIC(8,3),
  calories_burned INTEGER CHECK (calories_burned IS NULL OR (calories_burned >= 50 AND calories_burned <= 2000)),
  average_heart_rate INTEGER CHECK (average_heart_rate IS NULL OR (average_heart_rate >= 60 AND average_heart_rate <= 200)),
  intensity_level INTEGER CHECK (intensity_level >= 1 AND intensity_level <= 5),
  notes TEXT,
  achievement_flags TEXT[],
  weather_conditions TEXT CHECK (weather_conditions IS NULL OR weather_conditions IN ('Sunny', 'Cloudy', 'Rainy', 'Windy', 'Snow')),
  video_generated BOOLEAN DEFAULT FALSE,
  video_url TEXT,
  script_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on manual_activities
ALTER TABLE manual_activities ENABLE ROW LEVEL SECURITY;

-- Manual activities policies
CREATE POLICY "manual_activities_user_access"
  ON manual_activities FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes for manual_activities
CREATE INDEX idx_manual_activities_user_date ON manual_activities(user_id, activity_date DESC);
CREATE INDEX idx_manual_activities_created ON manual_activities(created_at DESC);
CREATE INDEX idx_manual_activities_type ON manual_activities(activity_type);

-- Create video_generations table
CREATE TABLE video_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  run_id UUID REFERENCES manual_activities(id) ON DELETE SET NULL,
  tavus_job_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  video_url TEXT,
  script_content TEXT,
  cost_estimate NUMERIC(10,4),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on video_generations
ALTER TABLE video_generations ENABLE ROW LEVEL SECURITY;

-- Video generations policies
CREATE POLICY "Users can insert own video generations"
  ON video_generations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own video generations"
  ON video_generations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own video generations"
  ON video_generations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own video generations"
  ON video_generations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for video_generations
CREATE INDEX idx_video_generations_user_id ON video_generations(user_id);
CREATE INDEX idx_video_generations_status ON video_generations(status);
CREATE INDEX idx_video_generations_created_at ON video_generations(created_at);
CREATE INDEX idx_video_generations_user_status ON video_generations(user_id, status);

-- Create health_data_sources table
CREATE TABLE health_data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('apple_health', 'google_fit', 'manual')),
  is_connected BOOLEAN DEFAULT FALSE,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'completed', 'failed')),
  permissions_granted JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, source_type)
);

-- Enable RLS on health_data_sources
ALTER TABLE health_data_sources ENABLE ROW LEVEL SECURITY;

-- Health data sources policies
CREATE POLICY "Users can manage own health data sources"
  ON health_data_sources FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for health_data_sources
CREATE INDEX health_data_sources_user_id_idx ON health_data_sources(user_id);
CREATE INDEX health_data_sources_source_type_idx ON health_data_sources(source_type);

-- Create imported_workouts table
CREATE TABLE imported_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES health_data_sources(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  workout_type TEXT NOT NULL CHECK (workout_type IN ('running', 'walking', 'cycling', 'swimming', 'strength', 'yoga', 'hiking', 'other')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  distance NUMERIC DEFAULT 0,
  duration INTEGER NOT NULL,
  calories INTEGER DEFAULT 0,
  heart_rate_avg INTEGER,
  heart_rate_max INTEGER,
  pace_avg NUMERIC,
  elevation_gain NUMERIC DEFAULT 0,
  route_data JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_id, external_id)
);

-- Enable RLS on imported_workouts
ALTER TABLE imported_workouts ENABLE ROW LEVEL SECURITY;

-- Imported workouts policies
CREATE POLICY "Users can insert own imported workouts"
  ON imported_workouts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own imported workouts"
  ON imported_workouts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own imported workouts"
  ON imported_workouts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for imported_workouts
CREATE INDEX imported_workouts_user_id_idx ON imported_workouts(user_id);
CREATE INDEX imported_workouts_source_id_idx ON imported_workouts(source_id);
CREATE INDEX imported_workouts_start_time_idx ON imported_workouts(start_time);
CREATE INDEX imported_workouts_workout_type_idx ON imported_workouts(workout_type);

-- Create achievements table
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  workout_id UUID REFERENCES imported_workouts(id) ON DELETE SET NULL,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN ('personal_record', 'milestone', 'streak', 'first_time')),
  category TEXT NOT NULL CHECK (category IN ('distance', 'duration', 'pace', 'consistency', 'calories', 'frequency')),
  value NUMERIC NOT NULL,
  previous_value NUMERIC,
  description TEXT NOT NULL,
  is_processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on achievements
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Achievements policies
CREATE POLICY "Users can insert own achievements"
  ON achievements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own achievements"
  ON achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements"
  ON achievements FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for achievements
CREATE INDEX achievements_user_id_idx ON achievements(user_id);
CREATE INDEX achievements_type_idx ON achievements(achievement_type);
CREATE INDEX achievements_processed_idx ON achievements(is_processed);
CREATE INDEX achievements_workout_id_idx ON achievements(workout_id);

-- Create runs table
CREATE TABLE runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  distance NUMERIC NOT NULL,
  duration INTEGER NOT NULL,
  average_pace NUMERIC,
  calories INTEGER,
  route_data JSONB,
  video_url TEXT,
  effort_level TEXT CHECK (effort_level IN ('encouraged', 'mission_accomplished', 'personal_best')),
  mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 6),
  imported_workout_id UUID REFERENCES imported_workouts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on runs
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;

-- Runs policies
CREATE POLICY "Users can insert own runs"
  ON runs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own runs"
  ON runs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own runs"
  ON runs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for runs
CREATE INDEX runs_user_id_idx ON runs(user_id);
CREATE INDEX runs_created_at_idx ON runs(created_at);
CREATE INDEX runs_effort_level_idx ON runs(effort_level);
CREATE INDEX runs_mood_rating_idx ON runs(mood_rating);

-- Create api_usage_tracking table
CREATE TABLE api_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  api_service TEXT NOT NULL CHECK (api_service = 'tavus'),
  request_type TEXT NOT NULL CHECK (request_type = 'video_generation'),
  request_timestamp TIMESTAMPTZ DEFAULT NOW(),
  response_status TEXT CHECK (response_status IN ('success', 'error', 'pending')),
  cost_estimate NUMERIC(10,4),
  request_payload JSONB,
  response_data JSONB
);

-- Enable RLS on api_usage_tracking
ALTER TABLE api_usage_tracking ENABLE ROW LEVEL SECURITY;

-- API usage tracking policies
CREATE POLICY "api_usage_insert_policy"
  ON api_usage_tracking FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "api_usage_select_policy"
  ON api_usage_tracking FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for api_usage_tracking
CREATE INDEX api_usage_user_id_idx ON api_usage_tracking(user_id);
CREATE INDEX api_usage_service_idx ON api_usage_tracking(api_service);
CREATE INDEX api_usage_timestamp_idx ON api_usage_tracking(request_timestamp);

-- Create video_templates table
CREATE TABLE video_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  workout_types TEXT[] NOT NULL,
  achievement_types TEXT[] NOT NULL,
  template_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on video_templates
ALTER TABLE video_templates ENABLE ROW LEVEL SECURITY;

-- Video templates policies
CREATE POLICY "Users can read video templates"
  ON video_templates FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- Create video_likes table
CREATE TABLE video_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_generation_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(video_generation_id, user_id)
);

-- Enable RLS on video_likes
ALTER TABLE video_likes ENABLE ROW LEVEL SECURITY;

-- Video likes policies
CREATE POLICY "Users can manage their own likes"
  ON video_likes FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read all likes"
  ON video_likes FOR SELECT
  TO authenticated
  USING (TRUE);

-- Create indexes for video_likes
CREATE INDEX video_likes_user_id_idx ON video_likes(user_id);
CREATE INDEX video_likes_video_id_idx ON video_likes(video_generation_id);

-- Create video_comments table
CREATE TABLE video_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_generation_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on video_comments
ALTER TABLE video_comments ENABLE ROW LEVEL SECURITY;

-- Video comments policies
CREATE POLICY "Users can manage their own comments"
  ON video_comments FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read all comments"
  ON video_comments FOR SELECT
  TO authenticated
  USING (TRUE);

-- Create indexes for video_comments
CREATE INDEX video_comments_user_id_idx ON video_comments(user_id);
CREATE INDEX video_comments_video_id_idx ON video_comments(video_generation_id);
CREATE INDEX video_comments_created_at_idx ON video_comments(created_at);

-- Create video_analytics table
CREATE TABLE video_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_generation_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'like', 'share', 'download', 'comment')),
  platform TEXT CHECK (platform IN ('twitter', 'instagram', 'tiktok', 'native', 'web')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on video_analytics
ALTER TABLE video_analytics ENABLE ROW LEVEL SECURITY;

-- Video analytics policies
CREATE POLICY "Users can insert own analytics"
  ON video_analytics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for video_analytics
CREATE INDEX video_analytics_user_id_idx ON video_analytics(user_id);
CREATE INDEX video_analytics_video_id_idx ON video_analytics(video_generation_id);
CREATE INDEX video_analytics_event_type_idx ON video_analytics(event_type);
CREATE INDEX video_analytics_created_at_idx ON video_analytics(created_at);

-- Create utility functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_manual_activities_updated_at
  BEFORE UPDATE ON manual_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_generations_updated_at
  BEFORE UPDATE ON video_generations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create achievement detection functions
CREATE OR REPLACE FUNCTION trigger_detect_achievements()
RETURNS TRIGGER AS $$
BEGIN
  -- This would contain logic to detect achievements
  -- For now, it's a placeholder
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_detect_manual_achievements()
RETURNS TRIGGER AS $$
BEGIN
  -- This would contain logic to detect achievements for manual activities
  -- For now, it's a placeholder
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for achievement detection
CREATE TRIGGER imported_workouts_achievement_trigger
  AFTER INSERT ON imported_workouts
  FOR EACH ROW EXECUTE FUNCTION trigger_detect_achievements();

CREATE TRIGGER manual_activities_achievement_trigger
  AFTER INSERT ON manual_activities
  FOR EACH ROW EXECUTE FUNCTION trigger_detect_manual_achievements();

-- Create application utility functions
CREATE OR REPLACE FUNCTION check_video_generation_limit(check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  video_count INTEGER;
  max_videos INTEGER := 3; -- Free tier limit
BEGIN
  SELECT COUNT(*)
  INTO video_count
  FROM api_usage_tracking
  WHERE user_id = check_user_id
    AND api_service = 'tavus'
    AND request_type = 'video_generation'
    AND response_status = 'success';
  
  RETURN video_count < max_videos;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_activity_stats(check_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_activities', COALESCE(manual_count, 0) + COALESCE(imported_count, 0),
    'total_distance', COALESCE(manual_distance, 0) + COALESCE(imported_distance, 0),
    'total_duration', COALESCE(manual_duration, 0) + COALESCE(imported_duration, 0),
    'total_calories', COALESCE(manual_calories, 0) + COALESCE(imported_calories, 0),
    'videos_generated', COALESCE(video_count, 0),
    'achievements_count', COALESCE(achievement_count, 0)
  )
  INTO result
  FROM (
    SELECT 
      (SELECT COUNT(*) FROM manual_activities WHERE user_id = check_user_id) as manual_count,
      (SELECT COALESCE(SUM(distance_km), 0) FROM manual_activities WHERE user_id = check_user_id) as manual_distance,
      (SELECT COALESCE(SUM(duration_seconds), 0) FROM manual_activities WHERE user_id = check_user_id) as manual_duration,
      (SELECT COALESCE(SUM(calories_burned), 0) FROM manual_activities WHERE user_id = check_user_id) as manual_calories,
      (SELECT COUNT(*) FROM imported_workouts WHERE user_id = check_user_id) as imported_count,
      (SELECT COALESCE(SUM(distance), 0) FROM imported_workouts WHERE user_id = check_user_id) as imported_distance,
      (SELECT COALESCE(SUM(duration), 0) FROM imported_workouts WHERE user_id = check_user_id) as imported_duration,
      (SELECT COALESCE(SUM(calories), 0) FROM imported_workouts WHERE user_id = check_user_id) as imported_calories,
      (SELECT COUNT(*) FROM video_generations WHERE user_id = check_user_id AND status = 'completed') as video_count,
      (SELECT COUNT(*) FROM achievements WHERE user_id = check_user_id) as achievement_count
  ) stats;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create debugging utility functions
CREATE OR REPLACE FUNCTION get_table_columns_info()
RETURNS TABLE(table_name TEXT, column_name TEXT, data_type TEXT, is_nullable TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::TEXT,
    c.column_name::TEXT,
    c.data_type::TEXT,
    c.is_nullable::TEXT
  FROM information_schema.tables t
  JOIN information_schema.columns c ON t.table_name = c.table_name
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
  ORDER BY t.table_name, c.ordinal_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_foreign_key_info()
RETURNS TABLE(
  table_name TEXT,
  column_name TEXT,
  foreign_table_name TEXT,
  foreign_column_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tc.table_name::TEXT,
    kcu.column_name::TEXT,
    ccu.table_name::TEXT AS foreign_table_name,
    ccu.column_name::TEXT AS foreign_column_name
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
  ORDER BY tc.table_name, kcu.column_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_column_exists_in_table(target_table TEXT, target_column TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = target_table
      AND column_name = target_column
  ) INTO column_exists;
  
  RETURN column_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;