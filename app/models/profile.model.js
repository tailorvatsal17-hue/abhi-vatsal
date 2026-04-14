const sql = require('./db.js');

const Profile = {};

Profile.getProfile = (id, result) => {
    sql.query(`SELECT id, email, created_at FROM users WHERE id = ${id}`, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.length) {
            console.log("found user: ", res[0]);
            result(null, res[0]);
            return;
        }

        // not found User with the id
        result({ kind: "not_found" }, null);
    });
};

Profile.updateProfile = (id, user, result) => {
    sql.query(
        "UPDATE users SET email = ? WHERE id = ?",
        [user.email, id],
        (err, res) => {
            if (err) {
                console.log("error: ", err);
                result(null, err);
                return;
            }

            if (res.affectedRows == 0) {
                // not found User with the id
                result({ kind: "not_found" }, null);
                return;
            }

            console.log("updated user: ", { id: id, ...user });
            result(null, { id: id, ...user });
        }
    );
};

Profile.getAddresses = (userId, result) => {
    sql.query(`SELECT * FROM addresses WHERE user_id = ${userId}`, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        console.log("addresses: ", res);
        result(null, res);
    });
};

Profile.addAddress = (newAddress, result) => {
    sql.query("INSERT INTO addresses SET ?", newAddress, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        console.log("created address: ", { id: res.insertId, ...newAddress });
        result(null, { id: res.insertId, ...newAddress });
    });
};

Profile.updateAddress = (id, address, result) => {
    sql.query(
        "UPDATE addresses SET address = ?, city = ?, state = ?, zip_code = ? WHERE id = ?",
        [address.address, address.city, address.state, address.zip_code, id],
        (err, res) => {
            if (err) {
                console.log("error: ", err);
                result(null, err);
                return;
            }

            if (res.affectedRows == 0) {
                // not found Address with the id
                result({ kind: "not_found" }, null);
                return;
            }

            console.log("updated address: ", { id: id, ...address });
            result(null, { id: id, ...address });
        }
    );
};

Profile.deleteAddress = (id, result) => {
    sql.query("DELETE FROM addresses WHERE id = ?", id, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(null, err);
            return;
        }

        if (res.affectedRows == 0) {
            // not found Address with the id
            result({ kind: "not_found" }, null);
            return;
        }

        console.log("deleted address with id: ", id);
        result(null, res);
    });
};

Profile.getBookings = (userId, result) => {
    sql.query(`
        SELECT 
            b.id AS booking_id, 
            s.name AS service_name, 
            p.name AS partner_name, 
            b.booking_date, 
            b.booking_time, 
            b.status, 
            b.total_cost 
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        JOIN partners p ON b.partner_id = p.id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
    `, [userId], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        console.log("bookings: ", res);
        result(null, res);
    });
};

module.exports = Profile;
