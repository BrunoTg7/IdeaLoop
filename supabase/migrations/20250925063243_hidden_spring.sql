/*
  # Create usage tracking functions

  1. Functions
    - `increment_user_usage()` - increments usage count and checks limits
    - `reset_user_usage()` - resets usage count based on plan
    - `check_usage_limit()` - checks if user can generate content

  2. Triggers
    - Auto-increment usage when content is generated
*/

-- Function to check if user can generate content
CREATE OR REPLACE FUNCTION check_usage_limit(user_uuid uuid)
RETURNS boolean AS $$
DECLARE
  user_record users%ROWTYPE;
  current_limit integer;
BEGIN
  -- Get user data
  SELECT * INTO user_record FROM users WHERE id = user_uuid;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if usage needs reset
  IF user_record.plan = 'free' AND user_record.usage_reset_date < now() - interval '7 days' THEN
    -- Reset weekly usage for free plan
    UPDATE users 
    SET usage_count = 0, usage_reset_date = now() 
    WHERE id = user_uuid;
    user_record.usage_count := 0;
  ELSIF user_record.plan IN ('pro', 'unlimited') AND user_record.usage_reset_date < now() - interval '30 days' THEN
    -- Reset monthly usage for paid plans
    UPDATE users 
    SET usage_count = 0, usage_reset_date = now() 
    WHERE id = user_uuid;
    user_record.usage_count := 0;
  END IF;
  
  -- Set limits based on plan
  CASE user_record.plan
    WHEN 'free' THEN current_limit := 2;
    WHEN 'pro' THEN current_limit := 50;
    WHEN 'unlimited' THEN RETURN true; -- No limit
  END CASE;
  
  -- Check if under limit
  RETURN user_record.usage_count < current_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_user_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment for new generations, not refinements
  IF NEW.generation_type = 'NOVO' THEN
    UPDATE users 
    SET usage_count = usage_count + 1 
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-increment usage
CREATE TRIGGER increment_usage_on_generation
  AFTER INSERT ON content_generations
  FOR EACH ROW
  EXECUTE FUNCTION increment_user_usage();

-- Function to get user usage stats
CREATE OR REPLACE FUNCTION get_user_usage_stats(user_uuid uuid)
RETURNS TABLE(
  current_usage integer,
  usage_limit integer,
  days_until_reset integer,
  can_generate boolean
) AS $$
DECLARE
  user_record users%ROWTYPE;
  limit_val integer;
  reset_interval interval;
BEGIN
  -- Get user data
  SELECT * INTO user_record FROM users WHERE id = user_uuid;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Set limits and intervals based on plan
  CASE user_record.plan
    WHEN 'free' THEN 
      limit_val := 2;
      reset_interval := interval '7 days';
    WHEN 'pro' THEN 
      limit_val := 50;
      reset_interval := interval '30 days';
    WHEN 'unlimited' THEN 
      limit_val := -1; -- Unlimited
      reset_interval := interval '30 days';
  END CASE;
  
  RETURN QUERY SELECT
    user_record.usage_count,
    limit_val,
    EXTRACT(days FROM (user_record.usage_reset_date + reset_interval - now()))::integer,
    check_usage_limit(user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;