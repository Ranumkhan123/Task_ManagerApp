/*
  # Add Status Field to Tasks Table

  ## Summary
  Extend the tasks table with a `status` field to support workflow tracking with three states:
  todo, in-progress, and done. The completed boolean field is retained for backward compatibility.

  ## Changes
  
  ### New Columns
  - `status` (text, default 'todo')
    - Allowed values: 'todo', 'in-progress', 'done'
    - Tracks the current workflow state of a task
    - Uses check constraint to ensure only valid values

  ### Migrations
  - Added `status` column to tasks table
  - Added check constraint: `status IN ('todo', 'in-progress', 'done')`
  - Set default value to 'todo' for all new tasks
  - Existing tasks default to 'todo' status

  ## Notes
  - The `completed` boolean is retained for existing data integrity
  - When `completed = true`, the status represents a done task
  - The migration is non-destructive and doesn't affect existing data
  - RLS policies automatically apply to the new column
*/

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS status text DEFAULT 'todo';

ALTER TABLE tasks
ADD CONSTRAINT check_status_values
CHECK (status IN ('todo', 'in-progress', 'done'))
NOT VALID;

ALTER TABLE tasks VALIDATE CONSTRAINT check_status_values;
