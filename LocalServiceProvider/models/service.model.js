const sql = require('./db.js');

const Service = {};

Service.getAll = (result) => {
    const query = `
        SELECT s.*, sc.name as category_name 
        FROM services s 
        LEFT JOIN service_categories sc ON s.category_id = sc.id
    `;
    sql.query(query, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(null, err);
            return;
        }

        console.log("services with categories: ", res.length);
        result(null, res);
    });
};

Service.search = (filters, result) => {
    // 1. Get schema information
    sql.query("SHOW COLUMNS FROM partners", (err, pCols) => {
        if (err) {
            console.error("Search Schema Error (Partners):", err);
            result(err, null);
            return;
        }

        sql.query("SHOW TABLES LIKE 'partner_services'", (err, tables) => {
            const hasExtraTable = !err && tables && tables.length > 0;
            const pFields = pCols.map(c => c.Field);

            // Dynamic Column Selection
            const ratingCol = pFields.includes('rating') ? "p.rating" : "0 AS rating";
            const approvedCol = pFields.includes('is_approved') ? "p.is_approved" : (pFields.includes('status') ? "p.status" : "1");
            const approvedVal = pFields.includes('is_approved') ? "1" : (pFields.includes('status') ? "'approved'" : "1");
            const profileImgCol = pFields.includes('profile_image') ? "p.profile_image" : "NULL AS profile_image";

            // Primary query (Partners table)
            const baseQuery = `
                SELECT 
                    s.name AS service_name, 
                    p.name AS partner_name, 
                    p.description, 
                    p.pricing, 
                    p.id, 
                    ${profileImgCol}, 
                    p.service_id, 
                    s.category_id, 
                    sc.name AS category_name, 
                    ${ratingCol}
                FROM services s
                INNER JOIN partners p ON s.id = p.service_id
                LEFT JOIN service_categories sc ON s.category_id = sc.id
                WHERE ${approvedCol} = ${approvedVal}
            `;

            let secondaryQuery = "";
            if (hasExtraTable) {
                // Secondary query (Additional services)
                secondaryQuery = `
                    UNION ALL
                    SELECT 
                        s.name AS service_name, 
                        p.name AS partner_name, 
                        ps.description, 
                        CAST(ps.price AS CHAR) AS pricing, 
                        p.id, 
                        ${profileImgCol}, 
                        ps.service_id, 
                        s.category_id, 
                        sc.name AS category_name, 
                        ${ratingCol}
                    FROM partner_services ps
                    JOIN partners p ON ps.partner_id = p.id
                    JOIN services s ON ps.service_id = s.id
                    LEFT JOIN service_categories sc ON s.category_id = sc.id
                    WHERE ${approvedCol} = ${approvedVal}
                `;
            }

            let query = `SELECT * FROM (${baseQuery} ${secondaryQuery}) as combined WHERE 1=1`;
            let params = [];

            if (filters.keyword) {
                query += " AND (LOWER(service_name) LIKE LOWER(?) OR LOWER(partner_name) LIKE LOWER(?) OR LOWER(category_name) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?))";
                const searchTerm = `%${filters.keyword}%`;
                params.push(searchTerm, searchTerm, searchTerm, searchTerm);
            }

            if (filters.category_id) {
                if (!isNaN(filters.category_id) && filters.category_id !== "") {
                    query += " AND category_id = ?";
                    params.push(filters.category_id);
                } else if (filters.category_id !== "") {
                    query += " AND LOWER(category_name) = LOWER(?)";
                    params.push(filters.category_id);
                }
            }

            if (filters.service_id) {
                query += " AND service_id = ?";
                params.push(filters.service_id);
            }

            query += " ORDER BY rating DESC";

            sql.query(query, params, (err, res) => {
                if (err) {
                    console.error("SQL Search Error:", err);
                    result(err, null);
                    return;
                }
                result(null, res);
            });
        });
    });
};

Service.getPartners = (serviceId, result) => {
    sql.query("SELECT * FROM partners WHERE service_id = ?", serviceId, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(null, err);
            return;
        }

        console.log("partners: ", res);
        result(null, res);
    });
};

module.exports = Service;
