/*
  # Fix video generation RLS policies

  1. Security Updates
    - Update RLS policies for video_generations table to properly handle manual activities
    - Allow users to create video generations for their own activities and achievements
    - Ensure proper ownership validation for both manual and imported activities

  2. Changes
    - Drop existing restrictive policies
    - Create new policies that properly validate ownership
    - Add support for video generation from manual activities without requiring achievements
*/

-- Drop existing policies for video_generations
DROP POLICY IF EXISTS "Users can insert own video generations" ON video_generations;
DROP POLICY IF EXISTS "Users can read own video generations" ON video_generations;
DROP POLICY IF EXISTS "Users can update own video generations" ON video_generations;

-- Create new policies for video_generations that properly handle ownership

-- Policy for INSERT operations
CREATE POLICY "Users can insert video generations for own content"
  ON video_generations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if run_id belongs to the user
    (run_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM runs WHERE id = run_id AND user_id = auth.uid()
    ))
    OR
    -- Allow if achievement_id belongs to the user
    (achievement_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM achievements WHERE id = achievement_id AND user_id = auth.uid()
    ))
    OR
    -- Allow if both are null (for manual video generation)
    (run_id IS NULL AND achievement_id IS NULL)
  );

-- Policy for SELECT operations
CREATE POLICY "Users can read own video generations"
  ON video_generations
  FOR SELECT
  TO authenticated
  USING (
    -- Allow if run_id belongs to the user
    (run_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM runs WHERE id = run_id AND user_id = auth.uid()
    ))
    OR
    -- Allow if achievement_id belongs to the user
    (achievement_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM achievements WHERE id = achievement_id AND user_id = auth.uid()
    ))
    OR
    -- Allow if both are null (for manual video generation)
    (run_id IS NULL AND achievement_id IS NULL)
  );

-- Policy for UPDATE operations
CREATE POLICY "Users can update own video generations"
  ON video_generations
  FOR UPDATE
  TO authenticated
  USING (
    -- Allow if run_id belongs to the user
    (run_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM runs WHERE id = run_id AND user_id = auth.uid()
    ))
    OR
    -- Allow if achievement_id belongs to the user
    (achievement_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM achievements WHERE id = achievement_id AND user_id = auth.uid()
    ))
    OR
    -- Allow if both are null (for manual video generation)
    (run_id IS NULL AND achievement_id IS NULL)
  )
  WITH CHECK (
    -- Same conditions for the updated row
    (run_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM runs WHERE id = run_id AND user_id = auth.uid()
    ))
    OR
    (achievement_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM achievements WHERE id = achievement_id AND user_id = auth.uid()
    ))
    OR
    (run_id IS NULL AND achievement_id IS NULL)
  );

-- Policy for DELETE operations (optional, for cleanup)
CREATE POLICY "Users can delete own video generations"
  ON video_generations
  FOR DELETE
  TO authenticated
  USING (
    -- Allow if run_id belongs to the user
    (run_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM runs WHERE id = run_id AND user_id = auth.uid()
    ))
    OR
    -- Allow if achievement_id belongs to the user
    (achievement_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM achievements WHERE id = achievement_id AND user_id = auth.uid()
    ))
    OR
    -- Allow if both are null (for manual video generation)
    (run_id IS NULL AND achievement_id IS NULL)
  );