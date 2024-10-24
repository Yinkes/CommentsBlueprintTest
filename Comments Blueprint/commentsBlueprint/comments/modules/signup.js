const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const db = require('./db');
const JWT_SECRET = 'your-secret-key'; // Move this to a config file in production

app.post('/signup', (req, res) => {
    const { username, password } = req.body;

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.error('Error hashing password:', err);
            res.status(500).send('Error hashing password');
            return;
        }

        const newUser = { username, password: hash, created_at: new Date() };
        db.query('INSERT INTO users SET ?', newUser, (err, result) => {
            if (err) {
                console.error('Error inserting user:', err);
                res.status(400).send('Username already exists');
            } else {
                console.log('User created successfully:', username);
                const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
                res.json({ success: true, token });
            }
        });
    });
});

module.exports = app;
