/*
  # Create content generations table

  1. New Tables
    - `content_generations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `platform` (text) - target platform (YouTube, TikTok, Instagram Reels)
      - `theme` (text) - main theme/topic
      - `keywords` (text) - focus keywords
      - `tone` (text) - voice tone
      - `duration` (text) - estimated video duration
      - `content` (jsonb) - generated content structure
      - `generation_type` (text) - type of generation (NOVO, REFINAR_TITULO, etc.)
      - `refinement_instruction` (text) - instruction for refinement
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `content_generations` table
    - Add policies for users to manage their own content
*/

-- Create content generations table
CREATE TABLE IF NOT EXISTS content_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform text NOT NULL,
  theme text NOT NULL,
  keywords text,
  tone text,
  duration text,
  content jsonb NOT NULL,
  generation_type text DEFAULT 'NOVO' NOT NULL,
  refinement_instruction text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE content_generations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own content generations"
  ON content_generations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own content generations"
  ON content_generations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own content generations"
  ON content_generations
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own content generations"
  ON content_generations
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS content_generations_user_id_idx ON content_generations(user_id);
CREATE INDEX IF NOT EXISTS content_generations_platform_idx ON content_generations(platform);
CREATE INDEX IF NOT EXISTS content_generations_created_at_idx ON content_generations(created_at DESC);