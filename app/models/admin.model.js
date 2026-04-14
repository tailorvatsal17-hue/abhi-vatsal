const sql = require('./db.js');

// constructor
const Admin = function(admin) {
    this.email = admin.email;
    this.password = admin.password;
};

Admin.findByEmail = (email, result) => {
    sql.query("SELECT * FROM admins WHERE email = ?", [email], (err, res) => {
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
            result(err, null);
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
            result(err, null);
            return;
        }

        console.log("partners: ", res);
        result(null, res);
    });
};

Admin.approvePartner = (id, result) => {
    sql.query(
        "UPDATE partners SET is_approved = 1 WHERE id = ?",
        [id],
        (err, res) => {
            if (err) {
                console.log("error: ", err);
                result(err, null);
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
                result(err, null);
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
                result(err, null);
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
    sql.query("DELETE FROM services WHERE id = ?", [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
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
            result(err, null);
            return;
        }

        console.log("bookings: ", res);
        result(null, res);
    });
};

Admin.cancelBooking = (id, result) => {
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

Admin.updateBookingStatus = (id, status, result) => {
    sql.query(
        "UPDATE bookings SET status = ? WHERE id = ?",
        [status, id],
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

            console.log("updated booking status: ", { id: id, status: status });
            result(null, { id: id, status: status });
        }
    );
};

// Get dashboard statistics - CRITICAL METHOD FOR DASHBOARD
Admin.getStatistics = (result) => {
    // Run all queries in parallel and collect results
    const stats = {};
    let queriesCompleted = 0;
    const totalQueries = 8;

    const checkComplete = () => {
        queriesCompleted++;
        if (queriesCompleted === totalQueries) {
            result(null, stats);
        }
    };

    // 1. Total Users
    sql.query("SELECT COUNT(*) as count FROM users", (err, res) => {
        if (!err && res.length) stats.totalUsers = res[0].count;
        checkComplete();
    });

    // 2. Total Partners
    sql.query("SELECT COUNT(*) as count FROM partners", (err, res) => {
        if (!err && res.length) stats.totalPartners = res[0].count;
        checkComplete();
    });

    // 3. Total Services
    sql.query("SELECT COUNT(*) as count FROM services", (err, res) => {
        if (!err && res.length) stats.totalServices = res[0].count;
        checkComplete();
    });

    // 4. Pending Bookings
    sql.query("SELECT COUNT(*) as count FROM bookings WHERE status = 'Pending'", (err, res) => {
        if (!err && res.length) stats.pendingBookings = res[0].count;
        checkComplete();
    });

    // 5. Completed Bookings
    sql.query("SELECT COUNT(*) as count FROM bookings WHERE status = 'Completed'", (err, res) => {
        if (!err && res.length) stats.completedBookings = res[0].count;
        checkComplete();
    });

    // 6. Cancelled Bookings
    sql.query("SELECT COUNT(*) as count FROM bookings WHERE status = 'Cancelled'", (err, res) => {
        if (!err && res.length) stats.cancelledBookings = res[0].count;
        checkComplete();
    });

    // 7. Total Revenue (from completed bookings)
    sql.query("SELECT SUM(total_cost) as revenue FROM bookings WHERE status = 'Completed'", (err, res) => {
        if (!err && res.length) stats.totalRevenue = res[0].revenue || 0;
        checkComplete();
    });

    // 8. Blocked Users
    sql.query("SELECT COUNT(*) as count FROM users WHERE is_blocked = true", (err, res) => {
        if (!err && res.length) stats.blockedUsers = res[0].count;
        checkComplete();
    });
};

// Block a user - prevents login and access
Admin.blockUser = (userId, reason, result) => {
    const blockedAt = new Date();
    sql.query(
        "UPDATE users SET is_blocked = true, blocked_reason = ?, blocked_at = ? WHERE id = ?",
        [reason, blockedAt, userId],
        (err, res) => {
            if (err) {
                console.log("error blocking user: ", err);
                result(null, err);
                return;
            }

            if (res.affectedRows == 0) {
                result({ kind: "not_found" }, null);
                return;
            }

            console.log("blocked user: ", userId);
            result(null, { userId: userId, is_blocked: true });
        }
    );
};

// Unblock a user - allows login and access again
Admin.unblockUser = (userId, result) => {
    sql.query(
        "UPDATE users SET is_blocked = false, blocked_reason = NULL, blocked_at = NULL WHERE id = ?",
        [userId],
        (err, res) => {
            if (err) {
                console.log("error unblocking user: ", err);
                result(null, err);
                return;
            }

            if (res.affectedRows == 0) {
                result({ kind: "not_found" }, null);
                return;
            }

            console.log("unblocked user: ", userId);
            result(null, { userId: userId, is_blocked: false });
        }
    );
};

// Suspend a partner - prevents booking acceptance and login
Admin.suspendPartner = (partnerId, reason, result) => {
    const suspendedAt = new Date();
    sql.query(
        "UPDATE partners SET is_suspended = true, suspended_reason = ?, suspended_at = ? WHERE id = ?",
        [reason, suspendedAt, partnerId],
        (err, res) => {
            if (err) {
                console.log("error suspending partner: ", err);
                result(null, err);
                return;
            }

            if (res.affectedRows == 0) {
                result({ kind: "not_found" }, null);
                return;
            }

            console.log("suspended partner: ", partnerId);
            result(null, { partnerId: partnerId, is_suspended: true });
        }
    );
};

// Restore a partner - allows login and booking acceptance again
Admin.restorePartner = (partnerId, result) => {
    sql.query(
        "UPDATE partners SET is_suspended = false, suspended_reason = NULL, suspended_at = NULL WHERE id = ?",
        [partnerId],
        (err, res) => {
            if (err) {
                console.log("error restoring partner: ", err);
                result(null, err);
                return;
            }

            if (res.affectedRows == 0) {
                result({ kind: "not_found" }, null);
                return;
            }

            console.log("restored partner: ", partnerId);
            result(null, { partnerId: partnerId, is_suspended: false });
        }
    );
};

module.exports = Admin;
