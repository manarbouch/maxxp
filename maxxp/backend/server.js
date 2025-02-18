const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB connection
mongoose.connect("mongodb+srv://MaxxEnergy:Maxxenergy@maxxenergy.jy0mw.mongodb.net/Maxxenergy?retryWrites=true&w=majority")

    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// User schema
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

const corsOptions = {
    origin: 'http://127.0.0.1:5001', // Explicitly allow the frontend URL
    methods: 'GET, POST',  // Specify methods that your API will accept
    allowedHeaders: ['Content-Type'], // Allow necessary headers
};

app.use(cors(corsOptions));
console.log("Server script is starting...");

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Endpoint for login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Validate input fields
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (user && await bcrypt.compare(password, user.password)) {
        // Successful login
        res.status(200).json({ message: 'Login successful' });
    } else {
        // Invalid credentials
        res.status(401).json({ error: 'Invalid email or password' });
    }
});

// API Endpoint for user registration
app.post('/join', async (req, res) => {
    const { email, password } = req.body;

    // Validate input fields
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    // Successful registration
    res.status(201).json({ message: 'User registered successfully' });
});

// API Endpoint to send email
app.post('/send-email', async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.RECEIVER_EMAIL,
            subject: `Message from ${name}`,
            text: `From: ${name} <${email}>\n\nMessage:\n${message}`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Email sent successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to send email", details: error.message });
    }
});

app.get('/users', async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch users", details: error.message });
    }
});

// Catch-all route to serve index.html for any non-API requests

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
