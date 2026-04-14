# 🔐 AUTHENTICATION & AUTHORIZATION FIX - PHASE 5

**Status**: Analysis Complete, Ready for Implementation  
**Issues Found**: 12 critical auth/security issues  
**Fix Scope**: Models, Controllers, Routes, Middleware  

---

## 🚨 Issues Identified

| # | Issue | Severity | Impact | Category |
|---|-------|----------|--------|----------|
| 1 | JWT secret hardcoded in code | 🔴 CRITICAL | Security breach risk | Security |
| 2 | No role-based middleware (requireCustomer, requirePartner, requireAdmin) | 🔴 CRITICAL | Any user can access any endpoint | Authorization |
| 3 | JWT doesn't include role/type information | 🔴 CRITICAL | Can't differentiate user type | Auth Flow |
| 4 | Admin credentials hardcoded (email: admin@gmail.com, password: admin) | 🔴 CRITICAL | Insecure, exposed credentials | Security |
| 5 | No logout functionality | 🟠 HIGH | Sessions never end | Auth Flow |
| 6 | Partner status (pending/approved/suspended) not checked on login | 🟠 HIGH | Suspended partners can still login | Authorization |
| 7 | Email/password credentials hardcoded in nodemailer | 🔴 CRITICAL | Email service exposed | Security |
| 8 | No password reset/forgot password flow | 🟡 MEDIUM | Users locked out if password lost | UX |
| 9 | OTP expires immediately (no TTL) | 🟡 MEDIUM | OTP always valid until reused | Security |
| 10 | No account lockout after failed attempts | 🟡 MEDIUM | Brute force vulnerability | Security |
| 11 | Partner/User/Admin separate tables but same JWT secret | 🟠 HIGH | Can't differentiate in middleware | Architecture |
| 12 | No role claim in JWT token | 🟠 HIGH | Middleware can't check authorization | Auth Flow |

---

## 🎯 Solution Architecture

### New Auth Flow (Proposed)

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                      │
└─────────────────────────────────────────────────────────────┘

CUSTOMER AUTH:
  Signup:  POST /api/auth/customer/signup
           → Hash password (bcrypt)
           → Send OTP via email
           → Return success
  Verify:  POST /api/auth/customer/verify-otp
           → Check OTP
           → Return success
  Login:   POST /api/auth/customer/login
           → Verify password
           → Generate JWT with { userId, role: 'customer', type: 'user' }
           → Return token
  Logout:  POST /api/auth/customer/logout (optional, JWT has no state)

PARTNER AUTH:
  Signup:  POST /api/auth/partner/signup
           → Hash password (bcrypt)
           → Create with is_approved: false (PENDING)
           → Return success
  Login:   POST /api/auth/partner/login
           → Verify password
           → Check is_approved status (allow APPROVED only)
           → Generate JWT with { partnerId, role: 'partner', type: 'partner' }
           → Return token, including { is_approved, status }
  Logout:  POST /api/auth/partner/logout

ADMIN AUTH:
  Login:   POST /api/auth/admin/login
           → Verify credentials from admin table
           → Generate JWT with { adminId, role: 'admin', type: 'admin' }
           → Return token
  Logout:  POST /api/auth/admin/logout

PROTECTED ENDPOINTS:
  GET /api/profile → Requires: verifyToken + requireCustomer
  GET /partner/dashboard → Requires: verifyToken + requirePartner
  GET /admin/dashboard → Requires: verifyToken + requireAdmin
