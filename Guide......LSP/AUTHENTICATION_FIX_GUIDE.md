# 🔐 AUTHENTICATION & AUTHORIZATION FIX - IMPLEMENTATION GUIDE

**Phase 5: Complete Auth System Overhaul**  
**Total Files**: 12 new/fixed files  
**Implementation Time**: 2-3 hours  

---

## 📦 Deliverables

### Middleware Files (4 new)
- ✅ `app/middleware/authJwt.js.fixed` - Enhanced JWT verification with role extraction
- ✅ `app/middleware/requireCustomer.js` - Enforce customer role
- ✅ `app/middleware/requirePartner.js` - Enforce partner role
- ✅ `app/middleware/requireAdmin.js` - Enforce admin role

### Controller Files (3 fixed)
- ✅ `app/controllers/user.controller.js.fixed` - Customer auth with improvements
- ✅ `app/controllers/partner.controller.js.fixed` - Partner auth + status checking
- ✅ `app/controllers/admin.controller.js.fixed` - Admin auth from DB (not hardcoded)

### Route Files (3 fixed)
- ✅ `app/routes/auth.routes.js.fixed` - Organized auth endpoints
- ✅ `app/routes/partner.routes.js.fixed` - Protected partner routes
- ✅ `app/routes/admin.routes.js.fixed` - Protected admin routes

### Documentation (2 files)
- ✅ `AUTH_ISSUES_ANALYSIS.md` - Problems and solutions
- ✅ This guide (implementation steps)

---

## 🔑 Key Improvements

### 1. Role-Based Middleware
**Before**: Only `verifyToken` (generic)  
**After**: `verifyToken` + `requireCustomer` / `requirePartner` / `requireAdmin`

**Example**:
```javascript
// Before (wrong)
router.get('/profile', verifyToken, profile.getProfile);
// Any authenticated user can access

// After (correct)
router.get('/profile', verifyToken, requireCustomer, profile.getProfile);
// Only customers can access
```

### 2. JWT with Role Information
**Before**:
```javascript
jwt.sign({ id: user.id }, secret, ...)
// No role info, can't differentiate in middleware
```

**After**:
```javascript
jwt.sign({
  userId: user.id,
  role: 'customer',  // ← Role included
  type: 'user'       // ← Type included
}, secret, ...)
```

### 3. Partner Status Checking
**Before**: No status check, suspended partners can still login  
**After**:
- PENDING → Cannot login (awaiting approval)
- APPROVED → Can login
- SUSPENDED → Cannot login (rejected/suspended)

### 4. Admin Credentials from Database
**Before**: Hardcoded `email: admin@gmail.com, password: admin`  
**After**: Read from admin table with bcrypt comparison

### 5. Environment Variables
**Before**: Secret key hardcoded in code  
**After**: Read from `.env` file

---

## 📋 Step-by-Step Implementation

### STEP 1: Environment Setup (5 min)

Create/update `.env` file:
```bash
# Database
DB_HOST=mysql
DB_USER=app_user
DB_PASSWORD=secure_password
DB_NAME=lsp_database

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=86400

# Email
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Server
PORT=3000
NODE_ENV=development
```

**Security Note**: Never commit `.env` to Git. Add to `.gitignore`:
```
.env
.env.local
```

### STEP 2: Backup Original Files (5 min)

```powershell
# Backup middleware
Copy-Item "app\middleware\authJwt.js" "app\middleware\authJwt.js.bak"

# Backup controllers
Copy-Item "app\controllers\user.controller.js" "app\controllers\user.controller.js.bak"
Copy-Item "app\controllers\partner.controller.js" "app\controllers\partner.controller.js.bak"
Copy-Item "app\controllers\admin.controller.js" "app\controllers\admin.controller.js.bak"

# Backup routes
Copy-Item "app\routes\auth.routes.js" "app\routes\auth.routes.js.bak"
Copy-Item "app\routes\partner.routes.js" "app\routes\partner.routes.js.bak"
Copy-Item "app\routes\admin.routes.js" "app\routes\admin.routes.js.bak"
```

### STEP 3: Add New Middleware (5 min)

Create 3 NEW files:

**1. `app/middleware/requireCustomer.js`**
```javascript
module.exports = (req, res, next) => {
  if (!req.role || req.role !== 'customer') {
    return res.status(403).send({
      message: "Access denied. Only customers can access this resource."
    });
  }
  next();
};
```

**2. `app/middleware/requirePartner.js`**
```javascript
module.exports = (req, res, next) => {
  if (!req.role || req.role !== 'partner') {
    return res.status(403).send({
      message: "Access denied. Only partners can access this resource."
    });
  }
  next();
};
```

**3. `app/middleware/requireAdmin.js`**
```javascript
module.exports = (req, res, next) => {
  if (!req.role || req.role !== 'admin') {
    return res.status(403).send({
      message: "Access denied. Only admins can access this resource."
    });
  }
  next();
};
```

