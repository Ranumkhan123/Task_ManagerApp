/*
  # Fix RLS Performance and Security Issues

  ## Changes
  
  ### 1. RLS Policy Optimization
  Replaced direct `auth.uid()` calls with `(select auth.uid())` to prevent 
  re-evaluation for each row. This improves query performance at scale.
  
  ### 2. Unused Indexes Removal
  Removed indexes that were not being utilized by the query planner:
  - idx_tasks_user_id
  - idx_tasks_category
  - idx_tasks_priority
  - idx_tasks_due_date
  - idx_tasks_created_at
  
  These indexes increased storage overhead without providing query optimization benefits.
  The main query patterns (viewing all tasks, filtering by ownership) are efficiently 
  served through sequential scans and the RLS policies without these indexes.
  
  ### 3. Function Security Hardening
  Added search_path immutability to the trigger function to prevent search path 
  mutations that could be used in privilege escalation attacks.
*/

-- Drop unused indexes to reduce storage overhead
DROP INDEX IF EXISTS idx_tasks_user_id;
DROP INDEX IF EXISTS idx_tasks_category;
DROP INDEX IF EXISTS idx_tasks_priority;
DROP INDEX IF EXISTS idx_tasks_due_date;
DROP INDEX IF EXISTS idx_tasks_created_at;

-- Drop and recreate policies with optimized auth.uid() calls
DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;

-- Recreate policies with (select auth.uid()) for performance
CREATE POLICY "Users can insert their own tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own tasks"
  ON tasks
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Harden the trigger function with immutable search_path
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP FUNCTION IF EXISTS update_updated_at_column();

CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();