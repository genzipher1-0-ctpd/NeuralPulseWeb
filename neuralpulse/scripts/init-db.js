
const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' }); // Adjust if needed

async function initDB() {
    console.log("Connecting to database:", process.env.DATABASE_URL?.split('@')[1]); // Log host for safety

    if (!process.env.DATABASE_URL) {
        // Fallback to reading .env directly if process.env isn't populated correctly by require above
        const fs = require('fs');
        const path = require('path');
        const envPath = path.resolve(__dirname, '../.env');
        const envConfig = require('dotenv').parse(fs.readFileSync(envPath));
        process.env.DATABASE_URL = envConfig.DATABASE_URL;
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Required for Neon
    });

    try {
        const client = await pool.connect();
        console.log("Connected successfully.");

        // Create table ensuring schema matches
        await client.query(`
            CREATE TABLE IF NOT EXISTS access_logs (
                id UUID PRIMARY KEY,
                doctor_id TEXT NOT NULL,
                patient_id TEXT NOT NULL,
                access_type TEXT NOT NULL,
                details TEXT,
                timestamp TIMESTAMPTZ NOT NULL,
                prev_hash TEXT,
                current_hash TEXT
            );
        `);
        console.log("Table 'access_logs' verified/created.");

        await client.query(`
            CREATE TABLE IF NOT EXISTS patients (
                id TEXT PRIMARY KEY,
                encrypted_data TEXT NOT NULL,
                last_seen TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                ip_address TEXT
            );
        `);
        console.log("Table 'patients' verified/created.");

        // Verify content
        const res = await client.query('SELECT COUNT(*) FROM access_logs');
        console.log(`Current log count: ${res.rows[0].count}`);

        client.release();
    } catch (err) {
        console.error("Database initialization failed:", err);
    } finally {
        await pool.end();
    }
}

initDB();
