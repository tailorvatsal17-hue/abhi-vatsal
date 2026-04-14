# Customer Module Implementation Guide

## Current Status: Phase 1 ✅ COMPLETE

**Completed (Phase 1):**
- ✅ Security fixes (SQL injection)
- ✅ Authorization checks
- ✅ Input validation

**Not Started (Phase 2):**
- ⏳ Complete booking form & submission
- ⏳ Dashboard data loading
- ⏳ Service filtering
- ⏳ Provider profile view
- ⏳ Payment system
- ⏳ Rating & review system

---

## 📁 Customer Module Structure

```
app/
├── controllers/
│   ├── user.controller.js (signup/login/logout)
│   ├── booking.controller.js ✅ UPDATED
│   ├── profile.controller.js ✅ UPDATED
│   └── service.controller.js
├── models/
│   ├── user.model.js ✅ UPDATED
│   ├── booking.model.js ✅ UPDATED
│   ├── profile.model.js ✅ UPDATED
│   └── service.model.js ✅ UPDATED
├── routes/
│   ├── auth.routes.js
│   ├── booking.routes.js
│   ├── profile.routes.js
│   └── service.routes.js
└── middleware/
    ├── authJwt.js
    ├── requireCustomer.js
    └── [other middleware]

views/
├── customer/
│   ├── dashboard.pug (to be created)
│   ├── profile.pug
│   ├── booking.pug ⏳ NEEDS WORK
│   ├── services.pug
│   └── payment.pug (to be created)
```

---

## 🔌 Current API Endpoints

### Auth Endpoints
```
POST   /api/auth/customer/signup          → Create account
POST   /api/auth/customer/login           → Login with password
POST   /api/auth/customer/verify-otp      → Verify email OTP
POST   /api/auth/customer/logout          → Logout (protected)
```

### Booking Endpoints (Protected)
```
POST   /api/bookings/                     → Create booking ✅
GET    /api/bookings/:id                  → Get booking ✅
PUT    /api/bookings/cancel/:id           → Cancel booking ✅
GET    /api/profile/:id/bookings          → Get user's bookings ✅
```

### Profile Endpoints (Protected)
```
GET    /api/profile/:id                   → Get profile ✅
PUT    /api/profile/:id                   → Update profile ✅
GET    /api/profile/:id/addresses         → Get addresses ✅
POST   /api/profile/:id/addresses         → Add address ✅
PUT    /api/profile/addresses/:id         → Update address
DELETE /api/profile/addresses/:id         → Delete address
```

### Service Endpoints (Public)
```
GET    /api/services/                     → List all services ✅
GET    /api/services/search?keyword=...   → Search services ✅
GET    /api/services/:id/partners         → Get providers ✅
```

---

## 🧪 Quick Testing (Phase 1)

### 1. Test SQL Injection Fix
```bash
# This should fail safely (not leak data)
curl -X POST http://localhost:3000/api/auth/customer/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com\" OR \"1\"=\"1","password":"test"}'
```

### 2. Test Authorization
```bash
# Get your token from login
TOKEN="eyJhbGc..."

# This should return 403 if you try to access another user
curl -X GET "http://localhost:3000/api/profile/999" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Test Booking Validation
```bash
TOKEN="eyJhbGc..."

# This should fail (past date)
curl -X POST http://localhost:3000/api/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "partner_id": 1,
    "service_id": 1,
    "booking_date": "2020-01-01",
    "booking_time": "10:00:00",
    "address_id": 1,
    "total_cost": 100
  }'
```

---

## 🔒 Authorization Rules Implemented

| Resource | Can Access | Rule |
|----------|-----------|------|
| Own Profile | ✅ | Must be the user (ID match) |
| Own Bookings | ✅ | Must own the booking (user_id match) |
| Own Addresses | ✅ | Must be the user (ID match) |
| Other User's Data | ❌ | Returns 403 Forbidden |

---

## 📝 Code Examples

### Creating a Booking (Authenticated)
```javascript
// Headers required:
Authorization: Bearer YOUR_JWT_TOKEN

