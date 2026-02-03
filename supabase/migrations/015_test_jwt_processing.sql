-- Test if JWT is being processed by PostgREST
-- Run this in SQL Editor while logged in to see what Postgres sees

-- Test 1: Check if auth.uid() works
SELECT 
  'auth.uid()' as test_name,
  auth.uid() as result;

-- Test 2: Check if request.jwt.claims is accessible
SELECT 
  'request.jwt.claims' as test_name,
  current_setting('request.jwt.claims', true)::jsonb as result;

-- Test 3: Check if we can extract sub from JWT
SELECT 
  'JWT sub claim' as test_name,
  (current_setting('request.jwt.claims', true)::jsonb->>'sub')::uuid as result;

-- Test 4: Check current role
SELECT 
  'Current role' as test_name,
  current_setting('request.jwt.claims', true)::jsonb->>'role' as result;

-- If all of these return NULL, the JWT isn't being processed by PostgREST
-- This could be a PostgREST configuration issue
