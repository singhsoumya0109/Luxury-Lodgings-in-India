const mongoose = require('mongoose');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');
const Hotel = require('../models/hotel');
const Review = require('../models/review');
const User = require('../models/user');
const Booking=require('../models/bookings');

// Use db_url from .env
mongoose.connect("/hehe",{})
    .then(() => {
        console.log("CONNECTION RUNNING");
    })
    .catch(err => {
        console.log("ERROR!!!", err);
    });

const sample = array => array[Math.floor(Math.random() * array.length)];

// List of random hotel/resort image URLs
const imageUrls = [
    'https://media.istockphoto.com/id/106393587/photo/luxury-hotel.jpg?s=612x612&w=0&k=20&c=vbt66vTRaL4Dn-ZDHo_28jAg6rFon8Ezv5Ad9CtHppE=',
    'https://media.istockphoto.com/id/490555943/photo/indian-hotel-resort-evening-scene.jpg?s=612x612&w=0&k=20&c=Kdxdri8dOvSchwNXzV1uYQcXGAI8CD0BKSi7gkxPzKI=',
    'https://media.istockphoto.com/id/1226021105/photo/taj-mahal-palace-hotel-in-mumbai.jpg?s=612x612&w=0&k=20&c=0Jh6bjKHvLVtXb3hTdhmwOgseTjFIZjmMcMiOIT_A_w=',
    'https://media.istockphoto.com/id/157533612/photo/indian-palace.jpg?s=612x612&w=0&k=20&c=6Q2B7L2iSiYihFfMtDpNi9V0RSSECCV-vXhlLTf9t6s=',
    'https://media.istockphoto.com/id/157533612/photo/indian-palace.jpg?s=612x612&w=0&k=20&c=6Q2B7L2iSiYihFfMtDpNi9V0RSSECCV-vXhlLTf9t6s=',
    'https://media.istockphoto.com/id/139744879/photo/dusk-at-the-poolside-of-a-luxury-hotel.jpg?s=612x612&w=0&k=20&c=NSg6Nh6N1LfLClZQutF-Vze4vXlBlw7nCF0laCGlpMo=',
    'https://media.istockphoto.com/id/1094387460/photo/night-beach-party-in-goa.jpg?s=612x612&w=0&k=20&c=90oHFh3klXfMASU5t0za7OyFde5FMLA9i_kB3mi37sM=',
    'https://media.istockphoto.com/id/1432806576/photo/facade-of-the-taj-mahal-palace-hotel-in-colaba-district-mumbai-india.jpg?s=612x612&w=0&k=20&c=qZ2pVQIOg6oIc34ho9o7l8G0pwLFnUr2Sv08USbKE2M=',
    'https://media.istockphoto.com/id/96669695/photo/luxury-palace-courtyard.jpg?s=612x612&w=0&k=20&c=CAAsyEccQsjiIXST3omGGYzmYNgcad8SrucOyEOxCAs=',
    'https://media.istockphoto.com/id/539018660/photo/taj-mahal-hotel-and-gateway-of-india.jpg?s=612x612&w=0&k=20&c=L1LJVrYMS8kj2rJKlQMcUR88vYoAZeWbYIGkcTo6QV0=',
    'https://media.istockphoto.com/id/539018660/photo/taj-mahal-hotel-and-gateway-of-india.jpg?s=612x612&w=0&k=20&c=L1LJVrYMS8kj2rJKlQMcUR88vYoAZeWbYIGkcTo6QV0=',
    'https://media.istockphoto.com/id/137421702/photo/the-gateway-of-india.jpg?s=612x612&w=0&k=20&c=0qX3Sh5m_HK_lRs-AIqZvOUCT-aVHXmHFabTneQSITs=',
    'https://media.istockphoto.com/id/629006734/photo/city-palace-and-pichola-lake-in-udaipur-india.jpg?s=612x612&w=0&k=20&c=qhP5o-dpZoWuRdCyrOVJfu6IHf7472QGovEJmytYzrI='
    // Add more URLs as needed
];

// List of random descriptions
const descriptions = [
    'Nestled in lush gardens, this serene resort offers luxurious rooms, modern amenities, and scenic views. Perfect for families and adventurers, enjoy fine dining, spa treatments, and cultural experiences. Relax and reconnect with nature.',
    'Experience the splendor of India with breathtaking views, nature trails, and plenty of wildlife. This resort is ideal for nature enthusiasts looking for a peaceful retreat.',
    'Enjoy a rustic yet elegant stay with basic facilities, close to lakes and rivers for boating and fishing. Perfect for a weekend getaway.',
    'A well-maintained hotel offering beautiful vistas, excellent facilities, and friendly staff. Ideal for both seasoned travelers and first-timers.',
    'Located in a picturesque setting, this resort provides a perfect escape from the hustle and bustle of city life. Enjoy outdoor activities or simply unwind in nature.',
    'A family-friendly resort with playgrounds, picnic areas, and plenty of activities for children. A great spot for making lasting memories with loved ones.'
    // Add more descriptions as needed
];

const reviewBody = {
    1: 'Very bad. The experience was disappointing from start to finish. Numerous issues overshadowed any positives, making it a regrettable stay.',
    2: 'Bad. There were several problems that negatively affected my experience, making it hard to enjoy the stay. Needs significant improvements.',
    3: 'Good. Overall, the stay was satisfactory. There were some minor issues, but nothing that ruined the experience. An acceptable option.',
    4: 'Very good. I enjoyed my stay quite a bit. There were a few things that could be improved, but they were minor. Would consider returning.',
    5: 'Loved it. Everything was fantastic! I had an amazing stay and would highly recommend this hotel/resort to others. A truly memorable experience.'
};

