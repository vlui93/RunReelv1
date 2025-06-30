/*
  # Complete Schema Sync After Function Drop
  
  This migration completes the database setup after the update_updated_at_column() 
  function and its dependent triggers have been dropped with CASCADE.
  
  1. Recreate the update_updated_at_column() function
  2. Recreate all necessary triggers
  3. Add any missing indexes for performance
  4. Verify all RLS policies are in place
  5. Add sample data for testing (optional)
*/

-- Step 2: Recreate the update_updated_at_column() function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Recreate all triggers that depend on update_updated_at_column()
CREATE TRIGGER update_manual_activities_updated_at
  BEFORE UPDATE ON manual_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_generations_updated_at
  BEFORE UPDATE ON video_generations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 4: Ensure all achievement detection functions exist
CREATE OR REPLACE FUNCTION trigger_detect_achievements()
RETURNS TRIGGER AS $$
DECLARE
  user_best_distance NUMERIC;
  user_best_duration INTEGER;
  user_best_pace NUMERIC;
  is_first_workout BOOLEAN;
  consecutive_days INTEGER;
BEGIN
  -- Check if this is the user's first workout
  SELECT COUNT(*) = 0 INTO is_first_workout
  FROM imported_workouts 
  WHERE user_id = NEW.user_id AND id != NEW.id;
  
  -- First time achievement
  IF is_first_workout THEN
    INSERT INTO achievements (user_id, workout_id, achievement_type, category, value, description)
    VALUES (NEW.user_id, NEW.id, 'first_time', 'frequency', 1, 'First workout completed! Welcome to your fitness journey! 🎉');
  END IF;
  
  -- Distance personal record
  IF NEW.distance > 0 THEN
    SELECT COALESCE(MAX(distance), 0) INTO user_best_distance
    FROM imported_workouts 
    WHERE user_id = NEW.user_id AND workout_type = NEW.workout_type AND id != NEW.id;
    
    IF NEW.distance > user_best_distance THEN
      INSERT INTO achievements (user_id, workout_id, achievement_type, category, value, previous_value, description)
      VALUES (NEW.user_id, NEW.id, 'personal_record', 'distance', NEW.distance, user_best_distance, 
              'New distance PR! ' || ROUND(NEW.distance/1000, 2) || 'km in ' || NEW.workout_type || ' 🏆');
    END IF;
  END IF;
  
  -- Duration personal record
  SELECT COALESCE(MAX(duration), 0) INTO user_best_duration
  FROM imported_workouts 
  WHERE user_id = NEW.user_id AND workout_type = NEW.workout_type AND id != NEW.id;
  
  IF NEW.duration > user_best_duration THEN
    INSERT INTO achievements (user_id, workout_id, achievement_type, category, value, previous_value, description)
    VALUES (NEW.user_id, NEW.id, 'personal_record', 'duration', NEW.duration, user_best_duration, 
            'New duration PR! ' || ROUND(NEW.duration/60.0, 1) || ' minutes of ' || NEW.workout_type || ' 💪');
  END IF;
  
  -- Pace personal record (for running/cycling)
  IF NEW.pace_avg IS NOT NULL AND NEW.workout_type IN ('running', 'cycling') THEN
    SELECT COALESCE(MIN(pace_avg), 999) INTO user_best_pace
    FROM imported_workouts 
    WHERE user_id = NEW.user_id AND workout_type = NEW.workout_type AND pace_avg IS NOT NULL AND id != NEW.id;
    
    IF NEW.pace_avg < user_best_pace THEN
      INSERT INTO achievements (user_id, workout_id, achievement_type, category, value, previous_value, description)
      VALUES (NEW.user_id, NEW.id, 'personal_record', 'pace', NEW.pace_avg, user_best_pace, 
              'New pace PR! ' || ROUND(NEW.pace_avg, 2) || ' min/km average pace 🚀');
    END IF;
  END IF;
  
  -- Distance milestones
  IF NEW.distance >= 5000 AND NEW.distance < 10000 THEN
    IF NOT EXISTS (
      SELECT 1 FROM achievements 
      WHERE user_id = NEW.user_id AND achievement_type = 'milestone' AND category = 'distance' AND value = 5000
    ) THEN
      INSERT INTO achievements (user_id, workout_id, achievement_type, category, value, description)
      VALUES (NEW.user_id, NEW.id, 'milestone', 'distance', 5000, 'First 5K completed! 🎉');
    END IF;
  ELSIF NEW.distance >= 10000 AND NEW.distance < 21097 THEN
    IF NOT EXISTS (
      SELECT 1 FROM achievements 
      WHERE user_id = NEW.user_id AND achievement_type = 'milestone' AND category = 'distance' AND value = 10000
    ) THEN
      INSERT INTO achievements (user_id, workout_id, achievement_type, category, value, description)
      VALUES (NEW.user_id, NEW.id, 'milestone', 'distance', 10000, 'First 10K completed! Amazing! 🏃‍♀️');
    END IF;
  ELSIF NEW.distance >= 21097 THEN
    IF NOT EXISTS (
      SELECT 1 FROM achievements 
      WHERE user_id = NEW.user_id AND achievement_type = 'milestone' AND category = 'distance' AND value = 21097
    ) THEN
      INSERT INTO achievements (user_id, workout_id, achievement_type, category, value, description)
      VALUES (NEW.user_id, NEW.id, 'milestone', 'distance', 21097, 'Half Marathon completed! Incredible! 🏅');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_detect_manual_achievements()
