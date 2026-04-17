const db = require('./services/db');

async function debugSchema() {
    try {
        console.log("--- SCHEMA DEBUG ---");
        const partners = await db.query("DESCRIBE partners");
        console.log("Partners columns:", partners.map(c => c.Field));
        
        const services = await db.query("DESCRIBE services");
        console.log("Services columns:", services.map(c => c.Field));
        
        try {
            const extra = await db.query("DESCRIBE partner_services");
            console.log("Partner Services columns:", extra.map(c => c.Field));
        } catch(e) {
            console.log("Partner Services table missing");
        }
        
        try {
            const cats = await db.query("DESCRIBE service_categories");
            console.log("Categories columns:", cats.map(c => c.Field));
        } catch(e) {
            console.log("Categories table missing");
        }
        
        process.exit(0);
    } catch (err) {
        console.error("Schema check failed:", err.message);
        process.exit(1);
    }
}

debugSchema();
