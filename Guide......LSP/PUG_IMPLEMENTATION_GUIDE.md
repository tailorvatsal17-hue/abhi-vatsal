# Pug View System - Implementation Guide

**Status**: Ready to implement  
**Total Issues Found**: 8  
**Total Files Fixed**: 8  
**New Documentation**: 2 guides  
**Time to Implement**: ~15 minutes  

---

## 📋 Summary of Fixes

| # | File | Issue | Fix |
|---|------|-------|-----|
| 1 | `login.pug` | Missing action/method/names | Added action="/api/auth/login", method="POST", name attributes |
| 2 | `signup.pug` | Missing action/method/names | Added action="/api/auth/signup", method="POST", name attributes |
| 3 | `otp.pug` | Missing action/method, email hidden field wrong | Added action="/api/auth/verify-otp", method="POST", name="email" |
| 4 | `partner_login.pug` | Missing action/method/names | Added action="/api/partners/login", method="POST", name attributes |
| 5 | `partner_signup.pug` | Missing action/method/names, wrong field names | Added action="/api/partners/signup", method="POST", changed `id="pricing"` to `name="hourly_rate"` |
| 6 | `admin_login.pug` | Missing action/method/names | Added action="/api/admin/login", method="POST", name attributes |
| 7 | `admin_dashboard.pug` | Doesn't extend layout, full HTML file | Changed to extend layout, preserves all functionality |
| 8 | `layout.pug` | Minor improvements needed | Added message display block, improved nav structure |

---

## 🔧 Step-by-Step Implementation

### Step 1: Backup Original Files (CRITICAL)

**Windows PowerShell**:
```powershell
$filesToBackup = @(
    "app/views/login.pug",
    "app/views/signup.pug",
    "app/views/otp.pug",
    "app/views/partner_login.pug",
    "app/views/partner_signup.pug",
    "app/views/admin_login.pug",
    "app/views/admin_dashboard.pug",
    "app/views/layout.pug"
)

foreach ($file in $filesToBackup) {
    if (Test-Path $file) {
        Copy-Item $file "$file.bak-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Write-Host "✓ Backed up $file"
    }
}
```

**Git Command** (if using Git):
```bash
git add app/views/*.pug
git commit -m "Backup: Pug files before form fixes"
```

### Step 2: View Current Routes (Verify endpoints exist)

Check that these routes are defined in your codebase:

```bash
# PowerShell
Select-String -Path "app/routes/*.js" -Pattern "router\.(post|get)" | Select-Object Line | Sort-Object -Unique

# Bash
grep -r "router\.\(post\|get\)" app/routes/
```

**Expected endpoints**:
- ✅ `POST /api/auth/login`
- ✅ `POST /api/auth/signup`
- ✅ `POST /api/auth/verify-otp`
- ✅ `POST /api/partners/login`
- ✅ `POST /api/partners/signup`
- ✅ `POST /api/admin/login`

### Step 3: Replace Files

**Option A: Using PowerShell (Recommended for Windows)**

```powershell
# Create mapping of source to destination
$fileMap = @{
    "app/views/login.pug.fixed" = "app/views/login.pug"
    "app/views/signup.pug.fixed" = "app/views/signup.pug"
    "app/views/otp.pug.fixed" = "app/views/otp.pug"
    "app/views/partner_login.pug.fixed" = "app/views/partner_login.pug"
    "app/views/partner_signup.pug.fixed" = "app/views/partner_signup.pug"
    "app/views/admin_login.pug.fixed" = "app/views/admin_login.pug"
    "app/views/admin_dashboard.pug.fixed" = "app/views/admin_dashboard.pug"
    "app/views/layout.pug.fixed" = "app/views/layout.pug"
}

foreach ($source in $fileMap.Keys) {
    $dest = $fileMap[$source]
    if (Test-Path $source) {
        Copy-Item $source $dest -Force
        Write-Host "✓ Replaced $dest"
    } else {
        Write-Host "✗ Source not found: $source"
    }
}

Write-Host "`nAll files replaced successfully!"
```

**Option B: Manual (Visual Studio Code)**

1. Open each `.fixed` file in VS Code
2. Select all content (Ctrl+A)
3. Copy (Ctrl+C)
4. Open corresponding `.pug` file
5. Select all (Ctrl+A)
6. Paste (Ctrl+V)
7. Save (Ctrl+S)

### Step 4: Verify Syntax

**Check for Pug syntax errors**:

```bash
# PowerShell - check if npm pug-cli is installed
npm list -g pug-cli

