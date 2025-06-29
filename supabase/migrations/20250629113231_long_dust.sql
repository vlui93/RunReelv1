/*
  # Fix Database Schema - Security, Constraints, and Performance

  1. Security Updates
    - Enable RLS on manual_activities table
    - Enable RLS on api_usage_tracking table
    - Add comprehensive policies for user data access

  2. Constraints
    - Add check constraints for data validation
    - Ensure data integrity across all tables

  3. Performance
    - Add indexes for frequently queried columns
    - Optimize query performance

  4. Functions
    - Add API usage limit checking function
    - Add helper functions for data validation
*/

-- Enable RLS on manual_activities table
ALTER TABLE manual_activities ENABLE ROW LEVEL SECURITY;

-- Enable RLS on api_usage_tracking table
ALTER TABLE api_usage_tracking ENABLE ROW LEVEL SECURITY;

-- Add comprehensive policies for manual_activities
CREATE POLICY "Users can manage own activities"
  ON manual_activities
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add comprehensive policies for api_usage_tracking
CREATE POLICY "Users can insert their own API usage"
  ON api_usage_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own API usage"
  ON api_usage_tracking
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Add check constraints for manual_activities
DO $$
BEGIN
  -- Activity type constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'manual_activities_activity_type_check'
  ) THEN
    ALTER TABLE manual_activities 
    ADD CONSTRAINT manual_activities_activity_type_check 
    CHECK (activity_type = ANY (ARRAY['Running'::text, 'Walking'::text, 'Cycling'::text, 'Swimming'::text, 'Strength Training'::text, 'Yoga'::text, 'Other'::text]));
  END IF;

  -- Calories constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'manual_activities_calories_check'
  ) THEN
    ALTER TABLE manual_activities 
    ADD CONSTRAINT manual_activities_calories_check 
    CHECK ((calories_burned IS NULL) OR ((calories_burned >= 50) AND (calories_burned <= 2000)));
  END IF;

  -- Heart rate constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'manual_activities_heart_rate_check'
  ) THEN
    ALTER TABLE manual_activities 
    ADD CONSTRAINT manual_activities_heart_rate_check 
    CHECK ((average_heart_rate IS NULL) OR ((average_heart_rate >= 60) AND (average_heart_rate <= 200)));
  END IF;

  -- Intensity level constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'manual_activities_intensity_level_check'
  ) THEN
    ALTER TABLE manual_activities 
    ADD CONSTRAINT manual_activities_intensity_level_check 
    CHECK ((intensity_level >= 1) AND (intensity_level <= 5));
  END IF;

  -- Weather conditions constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'manual_activities_weather_check'
  ) THEN
    ALTER TABLE manual_activities 
    ADD CONSTRAINT manual_activities_weather_check 
    CHECK ((weather_conditions IS NULL) OR (weather_conditions = ANY (ARRAY['Sunny'::text, 'Cloudy'::text, 'Rainy'::text, 'Windy'::text, 'Snow'::text])));
  END IF;
END $$;

-- Add check constraints for api_usage_tracking
DO $$
BEGIN
  -- API service constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'api_usage_service_check'
  ) THEN
    ALTER TABLE api_usage_tracking 
    ADD CONSTRAINT api_usage_service_check 
    CHECK (api_service = 'tavus'::text);
  END IF;

  -- Request type constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'api_usage_request_type_check'
  ) THEN
    ALTER TABLE api_usage_tracking 
    ADD CONSTRAINT api_usage_request_type_check 
    CHECK (request_type = 'video_generation'::text);
  END IF;

  -- Response status constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'api_usage_status_check'
  ) THEN
    ALTER TABLE api_usage_tracking 
    ADD CONSTRAINT api_usage_status_check 
    CHECK (response_status = ANY (ARRAY['success'::text, 'error'::text, 'pending'::text]));
  END IF;
END $$;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS manual_activities_user_id_idx ON manual_activities(user_id);
CREATE INDEX IF NOT EXISTS manual_activities_created_at_idx ON manual_activities(created_at);
CREATE INDEX IF NOT EXISTS manual_activities_date_idx ON manual_activities(activity_date);
CREATE INDEX IF NOT EXISTS manual_activities_type_idx ON manual_activities(activity_type);

CREATE INDEX IF NOT EXISTS api_usage_user_id_idx ON api_usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS api_usage_timestamp_idx ON api_usage_tracking(request_timestamp);
CREATE INDEX IF NOT EXISTS api_usage_service_idx ON api_usage_tracking(api_service);

-- Create API usage limit checking function
CREATE OR REPLACE FUNCTION check_video_generation_limit(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  usage_count INTEGER;
  max_limit INTEGER := 3; -- Default limit of 3 video generations
BEGIN
  -- Count successful video generations for the user
  SELECT COUNT(*)
  INTO usage_count
  FROM api_usage_tracking
  WHERE user_id = p_user_id
    AND api_service = 'tavus'
    AND request_type = 'video_generation'
    AND response_status = 'success';

  -- Return true if under limit, false if at or over limit
  RETURN usage_count < max_limit;
END;
$$;

-- Create helper function to get table columns (for debugging)
CREATE OR REPLACE FUNCTION get_table_columns(table_name TEXT)
RETURNS TABLE(column_name TEXT, data_type TEXT, is_nullable TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::TEXT,
    c.data_type::TEXT,
    c.is_nullable::TEXT
  FROM information_schema.columns c
  WHERE c.table_name = get_table_columns.table_name
    AND c.table_schema = 'public'
  ORDER BY c.ordinal_position;
END;
$$;

-- Create helper function to get foreign key constraints (for debugging)
CREATE OR REPLACE FUNCTION get_foreign_key_constraints(table_name TEXT)
RETURNS TABLE(constraint_name TEXT, column_name TEXT, foreign_table_name TEXT, foreign_column_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tc.constraint_name::TEXT,
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
    AND tc.table_name = get_foreign_key_constraints.table_name
    AND tc.table_schema = 'public';
END;
$$;

-- Create function to notify PostgREST to reload schema (for cache refresh)
CREATE OR REPLACE FUNCTION notify_pgrst_reload()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NOTIFY pgrst, 'reload schema';
END;
$$;

-- Create function to check if column exists
CREATE OR REPLACE FUNCTION check_column_exists(table_name TEXT, column_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = check_column_exists.table_name
      AND column_name = check_column_exists.column_name
  ) INTO column_exists;
  
  RETURN column_exists;
END;
$$;

-- Add trigger for updated_at timestamp on manual_activities
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_manual_activities_updated_at'
  ) THEN
    CREATE TRIGGER update_manual_activities_updated_at
      BEFORE UPDATE ON manual_activities
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;