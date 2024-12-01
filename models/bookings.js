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
    checkout: {
        type: Date,
        required: true, // Ensure this field is always present
        index: { expires: 0 } // TTL Index: Expire as soon as `checkout` passes
    },
    rooms: Number,
    adults: Number,
    children: Number,
    price: Number
}, {
    timestamps: true // Automatically add `createdAt` and `updatedAt` fields
});

module.exports = mongoose.model('Booking', BookingSchema);

