// Importing required modules
const http = require('http');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql');
const express = require('express');
const cors = require("cors");

const app = express();
app.use(cors())
app.use(express.json()); // Middleware to parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Middleware to parse URL-encoded request bodies

// Define the port number
const PORT = 5000;

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

app.get('/test', (req, res) => {

    console.log("test succeed");
    res.json("gatau ah males pengen beli truck");

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
app.get('/stock', (req, res) => {

    const sql = `select 
    invoice_number, received_date, equipment_name stock_name, equipment_qty qty, unit_name unit, null exp_date, 'equipment' category, price_per_unit price, qty_stock stock
    from equipment_stock left join equipment using(equipment_id) left join item_unit using(unit_id)
union all
select
    invoice_number, received_date, medicine_name, medicine_qty, unit_name, medicine_exp_date, 'medicine', price_per_unit, qty_stock
    from medicine_stock left join medicine using(medicine_id) left join item_unit using(unit_id)
union all
select 
    invoice_number, received_date, ingredient_name, ingredient_qty, unit_name, ingredient_exp_date, 'ingredient', price_per_unit, qty_stock
    from ingredient_stock left join ingredient using(ingredient_id) left join item_unit using(unit_id);`

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
// getting item referrence
app.get('/get_item_referrence', (req, res) => {

    const sql = `select medicine_id id, medicine_name item_name, 'medicine' category from medicine
    union all
    select equipment_id, equipment_name, 'equipment' category from equipment
    union all
    select ingredient_id, ingredient_name, 'ingredient' category from ingredient;
    `

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
app.get('/get_equipment', (req, res) => {

    const requestBody = req.body
    const sql = `select * from equipment WHERE (equipment_id = '${requestBody.equipmentId}');`

    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.json(results)
    });
});


// TABLE ingredient
app.post('/new_ingredient', (req, res) => {

    const requestBody = req.body
    const sql = `INSERT INTO equipment (ingredient_name,sell_price) VALUES ('${requestBody.ingredientName}', '${requestBody.sellPrice}');`


    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.send('well received')
    });
});
app.post('/delete_ingredient', (req, res) => {

    const requestBody = req.body
    const sql = `DELETE FROM ingredient WHERE (ingredient_id = '${requestBody.ingredientId}');`


    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.send('item deleted')
    });
});
app.post('/update_ingredient', (req, res) => {

    const requestBody = req.body
    const sql = `UPDATE ingredient SET ingredient_name = '${requestBody.ingredientName}', sell_price = '${requestBody.sellPrice}' WHERE (ingredient_id = '${requestBody.ingredientId}');`

    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.send('item updated')
    });
});
app.get('/get_ingredient', (req, res) => {

    const requestBody = req.body
    const sql = `select * from ingredient WHERE (ingredient_id = '${requestBody.ingredientId}');`

    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.json(results)
    });
});

// TABLE order
app.post('/new_order', (req, res) => {

    const requestBody = req.body
    const sql = `INSERT INTO order (order_date,order_item_id) VALUES ('${requestBody.orderDate}', '${requestBody.orderId}');`


    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.send('well received')
    });
});
app.post('/delete_order', (req, res) => {

    const requestBody = req.body
    const sql = `DELETE FROM order WHERE (order_id = '${requestBody.orderId}');`


    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.send('item deleted')
    });
});
app.post('/update_order', (req, res) => {

    const requestBody = req.body
    const sql = `UPDATE order SET order_date = '${requestBody.orderDate}' WHERE (order_id = '${requestBody.orderId}');`

    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.send('item updated')
    });
});
app.get('/get_order', (req, res) => {

    const requestBody = req.body
    const sql = `select * from order WHERE (order_id = '${requestBody.orderId}');`

    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.json(results)
    });
});
app.get('/get_order_reference', (req, res) => {

    const sql = `select order_id,order_date from order;`

    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.json(results)
    });
});

// TABLE medicine
app.post('/new_medicine', (req, res) => {

    const requestBody = req.body
    const sql = `INSERT INTO medicine 
                    (medicine_name,medicine_type,sell_price) VALUES ('${requestBody.medicineName}', '${requestBody.medicineType}','${requestBody.sellPrice}');`


    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.send('well received')
    });
});
app.post('/delete_medicine', (req, res) => {

    const requestBody = req.body
    const sql = `DELETE FROM medicine WHERE (medicine_id = '${requestBody.medicineId}');`


    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.send('item deleted')
    });
});
app.post('/update_medicine', (req, res) => {

    const requestBody = req.body
    const sql = `UPDATE medicine SET 
                medicine_name = '${requestBody.medicineName}', medicine_type = '${requestBody.medicineType}', sell_price = '${requestBody.sellPrice}' WHERE (medicine_id = '${requestBody.medicineId}');`

    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.send('item updated')
    });
});
app.get('/get_medicine', (req, res) => {

    const requestBody = req.body
    const sql = `select * from medicine WHERE (medicine_id = '${requestBody.medicineId}');`

    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.json(results)
    });
});

