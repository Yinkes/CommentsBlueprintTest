// comments.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const JWT_SECRET = 'your-secret-key'; // Ensure this matches the one used in your other files

function getUsernameFromToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.username;
  } catch (err) {
    console.error('Invalid token:', err);
    return null;
  }
}

function getPfp(username, callback) {
  const sql = 'SELECT pfp FROM users WHERE username = ?';
  db.query(sql, [username], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      callback(err, null);
      return;
    }
    if (results.length > 0) {
      callback(null, results[0].pfp);
    } else {
      callback(new Error('User not found'), null);
    }
  });
}

app.get('/comments', (req, res) => {
  const { sortby } = req.query;
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  const username = getUsernameFromToken(token);

  let sql = 'SELECT comments.*, (SELECT reaction FROM user_reactions WHERE user_reactions.comment_id = comments.comment_id AND user_reactions.username = ?) AS userReaction FROM comments ORDER BY created_at DESC';
  
  if (sortby === 'likes') {
    sql = 'SELECT comments.*, (SELECT reaction FROM user_reactions WHERE user_reactions.comment_id = comments.comment_id AND user_reactions.username = ?) AS userReaction FROM comments ORDER BY likes DESC';
  } else if (sortby === 'controversial') {
    sql = 'SELECT comments.*, (SELECT reaction FROM user_reactions WHERE user_reactions.comment_id = comments.comment_id AND user_reactions.username = ?) AS userReaction FROM comments ORDER BY dislikes DESC';
  }

  db.query(sql, [username], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      res.status(500).json({ success: false });
      return;
    }
    res.json({ comments: results });
  });
});

app.post('/comments', (req, res) => {
  const { comment_text } = req.body;
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  const username = getUsernameFromToken(token);

  if (!username) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  getPfp(username, (err, pfp) => {
    if (err) {
      console.error('Error fetching pfp:', err);
      return res.status(500).json({ success: false });
    }

    const sql = 'INSERT INTO comments (username, comment_text, pfp) VALUES (?, ?, ?)';
    db.query(sql, [username, comment_text, pfp], (err, result) => {
      if (err) {
        console.error('Database query error:', err);
        res.status(500).json({ success: false });
        return;
      }
      res.json({ success: true });
    });
  });
});

app.post('/replies', (req, res) => {
  const { comment_id, reply_text } = req.body;
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  const username = getUsernameFromToken(token);

  if (!username) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  getPfp(username, (err, pfp) => {
    if (err) {
      console.error('Error fetching pfp:', err);
      return res.status(500).json({ success: false });
    }

    const sql = 'INSERT INTO replies (comment_id, username, reply_text, pfp) VALUES (?, ?, ?, ?)';
    db.query(sql, [comment_id, username, reply_text, pfp], (err, result) => {
      if (err) {
        console.error('Database query error:', err);
        res.status(500).json({ success: false });
        return;
      }
      res.json({ success: true });
    });
  });
});

app.post('/comments/:id/like', (req, res) => {
  const { id } = req.params;
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  const username = getUsernameFromToken(token);

  if (!username) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  db.query('SELECT * FROM user_reactions WHERE comment_id = ? AND username = ?', [id, username], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ success: false });
    }

    if (results.length > 0) {
      const userReaction = results[0];
      if (userReaction.reaction === 'like') {
        return res.json({ success: true });
      } else if (userReaction.reaction === 'dislike') {
        db.query('UPDATE comments SET dislikes = dislikes - 1, likes = likes + 1 WHERE comment_id = ?', [id], (err) => {
          if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ success: false });
          }
          db.query('UPDATE user_reactions SET reaction = ? WHERE comment_id = ? AND username = ?', ['like', id, username], (err) => {
            if (err) {
              console.error('Database query error:', err);
              return res.status(500).json({ success: false });
            }
            res.json({ success: true });
          });
        });
      }
    } else {
      db.query('UPDATE comments SET likes = likes + 1 WHERE comment_id = ?', [id], (err) => {
        if (err) {
          console.error('Database query error:', err);
          return res.status(500).json({ success: false });
        }
        db.query('INSERT INTO user_reactions (comment_id, username, reaction) VALUES (?, ?, ?)', [id, username, 'like'], (err) => {
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

app.post('/comments/:id/dislike', (req, res) => {
  const { id } = req.params;
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  const username = getUsernameFromToken(token);

  if (!username) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  db.query('SELECT * FROM user_reactions WHERE comment_id = ? AND username = ?', [id, username], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ success: false });
    }

    if (results.length > 0) {
      const userReaction = results[0];
      if (userReaction.reaction === 'dislike') {
        return res.json({ success: true });
      } else if (userReaction.reaction === 'like') {
        db.query('UPDATE comments SET likes = likes - 1, dislikes = dislikes + 1 WHERE comment_id = ?', [id], (err) => {
          if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ success: false });
          }
          db.query('UPDATE user_reactions SET reaction = ? WHERE comment_id = ? AND username = ?', ['dislike', id, username], (err) => {
            if (err) {
              console.error('Database query error:', err);
              return res.status(500).json({ success: false });
            }
            res.json({ success: true });
          });
        });
      }
    } else {
      db.query('UPDATE comments SET dislikes = dislikes + 1 WHERE comment_id = ?', [id], (err) => {
        if (err) {
          console.error('Database query error:', err);
          return res.status(500).json({ success: false });
        }
        db.query('INSERT INTO user_reactions (comment_id, username, reaction) VALUES (?, ?, ?)', [id, username, 'dislike'], (err) => {
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
