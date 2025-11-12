-- Enable RLS on the health check table
ALTER TABLE public._health_check ENABLE ROW LEVEL SECURITY;

-- This is an internal system table, no policies needed as it shouldn't be accessed by users
