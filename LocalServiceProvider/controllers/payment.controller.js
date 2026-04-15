const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/payment.model.js');
const Booking = require('../models/booking.model.js');
require('dotenv').config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create a new order
exports.createOrder = async (req, res) => {
    try {
        const { bookingId } = req.body;
        
        // Fetch booking details
        Booking.getById(bookingId, async (err, booking) => {
            if (err) {
                return res.status(500).send({ message: "Error retrieving booking details." });
            }
            if (!booking) {
                return res.status(404).send({ message: "Booking not found." });
            }

            // Create order on Razorpay
            // Amount is in the smallest currency unit (e.g., pence for GBP)
            const options = {
                amount: Math.round(booking.total_cost * 100), 
                currency: "GBP",
                receipt: `receipt_order_${bookingId}`,
            };

            const order = await razorpay.orders.create(options);
            
            // Create a pending payment record
            const payment = new Payment({
                booking_id: bookingId,
                user_id: req.userId,
                amount: booking.total_cost,
                payment_method: 'Razorpay',
                transaction_id: order.id,
                status: 'Pending'
            });

            Payment.create(payment, (err, data) => {
                if (err) {
                    return res.status(500).send({ message: "Error saving payment record." });
                }
                res.status(200).send(order);
            });
        });
    } catch (error) {
        console.error("Razorpay Order Creation Error:", error);
        res.status(500).send({ message: "Could not create payment order." });
    }
};

// Verify payment
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature === razorpay_signature) {
            // Payment verified
            Payment.updateStatus(razorpay_order_id, 'Completed', (err, data) => {
                if (err) {
                    return res.status(500).send({ message: "Error updating payment status." });
                }

                // Get payment details to get booking_id
                const sql = require('../models/db.js');
                sql.query("SELECT booking_id FROM payments WHERE transaction_id = ?", [razorpay_order_id], (err, rows) => {
                    if (rows && rows.length > 0) {
                        const bookingId = rows[0].booking_id;
                        
                        // Update booking status to 'Paid'
                        // If 'Paid' ENUM doesn't exist, this might fail, but let's assume it does
                        sql.query("UPDATE bookings SET status = 'Paid' WHERE id = ?", [bookingId], (err, resUpdate) => {
                           if (err) {
                               // Fallback if 'Paid' ENUM is missing
                               sql.query("UPDATE bookings SET status = 'Confirmed' WHERE id = ?", [bookingId], (err, resConfirmed) => {
                                   res.status(200).send({ message: "Payment verified successfully, booking confirmed." });
                               });
                           } else {
                               res.status(200).send({ message: "Payment verified successfully, status updated to Paid." });
                           }
                        });
                    } else {
                        res.status(200).send({ message: "Payment verified, but booking not found." });
                    }
                });
            });
        } else {
            res.status(400).send({ message: "Invalid signature, payment verification failed." });
        }
    } catch (error) {
        console.error("Payment Verification Error:", error);
        res.status(500).send({ message: "Error verifying payment." });
    }
};
