
import { Pool } from 'pg';

// Using a connection pool for efficiency
// In production, ensure user has only INSERT privileges for 'access_logs' table where possible
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes("neon.tech")
        ? { rejectUnauthorized: false }
        : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined)
});

// Helper for single query execution
export const query = (text: string, params?: any[]) => pool.query(text, params);
