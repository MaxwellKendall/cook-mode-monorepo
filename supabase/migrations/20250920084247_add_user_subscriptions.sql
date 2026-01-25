-- Add user subscriptions functionality
-- This migration creates the user_subscriptions table for tracking subscription status and session usage

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User subscriptions table for tracking subscription status and session usage
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    is_subscribed BOOLEAN NOT NULL DEFAULT FALSE,
    subscription_id VARCHAR(255), -- Stripe subscription ID
    customer_id VARCHAR(255), -- Stripe customer ID
    status VARCHAR(50) DEFAULT 'inactive', -- Subscription status (active, inactive, canceled, etc.)
    sessions_used INTEGER NOT NULL DEFAULT 0, -- Number of cooking sessions used
    sessions_limit INTEGER NOT NULL DEFAULT 4, -- Maximum sessions allowed (4 for free, unlimited for paid)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure one subscription record per user
    UNIQUE(user_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
-- Add comments for documentation
COMMENT ON TABLE public.user_subscriptions IS 'User subscription status and session usage tracking';
COMMENT ON COLUMN public.user_subscriptions.is_subscribed IS 'Whether the user has an active paid subscription';
COMMENT ON COLUMN public.user_subscriptions.subscription_id IS 'Stripe subscription ID for billing management';
COMMENT ON COLUMN public.user_subscriptions.customer_id IS 'Stripe customer ID for billing management';
COMMENT ON COLUMN public.user_subscriptions.status IS 'Current subscription status (active, inactive, canceled, etc.)';
COMMENT ON COLUMN public.user_subscriptions.sessions_used IS 'Number of cooking sessions the user has used';
COMMENT ON COLUMN public.user_subscriptions.sessions_limit IS 'Maximum number of sessions allowed (4 for free users, unlimited for subscribers)';
