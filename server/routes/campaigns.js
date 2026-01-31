const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Campaign = require('../models/Campaign');

// Configure multer for campaign header images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/campaigns');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'campaign-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
});

// Helper to format image URL
const formatCampaign = (campaign, req) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const c = campaign.toObject ? campaign.toObject() : campaign;
    if (c.headerImage && !c.headerImage.startsWith('http')) {
        c.headerImage = `${baseUrl}${c.headerImage}`;
    }
    return c;
};

// GET /api/campaigns/business/:businessId - Get campaigns for a specific business
router.get('/business/:businessId', async (req, res) => {
    try {
        const { businessId } = req.params;
        const campaigns = await Campaign.find({ businessId }).sort({ displayOrder: 1, createdAt: -1 });
        const formattedCampaigns = campaigns.map(c => formatCampaign(c, req));
        res.json(formattedCampaigns);
    } catch (err) {
        console.error('Error fetching campaigns:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/campaigns - Create a new campaign with image
router.post('/', upload.single('headerImage'), async (req, res) => {
    try {
        console.log('--- POST /api/campaigns ---');
        console.log('Body:', req.body);
        console.log('File:', req.file ? req.file.filename : 'No file');

        const campaignData = req.body || {};

        // Basic validation
        if (!campaignData.businessId || !campaignData.title || !campaignData.endDate) {
            return res.status(400).json({ message: 'İşletme Kimliği, Başlık ve Bitiş Tarihi zorunludur.' });
        }

        const headerImage = req.file ? `/uploads/campaigns/${req.file.filename}` : campaignData.headerImage;

        if (!headerImage && !req.file) {
            return res.status(400).json({ message: 'Kampanya fotoğrafı zorunludur.' });
        }

        // Explicitly structure the object to ensure consistent field order in MongoDB
        const newCampaign = new Campaign({
            businessId: campaignData.businessId,
            title: campaignData.title,
            shortDescription: campaignData.shortDescription || '',
            headerImage: headerImage,
            content: campaignData.content || '',
            rewardType: campaignData.rewardType || 'stamp',
            rewardValue: parseInt(campaignData.rewardValue) || 1,
            rewardValidityDays: parseInt(campaignData.rewardValidityDays) || 30,
            icon: campaignData.icon || 'stars_rounded',
            isPromoted: campaignData.isPromoted === 'true' || campaignData.isPromoted === true,
            displayOrder: parseInt(campaignData.displayOrder) || 0,
            startDate: campaignData.startDate || new Date(),
            endDate: campaignData.endDate
        });

        const savedCampaign = await newCampaign.save();
        console.log('Campaign saved successfully:', savedCampaign._id);

        res.status(201).json({
            message: 'Kampanya başarıyla oluşturuldu',
            campaign: formatCampaign(savedCampaign, req)
        });
    } catch (err) {
        console.error('Error in POST /api/campaigns:', err);
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// PATCH /api/campaigns/:id - Update a campaign with image
router.patch('/:id', upload.single('headerImage'), async (req, res) => {
    try {
        console.log('--- PATCH /api/campaigns/:id ---');
        console.log('ID:', req.params.id);
        console.log('Body:', req.body);

        const { id } = req.params;
        const data = req.body || {};

        const updatedData = { ...data };
        if (req.file) {
            updatedData.headerImage = `/uploads/campaigns/${req.file.filename}`;
        }

        // Enforce field order and type casting for Form Data strings
        const updateObject = {};
        const fields = [
            'businessId', 'title', 'shortDescription', 'headerImage', 'content',
            'rewardType', 'rewardValue', 'rewardValidityDays', 'icon',
            'isPromoted', 'displayOrder', 'startDate', 'endDate'
        ];

        fields.forEach(field => {
            if (updatedData[field] !== undefined) {
                let val = updatedData[field];
                if (field === 'isPromoted') val = val === 'true' || val === true;
                if (field === 'displayOrder' || field === 'rewardValue' || field === 'rewardValidityDays') {
                    const parsed = parseInt(val);
                    val = isNaN(parsed) ? (field === 'displayOrder' ? 0 : 1) : parsed;
                }
                updateObject[field] = val;
            }
        });

        const updatedCampaign = await Campaign.findByIdAndUpdate(
            id,
            { $set: updateObject },
            { new: true, runValidators: true }
        );

        if (!updatedCampaign) {
            return res.status(404).json({ message: 'Kampanya bulunamadı.' });
        }

        res.json({
            message: 'Kampanya başarıyla güncellendi',
            campaign: formatCampaign(updatedCampaign, req)
        });
    } catch (err) {
        console.error('Error in PATCH /api/campaigns/:id:', err);
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// DELETE /api/campaigns/:id - Delete a campaign
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCampaign = await Campaign.findByIdAndDelete(id);

        if (!deletedCampaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        res.json({ message: 'Campaign deleted successfully' });
    } catch (err) {
        console.error('Error deleting campaign:', err);
        res.status(500).json({ error: err.message });
    }
});

// Error handling middleware for this router
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'Dosya boyutu çok büyük (Max: 10MB)' });
        }
        return res.status(400).json({ message: err.message });
    } else if (err) {
        return res.status(500).json({ error: err.message });
    }
    next();
});

module.exports = router;
