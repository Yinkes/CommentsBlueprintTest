const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const path = require('path');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();

//port
const port = 5555;
//database connection
const db = require('./modules/db')



// CORS configuration
app.use(cors({
  origin: 'http://localhost:5550/account', // Replace with the correct URL of your frontend if it's different
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));



app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

app.use(cors());

app.get('/signin', (req, res) => {
  res.sendFile(path.join(__dirname, 'signin.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup.html'));
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/account', (req, res) => {
  res.sendFile(path.join(__dirname, 'account.html'));
});

const JWT_SECRET = 'your-secret-key';



//sign in
const signin = require('./modules/signin');
app.use('/signin', signin); // This mounts the signin routes

//signup
const signup = require('./modules/signup');
app.use(signup);  // Use the routes defined in signup module

//comments 
const comments = require('./modules/comments')
app.use(comments);


//repies
const replies = require('./modules/replies')
app.use(replies)


//account
const account = require('./modules/account')
app.use(account)



function getUsernameFromToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.username;
  } catch (err) {
    console.error('Invalid token:', err);
    return null;
  }
}

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});




