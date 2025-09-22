-- ============================================================================
-- RYDE AUTHENTICATION SYSTEM - MODULE 1 SCHEMA
-- Production-Ready Authentication with Document Verification
-- Execute this in your Supabase SQL Editor
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS AND CUSTOM TYPES
-- ============================================================================

-- User types in the system
CREATE TYPE user_type AS ENUM ('passenger', 'driver', 'admin');

-- Account status for users
CREATE TYPE account_status AS ENUM ('active', 'pending_verification', 'suspended', 'banned');

-- Driver verification status
CREATE TYPE verification_status AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'resubmission_required');

-- Document types for driver verification
CREATE TYPE document_type AS ENUM (
  'drivers_license', 
  'vehicle_registration', 
  'insurance_certificate', 
  'background_check',
  'profile_photo',
  'vehicle_photo'
);

-- ============================================================================
-- MAIN TABLES
-- ============================================================================

-- User profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  user_type user_type NOT NULL DEFAULT 'passenger',
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE,
  avatar_url TEXT,
  account_status account_status DEFAULT 'active',
  
  -- Email verification
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Profile completion
  profile_completed BOOLEAN DEFAULT FALSE,
  
  -- Emergency contact (optional)
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT valid_phone_format CHECK (phone ~ '^[+]?[1-9]\d{1,14}$'),
  CONSTRAINT valid_full_name CHECK (length(trim(full_name)) >= 2)
);

-- Driver profiles table (additional driver-specific information)
CREATE TABLE driver_profiles (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  
  -- License information
  license_number TEXT NOT NULL,
  license_expiry_date DATE NOT NULL,
  license_state TEXT NOT NULL,
  
  -- Vehicle information
  vehicle_make TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_year INTEGER NOT NULL CHECK (vehicle_year >= 2010 AND vehicle_year <= EXTRACT(YEAR FROM NOW()) + 1),
  vehicle_color TEXT NOT NULL,
  vehicle_plate_number TEXT NOT NULL,
  
  -- Driver status
  verification_status verification_status DEFAULT 'pending',
  is_online BOOLEAN DEFAULT FALSE,
  can_receive_rides BOOLEAN DEFAULT FALSE,
  
  -- Performance metrics (initialized to 0)
  total_rides INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0.00 CHECK (avg_rating >= 0 AND avg_rating <= 5),
  
  -- Verification dates
  documents_submitted_at TIMESTAMP WITH TIME ZONE,
  verification_completed_at TIMESTAMP WITH TIME ZONE,
  last_document_update TIMESTAMP WITH TIME ZONE,
  
  -- Admin notes
  admin_notes TEXT,
  rejection_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_license_expiry CHECK (license_expiry_date > CURRENT_DATE),
  CONSTRAINT unique_license UNIQUE (license_number, license_state),
  CONSTRAINT unique_vehicle_plate UNIQUE (vehicle_plate_number)
);

-- Driver documents table for verification
CREATE TABLE driver_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  driver_id UUID REFERENCES driver_profiles(user_id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  
  -- Verification details
  status verification_status DEFAULT 'pending',
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES profiles(id),
  
  -- Admin feedback
  admin_notes TEXT,
  rejection_reason TEXT,
  
  -- File metadata
  is_current BOOLEAN DEFAULT TRUE,
  expires_at DATE, -- For time-sensitive documents
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one current document per type per driver
  UNIQUE(driver_id, document_type, is_current) DEFERRABLE INITIALLY DEFERRED
);

-- Password reset tokens (for custom implementation if needed)
CREATE TABLE password_reset_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Cleanup constraint
  CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Audit log for critical auth events
CREATE TABLE auth_audit_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Index for efficient querying
  INDEX (user_id, created_at),
  INDEX (event_type, created_at)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Profiles indexes
CREATE INDEX idx_profiles_user_type ON profiles(user_type);
CREATE INDEX idx_profiles_phone ON profiles(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_profiles_account_status ON profiles(account_status);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);

-- Driver profiles indexes
CREATE INDEX idx_driver_profiles_verification_status ON driver_profiles(verification_status);
CREATE INDEX idx_driver_profiles_is_online ON driver_profiles(is_online);
CREATE INDEX idx_driver_profiles_can_receive_rides ON driver_profiles(can_receive_rides);

-- Driver documents indexes
CREATE INDEX idx_driver_documents_driver_status ON driver_documents(driver_id, status);
CREATE INDEX idx_driver_documents_type_current ON driver_documents(document_type, is_current) WHERE is_current = TRUE;

-- Password reset indexes
CREATE INDEX idx_password_reset_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_token ON password_reset_tokens(token);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_audit_log ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile except sensitive fields" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Prevent users from changing their user_type or account_status
    (SELECT user_type FROM profiles WHERE id = auth.uid()) = NEW.user_type AND
    (SELECT account_status FROM profiles WHERE id = auth.uid()) = NEW.account_status
  );

CREATE POLICY "Enable insert for authenticated users" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin can view all profiles
CREATE POLICY "Admin can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

-- Admin can update all profiles
CREATE POLICY "Admin can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

-- Driver Profiles RLS Policies
CREATE POLICY "Drivers can view own driver profile" ON driver_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Drivers can update own driver profile" ON driver_profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    -- Prevent drivers from changing verification status
    (SELECT verification_status FROM driver_profiles WHERE user_id = auth.uid()) = NEW.verification_status
  );

CREATE POLICY "Enable insert for drivers" ON driver_profiles
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'driver')
  );

-- Admin can manage all driver profiles
CREATE POLICY "Admin can manage all driver profiles" ON driver_profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