# If not installed, install it
npm install -g pug-cli

# Validate each file
pug --validate app/views/login.pug
pug --validate app/views/signup.pug
pug --validate app/views/otp.pug
pug --validate app/views/partner_login.pug
pug --validate app/views/partner_signup.pug
pug --validate app/views/admin_login.pug
pug --validate app/views/admin_dashboard.pug
pug --validate app/views/layout.pug
```

### Step 5: Start Application

```bash
# Using Node directly
npm start

# Using Docker
docker compose down -v
docker compose up --build

# Or if using npm dev script
npm run dev
```

### Step 6: Test Each Form

**Test Customer Login**:
1. Go to `http://localhost:3000/login` (or your app URL)
2. Open browser DevTools (F12) → Network tab
3. Fill form: email=test@example.com, password=test123
4. Click "Login"
5. Verify Network tab shows:
   - Request to `POST /api/auth/login`
   - Request body contains `email` and `password` fields
   - Response status 200 or 401 (if auth fails)

**Test Customer Signup**:
1. Go to `http://localhost:3000/signup`
2. Open DevTools → Network tab
3. Fill form: email=newuser@example.com, password=test123
4. Click "Sign Up"
5. Verify request goes to `POST /api/auth/signup`

**Test Partner Login**:
1. Go to `http://localhost:3000/partner/login`
2. Fill and submit form
3. Verify request to `POST /api/partners/login`

**Test Partner Signup**:
1. Go to `http://localhost:3000/partner/signup`
2. Fill all fields (including dropdown)
3. Submit form
4. Verify request to `POST /api/partners/signup` with all fields

**Test Admin Login**:
1. Go to `http://localhost:3000/admin`
2. Fill form with admin credentials
3. Submit
4. Verify request to `POST /api/admin/login`

**Test OTP Verification**:
1. After signup, go to `http://localhost:3000/otp?email=test@example.com`
2. Verify hidden email field is populated
3. Enter OTP code (from email)
4. Submit
5. Verify request to `POST /api/auth/verify-otp` with `email` and `otp`

### Step 7: Check Console for Errors

**In browser DevTools**:
1. Press F12 → Console tab
2. Should show no red errors
3. Should show no Pug-related errors
4. Expected: May see CORS warnings (if API on different port), but no template errors

**Common errors to look for**:
- ❌ `Cannot read property 'each' of undefined` → Variable missing from controller
- ❌ `extends` not working → Check layout.pug path
- ❌ Syntax error in template → Check indentation (Pug uses 2-space indentation)

### Step 8: Verify Form Submission Data

**In browser DevTools → Network tab** (after submitting login form):

Click on the request to `/api/auth/login`:
- **Headers** tab: Should show `Content-Type: application/x-www-form-urlencoded` or `application/json`
- **Payload** tab: Should show `email: test@example.com` and `password: test123`

**NOT** `id: test@example.com` (that would mean form still using `id` instead of `name`)

---

## 📝 What Changed & Why

### login.pug Changes

**Before**:
```pug
form.login-form
    input(type="email", id="email")
    button(type="submit") Login
```

**After**:
```pug
form.login-form(action="/api/auth/login", method="POST")
    input(type="email", name="email", id="email", required)
    button(type="submit") Login
```

**Why**:
- ✅ `action="/api/auth/login"` - tells form where to POST data
- ✅ `method="POST"` - tells form to use POST (not GET)
- ✅ `name="email"` - data sent as `email` to server, NOT as `id`
- ✅ `required` - browser validates before submit

### partner_signup.pug Changes

**Before**:
```pug
input(type="text", id="pricing")
```

