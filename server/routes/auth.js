const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_change_this';

// REGISTER / SEED (Protected or Internal use mostly)
router.post('/register', async (req, res) => {
    try {
        const { username, password, role, businessName, theme } = req.body;

        // Check if user exists
        const existingUser = await Admin.findOne({ username });
        if (existingUser) return res.status(400).json({ message: 'Username already exists' });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new Admin({
            username,
            password: hashedPassword,
            role,
            businessName,
            theme
        });

        const savedUser = await newUser.save();
        res.status(201).json({ message: 'User created', userId: savedUser._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { username, password, phoneNumber } = req.body;

        let user = null;
        let isCustomer = false;

        // 1. Try Admin Login (if username provided)
        if (username) {
            user = await Admin.findOne({ username });
        }

        // 2. Try Customer Login (if phoneNumber provided AND no admin found yet)
        if (!user && phoneNumber) {
            const Customer = require('../models/Customer');

            // Normalize phone number (remove spaces, symbols)
            const cleanPhone = phoneNumber.replace(/\D/g, '');
            // Handle +90 or 0 prefix by checking the last 10 digits
            const last10 = cleanPhone.slice(-10);

            // Find user using Regex to allow partial match or different formats
            user = await Customer.findOne({
                phoneNumber: { $regex: last10, $options: 'i' }
            });

            if (user) isCustomer = true;
        }

        if (!user) {
            return res.status(400).json({ message: 'Kullanıcı bulunamadı.' });
        }

        // 3. Check Password
        let validPass = false;
        if (isCustomer) {
            // Use method from Customer model
            validPass = await user.comparePassword(password);
        } else {
            // Admin manual check
            validPass = await bcrypt.compare(password, user.password);
        }

        if (!validPass) {
            return res.status(400).json({ message: 'Hatalı şifre.' });
        }

        // 4. Create Token
        const token = jwt.sign(
            {
                _id: user._id,
                role: user.role,
                type: isCustomer ? 'customer' : 'admin'
            },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        // 5. Return Response
        // Format response based on user type to satisfy both apps
        const responseData = {
            token,
            user: {
                id: user._id,
                role: user.role,
                // Common fields or specific ones
                ...(isCustomer ? {
                    name: user.name,
                    surname: user.surname,
                    phoneNumber: user.phoneNumber,
                    email: user.email,
                    profileImage: user.profileImage
                } : {
                    username: user.username,
                    businessName: user.businessName,
                    businessId: user.businessId,
                    theme: user.theme,
                    logoUrl: user.logoUrl
                })
            }
        };

        res.json(responseData);

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
