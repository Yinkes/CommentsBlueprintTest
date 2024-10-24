const mysql = require('mysql')


const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '8098',
    database: 'example1',
    port: 3306
  });
  
  db.connect((err) => {
    if (err) {
      console.error('Error connecting to database:', err.stack);
      return;
    }
    console.log('Connected to database as id', db.threadId);
  });

  
  module.exports = db;