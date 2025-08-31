-- Step 1: Add counselor to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'counselor';