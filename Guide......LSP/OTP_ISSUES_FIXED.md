# OTP Generation Issues - Fixed

## Issues Found and Fixed

### 1. **Missing `expires_at` Column in OTP Table** ❌ → ✅
**Problem:**
- The `otps` table in `init.sql` was missing the `expires_at` column
- OTP service tries to INSERT into `expires_at` which didn't exist
- This caused SQL errors when generating OTP

**Fixed:**
- Updated `init.sql` to include `expires_at TIMESTAMP` column
- Migration file `migration-otp-fix.sql` added to ensure the fix

### 2. **Incomplete Notifications Table Schema** ❌ → ✅
**Problem:**
- Old notifications table had wrong structure (missing partner_id, notification_type, related_id, etc.)
- OTP service couldn't log notifications properly

**Fixed:**
- Updated notifications table in `init.sql` with correct schema
- Added indexes for better performance
- Added support for both user and partner notifications

### 3. **Missing Columns in Users and Partners Tables** ❌ → ✅
**Problem:**
- Users table missing `is_verified` column
- Partners table missing `is_verified`, `is_suspended`, `hourly_rate` columns

**Fixed:**
- Added `is_verified BOOLEAN DEFAULT false` to users
- Added `is_verified`, `is_suspended`, `hourly_rate` to partners
- Partners table now properly supports all required fields

### 4. **Partner Controller Not Handling All Fields** ❌ → ✅
**Problem:**
- Partner signup controller wasn't extracting `description` and `hourly_rate` from request
- Form data was being sent but not stored

**Fixed:**
- Updated partner controller to extract and validate all fields
- Added password validation (same as customer: 8+ chars, uppercase, lowercase, number, special char)
- Added proper error responses and status codes

### 5. **Missing Error Handling in OTP Flow** ❌ → ✅
**Problem:**
- Notification logging failures weren't logged
- Silent failures made debugging difficult

**Fixed:**
- Added error logging for OTP creation
- Added error logging for notification logging
- Added null checks for OTP value
- Improved error messages

## Database Schema Updates

### OTP Table (Fixed)
```sql
CREATE TABLE IF NOT EXISTS otps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP NULL DEFAULT DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 5 MINUTE),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Users Table (Fixed)
```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
```

### Partners Table (Fixed)
```sql
ALTER TABLE partners 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ADD COLUMN IF NOT EXISTS is_suspended TINYINT(1) DEFAULT 0;
ADD COLUMN IF NOT EXISTS hourly_rate VARCHAR(100);
```

### Notifications Table (Fixed)
```sql
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  partner_id INT,
  notification_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  related_id INT,
  related_type VARCHAR(100),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_partner_id (partner_id),
  INDEX idx_type (notification_type),
  INDEX idx_created_at (created_at)
);
```

## How to Apply the Fixes

### Option 1: Fresh Database Setup (Recommended for New Installations)
1. Delete existing database (if any)
2. Run: `init.sql` (updated version with all fixes)
3. Database will have all correct tables and columns

### Option 2: Apply to Existing Database
If you already have a database running, apply the migration:

```bash
# In Docker environment:
docker exec <mysql_container_name> mysql -u root -p<password> < db/migration-otp-fix.sql

# Or directly in MySQL:
source db/migration-otp-fix.sql;
```

### Option 3: Manual SQL Execution
Run the following commands in your MySQL client:

```sql
-- Add missing columns to existing tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS is_suspended TINYINT(1) DEFAULT 0;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS hourly_rate VARCHAR(100);
ALTER TABLE otps ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP NULL DEFAULT DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 5 MINUTE);

-- Update notifications table structure
DROP TABLE IF EXISTS notifications_backup;
RENAME TABLE notifications TO notifications_backup;

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  partner_id INT,
  notification_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  related_id INT,
  related_type VARCHAR(100),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_partner_id (partner_id),
  INDEX idx_type (notification_type),
  INDEX idx_created_at (created_at)
);
```

## Files Modified

1. **db/init.sql** - Updated database schema with all fixes
2. **app/controllers/user.controller.js** - Added error handling and null checks
3. **app/controllers/partner.controller.js** - Added field extraction and validation
4. **db/migration-otp-fix.sql** - New migration file for existing databases

## Testing the Fix

### Customer Signup OTP Flow
1. Go to `/signup`
2. Enter email and password (must meet requirements)
3. Click "Sign Up"
4. Check browser console - should see OTP in mock output
5. OTP should be valid for 5 minutes
6. Go to `/otp?email=youremail@example.com`
7. Enter the OTP code from console
8. Should be redirected to login on success

### Partner Signup
1. Go to `/partner/signup`
2. Fill all fields (name, email, password, service, description, hourly_rate)
3. Click "Register"
4. Should see success message and redirect to partner login
5. Account status: "Pending approval by admin"

## OTP Flow Diagram

```
User Signup Form
    ↓
POST /api/auth/customer/signup
    ↓
Validate Email & Password
    ↓
Create User Account
    ↓
Generate OTP (6 digits)
    ↓
INSERT INTO otps (email, otp, expires_at)
    ↓
Mock Send OTP (console log)
    ↓
Log "OTP_SENT" Notification
    ↓
Response: "OTP sent to your email"
    ↓
Redirect to /otp?email=...
    ↓
User Enters OTP Code
    ↓
POST /api/auth/customer/verify-otp
    ↓
Query otps table (email, otp, not expired)
    ↓
Update users SET is_verified = true
    ↓
Log "SIGNUP_VERIFIED" Notification
    ↓
Response: "OTP verified"
    ↓
Redirect to /login
```

## Troubleshooting

### Error: "Error generating OTP"
**Cause:** Missing `expires_at` column in otps table
**Fix:** Apply migration file or run ALTER TABLE command

### Error: "Error updating verification status"
**Cause:** Missing `is_verified` column in users table
**Fix:** Apply migration file or run ALTER TABLE command

### Notification not appearing in notifications table
**Cause:** Wrong notifications table structure
**Fix:** Apply migration to recreate notifications table with correct schema

### OTP expires too quickly
**Default:** 5 minutes
**To change:** Edit `otp-notification.service.js` line with `INTERVAL 5 MINUTE`

## Next Steps

1. ✅ Apply database migrations
2. ✅ Test customer signup flow
3. ✅ Test OTP verification
4. ✅ Test partner signup
5. Consider: Email integration (replace mock with real email service)
6. Consider: OTP template customization
