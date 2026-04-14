const Booking = require('../models/booking.model.js');
const { logUserNotification, logPartnerNotification, notificationEvents, getNotificationText } = require('../services/otp-notification.service.js');

// Create a new booking
exports.create = (req, res) => {
    // Validate request
    if (!req.body) {
        return res.status(400).send({
            message: "Content can not be empty!"
        });
    }

    const { partner_id, service_id, booking_date, booking_time, address_id, total_cost, is_first_booking } = req.body;
    const user_id = req.userId; // From JWT token

    // Validate inputs
    if (!partner_id || !service_id || !booking_date || !booking_time || !address_id || !total_cost) {
        return res.status(400).send({
            message: "Please provide all required fields: partner_id, service_id, booking_date, booking_time, address_id, total_cost"
        });
    }

    // Validate booking_date is not in the past
    const bookingDate = new Date(booking_date);
    if (bookingDate < new Date()) {
        return res.status(400).send({
            message: "Booking date cannot be in the past."
        });
    }

    // Validate cost is positive
    if (total_cost <= 0) {
        return res.status(400).send({
            message: "Total cost must be greater than 0."
        });
    }

    let final_cost = total_cost;
    // 5% handling fee
    const handling_fee = total_cost * 0.05;
    // 2% government tax
    const tax = total_cost * 0.02;

    if (is_first_booking) {
        final_cost = total_cost + tax;
    } else {
        final_cost = total_cost + handling_fee + tax;
    }

    // Create a Booking
    const booking = new Booking({
        user_id,
        partner_id,
        service_id,
        booking_date,
        booking_time,
        address_id,
        total_cost: final_cost
    });

    // Save Booking in the database
    Booking.create(booking, (err, data) => {
        if (err) {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the Booking."
            });
        } else {
            // Log notification for customer: booking created
            logUserNotification(user_id, notificationEvents.BOOKING_CREATED, {
                title: 'Booking Created',
                message: 'Your booking has been created and is awaiting partner confirmation.',
                related_id: data.id,
                related_type: 'booking'
            });

            // Log notification for partner: new booking received
            logPartnerNotification(partner_id, notificationEvents.BOOKING_CREATED, {
                title: 'New Booking',
                message: 'You have received a new booking request.',
                related_id: data.id,
                related_type: 'booking'
            });

            console.log('Booking created successfully:', data);
            res.status(201).send(data);
        }
    });
};

// Get a booking by id
exports.getById = (req, res) => {
    const bookingId = req.params.id;
    const userId = req.userId; // From JWT token

    Booking.getById(bookingId, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: `Not found Booking with id ${bookingId}.`
                });
            } else {
                res.status(500).send({
                    message: "Error retrieving Booking with id " + bookingId
                });
            }
        } else {
            // Authorization check: verify user owns this booking
            if (data.user_id !== userId) {
                return res.status(403).send({
                    message: "Access denied. You can only view your own bookings."
                });
            }
            res.send(data);
        }
    });
};

// Cancel a booking
exports.cancel = (req, res) => {
    const bookingId = req.params.id;
    const userId = req.userId; // From JWT token

    // First, get the booking to check ownership and status
    Booking.getById(bookingId, (err, booking) => {
        if (err) {
            if (err.kind === "not_found") {
                return res.status(404).send({
                    message: `Not found Booking with id ${bookingId}.`
                });
            } else {
                return res.status(500).send({
                    message: "Error retrieving Booking"
                });
            }
        }

        // Authorization check: verify user owns this booking
        if (booking.user_id !== userId) {
            return res.status(403).send({
                message: "Access denied. You can only cancel your own bookings."
            });
        }

        // Check if booking can be cancelled (not already completed/cancelled)
        if (booking.status === 'Completed') {
            return res.status(400).send({
                message: "Cannot cancel a completed booking."
            });
        }

        if (booking.status === 'Cancelled') {
            return res.status(400).send({
                message: "This booking is already cancelled."
            });
        }

        // Check if booking is at least 24 hours away
        const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
        const hoursUntilBooking = (bookingDateTime - new Date()) / (1000 * 60 * 60);
        
        if (hoursUntilBooking < 24) {
            return res.status(400).send({
                message: "Bookings can only be cancelled at least 24 hours before the scheduled time."
            });
        }

        // Proceed with cancellation
        Booking.cancel(bookingId, (err, data) => {
            if (err) {
                if (err.kind === "not_found") {
                    res.status(404).send({
                        message: `Not found Booking with id ${bookingId}.`
                    });
                } else {
                    res.status(500).send({
                        message: "Error updating Booking with id " + bookingId
                    });
                }
            } else {
                res.send({ 
                    message: "Booking was cancelled successfully.",
                    bookingId: bookingId 
                });
            }
        });
    });
};
