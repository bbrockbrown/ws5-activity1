// backend server.js
import express from 'express';
import cors from 'cors';
import { pool } from './db/index.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' });
});

app.get('/api/users/all', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching all users:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/alphabetical', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY last_name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users alphabetically:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/email-count', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM users');
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error getting email count:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { first_name, last_name, email } = req.body;

    if (!first_name || !last_name || !email) {
      return res.status(400).json({
        error: 'first_name, last_name, email, and age are required'
      });
    }

    const queryText = `
      INSERT INTO users(first_name, last_name, email) 
      VALUES($1, $2, $3) 
      RETURNING *
    `;
    const values = [first_name, last_name, email];

    const result = await pool.query(queryText, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: err.message });
  }
});


const PORT = process.env.VITE_PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

