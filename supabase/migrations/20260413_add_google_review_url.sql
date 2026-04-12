-- Run this in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste & Run

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS google_review_url TEXT DEFAULT NULL;
