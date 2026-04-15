const Review = require('../models/review.model.js');
const Booking = require('../models/booking.model.js');

exports.create = (req, res) => {
    // Validate request
    if (!req.body || !req.body.booking_id || !req.body.rating) {
        return res.status(400).send({
            message: "Content cannot be empty and must include booking_id and rating!"
        });
    }

    const { booking_id, rating, comment } = req.body;
    const user_id = req.userId;

    if (rating < 1 || rating > 5) {
        return res.status(400).send({ message: "Rating must be between 1 and 5." });
    }

    // Check if booking is completed
    Booking.getById(booking_id, (err, booking) => {
        if (err) {
            if (err.kind === "not_found") {
                return res.status(404).send({ message: "Booking not found." });
            } else {
                return res.status(500).send({ message: "Error retrieving booking." });
            }
        }

        if (booking.user_id !== user_id) {
            return res.status(403).send({ message: "Access denied. You can only review your own bookings." });
        }

        if (booking.status !== 'Completed') {
            return res.status(400).send({ message: "You can only review completed services." });
        }

        // Check if review already exists
        Review.findByBookingId(booking_id, (err, existingReview) => {
            if (!err) {
                return res.status(400).send({ message: "You have already reviewed this service." });
            }

            // Create a Review
            const review = new Review({
                booking_id: booking_id,
                user_id: user_id,
                partner_id: booking.partner_id,
                rating: rating,
                comment: comment || ""
            });

            // Save Review in the database
            Review.create(review, (err, data) => {
                if (err) {
                    res.status(500).send({
                        message: err.message || "Some error occurred while creating the Review."
                    });
                } else res.send(data);
            });
        });
    });
};

exports.getByBookingId = (req, res) => {
    Review.findByBookingId(req.params.bookingId, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: `Not found Review with booking_id ${req.params.bookingId}.`
                });
            } else {
                res.status(500).send({
                    message: "Error retrieving Review with booking_id " + req.params.bookingId
                });
            }
        } else res.send(data);
    });
};

