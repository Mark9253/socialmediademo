-- Initialize database with a simple health check table
-- This helps ensure Supabase types are properly generated

CREATE TABLE IF NOT EXISTS public._health_check (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public._health_check IS 'Internal table to ensure Supabase types are generated';
