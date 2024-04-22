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
// const dbConfig = {
//     host: 'localhost',
//     user: 'root',
//     password: 'root',
//     database: 'apotek'
// };
const dbConfig = {
    host: 'roundhouse.proxy.rlwy.net',
    user: 'root',
    password: 'MRLHYGJjtSWWMUuZKkvYMlhUESusYyOX',
    database: 'apotek',
    port: 25271,
    protocol: 'TCP'
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

// FUNCTIONAL API SECTION
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
app.get('/stock', (res) => {

    const sql = `select 
                    invoice_number, received_date, equipment_name stock_name, equipment_qty qty, qty_unit unit, null exp_date, 'equipment' category
                    from equipment_stock left join equipment using(equipment_id)
                union all
                select
                    invoice_number, received_date, medicine_name, medicine_qty, qty_unit, medicine_exp_date, 'medicine'
                    from medicine_stock left join medicine using(medicine_id)
                union all
                select 
                    invoice_number, received_date, ingredient_name, ingredient_qty, qty_unit, ingredient_exp_date, 'ingredient'
                    from ingredient_stock left join ingredient using(ingredient_id);`

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
        res.json(results)
    });
});

// API SECTION: Root Table Operations
// ----------------------------------
// TABLE equipment
app.post('/new_equipment', (req, res) => {

    const requestBody = req.body
    const sql = `INSERT INTO equipment (equipment_name,sell_price) VALUES ('${requestBody.equipmentName}', '${requestBody.sellPrice}');`


    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.send('well received')
    });
});
app.post('/delete_equipment', (req, res) => {

    const requestBody = req.body
    const sql = `DELETE FROM equipment WHERE (equipment_id = '${requestBody.equipmentId}');`


    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.send('item deleted')
    });
});
app.post('/update_equipment', (req, res) => {

    const requestBody = req.body
    const sql = `UPDATE equipment SET equipment_name = '${requestBody.equipmentName}', sell_price = '${requestBody.sellPrice}' WHERE (equipment_id = '${requestBody.equipmentId}');`

    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.send('item updated')
    });
});

// TABLE account
// could be use to adjust ppn value
app.post('/update_account', (req, res) => {

    const requestBody = req.body
    const sql = `UPDATE account set account_name = '${requestBody.accountName}',account_password='${requestBody.accountPassword}',ppn_value = ${requestBody.ppnValue} 
                 where account_id='${requestBody.accountId}'`

    pool.query(sql, (error, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
    });

    res.send('item updated')
})