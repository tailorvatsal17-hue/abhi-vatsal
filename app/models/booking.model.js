const sql = require('./db.js');

// constructor
const Booking = function(booking) {
    this.user_id = booking.user_id;
    this.partner_id = booking.partner_id;
    this.service_id = booking.service_id;
    this.booking_date = booking.booking_date;
    this.booking_time = booking.booking_time;
    this.address_id = booking.address_id;
    this.total_cost = booking.total_cost;
};

Booking.create = (newBooking, result) => {
    sql.query("INSERT INTO bookings SET ?", newBooking, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        console.log("created booking: ", { id: res.insertId, ...newBooking });
        result(null, { id: res.insertId, ...newBooking });
    });
};

Booking.getById = (id, result) => {
    sql.query("SELECT * FROM bookings WHERE id = ?", [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.length) {
            console.log("found booking: ", res[0]);
            result(null, res[0]);
            return;
        }

        // not found Booking with the id
        result({ kind: "not_found" }, null);
    });
};

Booking.cancel = (id, result) => {
    sql.query(
        "UPDATE bookings SET status = 'Cancelled' WHERE id = ?",
        [id],
        (err, res) => {
            if (err) {
                console.log("error: ", err);
                result(err, null);
                return;
            }

            if (res.affectedRows == 0) {
                // not found Booking with the id
                result({ kind: "not_found" }, null);
                return;
            }

            console.log("cancelled booking: ", { id: id });
            result(null, { id: id });
        }
    );
};

module.exports = Booking;
