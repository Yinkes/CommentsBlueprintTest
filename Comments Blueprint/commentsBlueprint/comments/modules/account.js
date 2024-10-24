const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('./db');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const JWT_SECRET = 'your-secret-key';

async function getUsernameFromToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded.username;
    } catch (err) {
        console.error('Invalid token:', err);
        return null;
    }
}

async function generateToken(username) {
    return jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
}

router.post('/update-username', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const oldUsername = await getUsernameFromToken(token);

    if (!oldUsername) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { newUsername } = req.body;

    try {
        db.query('UPDATE users SET username = ? WHERE username = ?', [newUsername, oldUsername], async (err) => {
            if (err) {
                console.error('Error updating username in database:', err);
                return res.status(500).json({ error: 'Failed to update username' });
            }

            // Generate a new token with the new username
            const newToken = await generateToken(newUsername);
            res.json({ success: true, newToken });
        });
    } catch (error) {
        console.error('Error updating username:', error);
        res.status(500).json({ error: 'Failed to update username' });
    }
});

router.post('/update-password', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const username = await getUsernameFromToken(token);

    if (!username) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { currentPassword, newPassword } = req.body;

    try {
        db.query('SELECT password FROM users WHERE username = ?', [username], async (err, results) => {
            if (err) {
                console.error('Error fetching user:', err);
                return res.status(500).json({ error: 'Failed to fetch user' });
            }

            if (results.length === 0) {
                return res.status(400).json({ error: 'User not found' });
            }

            const storedPassword = results[0].password;

            const match = await bcrypt.compare(currentPassword, storedPassword);
            if (!match) {
                return res.status(400).json({ error: 'Current password is incorrect' });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            db.query('UPDATE users SET password = ? WHERE username = ?', [hashedPassword, username], (err) => {
                if (err) {
                    console.error('Error updating password in database:', err);
                    return res.status(500).json({ error: 'Failed to update password' });
                }
                res.json({ success: true });
            });
        });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ error: 'Failed to update password' });
    }
});

// PFP functionality (no changes needed here)
const getOctokit = async () => {
    const { default: octokit } = await import('./githubClient.mjs');
    return octokit;
};

router.post('/upload-pfp', upload.single('pfp'), async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const username = await getUsernameFromToken(token);

    if (!username) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const octokit = await getOctokit();
        const filePath = `profile-pics/${username}/${Date.now()}_${req.file.originalname}`;
        await octokit.repos.createOrUpdateFileContents({
            owner: 'Yinkes',
            repo: 'CommentsExamplePFPs',
            path: filePath,
            message: 'Upload profile picture',
            content: req.file.buffer.toString('base64')
        });

        const imageUrl = `https://github.com/Yinkes/CommentsExamplePFPs/raw/main/${filePath}`;

        db.query('UPDATE users SET pfp = ? WHERE username = ?', [imageUrl, username], (err) => {
            if (err) {
                console.error('Error updating database:', err);
                return res.status(500).json({ error: 'Failed to update profile picture' });
            }
            res.json({ success: true });
        });
    } catch (error) {
        console.error('Error uploading file to GitHub:', error);
        res.status(500).json({ error: 'Failed to upload file to GitHub' });
    }
});

module.exports = router;
