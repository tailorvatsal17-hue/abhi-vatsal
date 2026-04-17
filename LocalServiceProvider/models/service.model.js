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
    // 1. Get complete schema snapshot to build a bulletproof query
    sql.query("SHOW TABLES", (err, tables) => {
        if (err) { result(err, null); return; }
        const tNames = tables.map(t => Object.values(t)[0].toLowerCase());
        
        const hasExtra = tNames.includes('partner_services');
        const hasCats = tNames.includes('service_categories');

        sql.query("SHOW COLUMNS FROM partners", (err, pCols) => {
            if (err) { result(err, null); return; }
            const pF = pCols.map(c => c.Field.toLowerCase());

            sql.query("SHOW COLUMNS FROM services", (err, sCols) => {
                if (err) { result(err, null); return; }
                const sF = sCols.map(c => c.Field.toLowerCase());

                // Construct dynamic column selectors
                const rating = pF.includes('rating') ? "p.rating" : "0";
                const pImg = pF.includes('profile_image') ? "p.profile_image" : "NULL";
                const approved = pF.includes('is_approved') ? "p.is_approved = 1" : (pF.includes('status') ? "p.status = 'approved'" : "1=1");
                
                const sCatId = sF.includes('category_id') ? "s.category_id" : "NULL";
                const joinCat = (hasCats && sF.includes('category_id')) ? "LEFT JOIN service_categories sc ON s.category_id = sc.id" : "";
                const catName = (hasCats && sF.includes('category_id')) ? "sc.name" : "NULL";

                // First part: Main Partners
                let queryBody = `
                    SELECT 
                        s.name AS service_name, 
                        p.name AS partner_name, 
                        p.description, 
                        p.pricing, 
                        p.id, 
                        ${pImg} AS profile_image, 
                        p.service_id, 
                        ${sCatId} AS category_id, 
                        ${catName} AS category_name, 
                        ${rating} AS rating
                    FROM services s
                    INNER JOIN partners p ON s.id = p.service_id
                    ${joinCat}
                    WHERE ${approved}
                `;

                // Second part: Additional Services
                if (hasExtra) {
                    queryBody += `
                        UNION ALL
                        SELECT 
                            s.name AS service_name, 
                            p.name AS partner_name, 
                            ps.description, 
                            CAST(ps.price AS CHAR) AS pricing, 
                            p.id, 
                            ${pImg} AS profile_image, 
                            ps.service_id, 
                            ${sCatId} AS category_id, 
                            ${catName} AS category_name, 
                            ${rating} AS rating
                        FROM partner_services ps
                        JOIN partners p ON ps.partner_id = p.id
                        JOIN services s ON ps.service_id = s.id
                        ${joinCat}
                        WHERE ${approved}
                    `;
                }

                let finalQuery = `SELECT * FROM (${queryBody}) AS results WHERE 1=1`;
                let params = [];

                if (filters.keyword) {
                    finalQuery += " AND (LOWER(service_name) LIKE LOWER(?) OR LOWER(partner_name) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?))";
                    const term = `%${filters.keyword}%`;
                    params.push(term, term, term);
                }

                if (filters.category_id) {
                    if (!isNaN(filters.category_id) && filters.category_id !== "") {
                        finalQuery += " AND category_id = ?";
                        params.push(filters.category_id);
                    } else if (filters.category_id !== "") {
                        finalQuery += " AND LOWER(category_name) = LOWER(?)";
                        params.push(filters.category_id);
                    }
                }

                if (filters.service_id) {
                    finalQuery += " AND service_id = ?";
                    params.push(filters.service_id);
                }

                finalQuery += " ORDER BY rating DESC";

                sql.query(finalQuery, params, (err, res) => {
                    if (err) {
                        console.error("SQL Search Failure:", err);
                        result(err, null);
                    } else {
                        result(null, res);
                    }
                });
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