// TABLE item_unit
app.post('/new_unit', (req, res) => {

    const requestBody = req.body
    const sql = `INSERT INTO item_unit 
                    (unit_name) VALUES ('${requestBody.unitName}');`


    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.send('well received')
    });
});
app.post('/delete_unit', (req, res) => {

    const requestBody = req.body
    const sql = `DELETE FROM item_unit WHERE (unit_id = '${requestBody.unitId}');`


    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.send('item deleted')
    });
});
app.post('/update_unit', (req, res) => {

    const requestBody = req.body
    const sql = `UPDATE item_unit SET 
                unit_name = '${requestBody.unitName}' WHERE (unit_id = '${requestBody.unitId}');`

    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.send('item updated')
    });
});
app.get('/get_unit', (req, res) => {

    const requestBody = req.body
    const sql = `select * from item_unit WHERE (unit_id = '${requestBody.unitId}');`

    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.json(results)
    });
});
app.get('/get_unit_reference', (req, res) => {

    const sql = `select unit_id,unit_name from item_unit;`

    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.json(results)
    });
});

// TABLE medicine_component
app.post('/new_medicine_component', (req, res) => {

    const requestBody = req.body
    const sql = `INSERT INTO medicine_component 
                    (component_qty, unit_id, medicine_id, ingredient_id) VALUES ('${requestBody.componentQty}','${requestBody.unitId}','${requestBody.medicineId}','${requestBody.ingredientId}');`


    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.send('well received')
    });
});
app.post('/delete_medicine_component', (req, res) => {

    const requestBody = req.body
    const sql = `DELETE FROM medicine_component WHERE (medicine_component_id = '${requestBody.medicineComponentId}');`


    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.send('item deleted')
    });
});
app.post('/update_medicine_component', (req, res) => {

    const requestBody = req.body
    const sql = `UPDATE medicine_component SET 
                component_qty = '${requestBody.componentQty}',unit_id = '${requestBody.unitId}',medicine_id = '${requestBody.medicineId}',ingredient_id= '${requestBody.ingredientId}' WHERE (medicine_component_id = '${requestBody.medicineComponentId}');`

    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.send('item updated')
    });
});
app.get('/get_medicine_component', (req, res) => {

    const requestBody = req.body
    const sql = `select * from medicine_component WHERE (medicine_component_id = '${requestBody.medicineComponentId}');`

    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.json(results)
    });
});

// TABLE order_item
app.post('/new_order_item', (req, res) => {

    const requestBody = req.body
    const sql = `INSERT INTO order_item 
                    (item_qty, medicine_id, equipment_id, unit_id) VALUES ('${requestBody.itemQty}','${requestBody.medicineId}','${requestBody.equipmentId}','${requestBody.unitId}');`


    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.send('well received')
    });
});
app.post('/delete_order_item', (req, res) => {

    const requestBody = req.body
    const sql = `DELETE FROM order_item WHERE (order_item_id = '${requestBody.orderItemId}');`


    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.send('item deleted')
    });
});
app.post('/update_order_item', (req, res) => {

    const requestBody = req.body
    const sql = `UPDATE order_item SET 
                item_qty = '${requestBody.itemQty}',medicine_id = '${requestBody.medicineId}',equipment_id = '${requestBody.equipmentId}',unit_id= '${requestBody.unitId}',order_id = '${requestBody.orderId}' WHERE (order_item_id = '${requestBody.orderItemId}');`

    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.send('item updated')
    });
});
app.get('/get_order_item', (req, res) => {

    const requestBody = req.body
    const sql = `select * from order_item WHERE (order_item_id = '${requestBody.orderItemId}');`

    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.json(results)
    });
});

