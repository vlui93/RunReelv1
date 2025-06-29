/*
  # Database Schema Updates

  1. Security
    - Enable RLS on manual_activities and api_usage_tracking tables
    - Add policies for user data access control

  2. Constraints
    - Add check constraints for data validation
    - Ensure data integrity

  3. Performance
    - Add indexes for frequently queried columns
    - Optimize query performance

  4. Functions
    - Add API usage limit checking function
*/

-- Enable Row Level Security
ALTER TABLE manual_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_tracking ENABLE ROW LEVEL SECURITY;

-- Policies for manual_activities
CREATE POLICY "Users can manage own activities"
  ON manual_activities
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policies for api_usage_tracking
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

-- Add constraints
ALTER TABLE manual_activities ADD CONSTRAINT manual_activities_activity_type_check 
  CHECK (activity_type IN ('Running', 'Walking', 'Cycling', 'Swimming', 'Strength Training', 'Yoga', 'Other'));

ALTER TABLE manual_activities ADD CONSTRAINT manual_activities_intensity_level_check 
  CHECK (intensity_level >= 1 AND intensity_level <= 5);

ALTER TABLE manual_activities ADD CONSTRAINT manual_activities_heart_rate_check 
  CHECK (average_heart_rate IS NULL OR (average_heart_rate >= 60 AND average_heart_rate <= 200));

ALTER TABLE manual_activities ADD CONSTRAINT manual_activities_calories_check 
  CHECK (calories_burned IS NULL OR (calories_burned >= 50 AND calories_burned <= 2000));

ALTER TABLE manual_activities ADD CONSTRAINT manual_activities_weather_check 
  CHECK (weather_conditions IS NULL OR weather_conditions IN ('Sunny', 'Cloudy', 'Rainy', 'Windy', 'Snow'));

ALTER TABLE api_usage_tracking ADD CONSTRAINT api_usage_service_check 
  CHECK (api_service = 'tavus');

ALTER TABLE api_usage_tracking ADD CONSTRAINT api_usage_request_type_check 
  CHECK (request_type = 'video_generation');

ALTER TABLE api_usage_tracking ADD CONSTRAINT api_usage_status_check 
  CHECK (response_status IN ('success', 'error', 'pending'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS manual_activities_user_id_idx ON manual_activities(user_id);
CREATE INDEX IF NOT EXISTS manual_activities_date_idx ON manual_activities(activity_date);
CREATE INDEX IF NOT EXISTS manual_activities_type_idx ON manual_activities(activity_type);
CREATE INDEX IF NOT EXISTS manual_activities_created_at_idx ON manual_activities(created_at);

CREATE INDEX IF NOT EXISTS api_usage_user_id_idx ON api_usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS api_usage_service_idx ON api_usage_tracking(api_service);
CREATE INDEX IF NOT EXISTS api_usage_timestamp_idx ON api_usage_tracking(request_timestamp);

-- Function to check API usage limits
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