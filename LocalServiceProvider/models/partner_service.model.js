const sql = require('./db.js');

const PartnerService = function(partnerService) {
    this.partner_id = partnerService.partner_id;
    this.service_id = partnerService.service_id;
    this.price = partnerService.price;
    this.description = partnerService.description;
};

// --- Self-Healing SQL initialization ---
const initTable = () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS partner_services (
            id INT AUTO_INCREMENT PRIMARY KEY,
            partner_id INT NOT NULL,
            service_id INT NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    sql.query(createTableQuery, (err) => {
        if (err) console.error("Error initializing partner_services table:", err);
        else console.log("partner_services table verified/created.");
    });
};
initTable();

PartnerService.create = (newPartnerService, result) => {
    // If service_id is a name (string) instead of a number, we create it in global 'services' first
    if (isNaN(newPartnerService.service_id)) {
        const serviceName = newPartnerService.service_id;
        
        // 1. Get the category_id from the partner's current category to keep it consistent
        sql.query(`
            SELECT s.category_id 
            FROM partners p 
            JOIN services s ON p.service_id = s.id 
            WHERE p.id = ?`, [newPartnerService.partner_id], (err, partnerInfo) => {
            
            if (err || !partnerInfo.length) {
                console.error("Error finding partner category:", err);
                result(err || { message: "Partner category not found" }, null);
                return;
            }

            const categoryId = partnerInfo[0].category_id;

            // 2. Check if service already exists globally
            sql.query("SELECT id FROM services WHERE LOWER(name) = LOWER(?)", [serviceName], (err, existing) => {
                if (err) {
                    result(err, null);
                    return;
                }

                if (existing.length > 0) {
                    // Service exists, just use its ID
                    const serviceId = existing[0].id;
                    insertPartnerService(newPartnerService.partner_id, serviceId, newPartnerService.price, result);
                } else {
                    // 3. Create NEW service in global 'services' table
                    const newGlobalService = {
                        name: serviceName,
                        category_id: categoryId,
                        description: newPartnerService.description || `Service provided by partner`,
                        base_price: newPartnerService.price
                    };

                    sql.query("INSERT INTO services SET ?", newGlobalService, (err, res) => {
                        if (err) {
                            result(err, null);
                            return;
                        }
                        const newServiceId = res.insertId;
                        insertPartnerService(newPartnerService.partner_id, newServiceId, newPartnerService.price, result);
                    });
                }
            });
        });
    } else {
        // Standard flow: ID provided
        insertPartnerService(newPartnerService.partner_id, newPartnerService.service_id, newPartnerService.price, result);
    }
};

// Internal helper to handle the partner_services link
const insertPartnerService = (partnerId, serviceId, price, result) => {
    sql.query("INSERT INTO partner_services (partner_id, service_id, price) VALUES (?, ?, ?)", 
    [partnerId, serviceId, price], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }
        result(null, { id: res.insertId, partner_id: partnerId, service_id: serviceId, price: price });
    });
};

PartnerService.findAllByPartnerId = (partnerId, result) => {
    sql.query(`
        SELECT ps.*, s.name as service_name 
        FROM partner_services ps 
        JOIN services s ON ps.service_id = s.id 
        WHERE ps.partner_id = ?`, [partnerId], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        result(null, res);
    });
};

PartnerService.remove = (id, result) => {
    sql.query("DELETE FROM partner_services WHERE id = ?", id, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows == 0) {
            result({ kind: "not_found" }, null);
            return;
        }

        result(null, res);
    });
};

module.exports = PartnerService;