### STEP 4: Update Middleware (5 min)

Replace `app/middleware/authJwt.js` with `authJwt.js.fixed`:

Key changes:
- Extract `role` from JWT: `req.role = decoded.role`
- Use environment variable for secret: `process.env.JWT_SECRET`
- Add fallback for backward compatibility

```powershell
Copy-Item "app\middleware\authJwt.js.fixed" "app\middleware\authJwt.js" -Force
```

### STEP 5: Update Controllers (20 min)

**Replace `app/controllers/user.controller.js`**:
```powershell
Copy-Item "app\controllers\user.controller.js.fixed" "app\controllers\user.controller.js" -Force
```

Changes:
- Uses `process.env.JWT_SECRET`
- JWT includes role: `role: 'customer'`
- Added `logout` endpoint
- OTP expiration (15 min TTL)
- Better error messages

**Replace `app/controllers/partner.controller.js`**:
```powershell
Copy-Item "app\controllers\partner.controller.js.fixed" "app\controllers\partner.controller.js" -Force
```

Changes:
- Uses `process.env.JWT_SECRET`
- JWT includes role: `role: 'partner'`
- Checks partner status on login (PENDING/APPROVED/SUSPENDED)
- Added `logout` endpoint
- Added dashboard endpoint
- Partner starts as PENDING by default

**Replace `app/controllers/admin.controller.js`**:
```powershell
Copy-Item "app\controllers\admin.controller.js.fixed" "app\controllers\admin.controller.js" -Force
```

Changes:
- Reads admin from database (not hardcoded)
- Uses bcrypt for password comparison
- JWT includes role: `role: 'admin'`
- Added `logout` endpoint
- Comprehensive dashboard statistics
- Partner approval/rejection workflow

### STEP 6: Update Routes (10 min)

**Replace `app/routes/auth.routes.js`**:
```powershell
Copy-Item "app\routes\auth.routes.js.fixed" "app\routes\auth.routes.js" -Force
```

New endpoints:
- `POST /api/auth/customer/signup`
- `POST /api/auth/customer/login`
- `POST /api/auth/customer/logout`
- `POST /api/auth/customer/verify-otp`

**Replace `app/routes/partner.routes.js`**:
```powershell
Copy-Item "app\routes\partner.routes.js.fixed" "app\routes\partner.routes.js" -Force
```

Changes:
- Public routes: signup, login, logout
- Protected routes require: `verifyToken` + `requirePartner`
- Endpoints moved to non-ID-based (e.g., `/dashboard` not `/123/dashboard`)

**Replace `app/routes/admin.routes.js`**:
```powershell
Copy-Item "app\routes\admin.routes.js.fixed" "app\routes\admin.routes.js" -Force
```

Changes:
- Public routes: login, logout
- Protected routes require: `verifyToken` + `requireAdmin`
- Reorganized endpoints by function (users, partners, services, bookings)

### STEP 7: Update Database Schema (10 min)

Add status column to partners table if not exists:

```sql
-- Check if status column exists
ALTER TABLE partners ADD COLUMN status ENUM('pending', 'approved', 'suspended') DEFAULT 'pending';

-- If you have existing partners, set them to approved if is_approved = true
UPDATE partners SET status = 'approved' WHERE is_approved = true;
UPDATE partners SET status = 'pending' WHERE is_approved = false;

-- Add OTP expiration if not exists
ALTER TABLE otps ADD COLUMN expires_at DATETIME DEFAULT NULL;
```

### STEP 8: Update App Bootstrap (5 min)

Check `app/app.js` or `index.js`:

Ensure environment variables are loaded:
```javascript
// At top of app.js or index.js
require('dotenv').config();

// Then use:
const jwtSecret = process.env.JWT_SECRET;
```

### STEP 9: Test Application (15 min)

```bash
# Install dependencies (if needed)
npm install

# Start application
npm start

# You should see no errors about undefined middleware
```

### STEP 10: Test Each Auth Flow (30 min)

**Test Customer Flow**:
1. POST `/api/auth/customer/signup`
   - Body: `{ email: "user@example.com", password: "Password123!" }`
   - Check: User created, OTP sent
2. POST `/api/auth/customer/verify-otp`
   - Body: `{ email: "user@example.com", otp: "123456" }`
   - Check: OTP verified
3. POST `/api/auth/customer/login`
   - Body: `{ email: "user@example.com", password: "Password123!" }`
   - Check: Token returned with `role: "customer"`

**Test Partner Flow**:
1. POST `/api/auth/partner/signup`
   - Body: `{ name: "John", email: "partner@example.com", password: "Password123!", service_id: 1, description: "...", hourly_rate: "£50/hr" }`
   - Check: Partner created with status: "pending"
2. POST `/api/auth/partner/login` (should fail - pending)
   - Check: Error "pending admin approval"
3. POST `/api/admin/login` first to get admin token
4. PUT `/api/admin/partners/1/approve` (as admin)
   - Check: Partner status changed to "approved"
