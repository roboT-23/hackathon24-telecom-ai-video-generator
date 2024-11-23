import express from 'express';
import mysql from 'mysql2';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

console.log('Server starting...');

// Middleware pre logovanie requestov
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

// Test database connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Successfully connected to database');
  connection.release();
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// GET /api/videos endpoint
app.get('/api/videos', (req, res) => {
  console.log('Fetching videos...');

  const query = `
    SELECT
      id,
      title,
      status,
      created_at,
      updated_at,
      processing_time,
      error_message,
      file_path,
      file_size,
      duration,
      format
    FROM videos
    ORDER BY created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({
        error: 'Failed to fetch videos',
        details: err.message
      });
    }

    console.log(`Found ${results.length} videos`);
    res.json(results);
  });
});



const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`Test the API at http://localhost:${port}/api/test`);
});
