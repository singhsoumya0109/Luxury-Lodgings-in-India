const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BookingSchema = new Schema({
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    hotel: {
        type: Schema.Types.ObjectId,
        ref: 'Hotel'
    },
    checkin: Date,
    checkout: Date,
    rooms:Number,
    adults:Number,
    children:Number,
    price: Number
}, {
    timestamps: true 
});

module.exports = mongoose.model('Booking', BookingSchema);
