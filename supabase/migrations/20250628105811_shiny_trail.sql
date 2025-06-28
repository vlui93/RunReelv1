/*
  # Fix video generations RLS policies

  1. Policy Updates
    - Update INSERT policy for video_generations to properly handle manual activities
    - Ensure users can create video generations for their own activities
    - Fix the complex policy logic that was preventing inserts

  2. Security
    - Maintain proper user isolation
    - Allow users to create video generations for their own content
    - Keep existing read/update policies intact
*/

-- Drop existing policies to recreate them with proper logic
DROP POLICY IF EXISTS "Users can insert own video generations" ON video_generations;
DROP POLICY IF EXISTS "Users can read own video generations" ON video_generations;
DROP POLICY IF EXISTS "Users can update own video generations" ON video_generations;

-- Create new INSERT policy that handles all cases properly
CREATE POLICY "Users can insert own video generations"
  ON video_generations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if run_id is provided and user owns the run
    (run_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM runs 
      WHERE runs.id = video_generations.run_id 
      AND runs.user_id = auth.uid()
    ))
    OR
    -- Allow if achievement_id is provided and user owns the achievement
    (achievement_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM achievements 
      WHERE achievements.id = video_generations.achievement_id 
      AND achievements.user_id = auth.uid()
    ))
    OR
    -- Allow if neither run_id nor achievement_id is provided (for manual activities)
    (run_id IS NULL AND achievement_id IS NULL)
  );

-- Create new SELECT policy
CREATE POLICY "Users can read own video generations"
  ON video_generations
  FOR SELECT
  TO authenticated
  USING (
    -- Allow if run_id is provided and user owns the run
    (run_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM runs 
      WHERE runs.id = video_generations.run_id 
      AND runs.user_id = auth.uid()
    ))
    OR
    -- Allow if achievement_id is provided and user owns the achievement
    (achievement_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM achievements 
      WHERE achievements.id = video_generations.achievement_id 
      AND achievements.user_id = auth.uid()
    ))
    OR
    -- Allow if neither run_id nor achievement_id is provided (for manual activities)
    (run_id IS NULL AND achievement_id IS NULL)
  );

-- Create new UPDATE policy
CREATE POLICY "Users can update own video generations"
  ON video_generations
  FOR UPDATE
  TO authenticated
  USING (
    -- Allow if run_id is provided and user owns the run
    (run_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM runs 
      WHERE runs.id = video_generations.run_id 
      AND runs.user_id = auth.uid()
    ))
    OR
    -- Allow if achievement_id is provided and user owns the achievement
    (achievement_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM achievements 
      WHERE achievements.id = video_generations.achievement_id 
      AND achievements.user_id = auth.uid()
    ))
    OR
    -- Allow if neither run_id nor achievement_id is provided (for manual activities)
    (run_id IS NULL AND achievement_id IS NULL)
  );