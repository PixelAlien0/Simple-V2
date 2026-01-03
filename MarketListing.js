const mongoose = require('mongoose');

const MarketListingSchema = new mongoose.Schema({
    seller: { type: String, required: true },
    item: { type: Object, required: true }, // The item instance
    price: { type: Number, required: true },
    listedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MarketListing', MarketListingSchema);
