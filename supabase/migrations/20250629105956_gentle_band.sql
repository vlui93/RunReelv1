/*
  # Fix RLS policies and constraints for manual_activities and api_usage_tracking

  1. Security
    - Enable RLS on manual_activities and api_usage_tracking tables
    - Drop and recreate policies to avoid conflicts
    - Add comprehensive policies for data access control

  2. Constraints
    - Add validation constraints for data integrity
    - Use IF NOT EXISTS where possible to avoid conflicts

  3. Performance
    - Create indexes for common query patterns
    - Optimize for user-based queries

  4. Functions
    - Create function to check API usage limits
*/

-- Enable Row Level Security (safe to run multiple times)
ALTER TABLE manual_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_tracking ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can manage own activities" ON manual_activities;
DROP POLICY IF EXISTS "Users can view their own API usage" ON api_usage_tracking;
DROP POLICY IF EXISTS "Users can insert their own API usage" ON api_usage_tracking;

-- Recreate policies for manual_activities
CREATE POLICY "Users can manage own activities"
  ON manual_activities
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Recreate policies for api_usage_tracking
CREATE POLICY "Users can view their own API usage"
  ON api_usage_tracking
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own API usage"
  ON api_usage_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Add constraints with proper error handling
DO $$
BEGIN
  -- manual_activities constraints
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'manual_activities_activity_type_check' 
    AND table_name = 'manual_activities'
  ) THEN
    ALTER TABLE manual_activities ADD CONSTRAINT manual_activities_activity_type_check 
      CHECK (activity_type IN ('Running', 'Walking', 'Cycling', 'Swimming', 'Strength Training', 'Yoga', 'Other'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'manual_activities_intensity_level_check' 
    AND table_name = 'manual_activities'
  ) THEN
    ALTER TABLE manual_activities ADD CONSTRAINT manual_activities_intensity_level_check 
      CHECK (intensity_level >= 1 AND intensity_level <= 5);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'manual_activities_heart_rate_check' 
    AND table_name = 'manual_activities'
  ) THEN
    ALTER TABLE manual_activities ADD CONSTRAINT manual_activities_heart_rate_check 
      CHECK (average_heart_rate IS NULL OR (average_heart_rate >= 60 AND average_heart_rate <= 200));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'manual_activities_calories_check' 
    AND table_name = 'manual_activities'
  ) THEN
    ALTER TABLE manual_activities ADD CONSTRAINT manual_activities_calories_check 
      CHECK (calories_burned IS NULL OR (calories_burned >= 50 AND calories_burned <= 2000));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'manual_activities_weather_check' 
    AND table_name = 'manual_activities'
  ) THEN
    ALTER TABLE manual_activities ADD CONSTRAINT manual_activities_weather_check 
      CHECK (weather_conditions IS NULL OR weather_conditions IN ('Sunny', 'Cloudy', 'Rainy', 'Windy', 'Snow'));
  END IF;

  -- api_usage_tracking constraints
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'api_usage_service_check' 
    AND table_name = 'api_usage_tracking'
  ) THEN
    ALTER TABLE api_usage_tracking ADD CONSTRAINT api_usage_service_check 
      CHECK (api_service = 'tavus');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'api_usage_request_type_check' 
    AND table_name = 'api_usage_tracking'
  ) THEN
    ALTER TABLE api_usage_tracking ADD CONSTRAINT api_usage_request_type_check 
      CHECK (request_type = 'video_generation');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'api_usage_status_check' 
    AND table_name = 'api_usage_tracking'
  ) THEN
    ALTER TABLE api_usage_tracking ADD CONSTRAINT api_usage_status_check 
      CHECK (response_status IN ('success', 'error', 'pending'));
  END IF;
END $$;

-- Create indexes for performance (using IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS manual_activities_user_id_idx ON manual_activities(user_id);
CREATE INDEX IF NOT EXISTS manual_activities_date_idx ON manual_activities(activity_date);
CREATE INDEX IF NOT EXISTS manual_activities_type_idx ON manual_activities(activity_type);
CREATE INDEX IF NOT EXISTS manual_activities_created_at_idx ON manual_activities(created_at);

CREATE INDEX IF NOT EXISTS api_usage_user_id_idx ON api_usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS api_usage_service_idx ON api_usage_tracking(api_service);
CREATE INDEX IF NOT EXISTS api_usage_timestamp_idx ON api_usage_tracking(request_timestamp);

-- Function to check API usage limits (replace if exists)
CREATE OR REPLACE FUNCTION check_video_generation_limit(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  usage_count integer;
BEGIN
  SELECT COUNT(*)
  INTO usage_count
  FROM api_usage_tracking
  WHERE user_id = p_user_id
    AND api_service = 'tavus'
    AND request_type = 'video_generation'
    AND response_status = 'success';
  
  RETURN usage_count < 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;