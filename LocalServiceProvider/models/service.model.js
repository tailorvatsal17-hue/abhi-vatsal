const sql = require('./db.js');

const Service = {};

Service.getAll = (result) => {
    sql.query("SELECT * FROM services", (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(null, err);
            return;
        }

        console.log("services: ", res);
        result(null, res);
    });
};

Service.search = (filters, result) => {
    let baseQuery = `
        SELECT 
            s.name AS service_name, 
            p.name AS partner_name, 
            p.description, 
            p.pricing, 
            p.work_images, 
            p.id, 
            p.profile_image, 
            p.service_id, 
            sc.name AS category_name, 
            p.rating
        FROM services s
        INNER JOIN partners p ON s.id = p.service_id
        LEFT JOIN service_categories sc ON s.category_id = sc.id
        WHERE p.is_approved = 1
    `;
    
    let secondaryQuery = `
        SELECT 
            s.name AS service_name, 
            p.name AS partner_name, 
            ps.description, 
            CAST(ps.price AS CHAR) as pricing, 
            p.work_images, 
            p.id, 
            p.profile_image, 
            ps.service_id, 
            sc.name AS category_name, 
            p.rating
        FROM partner_services ps
        JOIN partners p ON ps.partner_id = p.id
        JOIN services s ON ps.service_id = s.id
        LEFT JOIN service_categories sc ON s.category_id = sc.id
        WHERE p.is_approved = 1
    `;

    let query = `SELECT * FROM (${baseQuery} UNION ${secondaryQuery}) as combined WHERE 1=1`;
    let params = [];

    if (filters.keyword) {
        query += " AND (service_name LIKE ? OR partner_name LIKE ? OR category_name LIKE ?)";
        const searchTerm = `%${filters.keyword}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.category_id) {
        query += " AND service_id = ?";
        params.push(filters.category_id);
    }

    if (filters.min_price) {
        query += " AND CAST(pricing AS DECIMAL) >= ?";
        params.push(filters.min_price);
    }

    if (filters.max_price) {
        query += " AND CAST(pricing AS DECIMAL) <= ?";
        params.push(filters.max_price);
    }

    if (filters.min_rating) {
        query += " AND rating >= ?";
        params.push(filters.min_rating);
    }

    sql.query(query, params, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }
        result(null, res);
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
