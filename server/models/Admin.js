const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['super_admin', 'business'],
        default: 'business'
    },
    businessName: {
        type: String,
        default: ''
    },
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        default: null
    },
    theme: {
        type: String,
        default: 'default'
    },
    logoUrl: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Admin', adminSchema, 'admins');
