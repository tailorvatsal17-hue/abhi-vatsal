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
    // 1. Check if 'rating' column exists in partners table to avoid SQL errors
    sql.query("SHOW COLUMNS FROM partners", (err, pCols) => {
        if (err) {
            console.error("Search Initialization Error:", err);
            result(err, null);
            return;
        }

        const hasRating = pCols.some(c => c.Field === 'rating');
        const ratingField = hasRating ? "p.rating" : "0";

        // 2. Check if 'partner_services' table exists
        sql.query("SHOW TABLES LIKE 'partner_services'", (err, tables) => {
            const hasExtraTable = !err && tables && tables.length > 0;
            
            // Base query for primary services
            const baseQuery = `
                SELECT 
                    s.name AS service_name, 
                    p.name AS partner_name, 
                    p.description, 
                    p.pricing, 
                    p.id, 
                    p.profile_image, 
                    p.service_id, 
                    s.category_id, 
                    sc.name AS category_name, 
                    ${ratingField} AS rating
                FROM services s
                INNER JOIN partners p ON s.id = p.service_id
                LEFT JOIN service_categories sc ON s.category_id = sc.id
                WHERE p.is_approved = 1
            `;
            
            let fullQuery = "";
            if (hasExtraTable) {
                // UNION with additional services if the table exists
                const secondaryQuery = `
                    SELECT 
                        s.name AS service_name, 
                        p.name AS partner_name, 
                        ps.description, 
                        CAST(ps.price AS CHAR) as pricing, 
                        p.id, 
                        p.profile_image, 
                        ps.service_id, 
                        s.category_id, 
                        sc.name AS category_name, 
                        ${ratingField} AS rating
                    FROM partner_services ps
                    JOIN partners p ON ps.partner_id = p.id
                    JOIN services s ON ps.service_id = s.id
                    LEFT JOIN service_categories sc ON s.category_id = sc.id
                    WHERE p.is_approved = 1
                `;
                fullQuery = `SELECT * FROM (${baseQuery} UNION ALL ${secondaryQuery}) as combined WHERE 1=1`;
            } else {
                fullQuery = `SELECT * FROM (${baseQuery}) as combined WHERE 1=1`;
            }

            let params = [];

            // Filter by Keyword (Service name or Professional name)
            if (filters.keyword) {
                fullQuery += " AND (LOWER(service_name) LIKE LOWER(?) OR LOWER(partner_name) LIKE LOWER(?) OR LOWER(category_name) LIKE LOWER(?) OR service_name SOUNDS LIKE ?)";
                const searchTerm = `%${filters.keyword}%`;
                params.push(searchTerm, searchTerm, searchTerm, filters.keyword);
            }

            // Filter by Category
            if (filters.category_id) {
                if (!isNaN(filters.category_id) && filters.category_id !== "") {
                    fullQuery += " AND category_id = ?";
                    params.push(filters.category_id);
                } else if (filters.category_id !== "") {
                    fullQuery += " AND LOWER(category_name) = LOWER(?)";
                    params.push(filters.category_id);
                }
            }

            // Filter by specific Service
            if (filters.service_id) {
                fullQuery += " AND service_id = ?";
                params.push(filters.service_id);
            }

            fullQuery += " ORDER BY rating DESC";

            sql.query(fullQuery, params, (err, res) => {
                if (err) {
                    console.error("Database Search Error:", err);
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