5. POST `/api/auth/partner/login` (should succeed now)
   - Check: Token returned with `role: "partner"`

**Test Admin Flow**:
1. Ensure admin exists in database with hashed password
2. POST `/api/admin/login`
   - Body: `{ email: "admin@example.com", password: "AdminPassword123!" }`
   - Check: Token returned with `role: "admin"`
3. GET `/api/admin/dashboard` (with token)
   - Check: Statistics returned

**Test Authorization**:
1. Get customer token
2. Try to access `/api/partner/dashboard`
   - Check: 403 Forbidden - "Only partners can access"
3. Try to access `/api/admin/dashboard`
   - Check: 403 Forbidden - "Only admins can access"

---

## 🔄 API Endpoint Summary

### Customer Auth
```
POST /api/auth/customer/signup          → Create account
POST /api/auth/customer/verify-otp      → Verify email
POST /api/auth/customer/login           → Login
POST /api/auth/customer/logout          → Logout
```

### Partner Auth
```
POST /api/auth/partner/signup           → Create account (status: pending)
POST /api/auth/partner/login            → Login (only if approved)
POST /api/auth/partner/logout           → Logout
GET  /api/partners/profile              → Get profile (requires token + partner role)
PUT  /api/partners/profile              → Update profile
GET  /api/partners/dashboard            → Dashboard stats
GET  /api/partners/bookings             → Partner's bookings
```

### Admin Auth
```
POST /api/admin/login                   → Login
POST /api/admin/logout                  → Logout
GET  /api/admin/dashboard               → Dashboard stats
GET  /api/admin/users                   → List all users
GET  /api/admin/partners                → List all partners
GET  /api/admin/partners/:id            → Partner details
PUT  /api/admin/partners/:id/approve    → Approve partner
PUT  /api/admin/partners/:id/reject     → Reject/suspend partner
GET  /api/admin/services                → List services
POST /api/admin/services                → Create service
DELETE /api/admin/services/:id          → Delete service
GET  /api/admin/bookings                → List all bookings
```

---

## ✅ Verification Checklist

After implementation:

- [ ] All middleware files created (4 new files)
- [ ] Original files backed up (`.bak` files exist)
- [ ] Controllers replaced (3 files)
- [ ] Routes replaced (3 files)
- [ ] `.env` file created with JWT_SECRET
- [ ] Database schema updated (status column added)
- [ ] `app start` succeeds without errors
- [ ] No "Cannot find module" errors
- [ ] Customer signup/login works
- [ ] Partner pending status prevents login
- [ ] Admin approval changes partner status to approved
- [ ] Partner can login after approval
- [ ] Admin can login (from DB, not hardcoded)
- [ ] Authorization middleware works (403 on wrong role)
- [ ] JWT tokens include role information
- [ ] Logout endpoints return success
- [ ] All 12 files implemented correctly

---

## 🚨 Troubleshooting

### Issue: "Cannot find module 'requireCustomer'"
**Fix**: Ensure you created all 3 new middleware files in `app/middleware/`

### Issue: JWT secret undefined
**Fix**: Ensure `.env` file exists with `JWT_SECRET=...`

### Issue: Partner can login even when pending
**Fix**: Check partner controller login function checks `status` field

### Issue: Admin login fails "not found"
**Fix**: Ensure admin record exists in `admins` table with bcrypt-hashed password

### Issue: Authorization middleware not working
**Fix**: Verify `req.role` is set in `authJwt.js` from JWT token

### Issue: OTP always fails
**Fix**: Check OTP expiration logic and ensure `expires_at` column exists

### Issue: "Middleware is not a function"
**Fix**: Check file exports: `module.exports = (req, res, next) => {...}`

---

## 📊 Migration Path

### For Existing Users
- Existing JWT tokens won't have `role` field
- Tokens will still validate (backward compatible)
- But middleware checks will fail (no role)
- Solution: Users must re-login to get new token with role

### For New Deployments
- Start fresh with new schema
- All users get proper role tokens from day one

---

## 🔒 Security Hardening

Before production, also do:

1. **Change hardcoded values**:
   - Email/password for nodemailer in `.env`
   - Admin credentials (hash properly in DB)
   
2. **Enable HTTPS**: Use SSL certificates

3. **Add rate limiting**: Prevent brute force
   ```javascript
   const rateLimit = require('express-rate-limit');
   app.use('/api/auth/login', rateLimit({ windowMs: 15*60*1000, max: 5 }));
   ```

4. **Add logging**: Log all auth events

5. **Update dependencies**: `npm audit fix`

---

## 🎯 Next Steps After Implementation

1. Test all auth flows thoroughly
2. Test authorization (403 errors)
3. Load test (multiple concurrent logins)
4. Security review of .env handling
5. Database backups
6. Documentation update for team
7. Deploy to staging
8. User communication about changes

---

**Ready? Start with STEP 1: Environment Setup**