-- Driver Documents RLS Policies
CREATE POLICY "Drivers can view own documents" ON driver_documents
  FOR SELECT USING (
    driver_id = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'driver')
  );

CREATE POLICY "Drivers can insert own documents" ON driver_documents
  FOR INSERT WITH CHECK (
    driver_id = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'driver')
  );

-- Admin can manage all documents
CREATE POLICY "Admin can manage all driver documents" ON driver_documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

-- Password Reset Tokens RLS
CREATE POLICY "Users can manage own password reset tokens" ON password_reset_tokens
  FOR ALL USING (auth.uid() = user_id);

-- Auth Audit Log RLS
CREATE POLICY "Users can view own audit log" ON auth_audit_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all audit logs" ON auth_audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" ON auth_audit_log
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_profiles_updated_at BEFORE UPDATE ON driver_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_documents_updated_at BEFORE UPDATE ON driver_documents 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile after user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'passenger')::user_type
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to log authentication events
CREATE OR REPLACE FUNCTION log_auth_event(
  event_type TEXT,
  event_data JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO auth_audit_log (user_id, event_type, event_data, created_at)
  VALUES (auth.uid(), event_type, event_data, NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update driver verification status
CREATE OR REPLACE FUNCTION update_driver_verification_status(
  driver_user_id UUID,
  new_status verification_status,
  admin_notes TEXT DEFAULT NULL,
  rejection_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Check if current user is admin
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND user_type = 'admin'
  ) INTO is_admin;
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only admins can update verification status';
  END IF;
  
  -- Update driver profile
  UPDATE driver_profiles 
  SET 
    verification_status = new_status,
    admin_notes = COALESCE(update_driver_verification_status.admin_notes, driver_profiles.admin_notes),
    rejection_reason = COALESCE(update_driver_verification_status.rejection_reason, driver_profiles.rejection_reason),
    verification_completed_at = CASE 
      WHEN new_status IN ('approved', 'rejected') THEN NOW()
      ELSE verification_completed_at
    END,
    can_receive_rides = CASE 
      WHEN new_status = 'approved' THEN TRUE
      ELSE FALSE
    END,
    updated_at = NOW()
  WHERE user_id = driver_user_id;
  
  -- Update account status in profiles
  UPDATE profiles 
  SET 
    account_status = CASE 
      WHEN new_status = 'approved' THEN 'active'::account_status
      WHEN new_status = 'rejected' THEN 'suspended'::account_status
      ELSE 'pending_verification'::account_status
    END,
    updated_at = NOW()
  WHERE id = driver_user_id;
  
  -- Log the event
  PERFORM log_auth_event(
    'driver_verification_status_updated',
    jsonb_build_object(
      'driver_id', driver_user_id,
      'new_status', new_status,
      'updated_by', auth.uid()
    )
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired password reset tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM password_reset_tokens 
  WHERE expires_at < NOW() OR used_at IS NOT NULL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Create a default admin user function (to be called after first admin signup)
CREATE OR REPLACE FUNCTION promote_user_to_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Find user by email
  SELECT id INTO user_record FROM auth.users WHERE email = user_email;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found with email: %', user_email;
  END IF;
  
  -- Update user profile to admin
  UPDATE profiles 
  SET 
    user_type = 'admin',
    account_status = 'active',
    updated_at = NOW()
  WHERE id = user_record.id;
  
  -- Log the promotion
  INSERT INTO auth_audit_log (user_id, event_type, event_data, created_at)
  VALUES (
    user_record.id,
    'user_promoted_to_admin',
    jsonb_build_object('promoted_by', 'system', 'email', user_email),
    NOW()
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VIEWS FOR CONVENIENT QUERIES
-- ============================================================================

-- View for driver verification dashboard
CREATE VIEW driver_verification_dashboard AS
SELECT 
  p.id,
  p.full_name,
  p.phone,
  p.created_at as registered_at,
  dp.verification_status,
  dp.documents_submitted_at,
  dp.verification_completed_at,
  dp.license_number,
  dp.vehicle_make,
  dp.vehicle_model,
  dp.vehicle_year,
  dp.vehicle_plate_number,
  -- Count documents by status
  (SELECT COUNT(*) FROM driver_documents dd WHERE dd.driver_id = dp.user_id) as total_documents,
  (SELECT COUNT(*) FROM driver_documents dd WHERE dd.driver_id = dp.user_id AND dd.status = 'pending') as pending_documents,
  (SELECT COUNT(*) FROM driver_documents dd WHERE dd.driver_id = dp.user_id AND dd.status = 'approved') as approved_documents,
  (SELECT COUNT(*) FROM driver_documents dd WHERE dd.driver_id = dp.user_id AND dd.status = 'rejected') as rejected_documents
FROM profiles p
JOIN driver_profiles dp ON p.id = dp.user_id
WHERE p.user_type = 'driver';

-- ============================================================================
-- SCHEDULED JOBS (Set up in Supabase Dashboard -> Database -> Cron)
-- ============================================================================

-- Note: Add this as a cron job in Supabase to clean up expired tokens daily
-- SELECT cron.schedule('cleanup-expired-tokens', '0 2 * * *', 'SELECT cleanup_expired_tokens();');

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Ryde Authentication Schema v1.0 installed successfully!';
  RAISE NOTICE '📋 Next steps:';
  RAISE NOTICE '1. Set up your environment variables';
  RAISE NOTICE '2. Configure Supabase Auth settings';
  RAISE NOTICE '3. Update your application code';
  RAISE NOTICE '4. Test the authentication flow';
END $$;