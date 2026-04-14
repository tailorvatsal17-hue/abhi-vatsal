# Pug View System - Form Action & Input Name Mapping

## Customer Auth Forms

### 1. Login Form (login.pug)
- **File**: `app/views/login.pug.fixed`
- **Action**: `/api/auth/login`
- **Method**: `POST`
- **Fields**:
  - `email` (type: email, required)
  - `password` (type: password, required)
- **Expected Response**: JWT token, redirects to profile or homepage
- **Success**: User logged in
- **Error**: Email/password incorrect

### 2. Signup Form (signup.pug)
- **File**: `app/views/signup.pug.fixed`
- **Action**: `/api/auth/signup`
- **Method**: `POST`
- **Fields**:
  - `email` (type: email, required)
  - `password` (type: password, required)
- **Expected Response**: OTP sent to email, redirect to /otp
- **Success**: Account created, OTP verification needed
- **Error**: Email already exists

### 3. OTP Verification Form (otp.pug)
- **File**: `app/views/otp.pug.fixed`
- **Action**: `/api/auth/verify-otp`
- **Method**: `POST`
- **Fields**:
  - `email` (type: hidden, required) - populated from URL query
  - `otp` (type: text, required) - 6-digit code
- **Expected Response**: Redirects to /profile
- **Success**: Email verified, account activated
- **Error**: Invalid or expired OTP

---

## Partner Auth Forms

### 1. Partner Login Form (partner_login.pug)
- **File**: `app/views/partner_login.pug.fixed`
- **Action**: `/api/partners/login`
- **Method**: `POST`
- **Fields**:
  - `email` (type: email, required)
  - `password` (type: password, required)
- **Expected Response**: JWT token, redirects to /partner/dashboard
- **Success**: Partner logged in
- **Error**: Email/password incorrect

### 2. Partner Signup Form (partner_signup.pug)
- **File**: `app/views/partner_signup.pug.fixed`
- **Action**: `/api/partners/signup`
- **Method**: `POST`
- **Fields**:
  - `name` (type: text, required)
  - `email` (type: email, required)
  - `password` (type: password, required)
  - `service_id` (type: select, required) - selected from services dropdown
  - `description` (type: textarea, required)
  - `hourly_rate` (type: text, required) - e.g., "£50/hour"
- **Expected Response**: OTP sent, redirect to /otp
- **Success**: Partner account created, pending email verification
- **Error**: Email exists, service not found

---

## Admin Auth Form

### 1. Admin Login Form (admin_login.pug)
- **File**: `app/views/admin_login.pug.fixed`
- **Action**: `/api/admin/login`
- **Method**: `POST`
- **Fields**:
  - `email` (type: email, required)
  - `password` (type: password, required)
- **Expected Response**: JWT token, redirects to /admin/dashboard
- **Success**: Admin logged in
- **Error**: Invalid credentials (hardcoded admin check)

---

## Implementation Checklist

### ✅ Verify Routes Match

**Customer Auth Routes** (should exist in `app/routes/auth.js`):
```javascript
POST /api/auth/login     ← login.pug submits here
POST /api/auth/signup    ← signup.pug submits here
POST /api/auth/verify-otp ← otp.pug submits here
```

**Partner Routes** (should exist in `app/routes/partner.js`):
```javascript
POST /api/partners/login ← partner_login.pug submits here
POST /api/partners/signup ← partner_signup.pug submits here
```

**Admin Routes** (should exist in `app/routes/admin.js`):
```javascript
POST /api/admin/login ← admin_login.pug submits here
```

### ✅ Verify Form Handling JavaScript

Each form needs JS handler (or express middleware handles submission):
- Check if `/public/js/main.js` prevents default and handles with fetch
- Or check if forms submit via traditional POST (page refresh)

### ✅ Verify Input Names Match Controller Expectations

**Example** - login.pug sends:
```javascript
{
  email: "user@example.com",
  password: "password123"
}
```

**Controller must expect**:
```javascript
const { email, password } = req.body;
```

NOT:
```javascript
const email = req.body.id; // ❌ WRONG - form sends `name` not `id`
```

---

## Common Issues & Solutions

