# Database Security Requirements

## Critical Security Policies Required for Supabase

Your authentication system is now secure at the application level, but you **MUST** verify these database-level security policies are in place to prevent role escalation attacks:

### 1. Row Level Security (RLS) on `profiles` table

**CRITICAL**: Users must NOT be able to update their own `user_type` field.

```sql
-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their profile EXCEPT user_type
CREATE POLICY "Users can update own profile except user_type" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Prevent users from updating user_type (only service role can)
CREATE POLICY "Prevent user_type updates" ON profiles
  FOR UPDATE USING (false) 
  WITH CHECK (
    -- Only allow if user_type is not being changed
    (SELECT user_type FROM profiles WHERE id = auth.uid()) = NEW.user_type
  );
```

### 2. Admin Role Assignment Security

**CRITICAL**: Only authorized personnel should be able to create admin accounts.

```sql
-- Constraint to limit valid user types
ALTER TABLE profiles ADD CONSTRAINT valid_user_types 
  CHECK (user_type IN ('passenger', 'driver', 'admin'));

-- Default new users to passenger
ALTER TABLE profiles ALTER COLUMN user_type SET DEFAULT 'passenger';

-- Function to promote users to admin (only callable by service role)
CREATE OR REPLACE FUNCTION promote_to_admin(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only service role can execute this
  IF current_setting('role') != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: Only service role can promote to admin';
  END IF;
  
  UPDATE profiles 
  SET user_type = 'admin', updated_at = NOW()
  WHERE id = user_id;
END;
$$;
```

### 3. Driver Profile Security

```sql
-- Enable RLS on driver_profiles
ALTER TABLE driver_profiles ENABLE ROW LEVEL SECURITY;

-- Allow drivers to read/update their own profile
CREATE POLICY "Drivers can manage own profile" ON driver_profiles
  FOR ALL USING (
    auth.uid() = user_id AND 
    (SELECT user_type FROM profiles WHERE id = auth.uid()) = 'driver'
  );

-- Allow admins to read all driver profiles
CREATE POLICY "Admins can view all driver profiles" ON driver_profiles
  FOR SELECT USING (
    (SELECT user_type FROM profiles WHERE id = auth.uid()) = 'admin'
  );
```

### 4. Additional Security Measures

#### Audit Logging
```sql
-- Create audit log for user_type changes
CREATE TABLE user_type_audit (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  old_user_type TEXT,
  new_user_type TEXT,
  changed_by UUID,
  changed_at TIMESTAMP DEFAULT NOW()
);

-- Trigger to log user_type changes
CREATE OR REPLACE FUNCTION audit_user_type_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.user_type != NEW.user_type THEN
    INSERT INTO user_type_audit (user_id, old_user_type, new_user_type, changed_by)
    VALUES (NEW.id, OLD.user_type, NEW.user_type, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_type_audit_trigger
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION audit_user_type_changes();
```

## Verification Checklist

- [ ] RLS is enabled on `profiles` table
- [ ] Users cannot update their own `user_type`
- [ ] Only service role can promote users to admin
- [ ] `user_type` has proper constraints (passenger|driver|admin)
- [ ] Default user type is 'passenger'
- [ ] Driver profiles are properly protected
- [ ] Audit logging is in place

## Testing Your Security

1. **Create a test user** through the registration flow
2. **Attempt to update user_type** directly via Supabase dashboard (should fail)
3. **Verify admin access** is properly restricted
4. **Check audit logs** show all changes

## Admin User Creation

To create your first admin user safely:

1. Create a regular account through the app
2. Use the Supabase service role to promote them:
   ```sql
   SELECT promote_to_admin('user-uuid-here');
   ```

## ⚠️ CRITICAL WARNING

Without these database policies in place, users can bypass application security and grant themselves admin access. **Verify these policies are implemented before deploying to production.**