// POST /api/bookings
{
  "partner_id": 5,
  "service_id": 101,
  "booking_date": "2026-04-20",
  "booking_time": "14:00:00",
  "address_id": 1,
  "total_cost": 100,
  "is_first_booking": true
}

// Response (201 Created):
{
  "id": 1,
  "user_id": 1,
  "partner_id": 5,
  "booking_date": "2026-04-20",
  "booking_time": "14:00:00",
  "total_cost": 102,  // tax added
  "status": "Pending"
}
```

### Canceling a Booking (Protected)
```javascript
// Headers required:
Authorization: Bearer YOUR_JWT_TOKEN

// PUT /api/bookings/cancel/1
// Only works if:
// - User owns the booking
// - Booking status is 'Pending' or 'Confirmed'
// - More than 24 hours until booking time

// Response (200 OK):
{
  "message": "Booking was cancelled successfully.",
  "bookingId": 1
}
```

### Authorization Error
```javascript
// If you try to access another user's resource:
// GET /api/profile/999 (and you are user 1)

// Response (403 Forbidden):
{
  "message": "Access denied. You can only view your own profile."
}
```

---

## 🐛 Known Issues (To Address in Phase 2)

1. **Booking Form Incomplete**
   - Form has no action attribute
   - Missing form submission handling
   - No cost calculation on frontend

2. **Profile Dashboard**
   - Template exists but no data loading
   - No JavaScript to fetch data
   - Variables not populated

3. **Service Filtering**
   - No category filter
   - No price range filter
   - Search works but limited

4. **Provider Profile**
   - No dedicated view for provider details
   - No reviews display
   - No availability display

5. **Payment System**
   - Not integrated
   - No payment gateway
   - Status always 'Pending'

6. **Review System**
   - Not implemented
   - No rating/review creation
   - Reviews table exists but unused

---

## 📋 Checklist for Phase 2

Before starting Phase 2, verify Phase 1:

- [ ] No SQL injection vulnerabilities (test with special chars)
- [ ] Authorization working (403 errors on wrong user)
- [ ] Validation working (400 errors on invalid input)
- [ ] All models use parameterized queries
- [ ] All controllers check authorization
- [ ] Backup files exist in `backup-customer-*` folder
- [ ] Documentation updated
- [ ] No "Cannot find module" errors in logs

---

## 🚀 Starting Phase 2

When ready to implement Phase 2 features:

1. **Read:** `customer-module-plan.md` (detailed phase 2 plan)
2. **Create:** New controllers for Payment and Review
3. **Create:** New routes for Payment and Review
4. **Create:** New Pug templates for forms
5. **Test:** Each feature individually
6. **Verify:** Authorization still works
7. **Document:** All changes

---

## 📞 Important Files Reference

| File | Purpose | Status |
|------|---------|--------|
| CUSTOMER_PHASE1_SECURITY_FIXES.md | Phase 1 details | ✅ Read this first |
| customer-module-plan.md | Phase 2 planning | ⏳ For next phase |
| backup-customer-*/ | Original files | 🔒 Keep safe |

---

## ✅ Phase 1 Verification

Run these checks to confirm Phase 1 is working:

```bash
# 1. Check no SQL errors with special characters
curl -X GET "http://localhost:3000/api/services/search?keyword=%27%29%3B%20DROP%20TABLE" 

# 2. Check authorization works
curl -X GET http://localhost:3000/api/profile/999 \
  -H "Authorization: Bearer YOUR_TOKEN"  # Should get 403

# 3. Check validation works
curl -X POST http://localhost:3000/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"total_cost": -100}'  # Should get 400

# 4. Check booking creation works
curl -X POST http://localhost:3000/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "partner_id": 1,
    "service_id": 101,
    "booking_date": "2026-04-20",
    "booking_time": "10:00:00",
    "address_id": 1,
    "total_cost": 100
  }'  # Should get 201
```

---

**Last Updated:** 2026-04-13  
**Phase:** 1 Complete, Ready for Phase 2
