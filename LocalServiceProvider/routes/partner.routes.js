module.exports = app => {
    const router = require('express').Router();
    const partners = require('../controllers/partner.controller.js');
    const partnerAvailability = require('../controllers/partner_availability.controller.js');
    const partnerDocuments = require('../controllers/partner_document.controller.js');
    const partnerServices = require('../controllers/partner_service.controller.js');
    const { verifyToken } = require('../middleware/authJwt');

    // Partner Availability Management (Prioritized)
    router.get('/availability', verifyToken, partnerAvailability.findAllByPartner);
    router.post('/availability', verifyToken, partnerAvailability.create);
    router.get('/availability/:id', verifyToken, partnerAvailability.findOne);
    router.put('/availability/:id', verifyToken, partnerAvailability.update);
    router.delete('/availability/:id', verifyToken, partnerAvailability.delete);

    // Public routes
    router.get('/', partners.search);
    router.post('/signup', partners.signup);
    router.post('/verify-otp', partners.verifyOtp);
    router.post('/login', partners.login);
    router.get('/:partnerId/availability', partnerAvailability.getAvailabilityByPartnerId);

    // Protected routes (token required)
    router.use(verifyToken); 

    // Get partner profile
    router.get('/:id', partners.getProfile);

    // Get partner bookings
    router.get('/:id/bookings', partners.getBookings);

    // Update partner profile
    router.put('/:id', partners.updateProfile);

    // Unified Booking Status Actions
    router.put('/bookings/:id/accept', partners.updateBookingStatus);
    router.put('/bookings/:id/reject', partners.updateBookingStatus);
    router.put('/bookings/:id/status', partners.updateBookingStatus);

    // Partner Document Routes
    router.post('/documents/upload', partnerDocuments.uploadDocument);
    router.get('/documents/my', partnerDocuments.getPartnerDocuments);

    // Partner Service Management
    router.post('/services', partnerServices.addService);
    router.get('/services/my', partnerServices.getMyServices);
    router.delete('/services/:id', partnerServices.deleteService);

    app.use('/api/partners', router);
};
