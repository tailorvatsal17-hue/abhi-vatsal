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

Service.search = (keyword, result) => {
    const query = `
        SELECT s.name AS service_name, p.name AS partner_name, p.description, p.pricing, p.work_images, p.id, p.profile_image, p.service_id
        FROM services s
        LEFT JOIN partners p ON s.id = p.service_id
        WHERE s.name LIKE '%${keyword}%' OR p.name LIKE '%${keyword}%'
    `;
    sql.query(query, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(null, err);
            return;
        }

        console.log("search results: ", res);
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
