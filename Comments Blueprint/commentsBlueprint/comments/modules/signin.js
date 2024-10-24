    const express = require('express');
    const bcrypt = require('bcrypt');
    const jwt = require('jsonwebtoken');
    const bodyParser = require('body-parser');
    const cors = require('cors');

    const app1 = express();
    app1.use(bodyParser.json());
    app1.use(cors());

    const db = require('./db');
    const JWT_SECRET = 'your-secret-key'; // Move this to a config file in production

    app1.post('/', (req, res) => { // Changed route to match mounting in server.js
        const { username, password } = req.body;

        const sql = 'SELECT * FROM users WHERE username = ?';
        db.query(sql, [username], (err, results) => {
            if (err) {
                console.error('Database query error:', err);
                res.status(500).json({ success: false });
                return;
            }

            if (results.length > 0) {
                const user = results[0];
                bcrypt.compare(password, user.password, (bcryptErr, bcryptRes) => {
                    if (bcryptErr) {
                        console.error('Password comparison error:', bcryptErr);
                        res.status(500).json({ success: false });
                        return;
                    }

                    if (bcryptRes) {
                        const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '24h' });
                        console.log('User logged in successfully:', username);
                        res.status(200).json({ success: true, token });
                    } else {
                        console.log('Incorrect password for user:', username);
                        res.status(401).json({ success: false });
                    }
                });
            } else {
                console.log('User not found:', username);
                res.status(404).json({ success: false });
            }
        });
    });

    module.exports = app1;
