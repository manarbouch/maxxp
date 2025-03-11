require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const axios = require('axios');
const ngrok = require('ngrok');
const path = require('path');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const morgan = require('morgan');
const multer = require('multer'); // Added multer for file uploads

const app = express();
const PORT = process.env.PORT || 5001;

console.log("Server script is starting...");

// Ensure required environment variables are set
if (!process.env.HCAPTCHA_SECRET || !process.env.MONGO_URI || !process.env.NGROK_AUTH_TOKEN) {
    console.error('One or more required environment variables are missing.');
    process.exit(1);
}

// Track used hCaptcha tokens to prevent reuse
const usedTokens = new Set();

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    });

// User Schema & Model
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileImage: { type: String } // Added profile image field
});

const User = mongoose.model('User', userSchema);

// Middleware
const corsOptions = {
    origin: '*',
    methods: 'GET, POST',
    allowedHeaders: ['Content-Type'],
};

app.use(cors(corsOptions));
app.use(morgan('[:date[iso]] :method :url :status - :response-time ms'));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static('uploads')); // Serve uploaded images

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Ensure this folder exists
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

// hCaptcha Verification Middleware
const verifyCaptcha = async (req, res, next) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ error: 'Captcha token is required' });
    }

    if (usedTokens.has(token)) {
        return res.status(400).json({ error: 'Invalid captcha token' });
    }

    try {
        const verificationResponse = await axios.post(
            'https://hCaptcha.com/siteverify',
            `secret=${process.env.HCAPTCHA_SECRET}&response=${token}`,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        if (!verificationResponse.data.success) {
            return res.status(400).json({ error: 'Captcha verification failed', details: verificationResponse.data });
        }

        usedTokens.add(token);
        next();
    } catch (error) {
        console.error('hCaptcha verification error:', error);
        return res.status(500).json({ error: 'Captcha verification service unavailable', details: error.message });
    }
};

// User Authentication Endpoints
app.post('/login', verifyCaptcha, async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const user = await User.findOne({ email });
        if (user && await bcrypt.compare(password, user.password)) {
            console.log(`[${new Date().toISOString()}] ✅ LOGIN SUCCESS - User: ${email}`);
            res.status(200).json({ message: 'Login successful', redirect: '/profile.html' });
        } else {
            console.log(`[${new Date().toISOString()}] ❌ LOGIN FAILED - User: ${email} - Invalid credentials`);
            res.status(401).json({ error: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed', details: error.message });
    }
});

app.post('/join', verifyCaptcha, async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            console.log(`⚠️ User already exists: ${email}`);
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, password: hashedPassword });

        await newUser.save();
        console.log(`[${new Date().toISOString()}] ✅ REGISTRATION SUCCESS - New User: ${email}`);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({ error: 'Registration failed', details: error.message });
    }
});

// Profile Image Upload Endpoint
app.post('/upload-profile-image', upload.single('profileImage'), async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || !req.file) {
            return res.status(400).json({ error: 'Email and image are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.profileImage = `/uploads/${req.file.filename}`;
        await user.save();

        res.status(200).json({ message: 'Profile image updated successfully', imageUrl: user.profileImage });
    } catch (error) {
        console.error('Profile image upload error:', error);
        res.status(500).json({ error: 'Failed to upload profile image', details: error.message });
    }
});

// Email Sending Endpoint
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
        console.error('Email sending error:', error.message);
        res.status(500).json({ error: "Failed to send email", details: error.message });
    }
});

// Get All Users
app.get('/users', async (req, res) => {
    try {
        const users = await User.find({}, 'email profileImage');
        res.status(200).json(users);
    } catch (error) {
        console.error('Users fetch error:', error);
        res.status(500).json({ error: "Failed to fetch users", details: error.message });
    }
});

// Start Server
app.listen(PORT, async () => {
    console.log(`✅ Server is running on port ${PORT}`);
});
