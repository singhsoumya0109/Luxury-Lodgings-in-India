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
        images: [
            {
                url: {
                    type: String,
                    required: true
                },
                filename: {
                    type: String,
                    required: true
                }
            }
        ],
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
        ],
        bookings: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Booking'
            }
        ],
        totalRooms: {
            type: Number,
            required: true,
            min: [1, 'Total rooms must be at least 1.']
        },
        currentlyOccupied: {
            type: Number,
            default: 0,
            min: [0, 'Occupied rooms cannot be negative.']
        },
        ratingSum: {
            type: Number,
            default: 0,
            min: [0, 'Rating sum cannot be negative.']
        },
        ratingCount: {
            type: Map,
            of: Number,
            default: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
        }
    }
);

module.exports = mongoose.model('Hotel', HotelSchema);
