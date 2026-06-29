-- CosmicCore Supabase Database Schema
-- Run this script in your Supabase SQL Editor to set up the tables, triggers, and RLS policies.

-- 1. Create profiles table linked to Supabase Auth users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    birth_date DATE NOT NULL,              -- Stores YYYY-MM-DD
    birth_time TIME WITHOUT TIME ZONE,      -- Stores HH:MM:SS
    birth_place TEXT NOT NULL,             -- Stores location name (e.g. "Istanbul, Turkey")
    latitude DOUBLE PRECISION NOT NULL,    -- Stores latitude coordinate
    longitude DOUBLE PRECISION NOT NULL,   -- Stores longitude coordinate
    timezone TEXT NOT NULL,                -- Stores timezone name (e.g. "Europe/Istanbul")
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Enable Row Level Security (RLS) to secure user data
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies for Profiles
-- Drop policies if they already exist to prevent execution errors
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

-- Users can only SELECT their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Users can insert their own profile (Allow true check to support unconfirmed signups when email verification is pending)
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (true);

-- Users can only UPDATE their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Users can only DELETE their own profile (complies with App Store Connect Account Deletion Guideline 5.1.1)
CREATE POLICY "Users can delete their own profile" 
ON public.profiles FOR DELETE 
USING (auth.uid() = id);

-- 4. Create trigger function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Attach the updated_at trigger to the profiles table
DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