**After**:
```pug
input(type="text", name="hourly_rate", id="hourly_rate")
```

**Why**:
- ✅ Field name changed from `pricing` to `hourly_rate` (matches API expectation)
- ✅ `id` also changed to match (clearer variable naming)
- ✅ Form now sends `hourly_rate: "£50/hour"` instead of `pricing: ...`

### admin_dashboard.pug Changes

**Before**:
```pug
doctype html
html(lang="en")
    head
        // Complete HTML structure
```

**After**:
```pug
extends layout

block content
    div.admin-panel
        // Admin content only
```

**Why**:
- ✅ Uses layout for consistent header/footer
- ✅ Renders within main site template
- ✅ Cleaner code, less duplication
- ✅ Consistent with all other pages

---

## ✅ Verification Checklist

After implementing, verify:

- [ ] All 8 `.fixed` files replaced original `.pug` files
- [ ] Original files backed up with `.bak` suffix
- [ ] Application starts without Pug errors (`npm start` succeeds)
- [ ] Each login form submits to correct endpoint:
  - [ ] `/login` → `/api/auth/login`
  - [ ] `/partner/login` → `/api/partners/login`
  - [ ] `/admin` → `/api/admin/login`
- [ ] Each signup form submits to correct endpoint:
  - [ ] `/signup` → `/api/auth/signup`
  - [ ] `/partner/signup` → `/api/partners/signup`
- [ ] OTP form submits to `/api/auth/verify-otp`
- [ ] All forms include `name` attributes (not just `id`)
- [ ] Network DevTools shows correct POST data
- [ ] No red errors in browser console
- [ ] No Pug syntax errors
- [ ] Admin dashboard renders within layout
- [ ] Partner signup dropdown shows services

---

## 🆘 Troubleshooting

### Issue: "Cannot find module" or App won't start

**Solution**:
```bash
npm install
npm start
```

### Issue: Forms submit but go nowhere

**Check**:
1. Verify form has `action="/api/auth/login"` (or correct endpoint)
2. Verify form has `method="POST"`
3. Verify endpoint exists in `app/routes/auth.js` or similar

### Issue: Form data received as empty object `{}`

**Check**:
1. Verify input has `name="email"` (not just `id="email"`)
2. Verify middleware parses body: `app.use(express.json())` in `app.js`
3. Verify form sends data correctly (use Network tab to check)

### Issue: OTP email hidden field is empty

**Check**:
1. User accessing `/otp?email=test@example.com` (with query param)
2. JavaScript runs and populates field from URL
3. Hidden field has correct `name="email"`

### Issue: Partner signup missing services dropdown

**Check**:
1. Controller passes `services` to view: `res.render('partner_signup', { services: [...] })`
2. Template has correct `select(name="service_id", ...)`
3. Database has services in `services` table

### Issue: Admin dashboard looks broken or doesn't render

**Solution**:
1. Ensure `admin_dashboard.pug` extends layout
2. Check admin CSS file exists at `/admin/admin.css`
3. Verify admin.js loads without errors

---

## 🚀 Next Steps (After Pug Fixes)

1. **Test all auth flows end-to-end**
   - User signup → OTP → Login → Profile
   - Partner signup → OTP → Login → Dashboard
   - Admin login → Dashboard

2. **Check API responses** match Pug expectations
   - Login returns user data
   - Signup returns OTP status
   - Bookings API returns booking list

3. **Verify database operations** work correctly
   - Users created in database on signup
   - OTP codes sent and verified
   - Bookings displayed in profile

4. **Review error handling**
   - Duplicate email signup shows error
   - Wrong password login shows error
   - Missing fields show validation error

---

## 📞 Support

If issues arise during implementation:

1. Check browser DevTools → Console for errors
2. Check server logs for error messages
3. Use Network tab to verify requests/responses
4. Verify form `name` attributes match API expectations
5. Ensure routes exist in `app/routes/*.js`

---

**Pug View System - Ready for Implementation**  
**8 files fixed, 2 guides created, ~15 minutes to complete**
