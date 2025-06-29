/*
  # Database Security and Performance Migration

  1. Security
    - Enable RLS on manual_activities and api_usage_tracking tables
    - Create policies for data access control (with duplicate handling)
    
  2. Data Validation
    - Add check constraints for data integrity
    
  3. Performance
    - Create indexes for optimized queries
    
  4. Functions
    - API usage limit checking function
*/

-- Enable Row Level Security (safe to run multiple times)
ALTER TABLE manual_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_tracking ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate them
DO $$ 
BEGIN
  -- Drop manual_activities policies if they exist
  DROP POLICY IF EXISTS "Users can manage own activities" ON manual_activities;
  DROP POLICY IF EXISTS "Users can insert their own activities" ON manual_activities;
  DROP POLICY IF EXISTS "Users can view their own activities" ON manual_activities;
  
  -- Drop api_usage_tracking policies if they exist
  DROP POLICY IF EXISTS "Users can view their own API usage" ON api_usage_tracking;
  DROP POLICY IF EXISTS "Users can insert their own API usage" ON api_usage_tracking;
  DROP POLICY IF EXISTS "System can insert API usage" ON api_usage_tracking;
END $$;

-- Create policies for manual_activities
CREATE POLICY "Users can manage own activities"
  ON manual_activities
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create policies for api_usage_tracking
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

-- Add constraints (with IF NOT EXISTS equivalent using DO blocks)
DO $$ 
BEGIN
  -- Add manual_activities constraints
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

  -- Add api_usage_tracking constraints
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

-- Create indexes for performance (IF NOT EXISTS is safe for indexes)
CREATE INDEX IF NOT EXISTS manual_activities_user_id_idx ON manual_activities(user_id);
CREATE INDEX IF NOT EXISTS manual_activities_date_idx ON manual_activities(activity_date);
CREATE INDEX IF NOT EXISTS manual_activities_type_idx ON manual_activities(activity_type);
CREATE INDEX IF NOT EXISTS manual_activities_created_at_idx ON manual_activities(created_at);

CREATE INDEX IF NOT EXISTS api_usage_user_id_idx ON api_usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS api_usage_service_idx ON api_usage_tracking(api_service);
CREATE INDEX IF NOT EXISTS api_usage_timestamp_idx ON api_usage_tracking(request_timestamp);

-- Function to check API usage limits (CREATE OR REPLACE is safe)
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