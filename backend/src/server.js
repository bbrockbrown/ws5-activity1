// backend server.js
import express from 'express';
import cors from 'cors';
import { pool } from './db/index.js';
import dotenv from 'dotenv';
// import { db } from './db/index.js';
// import { usersTable } from './db/schema.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' });
});

app.post('/api/execute-sql', async (req, res) => {
  const { query, config } = req.body;

  if (config) {
    console.log('!!! DANGEROUS: Received DB config from frontend:');
    console.log(config);
  }

  if (!query) {
    return res.status(400).json({ error: 'Missing "query" in request body' });
  }

  try {
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error with query:', err);
    res.status(500).json({
      error: err.message,
    });
  }
});

app.post('/api/execute-sql/createNewUser', async (req, res) => {
  try {
    const { first_name, last_name, email } = req.body;

    if (!first_name || !last_name || !email ) {
      return res.status(400).json({
        error: 'first_name, last_name, and email are required'
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
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }
});

const PORT = process.env.VITE_PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});