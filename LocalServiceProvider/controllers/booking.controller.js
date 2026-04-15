const Booking = require('../models/booking.model.js');
const Partner = require('../models/partner.model.js');

// Create a new booking
exports.create = (req, res) => {
    // Validate request
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).send({
            message: "Content can not be empty!"
        });
    }

    const { partner_id, service_id, booking_date, booking_time, address_id, is_first_booking } = req.body;
    const user_id = req.userId; // Use userId from authenticated token

    // Robust boolean conversion
    const isFirst = String(is_first_booking) === 'true';

    if (!user_id) {
        return res.status(401).send({ message: "User not authenticated." });
    }

    // Backend Date Validation
    const selectedDate = new Date(booking_date);
    const today = new Date();
    today.setHours(0,0,0,0);
    if (selectedDate < today) {
        return res.status(400).send({
            message: "Please select a current or future date."
        });
    }

    // Fetch actual price from Partner model to prevent price manipulation
    Partner.findById(partner_id, (err, partner) => {
        if (err) {
            if (err.kind === "not_found") {
                return res.status(404).send({ message: `Partner with id ${partner_id} not found.` });
            } else {
                return res.status(500).send({ message: "Error retrieving Partner info." });
            }
        }

        const basePrice = parseFloat(partner.pricing);
        
        // Recalculate cost on backend
        let final_cost = basePrice;
        const handling_fee = basePrice * 0.05;
        const tax = basePrice * 0.02;

        if (isFirst) {
            final_cost = basePrice + tax;
        } else {
            final_cost = basePrice + handling_fee + tax;
        }

        // Check availability
        Booking.checkAvailability(partner_id, booking_date, booking_time, (err, isAvailable) => {
            if (err) {
                return res.status(500).send({ message: "Error checking availability." });
            }

            if (!isAvailable) {
                return res.status(400).send({ message: "The selected time slot is either already booked or not in the professional's schedule." });
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
                    console.log('Sending email confirmation to user...');
                    res.send(data);
                }
            });
        });
    });
};

// Get a booking by id
exports.getById = (req, res) => {
    Booking.getById(req.params.id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: `Not found Booking with id ${req.params.id}.`
                });
            } else {
                res.status(500).send({
                    message: "Error retrieving Booking with id " + req.params.id
                });
            }
        } else {
            // Ownership check
            if (data.user_id != req.userId) {
                return res.status(403).send({
                    message: "Access denied: This booking does not belong to you."
                });
            }
            res.send(data);
        }
    });
};

// Cancel a booking
exports.cancel = (req, res) => {
    // Check if the booking exists and belongs to the user
    Booking.getById(req.params.id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                return res.status(404).send({ message: `Not found Booking with id ${req.params.id}.` });
            } else {
                return res.status(500).send({ message: "Error retrieving Booking with id " + req.params.id });
            }
        }

        if (data.user_id != req.userId) {
            return res.status(403).send({ message: "Access denied: You cannot cancel this booking." });
        }

        // Status check: Only allow cancellation for 'Pending' or 'Confirmed'
        if (data.status !== 'Pending' && data.status !== 'Confirmed') {
            return res.status(400).send({ 
                message: `Cannot cancel a booking that is already ${data.status}.` 
            });
        }

        Booking.cancel(req.params.id, (err, result) => {
            if (err) {
                res.status(500).send({ message: "Error updating Booking with id " + req.params.id });
            } else {
                res.send({ message: "Booking was cancelled successfully." });
            }
        });
    });
};