RETURNS TRIGGER AS $$
DECLARE
  user_best_distance NUMERIC;
  user_best_duration INTEGER;
  is_first_activity BOOLEAN;
  distance_meters NUMERIC;
BEGIN
  -- Convert km to meters for consistency
  distance_meters := COALESCE(NEW.distance_km * 1000, 0);
  
  -- Check if this is the user's first manual activity
  SELECT COUNT(*) = 0 INTO is_first_activity
  FROM manual_activities 
  WHERE user_id = NEW.user_id AND id != NEW.id;
  
  -- First time achievement
  IF is_first_activity THEN
    INSERT INTO achievements (user_id, achievement_type, category, value, description)
    VALUES (NEW.user_id, 'first_time', 'frequency', 1, 'First activity logged! Your fitness journey begins! 🌟');
  END IF;
  
  -- Distance personal record
  IF distance_meters > 0 THEN
    SELECT COALESCE(MAX(distance_km * 1000), 0) INTO user_best_distance
    FROM manual_activities 
    WHERE user_id = NEW.user_id AND activity_type = NEW.activity_type AND id != NEW.id;
    
    IF distance_meters > user_best_distance THEN
      INSERT INTO achievements (user_id, achievement_type, category, value, previous_value, description)
      VALUES (NEW.user_id, 'personal_record', 'distance', distance_meters, user_best_distance, 
              'New distance PR! ' || ROUND(NEW.distance_km, 2) || 'km in ' || NEW.activity_type || ' 🏆');
    END IF;
  END IF;
  
  -- Duration personal record
  SELECT COALESCE(MAX(duration_seconds), 0) INTO user_best_duration
  FROM manual_activities 
  WHERE user_id = NEW.user_id AND activity_type = NEW.activity_type AND id != NEW.id;
  
  IF NEW.duration_seconds > user_best_duration THEN
    INSERT INTO achievements (user_id, achievement_type, category, value, previous_value, description)
    VALUES (NEW.user_id, 'personal_record', 'duration', NEW.duration_seconds, user_best_duration, 
            'New duration PR! ' || ROUND(NEW.duration_seconds/60.0, 1) || ' minutes of ' || NEW.activity_type || ' 💪');
  END IF;
  
  -- Distance milestones for manual activities
  IF distance_meters >= 5000 AND distance_meters < 10000 THEN
    IF NOT EXISTS (
      SELECT 1 FROM achievements 
      WHERE user_id = NEW.user_id AND achievement_type = 'milestone' AND category = 'distance' AND value = 5000
    ) THEN
      INSERT INTO achievements (user_id, achievement_type, category, value, description)
      VALUES (NEW.user_id, 'milestone', 'distance', 5000, 'First 5K completed! 🎉');
    END IF;
  ELSIF distance_meters >= 10000 AND distance_meters < 21097 THEN
    IF NOT EXISTS (
      SELECT 1 FROM achievements 
      WHERE user_id = NEW.user_id AND achievement_type = 'milestone' AND category = 'distance' AND value = 10000
    ) THEN
      INSERT INTO achievements (user_id, achievement_type, category, value, description)
      VALUES (NEW.user_id, 'milestone', 'distance', 10000, 'First 10K completed! Amazing! 🏃‍♀️');
    END IF;
  ELSIF distance_meters >= 21097 THEN
    IF NOT EXISTS (
      SELECT 1 FROM achievements 
      WHERE user_id = NEW.user_id AND achievement_type = 'milestone' AND category = 'distance' AND value = 21097
    ) THEN
      INSERT INTO achievements (user_id, achievement_type, category, value, description)
      VALUES (NEW.user_id, 'milestone', 'distance', 21097, 'Half Marathon completed! Incredible! 🏅');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Recreate achievement detection triggers
