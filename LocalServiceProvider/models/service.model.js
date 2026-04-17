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
    // 1. Get schema of both tables to avoid 'Unknown column' errors
    sql.query("SHOW COLUMNS FROM partners", (err, pCols) => {
        if (err) {
            console.error("Search Schema Error (Partners):", err);
            result(err, null);
            return;
        }

        sql.query("SHOW COLUMNS FROM services", (err, sCols) => {
            if (err) {
                console.error("Search Schema Error (Services):", err);
                result(err, null);
                return;
            }

            const pFields = pCols.map(c => c.Field);
            const sFields = sCols.map(c => c.Field);

            // Dynamic Column Selection
            const ratingCol = pFields.includes('rating') ? "p.rating" : "0 AS rating";
            const approvedCol = pFields.includes('is_approved') ? "p.is_approved" : (pFields.includes('status') ? "p.status" : "1");
            const approvedVal = pFields.includes('is_approved') ? "1" : (pFields.includes('status') ? "'approved'" : "1");
            const profileImgCol = pFields.includes('profile_image') ? "p.profile_image" : "NULL AS profile_image";
            
            const categoryIdCol = sFields.includes('category_id') ? "s.category_id" : "NULL AS category_id";

            const baseQuery = `
                SELECT 
                    s.name AS service_name, 
                    p.name AS partner_name, 
                    p.description, 
                    p.pricing, 
                    p.id, 
                    ${profileImgCol}, 
                    p.service_id, 
                    ${categoryIdCol}, 
                    sc.name AS category_name, 
                    ${ratingCol}
                FROM services s
                INNER JOIN partners p ON s.id = p.service_id
                LEFT JOIN service_categories sc ON ${sFields.includes('category_id') ? 's.category_id = sc.id' : '0=1'}
                WHERE ${approvedCol} = ${approvedVal}
            `;

            let query = `SELECT * FROM (${baseQuery}) as combined WHERE 1=1`;
            let params = [];

            if (filters.keyword) {
                query += " AND (LOWER(service_name) LIKE LOWER(?) OR LOWER(partner_name) LIKE LOWER(?) OR LOWER(category_name) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?))";
                const searchTerm = `%${filters.keyword}%`;
                params.push(searchTerm, searchTerm, searchTerm, searchTerm);
            }

            if (filters.category_id) {
                // If numeric, match category_id, otherwise match category_name
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
                    console.error("SQL Execution Error in Search:", err);
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
