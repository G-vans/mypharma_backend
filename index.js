// Import necessary modules and initialize express app
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

// Create and connect to SQLite database
const db = new sqlite3.Database(':memory:');

// This will create tables in the database
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS medications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        form TEXT NOT NULL,
        dose TEXT NOT NULL,
        price REAL NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        medication_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (medication_id) REFERENCES medications(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        phone_number TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS cart (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        medication_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (medication_id) REFERENCES medications(id)
    )`);
});

// Middleware to parse JSON requests
app.use(bodyParser.json());

// User routes
app.post('/signup', (req, res) => {
    const { email, password } = req.body;
    console.log('Received signup request:', { email, password }); // Add this line for logging
    db.run(`INSERT INTO users (email, password) VALUES (?, ?)`, [email, password], (err) => {
        if (err) {
            console.error('Error creating user:', err); // Add this line for logging
            return res.status(500).json({ error: 'Failed to create user' });
        }
        console.log('User created successfully'); // Add this line for logging
        res.status(201).json({ message: 'User created successfully' });
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ? AND password = ?`, [email, password], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Login failed' });
        }
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.status(200).json({ message: 'Login successful', user });
    });
});

// Medications routes
app.get('/medications', (req, res) => {
    db.all(`SELECT * FROM medications`, (err, medications) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to retrieve medications' });
        }
        res.status(200).json(medications);
    });
});

app.post('/medications', (req, res) => {
    const { name, form, dose, price } = req.body;
    db.run(`INSERT INTO medications (name, form, dose, price) VALUES (?, ?, ?, ?)`, [name, form, dose, price], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to add medication' });
        }
        res.status(201).json({ message: 'Medication added successfully' });
    });
});

// Orders routes
app.get('/orders', (req, res) => {
    db.all(`SELECT * FROM orders`, (err, orders) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to retrieve orders' });
        }
        res.status(200).json(orders);
    });
});

app.post('/orders', (req, res) => {
    const { user_id, medication_id, quantity } = req.body;
    db.run(`INSERT INTO orders (user_id, medication_id, quantity) VALUES (?, ?, ?)`, [user_id, medication_id, quantity], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to place order' });
        }
        res.status(201).json({ message: 'Order placed successfully' });
    });
});

// Payments routes
app.post('/payments', (req, res) => {
    const { order_id, phone_number } = req.body;
    db.run(`INSERT INTO payments (order_id, phone_number) VALUES (?, ?)`, [order_id, phone_number], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to process payment' });
        }
        res.status(201).json({ message: 'Payment processed successfully' });
    });
});

// Cart routes
app.get('/cart', (req, res) => {
    const { user_id } = req.body;
    db.all(`SELECT * FROM cart WHERE user_id = ?`, [user_id], (err, cartItems) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to retrieve cart' });
        }
        res.status(200).json(cartItems);
    });
});

app.post('/cart', (req, res) => {
    const { user_id, medication_id, quantity } = req.body;
    db.run(`INSERT INTO cart (user_id, medication_id, quantity) VALUES (?, ?, ?)`, [user_id, medication_id, quantity], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to add medication to cart' });
        }
        res.status(201).json({ message: 'Medication added to cart successfully' });
    });
});

app.delete('/cart/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM cart WHERE id = ?`, [id], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to remove medication from cart' });
        }
        res.status(200).json({ message: 'Medication removed from cart successfully' });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
