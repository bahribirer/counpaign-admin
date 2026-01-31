const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    shortDescription: {
        type: String,
        required: true,
        trim: true
    },
    headerImage: {
        type: String,
        default: null
    },
    content: {
        type: String,
        required: true
    },
    rewardType: {
        type: String,
        enum: ['points', 'stamp'],
        required: true
    },
    rewardValue: {
        type: Number,
        required: true,
        default: 1
    },
    rewardValidityDays: {
        type: Number,
        required: true,
        default: 30
    },
    icon: {
        type: String,
        default: 'star_rounded'
    },
    isPromoted: {
        type: Boolean,
        default: false
    },
    displayOrder: {
        type: Number,
        default: 0
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

campaignSchema.index({ businessId: 1, displayOrder: 1 });

module.exports = mongoose.model('Campaign', campaignSchema);
