# OTP & Notification System - Quick Start

## 🚀 Get Running in 3 Steps

### Step 1: Apply Database Migration
```bash
# Windows (with MySQL installed):
mysql -u root -p service_booking < db/migration-otp-notifications.sql

# Or import directly in phpMyAdmin:
# 1. Open phpMyAdmin (http://localhost:8080)
# 2. Select database: service_booking
# 3. Click "Import"
# 4. Select: db/migration-otp-notifications.sql
# 5. Click "Go"
```

### Step 2: Test Signup Flow
```bash
# In your browser or with curl:

# 1. Sign up customer
POST http://localhost:3000/api/auth/customer/signup
{
  "email": "customer@test.com",
  "password": "Test@1234"
}

# Check server console for OTP output:
# ============================================================
# 📧 OTP MOCK EMAIL (Development)
# ...
# Your OTP code is: 123456
# ============================================================

# 2. Verify OTP (use code from console)
POST http://localhost:3000/api/auth/customer/verify-otp
{
  "email": "customer@test.com",
  "otp": "123456"
}

# 3. Login
POST http://localhost:3000/api/auth/customer/login
{
  "email": "customer@test.com",
  "password": "Test@1234"
}
```

### Step 3: View Notifications in Dashboard

Add this to `app/views/customer_dashboard.pug`:
```pug
div.notifications-section
    include ./partials/notifications.pug
```

Then refresh: `http://localhost:3000/customer/dashboard`

---

## 📊 What's Working Now

| Feature | Status | Details |
|---------|--------|---------|
| Customer OTP on signup | ✅ Live | 6-digit OTP, 5-min expiry |
| OTP verification | ✅ Live | Marks user as verified |
| Notifications DB table | ✅ Live | Stores all events |
| Notification API | ✅ Live | `/api/notifications/customer/*` |
| Notification UI | ✅ Live | Auto-refresh every 30s |
| Email sending | ⚠️ Mock | Prints to console (dev only) |
| Partner OTP | ⏳ Ready | Just need to wire up in partner.controller.js |

---

## 🔍 Verify Installation

Run this in MySQL to confirm schema:
```sql
-- Check otps table has expires_at
SHOW COLUMNS FROM otps;

-- Check notifications table exists
SHOW TABLES LIKE 'notifications';

-- Check users has is_verified
SHOW COLUMNS FROM users;
```

Expected output:
```
✅ otps table: should have 'expires_at' column
✅ notifications table: should exist with 9 columns
✅ users table: should have 'is_verified' column (boolean)
```

---

## 🧪 End-to-End Test

1. **Browser Test:**
   - Go to: http://localhost:3000/customer/signup
   - Enter: email + password
   - Check server console for OTP
   - Enter OTP
   - Dashboard should show notification: "Signup Verified"

2. **API Test:**
   ```bash
   # After signup, get notifications:
   curl -X GET http://localhost:3000/api/notifications/customer/notifications \
     -H "Authorization: Bearer <your-token-from-login>"
   
   # Should return array with:
   # - notification_type: "otp_sent"
   # - notification_type: "signup_verified"
   ```

3. **Create Booking Test:**
   - Login as customer
   - Create a booking
   - Check notifications: should see "Booking Created"
   - Check partner notifications: should also see "Booking Created"

---

## 📝 Files You Modified

- ✅ `app/app.js` - Added notification routes
- ✅ `app/controllers/user.controller.js` - Uses OTP service
- ✅ `app/controllers/booking.controller.js` - Logs notifications
- ✅ `app/models/user.model.js` - Verification methods

## 📝 Files You Created

- ✅ `app/services/otp-notification.service.js`
- ✅ `app/models/notification.model.js`
- ✅ `app/controllers/notification.controller.js`
- ✅ `app/routes/notification.routes.js`
- ✅ `app/views/partials/notifications.pug`
- ✅ `db/migration-otp-notifications.sql`

---

## 🆘 Troubleshooting

### "OTP not showing in console"
- Check server is running with: `npm start` or `node index.js`
- Make sure you're looking at the **server** console, not browser console

### "Verify OTP button doesn't work"
- Make sure migration was applied: `mysql -u root -p service_booking < db/migration-otp-notifications.sql`
- Check browser console for errors (F12)
- Check server logs for 404 errors

### "Notifications not showing in dashboard"
- Add `include ./partials/notifications.pug` to your dashboard Pug file
- Make sure JWT token is stored in localStorage
- Refresh page and check browser Network tab for API calls

### "Migration fails"
- Make sure you're in the project directory
- Check MySQL is running: `mysql -u root -p` then `quit`
- Try running migration from MySQL directly via phpMyAdmin

---

## 🎯 What's Next (Optional)

### Partner OTP (Easy - 10 mins)
In `app/controllers/partner.controller.js`, update signup to use OTP service:
```javascript
const { createOTP } = require('../services/otp-notification.service.js');

// After creating partner, add:
createOTP(email);
```

### Real Email (Medium - 30 mins)
1. Get Gmail app password (or SendGrid key)
2. Add to `.env`: `EMAIL_PASSWORD=your-password`
3. Replace `sendOTPMock()` with real email in `otp-notification.service.js`

### More Notifications (Easy - 5 mins each)
In relevant controllers, add:
```javascript
const { logPartnerNotification } = require('../services/otp-notification.service.js');

// Log payment received
logPartnerNotification(partnerId, 'payment_received', {
    title: 'Payment Received',
    message: `₹${amount} received`,
    related_id: bookingId,
    related_type: 'payment'
});
```

---

## 📞 Support

**Having issues?**

1. Check the main guide: `OTP_NOTIFICATION_IMPLEMENTATION.md`
2. Verify database migration ran: check phpMyAdmin
3. Check server console for error messages
4. Check browser console (F12) for API errors

**Key diagnostic queries:**
```sql
-- Check notifications were created
SELECT * FROM notifications LIMIT 5;

-- Check OTP expiry
SELECT id, email, created_at, expires_at FROM otps ORDER BY id DESC LIMIT 1;

-- Check user verification status
SELECT id, email, is_verified FROM users;
```

---

**Ready to go! 🎉**
