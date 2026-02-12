import express from 'express';
import cors from 'cors';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = process.env.DB_PATH || './database.sqlite';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

let db;

(async () => {
    try {
        db = await open({
            filename: DB_PATH,
            driver: sqlite3.Database
        });

        await db.exec(`
        CREATE TABLE IF NOT EXISTS bookings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT,
          hour INTEGER,
          user TEXT
        )
      `);
        console.log('Database connected and table ready');
    } catch (err) {
        console.error('Database error:', err);
    }
})();

// API Endpoints
app.get('/api/bookings', async (req, res) => {
    try {
        const bookings = await db.all('SELECT * FROM bookings');
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/bookings', async (req, res) => {
    const { date, hour, user } = req.body;
    try {
        const existing = await db.get('SELECT * FROM bookings WHERE date = ? AND hour = ?', [date, hour]);
        if (existing) {
            return res.status(409).json({ error: 'Horário já ocupado' });
        }
        await db.run('INSERT INTO bookings (date, hour, user) VALUES (?, ?, ?)', [date, hour, user]);
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/bookings', async (req, res) => {
    const { date, hour, user } = req.body;
    try {
        await db.run('DELETE FROM bookings WHERE date = ? AND hour = ? AND user = ?', [date, hour, user]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// For Render deployment - serve index.html for all other routes via middleware
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
