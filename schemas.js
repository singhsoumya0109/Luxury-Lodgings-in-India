const Joi = require('joi');

module.exports.hotelSchema = Joi.object({
    hotel: Joi.object({
        name: Joi.string().required(),
        price: Joi.number().required().min(0),
        location: Joi.string().required(),
        description: Joi.string().required(),
        rating: Joi.number().integer().min(1).max(5).required()  // Adding rating validation
    }).required()
});
