/*
  # Fix video generations schema for achievement support

  1. Schema Changes
    - Add `achievement_id` column (uuid, nullable) to support achievement-based video generation
    - Make `run_id` column nullable to support videos not tied to specific runs
    - Add foreign key constraint for achievement_id

  2. Security
    - Update RLS policies to handle both run-based and achievement-based video generations
    - Ensure users can only access their own video generations regardless of type

  3. Indexes
    - Add index on achievement_id for better query performance
*/

-- Add achievement_id column (nullable)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_generations' AND column_name = 'achievement_id'
  ) THEN
    ALTER TABLE video_generations ADD COLUMN achievement_id uuid;
  END IF;
END $$;

-- Make run_id nullable
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_generations' 
    AND column_name = 'run_id' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE video_generations ALTER COLUMN run_id DROP NOT NULL;
  END IF;
END $$;

-- Add foreign key constraint for achievement_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'video_generations_achievement_id_fkey'
  ) THEN
    ALTER TABLE video_generations 
    ADD CONSTRAINT video_generations_achievement_id_fkey 
    FOREIGN KEY (achievement_id) REFERENCES achievements(id);
  END IF;
END $$;

-- Add index on achievement_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'video_generations_achievement_id_idx'
  ) THEN
    CREATE INDEX video_generations_achievement_id_idx ON video_generations(achievement_id);
  END IF;
END $$;

-- Update RLS policies to handle both run-based and achievement-based generations
DROP POLICY IF EXISTS "Users can insert own video generations" ON video_generations;
DROP POLICY IF EXISTS "Users can read own video generations" ON video_generations;
DROP POLICY IF EXISTS "Users can update own video generations" ON video_generations;

-- Policy for inserting video generations (both run-based and achievement-based)
CREATE POLICY "Users can insert own video generations"
  ON video_generations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (run_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM runs 
      WHERE runs.id = video_generations.run_id 
      AND runs.user_id = auth.uid()
    ))
    OR
    (achievement_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM achievements 
      WHERE achievements.id = video_generations.achievement_id 
      AND achievements.user_id = auth.uid()
    ))
  );

-- Policy for reading video generations (both run-based and achievement-based)
CREATE POLICY "Users can read own video generations"
  ON video_generations
  FOR SELECT
  TO authenticated
  USING (
    (run_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM runs 
      WHERE runs.id = video_generations.run_id 
      AND runs.user_id = auth.uid()
    ))
    OR
    (achievement_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM achievements 
      WHERE achievements.id = video_generations.achievement_id 
      AND achievements.user_id = auth.uid()
    ))
  );

-- Policy for updating video generations (both run-based and achievement-based)
CREATE POLICY "Users can update own video generations"
  ON video_generations
  FOR UPDATE
  TO authenticated
  USING (
    (run_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM runs 
      WHERE runs.id = video_generations.run_id 
      AND runs.user_id = auth.uid()
    ))
    OR
    (achievement_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM achievements 
      WHERE achievements.id = video_generations.achievement_id 
      AND achievements.user_id = auth.uid()
    ))
  );