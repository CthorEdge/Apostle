// Importing required modules
const http = require('http');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql');
const express = require('express');

const app = express();
app.use(express.json()); // Middleware to parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Middleware to parse URL-encoded request bodies

// Define the port number
const PORT = process.env.PORT || 5000;

// MySQL database connection configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'apotek'
};

// Create a MySQL connection pool
var pool = mysql.createPool(dbConfig);

// Connect to MySQL and start the server
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
    connection.release(); // Release the connection
});

// Start the server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// API SECTION
// getting user credentials
app.get('/login', (req, res) => {

    const requestBody = req.body
    const sql = `SELECT account_name, account_role FROM account WHERE account_name = '${requestBody.username}' AND account_password = '${requestBody.password}'`

    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
        else if (results==null) {
            res.status(500).json({ error: 'User Credentials Does Not Match!'})
        }

        console.log(results);
        res.json(results);
    });
});

// getting stock data
app.get('/stock', (req, res) => {

    const sql = `SELECT 
                    medicine_stock.received_date, medicine.medicine_name,medicine_stock.medicine_qty, 
                    medicine_stock.qty_unit, medicine.sell_price, medicine_stock.medicine_exp_date
                 FROM 
                    medicine_stock 
                 LEFT JOIN 
                    medicine 
                 ON 
                    medicine_stock.medicine_id  = medicine.medicine_id`

    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        console.log(results);
        res.json(results);
    });
});

// getting current ppn value
app.get('/get_ppn', (req, res) => {

    const sql = `SELECT ppn_value FROM account where account_role = 'admin'`

    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
        console.log(results);
        res.json(results);
    });
});

// adjusting ppn value
app.post('/adjust_ppn', (req, res) => {

    const{ppn_value} = req.query

    const sql = `UPDATE account set ppn_value = ${ppn_value}  where account_role='admin'`

    pool.query(sql, (error, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
    });

    res.send('well received')
})