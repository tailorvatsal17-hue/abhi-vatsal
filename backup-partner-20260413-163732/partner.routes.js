module.exports = app => {
    const router = require('express').Router();
    const partners = require('../controllers/partner.controller.js');
    const partnerAvailability = require('../controllers/partner_availability.controller.js');
    const { verifyToken } = require('../middleware/authJwt');
    const requirePartner = require('../middleware/requirePartner');

    // Public routes (no token required)
    router.post('/signup', partners.signup);
    router.post('/login', partners.login);

    // Protected routes (token + partner role required)
    router.use(verifyToken);
    router.use(requirePartner);

    // Get partner dashboard
    router.get('/dashboard', partners.getDashboard);

    // Get partner profile
    router.get('/:id', partners.getProfile);

    // Get partner bookings
    router.get('/:id/bookings', partners.getBookings);

    // Update partner profile
    router.put('/:id', partners.updateProfile);

    // Accept booking
    router.put('/bookings/:id/accept', partners.acceptBooking);

    // Reject booking
    router.put('/bookings/:id/reject', partners.rejectBooking);

    // Logout
    router.post('/logout', partners.logout);

    // Partner Availability Routes
    router.post('/availability', partnerAvailability.create);
    router.get('/availability', partnerAvailability.findAllByPartner);
    router.get('/availability/:id', partnerAvailability.findOne);
    router.put('/availability/:id', partnerAvailability.update);
    router.delete('/availability/:id', partnerAvailability.delete);

    app.use('/api/partners', router);
};