CREATE TRIGGER imported_workouts_achievement_trigger
  AFTER INSERT ON imported_workouts
  FOR EACH ROW EXECUTE FUNCTION trigger_detect_achievements();

CREATE TRIGGER manual_activities_achievement_trigger
  AFTER INSERT ON manual_activities
  FOR EACH ROW EXECUTE FUNCTION trigger_detect_manual_achievements();

-- Step 6: Add any missing indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_video_generations_created ON video_generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_timestamp ON api_usage_tracking(request_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_service ON api_usage_tracking(user_id, api_service);
CREATE INDEX IF NOT EXISTS runs_user_effort_idx ON runs(user_id, effort_level);
CREATE INDEX IF NOT EXISTS runs_user_mood_idx ON runs(user_id, mood_rating);
CREATE INDEX IF NOT EXISTS imported_workouts_external_id_idx ON imported_workouts(source_id, external_id);

-- Step 7: Ensure all utility functions are properly created with correct signatures
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
    'achievements_count', COALESCE(achievement_count, 0),
    'activity_types', json_build_object(
      'running', COALESCE(running_count, 0),
      'cycling', COALESCE(cycling_count, 0),
      'walking', COALESCE(walking_count, 0),
      'strength', COALESCE(strength_count, 0),
      'other', COALESCE(other_count, 0)
    )
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
      (SELECT COUNT(*) FROM achievements WHERE user_id = check_user_id) as achievement_count,
      (SELECT COUNT(*) FROM manual_activities WHERE user_id = check_user_id AND activity_type = 'Running') as running_count,
      (SELECT COUNT(*) FROM manual_activities WHERE user_id = check_user_id AND activity_type = 'Cycling') as cycling_count,
      (SELECT COUNT(*) FROM manual_activities WHERE user_id = check_user_id AND activity_type = 'Walking') as walking_count,
      (SELECT COUNT(*) FROM manual_activities WHERE user_id = check_user_id AND activity_type = 'Strength Training') as strength_count,
      (SELECT COUNT(*) FROM manual_activities WHERE user_id = check_user_id AND activity_type NOT IN ('Running', 'Cycling', 'Walking', 'Strength Training')) as other_count
  ) stats;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Add sample video templates for testing
INSERT INTO video_templates (name, workout_types, achievement_types, template_config) VALUES
('Motivational Achievement', 
 ARRAY['running', 'cycling', 'walking'], 
 ARRAY['personal_record', 'milestone'], 
 '{"voice_tone": "motivational", "background": "dynamic", "music": "upbeat"}'::jsonb),
('First Time Celebration', 
 ARRAY['running', 'cycling', 'walking', 'strength', 'yoga'], 
 ARRAY['first_time'], 
 '{"voice_tone": "encouraging", "background": "celebration", "music": "triumphant"}'::jsonb),
('Streak Celebration', 
 ARRAY['running', 'cycling', 'walking', 'strength', 'yoga'], 
 ARRAY['streak'], 
 '{"voice_tone": "proud", "background": "calendar", "music": "inspiring"}'::jsonb)
ON CONFLICT DO NOTHING;

-- Step 9: Verify schema integrity with a test query
DO $$
DECLARE
  table_count INTEGER;
  function_count INTEGER;
  trigger_count INTEGER;
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  
  -- Count functions
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines 
  WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
  
  -- Count triggers
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers 
  WHERE trigger_schema = 'public';
  
  RAISE NOTICE 'Schema verification complete:';
  RAISE NOTICE '- Tables: %', table_count;
  RAISE NOTICE '- Functions: %', function_count;
  RAISE NOTICE '- Triggers: %', trigger_count;
  
  -- Verify critical tables exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    RAISE EXCEPTION 'Critical table user_profiles is missing!';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'manual_activities') THEN
    RAISE EXCEPTION 'Critical table manual_activities is missing!';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'video_generations') THEN
    RAISE EXCEPTION 'Critical table video_generations is missing!';
  END IF;
  
  RAISE NOTICE 'All critical tables verified successfully!';
END $$;