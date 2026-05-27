-- ============================================================================
-- PolicyBot Auth Roles Migration
-- Run this in the Supabase SQL Editor to add Roles to the users table.
-- ============================================================================

-- 1. Add role column to the users table (default to 'employee')
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'employee';

-- 2. Update existing users to 'admin' so they don't lose access
UPDATE users SET role = 'admin' WHERE role = 'employee';
