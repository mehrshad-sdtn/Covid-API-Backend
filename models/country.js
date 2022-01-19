const mongoose = require('mongoose');

const countrySchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    todayCases: Number, 
    todayDeaths: Number,
    todayRecovered: Number,
    critical: Number
});

module.exports = mongoose.model('Country', countrySchema);
