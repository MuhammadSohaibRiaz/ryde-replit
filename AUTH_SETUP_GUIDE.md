# 🔐 **Ryde Authentication System - Setup Guide**

## **Module 1: Authentication System - Production Ready**

This guide will help you set up the complete authentication system with driver verification flow.

---

## 📋 **Prerequisites**

1. **Supabase Account**: Create account at [supabase.com](https://supabase.com)
2. **Node.js**: Version 18+ installed
3. **Git**: For version control

---

## 🚀 **Step 1: Supabase Project Setup**

### **1.1 Create New Supabase Project**
```bash
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Choose your organization
4. Set project name: "ryde-production"
5. Set database password (save this!)
6. Choose region closest to your users
7. Wait for project to be created (~2-3 minutes)
```

### **1.2 Get Project Credentials**
```bash
1. Go to Project Settings → API
2. Copy your Project URL
3. Copy your anon/public key
4. Copy your service_role key (keep this secret!)
```

---

## 🗄️ **Step 2: Database Schema Setup**

### **2.1 Execute Authentication Schema**
```sql
1. In Supabase Dashboard, go to SQL Editor
2. Copy the entire contents from: lib/database/auth-schema.sql
3. Click "RUN" to execute the schema
4. Verify success message appears
```

### **2.2 Verify Schema Installation**
```sql
-- Run this query to verify tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'driver_profiles', 'driver_documents');
```

---

## ⚙️ **Step 3: Environment Configuration**

### **3.1 Create Environment File**
```bash
# Copy the example file
cp .env.example .env.local
```

### **3.2 Update Environment Variables**
```env
# Update .env.local with your actual values
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Maps (get from Google Cloud Console)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=Ryde

# File Upload Limits
NEXT_PUBLIC_MAX_FILE_SIZE=5242880
NEXT_PUBLIC_ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,application/pdf
```

---

## 📧 **Step 4: Supabase Auth Configuration**

### **4.1 Configure Email Templates**
```bash
1. Go to Supabase Dashboard → Authentication → Email Templates
2. Update email templates with your branding:
```

**Confirm Signup Template:**
```html
<h2>Welcome to Ryde!</h2>
<p>Click the link below to confirm your account:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your account</a></p>
<p>This link expires in 24 hours.</p>
```

**Magic Link Template:**
```html
<h2>Sign in to Ryde</h2>
<p>Click the link below to sign in:</p>
<p><a href="{{ .ConfirmationURL }}">Sign in to Ryde</a></p>
<p>This link expires in 1 hour.</p>
```

### **4.2 Configure Auth Settings**
```bash
1. Go to Authentication → Settings
2. Set Site URL: http://localhost:5000 (or your domain)
3. Add Redirect URLs:
   - http://localhost:5000/auth/callback
   - http://localhost:5000/auth/verification-pending
   - http://localhost:5000/main
   - http://localhost:5000/driver-profile
4. Enable email confirmations: ON
5. Double confirm email changes: ON
6. Enable secure email change: ON
```

---

## 🛡️ **Step 5: Security Configuration**

### **5.1 Row Level Security Verification**
```sql
-- Verify RLS is enabled on critical tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'driver_profiles', 'driver_documents');
```

### **5.2 Test Security Policies**
```sql
-- Test that users can only see their own data
SELECT * FROM profiles; -- Should only return current user's profile
SELECT * FROM driver_profiles; -- Should only return if user is driver
```

---

## 🧪 **Step 6: Testing the Authentication Flow**

### **6.1 Install Dependencies**
```bash
npm install
```

### **6.2 Start Development Server**
```bash
npm run dev
```

### **6.3 Test Authentication Flows**

**Test Passenger Registration:**
```bash
1. Go to http://localhost:5000/auth/passenger/register
2. Enter email and get OTP link
3. Click link to verify
4. Should redirect to /main
```

**Test Driver Registration:**
```bash
1. Go to http://localhost:5000/auth/driver/register
2. Complete 2-step registration form
3. Get OTP verification email
4. Click link to verify
5. Should redirect to /auth/verification-pending
6. Check database for driver profile creation
```

**Test Login Flows:**
```bash
1. Test passenger login → should go to /main
2. Test driver login → should go to /auth/verification-pending
3. Test admin login (after creating admin) → should go to /admin
```

---

## 👨‍💼 **Step 7: Create First Admin User**

### **7.1 Register Normal Account**
```bash
1. Register as passenger normally
2. Note the user's email address
```

### **7.2 Promote to Admin**
```sql
-- Execute in Supabase SQL Editor
SELECT promote_user_to_admin('admin@yourdomain.com');
```

### **7.3 Verify Admin Access**
```bash
1. Login as admin user
2. Should redirect to /admin dashboard
3. Test admin routes work
```

---

## 📊 **Step 8: Verify Database Functions**

### **8.1 Test Driver Verification Function**
```sql
-- Test the driver verification function
SELECT update_driver_verification_status(
  'driver-user-id-here'::UUID,
  'approved'::verification_status,
  'Documents look good!'::TEXT,
  NULL::TEXT
);
```

### **8.2 Test Audit Logging**
```sql
-- Check audit logs are working
SELECT * FROM auth_audit_log ORDER BY created_at DESC LIMIT 10;
```

---

## 🔍 **Step 9: Production Readiness Checklist**

### **Security Checklist:**
- [ ] RLS policies are active on all tables
- [ ] Service role key is secure and not exposed
- [ ] Email verification is required
- [ ] Users cannot modify their own user_type
- [ ] Admin promotion requires service role
- [ ] All API endpoints validate user permissions

### **Functionality Checklist:**
- [ ] Passenger registration works end-to-end
- [ ] Driver registration creates driver profile
- [ ] Driver verification flow shows correct status
- [ ] Email OTP authentication works
- [ ] Middleware redirects work correctly
- [ ] Admin user promotion works
- [ ] Audit logging captures events

### **Performance Checklist:**
- [ ] Database indexes are created
- [ ] Connection pooling is configured
- [ ] File upload size limits are set
- [ ] Rate limiting is considered for production

---

## 🚨 **Troubleshooting**

### **Common Issues:**

**"User can't access protected routes"**
```bash
1. Check if profile was created after auth
2. Verify RLS policies allow user access
3. Check middleware logic for role checking
```

**"Driver registration doesn't create driver profile"**
```bash
1. Check if auth callback completed driver profile creation
2. Verify API endpoint is being called
3. Check database logs for errors
```

**"Email verification not working"**
```bash
1. Verify Site URL in Supabase auth settings
2. Check redirect URLs are whitelisted
3. Test email delivery in logs
```

**"Admin routes not accessible"**
```bash
1. Verify user was promoted to admin in database
2. Check middleware admin route protection
3. Verify promote_user_to_admin function worked
```

---

## 📞 **Next Steps**

After completing authentication setup:

1. **Test thoroughly** with different user types
2. **Deploy to staging** environment 
3. **Update environment URLs** for production
4. **Set up monitoring** for auth events
5. **Configure backups** for user data

**Module 2 (Passenger Ride Booking)** will build upon this authentication foundation.

---

## 🎯 **Success Criteria**

✅ **Authentication system is working when:**
- Passengers can register and access ride booking
- Drivers can register and see verification pending status  
- Admins can access admin dashboard
- All redirects work based on user type and verification status
- Security policies prevent unauthorized access
- Email verification is required and working
- Database audit logs capture authentication events

The authentication module is now **production-ready**! 🚀