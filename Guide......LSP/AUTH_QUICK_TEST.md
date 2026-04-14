# Auth System - Quick Testing Guide

## ✅ Pre-Test Checklist

```bash
# 1. Check backups created
ls -la backup-*/

# 2. Check .env file exists
cat .env

# 3. Check database migration file created
cat db/migration-auth-fixes.sql

# 4. Check all files were updated (no errors in terminal)
```

## 🧪 Test Scenarios

### Test 1: Customer Auth Flow
```bash
# 1. Customer signup
curl -X POST http://localhost:3000/api/auth/customer/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"AlicePass123!"}'

# Expected: 200 OK, "OTP sent to your email"

# 2. Customer verify OTP (use OTP from email)
curl -X POST http://localhost:3000/api/auth/customer/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","otp":"123456"}'

# Expected: 200 OK, "OTP verified successfully"

# 3. Customer login
curl -X POST http://localhost:3000/api/auth/customer/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"AlicePass123!"}'

# Expected: 200 OK + JWT token with role: "customer"
# Save token as $CUSTOMER_TOKEN

# 4. Customer logout
curl -X POST http://localhost:3000/api/auth/customer/logout \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"

# Expected: 200 OK, "Logged out successfully"
```

### Test 2: Partner Auth Flow
```bash
# 1. Partner signup
curl -X POST http://localhost:3000/api/auth/partner/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name":"John Carpenter",
    "email":"john@partner.com",
    "password":"JohnPass123!",
    "service_id":101
  }'

# Expected: 201 OK

# 2. Partner login (should FAIL - status is PENDING)
curl -X POST http://localhost:3000/api/auth/partner/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@partner.com","password":"JohnPass123!"}'

# Expected: 403 Error, "Partner account is PENDING"

# 3. Admin approves partner (use admin token from step 3 below)
curl -X PUT http://localhost:3000/api/admin/partners/approve/[PARTNER_ID] \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: 200 OK

# 4. Partner login again (should SUCCESS)
curl -X POST http://localhost:3000/api/auth/partner/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@partner.com","password":"JohnPass123!"}'

# Expected: 200 OK + JWT token with role: "partner", status: "APPROVED"
# Save token as $PARTNER_TOKEN

# 5. Access partner dashboard
curl -X GET http://localhost:3000/api/partners/dashboard \
  -H "Authorization: Bearer $PARTNER_TOKEN"

# Expected: 200 OK, partner profile data

# 6. Partner logout
curl -X POST http://localhost:3000/api/partners/logout \
  -H "Authorization: Bearer $PARTNER_TOKEN"

# Expected: 200 OK
```

### Test 3: Admin Auth Flow
```bash
# 1. Admin login (using migrated password)
curl -X POST http://localhost:3000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"admin"}'

# Expected: 200 OK + JWT token with role: "admin"
# Save token as $ADMIN_TOKEN

# 2. Access admin dashboard
curl -X GET http://localhost:3000/api/admin/dashboard \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: 200 OK, statistics data

# 3. Get all partners
curl -X GET http://localhost:3000/api/admin/partners \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: 200 OK, list of all partners

# 4. Admin logout
curl -X POST http://localhost:3000/api/admin/logout \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: 200 OK
```

### Test 4: Role-Based Access Control (Security)
```bash
# Test that partner cannot access admin routes
curl -X GET http://localhost:3000/api/admin/partners \
  -H "Authorization: Bearer $PARTNER_TOKEN"

# Expected: 403 Error, "Access denied. Only admins can access this resource."

# Test that customer cannot access partner routes
curl -X GET http://localhost:3000/api/partners/dashboard \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"

# Expected: 403 Error, "Access denied. Only partners can access this resource."

# Test that admin cannot access customer logout (customer role required)
curl -X POST http://localhost:3000/api/auth/customer/logout \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: 403 Error, "Access denied"
```

### Test 5: Error Handling
```bash
# Test missing token
curl -X GET http://localhost:3000/api/admin/partners

# Expected: 403 Error, "No token provided"

# Test invalid token
curl -X GET http://localhost:3000/api/admin/partners \
  -H "Authorization: Bearer invalid_token_here"

# Expected: 401 Error, "Unauthorized! Token expired or invalid"

# Test wrong password
curl -X POST http://localhost:3000/api/auth/customer/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"WrongPassword123!"}'

# Expected: 401 Error, "Invalid Password"

# Test weak password
curl -X POST http://localhost:3000/api/auth/customer/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"weak@test.com","password":"weak"}'

# Expected: 400 Error, "Password must be at least 8 characters..."
```

## 📝 Expected Token Format

Decode JWT tokens to verify structure:
- Use https://jwt.io
- Paste token and check payload contains `role` field

### Customer token payload should contain:
```json
{
  "userId": 1,
  "role": "customer",
  "type": "customer",
  "email": "alice@test.com"
}
```

### Partner token payload should contain:
```json
{
  "userId": 1,
  "role": "partner",
  "type": "partner",
  "status": "APPROVED",
  "email": "john@partner.com"
}
```

### Admin token payload should contain:
```json
{
  "userId": 1,
  "role": "admin",
  "type": "admin",
  "email": "admin@gmail.com"
}
```

## ✅ Success Criteria

- [ ] Customer signup → login → dashboard → logout works
- [ ] Partner signup → status PENDING → cannot login ✓
- [ ] Admin approves partner → partner can now login ✓
- [ ] Admin login → dashboard → logout works
- [ ] Wrong role accessing wrong endpoint returns 403 ✓
- [ ] Missing token returns 403 ✓
- [ ] Invalid token returns 401 ✓
- [ ] JWT tokens include role field ✓
- [ ] Email OTP expires after 15 minutes ✓
- [ ] Passwords use bcrypt hashing ✓

## 🔧 If Tests Fail

1. **Check error message in response**
2. **Review `.env` file for missing variables**
3. **Run database migration again**
4. **Check application logs for "Cannot find module" errors**
5. **Restart application**
6. **Check backup files to compare original vs updated**

## 📊 Test Results Template

```
Date: 2026-04-13
Tester: [Your Name]

Customer Auth:     [ ] PASS [ ] FAIL
Partner Auth:      [ ] PASS [ ] FAIL
Admin Auth:        [ ] PASS [ ] FAIL
Role-Based Access: [ ] PASS [ ] FAIL
Error Handling:    [ ] PASS [ ] FAIL
JWT Tokens:        [ ] PASS [ ] FAIL

Overall Status:    [ ] READY FOR PRODUCTION [ ] NEEDS FIXES

Notes:
____________________________________________________________________
____________________________________________________________________
____________________________________________________________________
```
