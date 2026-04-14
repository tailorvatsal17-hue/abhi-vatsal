const sql = require('./db.js');

// constructor
const User = function(user) {
    this.email = user.email;
    this.password = user.password;
};

User.create = (newUser, result) => {
    sql.query("INSERT INTO users SET ?", newUser, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        console.log("created user: ", { id: res.insertId, ...newUser });
        result(null, { id: res.insertId, ...newUser });
    });
};

User.findByEmail = (email, result) => {
    sql.query("SELECT * FROM users WHERE email = ?", [email], (err, res) => {
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

        // not found User with the email
        result({ kind: "not_found" }, null);
    });
};

User.findById = (userId, result) => {
    sql.query("SELECT * FROM users WHERE id = ?", [userId], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.length) {
            result(null, res[0]);
            return;
        }

        result({ kind: "not_found" }, null);
    });
};

// Mark user as verified (after OTP verification)
User.updateVerification = (userId, isVerified, result) => {
    sql.query(
        "UPDATE users SET is_verified = ? WHERE id = ?",
        [isVerified ? 1 : 0, userId],
        (err, res) => {
            if (err) {
                console.log("error updating verification: ", err);
                result(err, null);
                return;
            }

            if (res.affectedRows == 0) {
                result({ kind: "not_found" }, null);
                return;
            }

            console.log("updated user verification: ", userId);
            result(null, { userId: userId, is_verified: isVerified });
        }
    );
};

module.exports = User;
