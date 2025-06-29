-- =====================================================
-- RunReel Database Schema Migration - Fixed Version
-- Resolves column ambiguity and ensures safe application
-- =====================================================

-- Start transaction for atomic operations
BEGIN;

-- =====================================================
-- 1. SAFELY DROP EXISTING POLICIES TO AVOID CONFLICTS
-- =====================================================

-- Drop all existing policies on manual_activities
DROP POLICY IF EXISTS "Users can manage own activities" ON manual_activities;
DROP POLICY IF EXISTS "Users can view own activities" ON manual_activities;
DROP POLICY IF EXISTS "Users can insert own activities" ON manual_activities;
DROP POLICY IF EXISTS "Users can update own activities" ON manual_activities;
DROP POLICY IF EXISTS "Users can delete own activities" ON manual_activities;
DROP POLICY IF EXISTS "Users can manage their own activities" ON manual_activities;
DROP POLICY IF EXISTS "manual_activities_user_access" ON manual_activities;

-- Drop all existing policies on api_usage_tracking
DROP POLICY IF EXISTS "Users can insert their own API usage" ON api_usage_tracking;
DROP POLICY IF EXISTS "Users can view their own API usage" ON api_usage_tracking;
DROP POLICY IF EXISTS "Users can read own API usage" ON api_usage_tracking;
DROP POLICY IF EXISTS "Users can insert own API usage" ON api_usage_tracking;
DROP POLICY IF EXISTS "api_usage_insert_policy" ON api_usage_tracking;
DROP POLICY IF EXISTS "api_usage_select_policy" ON api_usage_tracking;

-- =====================================================
-- 2. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on manual_activities table
ALTER TABLE manual_activities ENABLE ROW LEVEL SECURITY;

-- Enable RLS on api_usage_tracking table  
ALTER TABLE api_usage_tracking ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. CREATE COMPREHENSIVE RLS POLICIES
-- =====================================================

-- Manual Activities Policies - Comprehensive access control
CREATE POLICY "manual_activities_user_access"
  ON manual_activities
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- API Usage Tracking Policies - Separate policies for different operations
CREATE POLICY "api_usage_insert_policy"
  ON api_usage_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "api_usage_select_policy"
  ON api_usage_tracking
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- 4. SAFELY ADD DATA VALIDATION CONSTRAINTS
-- =====================================================

-- Add constraints using DO blocks to avoid ambiguity
DO $$
BEGIN
  -- Manual Activities: Activity Type Constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.constraint_name = 'manual_activities_activity_type_check'
    AND tc.table_name = 'manual_activities'
    AND tc.table_schema = 'public'
  ) THEN
    ALTER TABLE manual_activities 
    ADD CONSTRAINT manual_activities_activity_type_check 
    CHECK (activity_type = ANY (ARRAY['Running'::text, 'Walking'::text, 'Cycling'::text, 'Swimming'::text, 'Strength Training'::text, 'Yoga'::text, 'Other'::text]));
  END IF;

  -- Manual Activities: Calories Constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.constraint_name = 'manual_activities_calories_check'
    AND tc.table_name = 'manual_activities'
    AND tc.table_schema = 'public'
  ) THEN
    ALTER TABLE manual_activities 
    ADD CONSTRAINT manual_activities_calories_check 
    CHECK ((calories_burned IS NULL) OR ((calories_burned >= 50) AND (calories_burned <= 2000)));
  END IF;

  -- Manual Activities: Heart Rate Constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.constraint_name = 'manual_activities_heart_rate_check'
    AND tc.table_name = 'manual_activities'
    AND tc.table_schema = 'public'
  ) THEN
    ALTER TABLE manual_activities 
    ADD CONSTRAINT manual_activities_heart_rate_check 
    CHECK ((average_heart_rate IS NULL) OR ((average_heart_rate >= 60) AND (average_heart_rate <= 200)));
  END IF;

  -- Manual Activities: Intensity Level Constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.constraint_name = 'manual_activities_intensity_level_check'
    AND tc.table_name = 'manual_activities'
    AND tc.table_schema = 'public'
  ) THEN
    ALTER TABLE manual_activities 
    ADD CONSTRAINT manual_activities_intensity_level_check 
    CHECK ((intensity_level >= 1) AND (intensity_level <= 5));
  END IF;

  -- Manual Activities: Weather Constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.constraint_name = 'manual_activities_weather_check'
    AND tc.table_name = 'manual_activities'
    AND tc.table_schema = 'public'
  ) THEN
    ALTER TABLE manual_activities 
    ADD CONSTRAINT manual_activities_weather_check 
    CHECK ((weather_conditions IS NULL) OR (weather_conditions = ANY (ARRAY['Sunny'::text, 'Cloudy'::text, 'Rainy'::text, 'Windy'::text, 'Snow'::text])));
  END IF;

  -- API Usage: Service Constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.constraint_name = 'api_usage_service_check'
    AND tc.table_name = 'api_usage_tracking'
    AND tc.table_schema = 'public'
  ) THEN
    ALTER TABLE api_usage_tracking 
    ADD CONSTRAINT api_usage_service_check 
    CHECK (api_service = 'tavus'::text);
  END IF;

  -- API Usage: Request Type Constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.constraint_name = 'api_usage_request_type_check'
    AND tc.table_name = 'api_usage_tracking'
    AND tc.table_schema = 'public'
  ) THEN
    ALTER TABLE api_usage_tracking 
    ADD CONSTRAINT api_usage_request_type_check 
    CHECK (request_type = 'video_generation'::text);
  END IF;

  -- API Usage: Status Constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.constraint_name = 'api_usage_status_check'
    AND tc.table_name = 'api_usage_tracking'
    AND tc.table_schema = 'public'
  ) THEN
    ALTER TABLE api_usage_tracking 
    ADD CONSTRAINT api_usage_status_check 
    CHECK (response_status = ANY (ARRAY['success'::text, 'error'::text, 'pending'::text]));
  END IF;