function getWeightedRandom() {
    // Define weights for numbers 1 to 5
    const weights = [1, 10, 20, 40, 33]; // Weights: 1, 2, 3, 4, 5 respectively
    const cumulativeWeights = [];
    let sum = 0;
    
    // Calculate cumulative weights
    for (let weight of weights) {
        sum += weight;
        cumulativeWeights.push(sum);
    }

    // Generate a random number between 0 and the sum of weights
    const random = Math.random() * sum;

    // Find the corresponding number based on the cumulative weights
    for (let i = 0; i < cumulativeWeights.length; i++) {
        if (random < cumulativeWeights[i]) {
            return i + 1;
        }
    }
}

const seedDB = async () => {
    const admin = await User.findById('672d16061151a2f1996fa392');

    // Find users based on the provided IDs
    const reviewAuthors = [
        await User.findById('672d16181151a2f1996fa397'),
        await User.findById('672d16691151a2f1996fa39c'),
        await User.findById('672d167e1151a2f1996fa3a1'),
        await User.findById('672d16931151a2f1996fa3a6'),
        await User.findById('672d16be1151a2f1996fa3ab')
    ];

    // Clear existing reviews and hotels for admin and review authors
    admin.reviews = [];
    admin.hotels = [];
    admin.bookings=[];
    for (const user of reviewAuthors) {
        user.reviews = [];
        user.hotels=[];
        user.bookings=[];
    }
    await admin.save();
    for (const user of reviewAuthors) {
        await user.save();
    }

    await Hotel.deleteMany({});
    await Review.deleteMany({});
    await Booking.deleteMany({});
    const ratedReviews = Math.floor(Math.random() * 11) + 40;

    for (let i = 0; i < ratedReviews; i++) {
        const random36 = Math.floor(Math.random() * 36);
        const price1 = Math.floor(Math.random() * 5001) + 2000; // Adjusting price range to reflect hotel prices

        const hotel = new Hotel({
            location: `${cities[random36].city}, ${cities[random36].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            images: [
                {
                    url: sample(imageUrls),
                    filename: 'Hotel1.png'
                },
                {
                    url: sample(imageUrls),
                    filename: 'Hotel2.png'
                },
                {
                    url: sample(imageUrls),
                    filename: 'Hotel3.png'
                }
            ],
            description: sample(descriptions), // Use a random description
            price: price1,
            author: '672d16061151a2f1996fa392',
            totalRooms:5,

        });

        await hotel.save();

        // for (let j = 0; j < 5; j++) {
        //     const rating1 = getWeightedRandom();
        //     const review = new Review({
        //         body: reviewBody[rating1],
        //         rating: rating1,
        //         author: reviewAuthors[j]._id, // Use the specific author ID
        //         hotel: hotel._id
        //     });
        //     reviewAuthors[j].reviews.push(review); // Add the review to the user's reviews array
        //     await review.save();
        //     hotel.ratingSum+=rating1;
        //     hotel.ratingCount.set(rating1.toString(), hotel.ratingCount.get(rating1.toString()) + 1);
        //     hotel.reviews.push(review); // Add the review to the hotel's reviews array
        // }


        // Generate a random number between 1 and 5 for the number of reviews
        const numReviews = Math.floor(Math.random() * 5) + 1;

        // Shuffle the authors array and pick a unique subset
        const shuffledAuthors = reviewAuthors.sort(() => 0.5 - Math.random());
        const selectedAuthors = shuffledAuthors.slice(0, numReviews);

        for (let j = 0; j < numReviews; j++) {
            const rating1 = getWeightedRandom();
            const review = new Review({
                body: reviewBody[rating1],
                rating: rating1,
                author: selectedAuthors[j]._id, // Use the specific author ID
                hotel: hotel._id
            });
            selectedAuthors[j].reviews.push(review); // Add the review to the user's reviews array
            await review.save();
            
            // Update hotel ratingSum and ratingCount
            hotel.ratingSum += rating1;
            hotel.ratingCount.set(rating1.toString(), hotel.ratingCount.get(rating1.toString()) + 1);
            hotel.reviews.push(review); // Add the review to the hotel's reviews array
        }

        admin.hotels.push(hotel);
        await hotel.save(); // Save hotel again with the reviews
    }

    const noReview = Math.floor(Math.random() * 11) + 10;
    // Create hotels with no reviews
    for (let i = 0; i < noReview; i++) {
        const random36 = Math.floor(Math.random() * 36);
        const price1 = Math.floor(Math.random() * 5001) + 2000; // Adjusting price range to reflect hotel prices

        const hotel = new Hotel({
            location: `${cities[random36].city}, ${cities[random36].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            images: [
                {
                    url: sample(imageUrls),
                    filename: 'Hotel1.png'
                },
                {
                    url: sample(imageUrls),
                    filename: 'Hotel2.png'
                },
                {
                    url: sample(imageUrls),
                    filename: 'Hotel3.png'
                }
            ],
            description: sample(descriptions), // Use a random description
            price: price1,
            author: '672d16061151a2f1996fa392',
            totalRooms:5
        });
        admin.hotels.push(hotel);
        await hotel.save(); // Save hotel without reviews
    }
    await admin.save();
    for (const user of reviewAuthors) {
        await user.save(); // Save each user with their new reviews
    }
}

seedDB().then(() => {
    mongoose.connection.close();
});
