const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const JWT_SECRET = 'your-secret-key';

function getUsernameFromToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.username;
  } catch (err) {
    console.error('Invalid token:', err);
    return null;
  }
}

// Get replies for a comment
app.get('/replies', (req, res) => {
  const { comment_id } = req.query;

  db.query('SELECT replies.*, (SELECT reaction FROM replies_user_reactions WHERE replies_user_reactions.reply_id = replies.reply_id AND replies_user_reactions.username = ?) AS userReaction FROM replies WHERE comment_id = ?', [getUsernameFromToken(req.headers.authorization && req.headers.authorization.split(' ')[1]), comment_id], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      res.status(500).json({ success: false });
      return;
    }
    res.json({ replies: results });
  });
});

// Post a new reply
app.post('/replies', (req, res) => {
  const { comment_id, reply_text } = req.body;
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  const username = getUsernameFromToken(token);

  if (!username) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  db.query('INSERT INTO replies (comment_id, username, reply_text) VALUES (?, ?, ?)', [comment_id, username, reply_text], (err, result) => {
    if (err) {
      console.error('Database query error:', err);
      res.status(500).json({ success: false });
      return;
    }
    res.json({ success: true });
  });
});

// Like a reply
app.post('/replies/:id/like', (req, res) => {
  const { id } = req.params;
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  const username = getUsernameFromToken(token);

  if (!username) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  db.query('SELECT * FROM replies_user_reactions WHERE reply_id = ? AND username = ?', [id, username], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ success: false });
    }

    if (results.length > 0) {
      const userReaction = results[0];
      if (userReaction.reaction === 'like') {
        return res.json({ success: true });
      } else if (userReaction.reaction === 'dislike') {
        db.query('UPDATE replies SET dislikes = dislikes - 1, likes = likes + 1 WHERE reply_id = ?', [id], (err) => {
          if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ success: false });
          }
          db.query('UPDATE replies_user_reactions SET reaction = ? WHERE reply_id = ? AND username = ?', ['like', id, username], (err) => {
            if (err) {
              console.error('Database query error:', err);
              return res.status(500).json({ success: false });
            }
            res.json({ success: true });
          });
        });
      }
    } else {
      db.query('UPDATE replies SET likes = likes + 1 WHERE reply_id = ?', [id], (err) => {
        if (err) {
          console.error('Database query error:', err);
          return res.status(500).json({ success: false });
        }
        db.query('INSERT INTO replies_user_reactions (reply_id, username, reaction) VALUES (?, ?, ?)', [id, username, 'like'], (err) => {
          if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ success: false });
          }
          res.json({ success: true });
        });
      });
    }
  });
});

// Dislike a reply
app.post('/replies/:id/dislike', (req, res) => {
  const { id } = req.params;
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  const username = getUsernameFromToken(token);

  if (!username) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  db.query('SELECT * FROM replies_user_reactions WHERE reply_id = ? AND username = ?', [id, username], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ success: false });
    }

    if (results.length > 0) {
      const userReaction = results[0];
      if (userReaction.reaction === 'dislike') {
        return res.json({ success: true });
      } else if (userReaction.reaction === 'like') {
        db.query('UPDATE replies SET likes = likes - 1, dislikes = dislikes + 1 WHERE reply_id = ?', [id], (err) => {
          if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ success: false });
          }
          db.query('UPDATE replies_user_reactions SET reaction = ? WHERE reply_id = ? AND username = ?', ['dislike', id, username], (err) => {
            if (err) {
              console.error('Database query error:', err);
              return res.status(500).json({ success: false });
            }
            res.json({ success: true });
          });
        });
      }
    } else {
      db.query('UPDATE replies SET dislikes = dislikes + 1 WHERE reply_id = ?', [id], (err) => {
        if (err) {
          console.error('Database query error:', err);
          return res.status(500).json({ success: false });
        }
        db.query('INSERT INTO replies_user_reactions (reply_id, username, reaction) VALUES (?, ?, ?)', [id, username, 'dislike'], (err) => {
          if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ success: false });
          }
          res.json({ success: true });
        });
      });
    }
  });
});

module.exports = app;
