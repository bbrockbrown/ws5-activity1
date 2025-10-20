// backend server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './db/index.js';
import { usersTable } from './db/schema.js';
import { asc, count } from 'drizzle-orm';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


app.get('/', (_req, res) => {
  res.json({ message: 'Hello World!' });
});

app.get('/api/users/all', async (_req, res) => {
  try {
    const result = await db.select().from(usersTable);
    res.json(result);
  } catch (err) {
    console.error('Error fetching all users:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/alphabetical', async (_req, res) => {
  try {
    const result = await db.select().from(usersTable).orderBy(asc(usersTable.last_name));
    res.json(result);
  } catch (err) {
    console.error('Error fetching users alphabetically:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/email-count', async (_req, res) => {
  try {
    const result = await db.select({ count: count() }).from(usersTable);
    // Normalize to an array of row objects so frontend receives consistent shape
    const cnt = result && result[0] && result[0].count != null ? Number(result[0].count) : 0;
    res.json([{ count: cnt }]);
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
        error: 'first_name, last_name, and email are required'
      });
    }

    const newUser = await db.insert(usersTable).values({
      first_name,
      last_name,
      email
    }).returning();

    res.status(201).json(newUser);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: err.message });
  }
});


const PORT = process.env.VITE_PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

