# Project User Stories & Full File Distribution

This document assigns every file in the codebase to a specific team member based on the 27 User Stories.

---

## 1. Vatsal - Customer Core & Discovery
**Focus:** Stories 1, 2, 3, 4, 5, 6 (Customer UI, Search, Filter, Profile, Login)

| Path | File Name |
|:---|:---|
| **Views** | `views/index.pug`, `views/services.pug`, `views/partners.pug`, `views/partner_profile_view.pug`, `views/booking.pug`, `views/profile.pug`, `views/user/login.pug`, `views/user/signup.pug`, `views/layout.pug` |
| **Controllers** | `controllers/user.controller.js`, `controllers/profile.controller.js` |
| **Models** | `models/user.model.js`, `models/profile.model.js`, `models/db.js` |
| **Routes** | `routes/auth.routes.js`, `routes/profile.routes.js` |
| **Public** | `public/js/main.js`, `public/css/style.css` |

---

## 2. Vidhi - Onboarding & Transactions
**Focus:** Stories 7, 8, 9, 10, 11, 12 (Booking status, Payment, Reviews, OTP, Documents)

| Path | File Name |
|:---|:---|
| **Views** | `views/booking_details.pug`, `views/user/otp.pug`, `views/partner/signup.pug`, `views/partner/login.pug`, `views/partner/upload_documents.pug` |
| **Controllers** | `controllers/payment.controller.js`, `controllers/review.controller.js`, `controllers/partner_document.controller.js` |
| **Models** | `models/payment.model.js`, `models/review.model.js`, `models/partner_document.model.js` |
| **Routes** | `routes/payment.routes.js`, `routes/review.routes.js` |
| **Services** | `services/email.service.js` |

---

## 3. Abhishek - Partner Management
**Focus:** Stories 13, 14, 15, 16, 17 (Partner Services, Pricing, Availability, Scheduling)

| Path | File Name |
|:---|:---|
| **Views** | `views/partner/manage_services.pug`, `views/partner/partner_bookings.pug`, `views/partner/partner_profile.pug`, `views/category_services.pug` |
| **Controllers** | `controllers/partner_service.controller.js`, `controllers/partner_availability.controller.js`, `controllers/booking.controller.js`, `controllers/partner.controller.js` |
| **Models** | `models/partner_service.model.js`, `models/partner_availability.model.js`, `models/booking.model.js`, `models/partner.model.js` |
| **Routes** | `routes/booking.routes.js`, `routes/partner.routes.js` |
| **Public** | `public/partner/partner.js`, `public/partner/partner.css` |

---

## 4. Surabh - Safety & Earnings
**Focus:** Stories 18, 19, 20, 21, 22 (Financials, Chat, Provider Approval, Safety)

| Path | File Name |
|:---|:---|
| **Views** | `views/partner/partner_dashboard.pug`, `views/partner/partner_layout.pug`, `views/admin/admin_partners.pug`, `views/admin/admin_users.pug` |
| **Controllers** | `controllers/withdrawal.controller.js`, `controllers/chat.controller.js`, `controllers/admin.controller.js` |
| **Models** | `models/withdrawal_request.model.js`, `models/chat.model.js`, `models/admin.model.js` |
| **Routes** | `routes/withdrawal.routes.js`, `routes/chat.routes.js`, `routes/admin.routes.js` |
| **Config** | `config/db.config.js` |

---

## 5. Susan - Admin Operations
**Focus:** Stories 23, 24, 25, 26, 27 (Categories, Monitoring, Disputes, Analytics)

| Path | File Name |
|:---|:---|
| **Views** | `views/admin/admin_categories.pug`, `views/admin/admin_bookings.pug`, `views/admin/admin_disputes.pug`, `views/admin/admin_payments.pug`, `views/admin/admin_analytics.pug`, `views/admin/admin_dashboard.pug`, `views/admin/admin_withdrawals.pug`, `views/admin/admin_layout.pug`, `views/admin/admin_login.pug`, `views/admin/sidebar.pug` |
| **Controllers** | `controllers/dispute.controller.js`, `controllers/service.controller.js` |
| **Models** | `models/dispute.model.js`, `models/service_category.model.js`, `models/service.model.js` |
| **Routes** | `routes/dispute.routes.js`, `routes/service.routes.js` |
| **Public** | `public/admin/admin.js`, `public/admin/admin.css` |