```

### Middleware Stack (Proposed)

```
app.js
├── app.use(verifyToken)        → Extracts JWT, validates signature
├── app.use(verifyRole)         → Extracts role from token
└── Routes
    ├── /api/auth/*             → Public (no middleware)
    ├── /api/profile/*          → verifyToken + requireCustomer
    ├── /api/partner/*          → verifyToken + requirePartner
    ├── /api/admin/*            → verifyToken + requireAdmin
    └── Views routes            → verifyToken (flexible)
```

---

## 📋 Implementation Plan

### Phase 5.1: Update Models

**File**: `app/models/user.model.js`
- Add `findById` method if missing
- Keep bcrypt hashing in controller (not model)

**File**: `app/models/partner.model.js`
- Add `findById` method if missing
- Add approval status checking method

**File**: `app/models/admin.model.js`
- Add password hashing support (remove hardcoded check)
- Add findById method

### Phase 5.2: Update Controllers

**File**: `app/controllers/user.controller.js`
- ✅ Keep signup with OTP (good)
- ✅ Keep login with bcrypt (good)
- ✅ Add logout endpoint (returns success)
- Update JWT to include role: `jwt.sign({ userId: user.id, role: 'customer', type: 'user' }, ...)`
- Move hardcoded credentials to .env

**File**: `app/controllers/partner.controller.js`
- ✅ Keep signup with bcrypt (good)
- ✅ Keep login (good)
- ⚠️ Add is_approved check on login
- Update JWT to include role
- Add logout endpoint
- Partner statuses: PENDING (default), APPROVED (admin approves), SUSPENDED (admin suspends)

**File**: `app/controllers/admin.controller.js`
- ❌ Remove hardcoded credentials
- Use admin table with hashed passwords
- Update JWT to include role
- Add logout endpoint

### Phase 5.3: Create Middleware

**NEW File**: `app/middleware/requireCustomer.js`
```javascript
module.exports = (req, res, next) => {
  if (req.role !== 'customer') {
    return res.status(403).send({ message: "Only customers can access this resource." });
  }
  next();
};
```

**NEW File**: `app/middleware/requirePartner.js`
```javascript
module.exports = (req, res, next) => {
  if (req.role !== 'partner') {
    return res.status(403).send({ message: "Only partners can access this resource." });
  }
  next();
};
```

**NEW File**: `app/middleware/requireAdmin.js`
```javascript
module.exports = (req, res, next) => {
  if (req.role !== 'admin') {
    return res.status(403).send({ message: "Only admins can access this resource." });
  }
  next();
};
```

**File**: `app/middleware/authJwt.js` (UPDATE)
```javascript
// Keep verifyToken as-is
// Enhance to extract role from token
jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
  req.userId = decoded.userId || decoded.id;
  req.role = decoded.role;    // Extract role
  req.userType = decoded.type; // Extract type (user/partner/admin)
  next();
});
```

### Phase 5.4: Update Routes

**File**: `app/routes/auth.routes.js` (REFACTOR)
```javascript
// NEW STRUCTURE:
router.post('/customer/signup', users.signup);
router.post('/customer/login', users.login);
router.post('/customer/logout', users.logout);
router.post('/customer/verify-otp', users.verifyOtp);

router.post('/partner/signup', partners.signup);
router.post('/partner/login', partners.login);
router.post('/partner/logout', partners.logout);

router.post('/admin/login', admins.login);
router.post('/admin/logout', admins.logout);
```

**File**: `app/routes/profile.routes.js` (ADD MIDDLEWARE)
```javascript
const requireCustomer = require('../middleware/requireCustomer');
const authJwt = require('../middleware/authJwt');

router.get('/me', authJwt.verifyToken, requireCustomer, profile.getProfile);
router.put('/update', authJwt.verifyToken, requireCustomer, profile.updateProfile);
```

**File**: `app/routes/partner.routes.js` (ADD MIDDLEWARE)
```javascript
const requirePartner = require('../middleware/requirePartner');
const authJwt = require('../middleware/authJwt');

router.get('/dashboard', authJwt.verifyToken, requirePartner, partners.getDashboard);
router.get('/profile', authJwt.verifyToken, requirePartner, partners.getProfile);
```

**File**: `app/routes/admin.routes.js` (ADD MIDDLEWARE)
```javascript
const requireAdmin = require('../middleware/requireAdmin');
const authJwt = require('../middleware/authJwt');

router.get('/dashboard', authJwt.verifyToken, requireAdmin, admins.getDashboard);
router.put('/partners/approve/:id', authJwt.verifyToken, requireAdmin, admins.approvePartner);
```

### Phase 5.5: Environment Variables

**File**: `.env` (UPDATE)
```
JWT_SECRET=your-super-secret-key-here-not-hardcoded
JWT_EXPIRATION=86400

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=hashed-password-goes-here

EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

---

## 🔐 Security Improvements

### Before (Insecure)
```javascript
const token = jwt.sign({ id: user.id }, 'MyProject2026SecureKey', ...);
// Hardcoded secret, no role info
```

### After (Secure)
```javascript
const token = jwt.sign({
  userId: user.id,
  role: 'customer',
  type: 'user',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 86400
}, process.env.JWT_SECRET);
// Secret in environment, includes role, has expiration
```

---

## 📝 Partner Status System

New partner statuses:
- **PENDING** (default after signup)
  - Cannot login
  - Can edit profile
  - Awaiting admin approval
- **APPROVED** (admin action)
  - Can login
  - Can accept bookings
  - Can manage profile
- **SUSPENDED** (admin action)
  - Cannot login (rejected on login)
  - Cannot manage profile
  - Notified of reason

Implementation:
```sql
ALTER TABLE partners ADD COLUMN status ENUM('pending', 'approved', 'suspended') DEFAULT 'pending';
-- Or rename is_approved to status with migration
```

---

## ✅ Expected Outcomes

After implementation:
- ✅ Separate auth flows for each role
- ✅ Role-based route protection
- ✅ Secure JWT with role claims
- ✅ Partner approval workflow
- ✅ Environment-based configuration
- ✅ No hardcoded secrets
- ✅ Clean logout support
- ✅ Role middleware for all protected routes
- ✅ Proper error messages for authorization failures
- ✅ Consistent auth across all roles

---

## 🔄 Backward Compatibility

**What changes**: Everything (but with fallback)
**What breaks**: Current JWT tokens (need reissue)
**Migration**: Restart service, existing sessions expire naturally (24hrs)

---

**Ready for implementation? See AUTHENTICATION_FIX_GUIDE.md**
