const mongoose = require('mongoose');

const DataSchema = new mongoose.Schema({
    features: {
        type: Array,
        required: true
    },
    rawData: {
        type: Object, 
        required: false
    },
    timestamp: {
        type: Date,
        default: Date.now 
    }
});

module.exports = mongoose.model('Data', DataSchema);