-- ============================================================
-- PolicyBot — Add Preferred Language Column
-- Run this in Supabase SQL Editor (Database → SQL Editor)
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'English';
