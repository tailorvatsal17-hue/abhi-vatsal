module.exports = app => {
    const router = require('express').Router();
    const users = require('../controllers/user.controller.js');
    const partners = require('../controllers/partner.controller.js');
    const admins = require('../controllers/admin.controller.js');
    const { verifyToken } = require('../middleware/authJwt');
    const requireCustomer = require('../middleware/requireCustomer');
    const requirePartner = require('../middleware/requirePartner');
    const requireAdmin = require('../middleware/requireAdmin');

    // ===== CUSTOMER AUTH ROUTES =====
    router.post('/customer/signup', users.signup);
    router.post('/customer/login', users.login);
    router.post('/customer/verify-otp', users.verifyOtp);
    router.post('/customer/logout', verifyToken, requireCustomer, users.logout);

    // ===== PARTNER AUTH ROUTES =====
    router.post('/partner/signup', partners.signup);
    router.post('/partner/login', partners.login);
    router.post('/partner/logout', verifyToken, requirePartner, partners.logout);

    // ===== ADMIN AUTH ROUTES =====
    router.post('/admin/login', admins.login);
    router.post('/admin/logout', verifyToken, requireAdmin, admins.logout);

    app.use('/api/auth', router);
};
