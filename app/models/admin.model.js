const sql = require('./db.js');

// constructor
const Admin = function(admin) {
    this.email = admin.email;
    this.password = admin.password;
};

Admin.findByEmail = (email, result) => {
    sql.query(`SELECT * FROM admins WHERE email = '${email}'`, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.length) {
            console.log("found admin: ", res[0]);
            result(null, res[0]);
            return;
        }

        // not found Admin with the email
        result({ kind: "not_found" }, null);
    });
};

Admin.getAllUsers = (result) => {
    sql.query("SELECT * FROM users", (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(null, err);
            return;
        }

        console.log("users: ", res);
        result(null, res);
    });
};

Admin.getAllPartners = (result) => {
    sql.query("SELECT * FROM partners", (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(null, err);
            return;
        }

        console.log("partners: ", res);
        result(null, res);
    });
};

Admin.approvePartner = (id, result) => {
    sql.query(
        "UPDATE partners SET is_approved = true WHERE id = ?",
        id,
        (err, res) => {
            if (err) {
                console.log("error: ", err);
                result(null, err);
                return;
            }

            if (res.affectedRows == 0) {
                // not found Partner with the id
                result({ kind: "not_found" }, null);
                return;
            }

            console.log("approved partner: ", { id: id });
            result(null, { id: id });
        }
    );
};

Admin.updatePartner = (id, partner, result) => {
    sql.query(
        "UPDATE partners SET description = ?, pricing = ?, is_approved = ? WHERE id = ?",
        [partner.description, partner.pricing, partner.is_approved, id],
        (err, res) => {
            if (err) {
                console.log("error: ", err);
                result(null, err);
                return;
            }

            if (res.affectedRows == 0) {
                result({ kind: "not_found" }, null);
                return;
            }

            console.log("updated partner: ", { id: id, ...partner });
            result(null, { id: id, ...partner });
        }
    );
};

Admin.createService = (newService, result) => {
    sql.query("INSERT INTO services SET ?", newService, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        console.log("created service: ", { id: res.insertId, ...newService });
        result(null, { id: res.insertId, ...newService });
    });
};

Admin.updateService = (id, service, result) => {
    sql.query(
        "UPDATE services SET name = ?, description = ?, image = ? WHERE id = ?",
        [service.name, service.description, service.image, id],
        (err, res) => {
            if (err) {
                console.log("error: ", err);
                result(null, err);
                return;
            }

            if (res.affectedRows == 0) {
                // not found Service with the id
                result({ kind: "not_found" }, null);
                return;
            }

            console.log("updated service: ", { id: id, ...service });
            result(null, { id: id, ...service });
        }
    );
};

Admin.deleteService = (id, result) => {
    sql.query("DELETE FROM services WHERE id = ?", id, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(null, err);
            return;
        }

        if (res.affectedRows == 0) {
            // not found Service with the id
            result({ kind: "not_found" }, null);
            return;
        }

        console.log("deleted service with id: ", id);
        result(null, res);
    });
};

Admin.getAllBookings = (result) => {
    sql.query("SELECT * FROM bookings", (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(null, err);
            return;
        }

        console.log("bookings: ", res);
        result(null, res);
    });
};

Admin.cancelBooking = (id, result) => {
    sql.query(
        "UPDATE bookings SET status = 'Cancelled' WHERE id = ?",
        id,
        (err, res) => {
            if (err) {
                console.log("error: ", err);
                result(null, err);
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

Admin.updateBookingStatus = (id, status, result) => {
    sql.query(
        "UPDATE bookings SET status = ? WHERE id = ?",
        [status, id],
        (err, res) => {
            if (err) {
                console.log("error: ", err);
                result(null, err);
                return;
            }

            if (res.affectedRows == 0) {
                // not found Booking with the id
                result({ kind: "not_found" }, null);
                return;
            }

            console.log("updated booking status: ", { id: id, status: status });
            result(null, { id: id, status: status });
        }
    );
};

module.exports = Admin;