END $$;

-- =====================================================
-- 5. CREATE PERFORMANCE INDEXES
-- =====================================================

-- Manual Activities Indexes
CREATE INDEX IF NOT EXISTS manual_activities_user_id_idx ON manual_activities(user_id);
CREATE INDEX IF NOT EXISTS manual_activities_created_at_idx ON manual_activities(created_at);
CREATE INDEX IF NOT EXISTS manual_activities_date_idx ON manual_activities(activity_date);
CREATE INDEX IF NOT EXISTS manual_activities_type_idx ON manual_activities(activity_type);
CREATE INDEX IF NOT EXISTS manual_activities_user_date_idx ON manual_activities(user_id, activity_date DESC);

-- API Usage Tracking Indexes
CREATE INDEX IF NOT EXISTS api_usage_user_id_idx ON api_usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS api_usage_timestamp_idx ON api_usage_tracking(request_timestamp);
CREATE INDEX IF NOT EXISTS api_usage_service_idx ON api_usage_tracking(api_service);
CREATE INDEX IF NOT EXISTS api_usage_user_service_idx ON api_usage_tracking(user_id, api_service);

-- =====================================================
-- 6. CREATE UTILITY FUNCTIONS
-- =====================================================

-- API usage limit checking function
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

-- Helper function to get table columns (for debugging)
CREATE OR REPLACE FUNCTION get_table_columns(p_table_name TEXT)
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
  WHERE c.table_name = p_table_name
    AND c.table_schema = 'public'
  ORDER BY c.ordinal_position;
END;
$$;

-- Helper function to get foreign key constraints (for debugging)
CREATE OR REPLACE FUNCTION get_foreign_key_constraints(p_table_name TEXT)
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
    AND tc.table_name = p_table_name
    AND tc.table_schema = 'public';
END;
$$;

-- Function to check if column exists
CREATE OR REPLACE FUNCTION check_column_exists(p_table_name TEXT, p_column_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = p_table_name
      AND c.column_name = p_column_name
  ) INTO column_exists;
  
  RETURN column_exists;
END;
$$;

-- =====================================================
-- 7. CREATE UPDATED_AT TRIGGERS
-- =====================================================

-- Function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Safely create trigger for manual_activities
DROP TRIGGER IF EXISTS update_manual_activities_updated_at ON manual_activities;
CREATE TRIGGER update_manual_activities_updated_at
  BEFORE UPDATE ON manual_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =====================================================
-- 9. VERIFICATION AND SUCCESS NOTICES
-- =====================================================

-- Verify RLS is enabled
DO $$
DECLARE
  rls_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO rls_count
  FROM pg_tables 
  WHERE tablename IN ('manual_activities', 'api_usage_tracking')
  AND rowsecurity = true;
  
  RAISE NOTICE '✅ RLS enabled on % tables', rls_count;
END $$;

-- Verify policies exist
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename IN ('manual_activities', 'api_usage_tracking');
  
  RAISE NOTICE '✅ Created % RLS policies', policy_count;
END $$;

-- Verify constraints exist
DO $$
DECLARE
  constraint_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO constraint_count
  FROM pg_constraint 
  WHERE conrelid IN (
    'manual_activities'::regclass, 
    'api_usage_tracking'::regclass
  )
  AND contype = 'c'; -- Check constraints only
  
  RAISE NOTICE '✅ Added % check constraints', constraint_count;
END $$;

-- Verify indexes exist
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes 
  WHERE tablename IN ('manual_activities', 'api_usage_tracking')
  AND indexname LIKE '%_idx';
  
  RAISE NOTICE '✅ Created % performance indexes', index_count;
END $$;

-- Final success message
DO $$
BEGIN
  RAISE NOTICE '🎉 RunReel database migration completed successfully!';
  RAISE NOTICE '📊 Database is now production-ready with:';
  RAISE NOTICE '   - Row Level Security (RLS) enabled';
  RAISE NOTICE '   - Data validation constraints';
  RAISE NOTICE '   - Performance indexes';
  RAISE NOTICE '   - Utility functions';
  RAISE NOTICE '   - Updated triggers';
END $$;

-- Commit all changes
COMMIT;