import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import process from 'eslint-plugin-vue/lib/configs/base'

// Načtení environment proměnných
dotenv.config();

// Vytvoření připojení k databázi
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USERNAME || 'dashboard_user',
  password: process.env.DB_PASSWORD || 'secure_password',
  database: process.env.DB_DATABASE || 'dashboard_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Funkce pro dotazování
export const query = async (sql, params) => {
  const [results] = await pool.execute(sql, params);
  return results;
};
const getVideoCount = async () => {
  try {
    const [rows] = await pool.execute('SELECT COUNT(*) AS total_videos FROM videos');
    return rows[0].total_videos; // Počet videí
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
};
getVideoCount().then(count => {
  console.log(`Počet videí: ${count}`);
});
export default pool;