// TABLE medicine_stock
app.post('/new_medicine_stock', (req, res) => {

    const requestBody = req.body
    const sql = `INSERT INTO medicine_stock 
                    (unit_id,medicine_qty,medicine_id,medicine_exp_date,received_date,price_per_unit,invoice_number,qty_stock) 
                    VALUES ('${requestBody.unitId}','${requestBody.medicineQty}','${requestBody.medicineId}','${requestBody.medicineExpDate}','${requestBody.receivedDate}','${requestBody.pricePerUnit}','${requestBody.invoiceNumber}','${requestBody.qtyStock}');`


    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.send('well received')
    });
});
app.post('/delete_medicine_stock', (req, res) => {

    const requestBody = req.body
    const sql = `DELETE FROM medicine_stock WHERE (medicine_stock_id = '${requestBody.medicineStockId}');`


    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.send('item deleted')
    });
});
app.post('/update_medicine_stock', (req, res) => {

    const requestBody = req.body
    const sql = `UPDATE medicine_stock SET 
                qty_stock = '${requestBody.qtyStock}',
                unit_id = '${requestBody.unitId}',medicine_qty = '${requestBody.medicineQty}',medicine_id = '${requestBody.medicineId}',medicine_exp_date='${requestBody.medicineExpDate}',received_date='${requestBody.receivedDate}',price_per_unit='${requestBody.pricePerUnit}',invoice_number='${requestBody.invoiceNumber}'
                WHERE (order_item_id = '${requestBody.orderItemId}');`

    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.send('item updated')
    });
});
app.get('/get_medicine_stock', (req, res) => {

    const requestBody = req.body
    const sql = `select * from medicine_stock WHERE (medicine_stock_id = '${requestBody.medicineStockId}');`

    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.json(results)
    });
});

// TABLE equipment_stock
app.post('/new_equipment_stock', (req, res) => {

    const requestBody = req.body
    const sql = `INSERT INTO equipment_stock 
                    (equipment_qty,equipment_id,unit_id,received_date,price_per_unit,invoice_number,qty_stock) 
                    VALUES ('${requestBody.equipmentQty}','${requestBody.equipmentId}','${requestBody.unitId}','${requestBody.receivedDate}','${requestBody.pricePerUnit}','${requestBody.invoiceNumber}','${requestBody.qtyStock}');`


    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.send('well received')
    });
});
app.post('/delete_equipment_stock', (req, res) => {

    const requestBody = req.body
    const sql = `DELETE FROM equipment_stock WHERE (equipment_stock_id = '${requestBody.equipmentStockId}');`


    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.send('item deleted')
    });
});
app.post('/update_equipment_stock', (req, res) => {

    const requestBody = req.body
    const sql = `UPDATE equipment_stock SET 
                qty_stock = '${requestBody.qtyStock}',
                unit_id = '${requestBody.unitId}',equipment_qty = '${requestBody.equipmentQty}',equipment_id = '${requestBody.equipmentId}',received_date='${requestBody.receivedDate}',price_per_unit='${requestBody.pricePerUnit}',invoice_number='${requestBody.invoiceNumber}'
                WHERE (equipment_stock_id = '${requestBody.equipmentStockId}');`

    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.send('item updated')
    });
});
app.get('/get_equipment_stock', (req, res) => {

    const requestBody = req.body
    const sql = `select * from equipment_stock WHERE (equipment_stock_id = '${requestBody.equipmentStockId}');`

    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.json(results)
    });
});

// TABLE ingredient_stock
app.post('/new_ingredient_stock', (req, res) => {

    const requestBody = req.body
    const sql = `INSERT INTO ingredient_stock 
                    (ingredient_qty,ingredient_id,unit_id,ingredient_exp_date,received_date,price_per_unit,invoice_number,qty_stock) 
                    VALUES ('${requestBody.ingredientQty}','${requestBody.ingredientId}','${requestBody.unitId}','${requestBody.ingredientExpDate}','${requestBody.receivedDate}','${requestBody.pricePerUnit}','${requestBody.invoiceNumber}','${requestBody.qtyStock}');`


    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.send('well received')
    });
});
app.post('/delete_ingredient_stock', (req, res) => {

    const requestBody = req.body
    const sql = `DELETE FROM ingredient_stock WHERE (ingredient_stock_id = '${requestBody.ingredientStockId}');`


    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.send('item deleted')
    });
});
app.post('/update_ingredient_stock', (req, res) => {

    const requestBody = req.body
    const sql = `UPDATE ingredient_stock SET
                qty_stock = '${requestBody.qtyStock}',ingredient_exp_date = '${requestBody.ingredientExpDate}',
                unit_id = '${requestBody.unitId}',ingredient_qty = '${requestBody.ingredientQty}',ingredient_id = '${requestBody.ingredientId}',received_date='${requestBody.receivedDate}',price_per_unit='${requestBody.pricePerUnit}',invoice_number='${requestBody.invoiceNumber}'
                WHERE (ingredient_stock_id = '${requestBody.ingredientStockId}');`

    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.send('item updated')
    });
});
app.get('/get_ingredient_stock', (req, res) => {

    const requestBody = req.body
    const sql = `select * from ingredient_stock WHERE (ingredient_stock_id = '${requestBody.ingredientStockId}');`

    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.json(results)
    });
});