### ❌ Issue: Form submits but nothing happens
**Check**:
- Form has `action="/api/auth/login"`
- Form has `method="POST"`
- Endpoint exists in routes

### ❌ Issue: "undefined" values in controller
**Check**:
- Input has `name="email"` (not just `id="email"`)
- Controller reads from `req.body.email` (matches form's `name`)

### ❌ Issue: Admin dashboard looks broken
**Solution**: Applied in `admin_dashboard.pug.fixed`
- Changed from full HTML to `extends layout`
- Now renders within master layout
- Preserves admin panel styling

### ❌ Issue: Partner signup missing fields
**Check**:
- All 6 fields present: name, email, password, service_id, description, hourly_rate
- Service dropdown populated from controller (or hardcoded)
- Hidden email field in OTP form is populated from URL

---

## Files to Replace

1. **`app/views/login.pug`** ← Replace with `login.pug.fixed`
2. **`app/views/signup.pug`** ← Replace with `signup.pug.fixed`
3. **`app/views/otp.pug`** ← Replace with `otp.pug.fixed`
4. **`app/views/partner_login.pug`** ← Replace with `partner_login.pug.fixed`
5. **`app/views/partner_signup.pug`** ← Replace with `partner_signup.pug.fixed`
6. **`app/views/admin_login.pug`** ← Replace with `admin_login.pug.fixed`
7. **`app/views/admin_dashboard.pug`** ← Replace with `admin_dashboard.pug.fixed`
8. **`app/views/layout.pug`** ← Replace with `layout.pug.fixed` (optional but recommended)

## Implementation Command (Bash/PowerShell)

### Option 1: Selective Replace (Recommended)
```bash
# Backup originals first
cp app/views/login.pug app/views/login.pug.bak
cp app/views/signup.pug app/views/signup.pug.bak
# ... repeat for all files

# Replace with fixed versions
cp app/views/login.pug.fixed app/views/login.pug
cp app/views/signup.pug.fixed app/views/signup.pug
# ... repeat for all files
```

### Option 2: PowerShell (Windows)
```powershell
# Copy originals as backup
Copy-Item "app\views\login.pug" "app\views\login.pug.bak"
Copy-Item "app\views\signup.pug" "app\views\signup.pug.bak"
Copy-Item "app\views\otp.pug" "app\views\otp.pug.bak"
Copy-Item "app\views\partner_login.pug" "app\views\partner_login.pug.bak"
Copy-Item "app\views\partner_signup.pug" "app\views\partner_signup.pug.bak"
Copy-Item "app\views\admin_login.pug" "app\views\admin_login.pug.bak"
Copy-Item "app\views\admin_dashboard.pug" "app\views\admin_dashboard.pug.bak"

# Replace with fixed versions
Copy-Item "app\views\login.pug.fixed" "app\views\login.pug" -Force
Copy-Item "app\views\signup.pug.fixed" "app\views\signup.pug" -Force
Copy-Item "app\views\otp.pug.fixed" "app\views\otp.pug" -Force
Copy-Item "app\views\partner_login.pug.fixed" "app\views\partner_login.pug" -Force
Copy-Item "app\views\partner_signup.pug.fixed" "app\views\partner_signup.pug" -Force
Copy-Item "app\views\admin_login.pug.fixed" "app\views\admin_login.pug" -Force
Copy-Item "app\views\admin_dashboard.pug.fixed" "app\views\admin_dashboard.pug" -Force
```

---

## Verification After Implementation

1. **Start the app**: `npm start` or `docker compose up`
2. **Test customer login**: Go to `/login`, verify form submits to `/api/auth/login`
3. **Test customer signup**: Go to `/signup`, verify form submits to `/api/auth/signup`
4. **Test partner login**: Go to `/partner/login`, verify form submits to `/api/partners/login`
5. **Test partner signup**: Go to `/partner/signup`, verify all fields present
6. **Test admin login**: Go to `/admin`, verify form submits to `/api/admin/login`
7. **Test OTP form**: After signup, verify OTP form submits to `/api/auth/verify-otp`
8. **Check console**: No Pug syntax errors
9. **Check Network tab**: Forms POST to correct endpoints

---

**Pug View System - Form Mapping Complete**
