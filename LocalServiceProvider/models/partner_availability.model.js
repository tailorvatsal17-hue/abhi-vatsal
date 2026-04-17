const sql = require('./db.js');

const PartnerAvailability = function(availability) {
    this.partner_id = availability.partner_id;
    this.available_date = availability.available_date;
    this.start_time = availability.start_time;
    this.end_time = availability.end_time;
    this.status = availability.status;
};

// --- Self-Healing SQL initialization ---
const initTable = () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS partner_availability (
            id INT AUTO_INCREMENT PRIMARY KEY,
            partner_id INT NOT NULL,
            available_date DATE NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            status VARCHAR(50) DEFAULT 'Available',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    sql.query(createTableQuery, (err) => {
        if (err) console.error("Error initializing partner_availability table:", err);
        else console.log("partner_availability table verified/created.");
    });
};
initTable();

PartnerAvailability.create = (newAvailability, result) => {
    sql.query("INSERT INTO partner_availability SET ?", newAvailability, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }
        console.log("created availability: ", { id: res.insertId, ...newAvailability });
        result(null, { id: res.insertId, ...newAvailability });
    });
};

PartnerAvailability.findByPartnerId = (partnerId, result) => {
    const query = `
        SELECT 
            id, 
            partner_id, 
            DATE_FORMAT(available_date, '%Y-%m-%d') as available_date, 
            start_time, 
            end_time, 
            status 
        FROM partner_availability 
        WHERE partner_id = ? 
        ORDER BY available_date ASC, start_time ASC
    `;

    sql.query(query, [partnerId], (err, res) => {
        if (err) {
            console.error("Database Query Error (findByPartnerId):", err);
            result(err, null);
            return;
        }
        
        if (res && res.length > 0) {
            result(null, res);
            return;
        }
        
        // Return not_found kind for empty results
        result({ kind: "not_found" }, null);
    });
};

PartnerAvailability.findById = (id, result) => {
    sql.query("SELECT * FROM partner_availability WHERE id = ?", [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }
        if (res.length) {
            console.log("found availability: ", res[0]);
            result(null, res[0]);
            return;
        }
        result({ kind: "not_found" }, null);
    });
};

PartnerAvailability.updateById = (id, availability, result) => {
    sql.query(
        "UPDATE partner_availability SET available_date = ?, start_time = ?, end_time = ?, status = ? WHERE id = ?",
        [availability.available_date, availability.start_time, availability.end_time, availability.status, id],
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
            console.log("updated availability: ", { id: id, ...availability });
            result(null, { id: id, ...availability });
        }
    );
};

PartnerAvailability.remove = (id, result) => {
    sql.query("DELETE FROM partner_availability WHERE id = ?", id, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }
        if (res.affectedRows == 0) {
            result({ kind: "not_found" }, null);
            return;
        }
        console.log("deleted availability with id: ", id);
        result(null, res);
    });
};

PartnerAvailability.checkOverlap = (partner_id, date, start, end, result) => {
    sql.query(
        "SELECT * FROM partner_availability WHERE partner_id = ? AND available_date = ? AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?) OR (start_time >= ? AND end_time <= ?))",
        [partner_id, date, start, start, end, end, start, end],
        (err, res) => {
            if (err) {
                console.log("error: ", err);
                result(err, null);
                return;
            }
            if (res.length > 0) {
                result(null, true); // Overlap found
            } else {
                result(null, false); // No overlap
            }
        }
    );
};

module.exports = PartnerAvailability;
