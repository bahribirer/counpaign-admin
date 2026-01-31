const router = require('express').Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Admin = require('../models/Admin');
const Business = require('../models/Business');
const CustomerBusiness = require('../models/CustomerBusiness');
const Campaign = require('../models/Campaign');
const Terminal = require('../models/Terminal');
const Participation = require('../models/Participation');
const Transaction = require('../models/Transaction');
const Review = require('../models/Review');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/logos');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
});

// GET /api/firms/my-business - Get current user's business ID
// This is a helper for the frontend to recover businessId if lost in state

router.get('/my-business', async (req, res) => {
    try {
        // Simple token extraction since we might not have middleware file handy
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) return res.status(401).json({ message: 'No token provided' });

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded._id) return res.status(403).json({ message: 'Invalid token' });

        const admin = await Admin.findById(decoded._id);
        if (!admin || !admin.businessId) {
            return res.status(404).json({ message: 'Business not found for this user' });
        }

        res.json({ businessId: admin.businessId, businessName: admin.businessName });

    } catch (err) {
        console.error('Error fetching my business:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/firms - Get all businesses/firms
router.get('/', async (req, res) => {
    try {
        const businesses = await Business.find().sort({ createdAt: -1 });
        res.json(businesses);
    } catch (err) {
        console.error('Error fetching firms:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/firms/:id - Delete a business/firm
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Find and delete the business
        const deletedBusiness = await Business.findByIdAndDelete(id);

        if (!deletedBusiness) {
            return res.status(404).json({ message: 'Firm not found' });
        }

        // Also delete all associated data
        await Promise.all([
            Admin.deleteMany({ businessId: id }),
            CustomerBusiness.deleteMany({ business: id }),
            Campaign.deleteMany({ businessId: id }),
            Terminal.deleteMany({ businessId: id }),
            Participation.deleteMany({ business: id }),
            Transaction.deleteMany({ business: id }),
            Review.deleteMany({ business: id })
        ]);

        res.json({
            message: 'Firm and all associated data deleted successfully',
            deletedBusiness: {
                id: deletedBusiness._id,
                companyName: deletedBusiness.companyName
            }
        });
    } catch (err) {
        console.error('Error deleting firm:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/firms - Create new business/firm
router.post('/', upload.single('logo'), async (req, res) => {
    try {
        const { name, email, password, settings } = req.body;

        // Parse settings if it's a string
        const parsedSettings = typeof settings === 'string' ? JSON.parse(settings) : settings;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        if (!parsedSettings || !parsedSettings.district || !parsedSettings.neighborhood) {
            return res.status(400).json({ message: 'District and neighborhood are required' });
        }

        // Check if email already exists in Admin
        const existingAdmin = await Admin.findOne({ username: email });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin email already exists' });
        }

        // Check if email already exists in Business (main backend)
        const existingBusiness = await Business.findOne({ email: email });
        if (existingBusiness) {
            return res.status(400).json({ message: 'Business email already exists' });
        }

        // Get logo URL (if uploaded)
        const logoUrl = req.file ? `/uploads/logos/${req.file.filename}` : null;

        // Create new business in the MAIN BACKEND Business collection
        const newBusiness = new Business({
            companyName: name,
            email: email,
            password: password, // Will be hashed by Business model's pre-save hook
            category: parsedSettings.category || 'Cafe',
            logo: logoUrl,
            cardColor: parsedSettings.cardColor || '#EE2C2C',
            cardIcon: parsedSettings.cardIcon || 'local_cafe_rounded',
            city: parsedSettings.city || 'Ankara',
            district: parsedSettings.district,
            neighborhood: parsedSettings.neighborhood,
            settings: {
                pointsPerVisit: 10,
                redemptionThreshold: 100
            }
        });

        const savedBusiness = await newBusiness.save();

        // Hash password for Admin
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create admin and link to the business
        const newAdmin = new Admin({
            username: email,
            password: hashedPassword,
            role: 'business',
            businessName: name,
            businessId: savedBusiness._id, // Link to the Business
            theme: name.toLowerCase().replace(/\s+/g, '-'),
            logoUrl: logoUrl || ''
        });

        const savedAdmin = await newAdmin.save();

        res.status(201).json({
            message: 'Firm created successfully',
            admin: {
                id: savedAdmin._id,
                username: savedAdmin.username,
                businessName: savedAdmin.businessName,
                businessId: savedAdmin.businessId
            },
            business: {
                id: savedBusiness._id,
                companyName: savedBusiness.companyName,
                email: savedBusiness.email
            }
        });
    } catch (err) {
        console.error('Error creating firm:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
