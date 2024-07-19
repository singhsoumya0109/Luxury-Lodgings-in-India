const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const HotelSchema = new Schema(
    {
        title: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true,
            min: [0, 'Price must be a non-negative number.']
        },
        image: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        location: {
            type: String,
            required: true
        },
        author: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        reviews: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Review'
            }
        ]
    }
);

module.exports = mongoose.model('Hotel', HotelSchema);
