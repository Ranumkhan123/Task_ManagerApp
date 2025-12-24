/*
  # Create Tasks Table for Collaborative Task Manager

  ## Overview
  This migration sets up a collaborative task management system where authenticated users 
  can create, view, update, and delete tasks. All users can see each other's tasks in real-time.

  ## New Tables
  
  ### `tasks`
  - `id` (uuid, primary key) - Unique identifier for each task
  - `user_id` (uuid, foreign key) - References the user who created the task
  - `title` (text, required) - Task title/name
  - `description` (text, optional) - Detailed description of the task
  - `category` (text, required) - Task category (e.g., Work, Personal, Shopping, etc.)
  - `priority` (text, required) - Priority level: 'low', 'medium', or 'high'
  - `due_date` (date, optional) - When the task is due
  - `completed` (boolean, default false) - Whether the task is completed
  - `created_at` (timestamptz, default now()) - When the task was created
  - `updated_at` (timestamptz, default now()) - When the task was last updated

  ## Security
  
  - Enable Row Level Security (RLS) on `tasks` table
  - All authenticated users can view all tasks (collaborative feature)
  - Users can only insert tasks with their own user_id
  - Users can only update their own tasks
  - Users can only delete their own tasks

  ## Indexes
  
  - Index on `user_id` for faster user-specific queries
  - Index on `category` for filtering performance
  - Index on `priority` for filtering performance
  - Index on `due_date` for sorting and filtering performance
  - Index on `created_at` for sorting performance
*/

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL,
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  due_date date,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view all tasks (collaborative feature)
CREATE POLICY "All authenticated users can view all tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can only insert tasks with their own user_id
CREATE POLICY "Users can insert their own tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own tasks
CREATE POLICY "Users can update their own tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own tasks
CREATE POLICY "Users can delete their own tasks"
  ON tasks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before updates
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();