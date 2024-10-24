const express = require('express');
const router = express.Router();
const db = require('./db'); // Ensure db.js is correctly configured
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your-secret-key'; // Move to a config file in production

function getUsernameFromToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.username;
  } catch (err) {
    console.error('Invalid token:', err);
    return null;
  }
}

router.get('/profile-picture', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const username = getUsernameFromToken(token);
  if (!username) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  const sql = 'SELECT pfp FROM users WHERE username = ?';
  db.query(sql, [username], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ success: false });
    }

    if (results.length > 0) {
      const pfp = results[0].pfp;
      console.log('User pfp:', pfp); // Log pfp to console
      res.status(200).json({ success: true, pfp });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  });
});

module.exports = router;
