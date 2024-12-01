if(process.env.NODE_ENV!=="production"){
    require('dotenv').config();
}

const mongoSanitize = require('express-mongo-sanitize');
const express = require('express');
const methodOverride = require('method-override');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const Booking = require('./models/bookings');
const Review = require('./models/review');
const Hotel = require('./models/hotel');
const FuzzySearch=require('fuzzy-search');
const multer  = require('multer')
const {storage}=require('./cloudinary');
const {cloudinary}=require('./cloudinary');
const ExpressMongoSanitize = require('express-mongo-sanitize');
const upload = multer({storage});
const app = express();
app.engine('ejs', ejsMate);


const url=process.env.db_url;

mongoose.connect(url, {})
    .then(() => {
        console.log("MongoDB connection established successfully.");
    })
    .catch(err => {
        console.error("MongoDB connection error:", err);
    });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(methodOverride('_method'));
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'yourSecretKey', // Change this to a secret key for production
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Use true if using HTTPS
}));

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(mongoSanitize());

app.use((req, res, next) => {
    //console.log(req.query);
    res.locals.user = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

// Utility function to catch and handle async errors
const catchAsync = fn => (req, res, next) => {
    fn(req, res, next).catch(next);
};

// Custom Error Class
class AppError extends Error {
    constructor(message, statusCode) {
        super();
        this.message = message;
        this.statusCode = statusCode;
    }
}

// Function to modify returnTo path
const modifyReturnToPath = (path) => {
    if (path.includes('/reviews')) {
        const segments = path.split('/');
        if (segments.length >= 4) {
            return `/${segments[1]}/${segments[2]}`;
        }
    }
    return path;
}

const isLogin = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'You must login first');
        return res.redirect('/login');
    }
    next();
}

const isAuthor = async (req, res, next) => {
    const { id } = req.params;
    const hotel = await Hotel.findById(id);
    if (!hotel.author.equals(req.user._id)) {
        req.flash('error', 'You are not the author');
        return res.redirect(`/hotels/${id}`);
    }
    next();
}

const isNotAuthor = async (req, res, next) => {
    const { id } = req.params;
    const hotel = await Hotel.findById(id);
    if (hotel.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to review your own hotel');
        return res.redirect(`/hotels/${id}`);
    }
    next();
}

const isAuthorReview = async (req, res, next) => {
    const { hotelId, reviewId } = req.params;
    const review = await Review.findById(reviewId).populate('author');
    if (!review) {
        req.flash('error', 'No such review found');
        return res.redirect(`/hotels/${hotelId}`);
    }
    if (!review.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that');
        return res.redirect(`/hotels/${hotelId}`);
    }
    next();
}

const checkAlreadyReviewed = async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user._id;
    const review = await Review.findOne({ author: userId, hotel: id });
    if (review) {
        req.flash('error', 'You already have reviewed this hotel');
        return res.redirect(`/hotels/${id}`);
    }
    next();
}

const storeReturnTo = (req, res, next) => {
    if (req.session.returnTo) {
        res.locals.returnTo = modifyReturnToPath(req.session.returnTo);
    }
    next();
};

// Route to render registration form
app.get('/register', (req, res) => {
    res.render('users/register');
});

// Route to handle registration
app.post('/register', catchAsync(async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        const user = new User({ username, email });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome to Luxury Lodgings India!');
            res.redirect('/');
        });
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/register');
    }
}));

app.get('/login', (req, res) => {
    res.render('users/login');
});

app.post('/login', storeReturnTo, passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), (req, res) => {
    req.flash('success', 'Welcome back to Luxury Lodgings India');
    const returnTo = res.locals.returnTo || '/';
    delete req.session.returnTo; // Remove the returnTo after using it
    res.redirect(returnTo);
});

app.get('/logout', (req, res, next) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        req.flash('success', 'Goodbye! You have successfully logged out');
        res.redirect('/');
    });
});

// app.delete('/users/:id', async (req, res) => {
//     const { id } = req.params; // Use id from req.params
//     const user = await User.findById(id).populate({
//         path: 'reviews',
//         populate: {
//             path: 'hotel'
//         }
//     }).populate('hotels');

//     if (!user) {
//         req.flash('error', 'User not found');
//         return res.redirect('/somewhere'); // Redirect to a relevant page
//     }

//     // Delete all reviews written by the user
//     const reviews = user.reviews;
//     for (let review of reviews) {
//         const hotelId = review.hotel._id;
//         const hotel = await Hotel.findById(hotelId);

//         if (hotel) {
//             hotel.reviews = hotel.reviews.filter(hotelReview => String(hotelReview) !== String(review._id));
//             await hotel.save();
//         }

//         await Review.findByIdAndDelete(review._id);
//     }

//     // Delete all hotels created by the user
//     const hotels = user.hotels;
//     for (let hotel of hotels) {
//         // Get the list of review IDs
//         const reviewIds = hotel.reviews;

//         // Remove each review ID from the corresponding author's reviews array and delete the review
//         for (let reviewId of reviewIds) {
//             const review = await Review.findById(reviewId);

//             if (review) {
//                 const reviewAuthor = await User.findById(review.author);
//                 if (reviewAuthor) {
//                     reviewAuthor.reviews = reviewAuthor.reviews.filter(userReview => String(userReview) !== String(reviewId));
//                     await reviewAuthor.save();
//                 }
//                 await Review.findByIdAndDelete(reviewId);
//             }
//         }

//         await Hotel.findByIdAndDelete(hotel._id);
//     }

//     await User.findByIdAndDelete(id);

//     req.flash('success', 'Successfully deleted user, associated reviews, and hotels');
//     res.redirect(`/hotels`); // Redirect to a relevant page
// });

app.get('/', (req, res) => {
    res.render('home');
});



// app.get('/hotels', catchAsync(async (req, res) => {
//     const { search, location, minPrice, maxPrice, sortBy = 'rating-desc' } = req.query;
//     let query = {};

    
//     if (search) {
//         const hotels = await Hotel.find({});
//         const searcher = new FuzzySearch(hotels, ['title'], {
//             caseSensitive: false,
//             sort: true
//         });
//         query = { _id: { $in: searcher.search(search).map(hotel => hotel._id) } };
//     }

//     if (location) {
//         query.location = { $regex: location, $options: 'i' };
//     }

//     if (minPrice) {
//         query.price = { $gte: Number(minPrice) };
//     }

//     if (maxPrice) {
//         if (!query.price) {
//             query.price = {};
//         }
//         query.price.$lte = Number(maxPrice);
//     }

//     const hotels = await Hotel.find(query).populate('reviews');


//     if (hotels.length === 0) {
//         req.flash('error', 'No hotels found');
//         return res.redirect('/hotels');
//     }

    

//     const [criteria, order] = sortBy.split('-');
//     hotels.sort((a, b) => {
//         let comparison = 0;
//         if (criteria === 'rating') {
//             const avgRatingA = a.reviews.length ? a.ratingSum / a.reviews.length : 0;
//             const avgRatingB = b.reviews.length ? b.ratingSum / b.reviews.length : 0;
//             comparison = avgRatingB - avgRatingA;
//         } else if (criteria === 'price') {
//             comparison = b.price - a.price;
//         } else if (criteria === 'reviews') {
//             comparison = b.reviews.length - a.reviews.length;
//         }

//         return order === 'asc' ? comparison * -1 : comparison;
//     });


//     res.render('hotels/index', { hotels, query: req.query });
// }));



app.get('/hotels', catchAsync(async (req, res) => {
    const { search, location, minPrice, maxPrice, sortBy = 'rating-desc' } = req.query;
    let query = {};

    // Trim the input query fields to remove unnecessary spaces
    const trimmedSearch = search?.trim();
    const trimmedLocation = location?.trim();

    if (trimmedSearch) {
        const hotels = await Hotel.find({});
        const searcher = new FuzzySearch(hotels, ['title'], {
            caseSensitive: false,
            sort: true
        });
        query = { _id: { $in: searcher.search(trimmedSearch).map(hotel => hotel._id) } };
    }

    if (trimmedLocation) {
        query.location = { $regex: trimmedLocation, $options: 'i' };
    }

    if (minPrice) {
        query.price = { $gte: Number(minPrice) };
    }

    if (maxPrice) {
        if (!query.price) {
            query.price = {};
        }
        query.price.$lte = Number(maxPrice);
    }

    const hotels = await Hotel.find(query).populate('reviews');

    if (hotels.length === 0) {
        req.flash('error', 'No hotels found');
        return res.redirect('/hotels');
    }

    // Calculate the average rating for each hotel
    hotels.forEach(hotel => {
        let sum = 0;
        hotel.reviews.forEach(review => {
            sum += review.rating;
        });
        hotel.averageRating = hotel.reviews.length ? sum / hotel.reviews.length : 0;
    });

    const [criteria, order] = sortBy.split('-');
    hotels.sort((a, b) => {
        let comparison = 0;
        if (criteria === 'rating') {
            comparison = b.averageRating - a.averageRating;
        } else if (criteria === 'price') {
            comparison = b.price - a.price;
        } else if (criteria === 'reviews') {
            comparison = b.reviews.length - a.reviews.length;
        }

        return order === 'asc' ? comparison * -1 : comparison;
    });

    res.render('hotels/index', { hotels, query: req.query });
}));





app.get('/hotels/new', isLogin, (req, res) => {
    res.render('hotels/new');
});



app.post('/hotels', isLogin,upload.array('image'), catchAsync(async (req, res) => {
    const hotel = new Hotel(req.body.hotel);
    hotel.images=req.files.map(f=>({url:f.path,filename:f.filename}));
    hotel.author = req.user._id;
    //console.log(hotel);
    await hotel.save();

    // Find the user and update their hotels array
    const user = await User.findById(req.user._id);
    user.hotels.push(hotel._id);
    await user.save();

    req.flash('success', 'Successfully added a new Hotel');
    res.redirect(`/hotels/${hotel._id}`);
}));



app.get('/hotels/:id/bookings',(req,res)=>{
    res.redirect(`/hotels/${req.params.id}`);
})

app.post('/hotels/:id/bookings', isLogin, async (req, res) => {
    const { checkin, checkout } = req.body;
    const rooms = parseInt(req.body.rooms, 10);
    const adults = parseInt(req.body.adults, 10);
    const children = parseInt(req.body.children, 10);

    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // Validate dates
    if (checkinDate < currentDate) {
        req.flash('error', 'Check-in date must be greater than or equal to today\'s date');
        return res.redirect(`/hotels/${req.params.id}`);
    }
    if (checkoutDate < checkinDate) {
        req.flash('error', 'Check-out date must be greater than or equal to the check-in date');
        return res.redirect(`/hotels/${req.params.id}`);
    }

    // Validate room, adult, and children counts
    if (rooms <= 0) {
        req.flash('error', 'Rooms must be positive');
        return res.redirect(`/hotels/${req.params.id}`);
    }
    if (adults <= 0) {
        req.flash('error', 'Adults must be greater than zero');
        return res.redirect(`/hotels/${req.params.id}`);
    }
    if (children < 0) {
        req.flash('error', 'Children must be non-negative');
        return res.redirect(`/hotels/${req.params.id}`);
    }

    const hotel = await Hotel.findById(req.params.id);

    // Check room availability
    if (hotel.currentlyOccupied + rooms > hotel.totalRooms) {
        req.flash('error', 'The hotel is fully occupied or has limited availability. Choose another hotel or adjust the room count.');
        return res.redirect(`/hotels/${req.params.id}`);
    }

    // Update currentlyOccupied count
    hotel.currentlyOccupied += rooms;

    const booking = new Booking({
        checkin: checkinDate,
        checkout: checkoutDate,
        hotel: req.params.id,
        price: hotel.price,
        rooms,
        adults,
        children,
        author: req.user._id
    });

    await booking.save();

    hotel.bookings.push(booking);

    const user = await User.findById(req.user._id);
    user.bookings.push(booking);

    await user.save();
    await hotel.save();

    req.flash('success', 'Successfully booked the hotel');
    res.redirect(`/hotels/${req.params.id}`);
});




app.get('/hotels/:id', catchAsync(async (req, res, next) => {
    const hotel = await Hotel.findById(req.params.id).populate('author').populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    })
    .populate({
        path: 'bookings',
        populate: { path: 'author', select: 'username' }
    });
    if (!hotel) {
        req.flash('error', 'No hotels found');
        return res.redirect('/hotels');
    }
    let hasReviewed = null;
    if (req.user)
        hasReviewed = await Review.findOne({ author: req.user._id, hotel: req.params.id });

    res.render('hotels/show', { hotel, hasReviewed });
}));

app.get('/hotels/:id/edit', isLogin, isAuthor, catchAsync(async (req, res, next) => {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
        req.flash('error', 'No hotels found');
        return res.redirect('/hotels');
    }
    res.render('hotels/edit', { hotel });
}));

// app.put('/hotels/:id', isLogin, isAuthor,upload.array('image'), catchAsync(async (req, res, next) => {
//     const { id } = req.params;
//     console.log(req.body);
//     const hotel = await Hotel.findByIdAndUpdate(id, { ...req.body.hotel }, { new: true, runValidators: true });
//     if (!hotel) {
//         req.flash('error', 'No hotels found');
//         return res.redirect('/hotels');
//     }
//     const imgs=req.files.map(f=>({url:f.path,filename:f.filename}));
//     hotel.images.push(...imgs);
//     await hotel.save();
//     if(req.body.deleteImages)
//     {
//         await hotel.updateOne({$pull: {images: {filename: { $in:req.body.deleteImages}}}});
//     }
//     req.flash('success', 'Successfully updated the Hotel');
//     res.redirect(`/hotels/${hotel._id}`);
// }));



app.put('/hotels/:id', isLogin, isAuthor, upload.array('image'), catchAsync(async (req, res, next) => {
    const { id } = req.params;
    // console.log('Request body:', req.body);
    // console.log('Files:', req.files);

    const hotel = await Hotel.findByIdAndUpdate(id, { ...req.body.hotel }, { new: true, runValidators: true });
    if (!hotel) {
        req.flash('error', 'No hotels found');
        return res.redirect('/hotels');
    }

    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    hotel.images.push(...imgs);
    await hotel.save();

    if (req.body.deleteImages) {
        //console.log('Images to delete:', req.body.deleteImages);
        // Ensure deleteImages is an array of strings
        const deleteImages = req.body.deleteImages.map(filename => filename.trim());
        for(let filename of deleteImages)
        {
            await cloudinary.uploader.destroy(filename);
        }
        await hotel.updateOne({ $pull: { images: { filename: { $in: deleteImages } } } });
    }

    req.flash('success', 'Successfully updated the Hotel');
    res.redirect(`/hotels/${hotel._id}`);
}));


// app.delete('/hotels/:id', isLogin, isAuthor, async (req, res) => {
//     const { id } = req.params;

//     try {
//         // Find the hotel to delete
//         const hotel = await Hotel.findByIdAndDelete(id);

//         if (!hotel) {
//             req.flash('error', 'Hotel not found');
//             return res.redirect('/hotels');
//         }

//         // Remove hotel ID from user's hotels array
//         const user = await User.findById(req.user._id);
//         user.hotels.pull(id);
//         await user.save();

//         // Get the list of review IDs
//         const reviewIds = hotel.reviews;

//         // Remove each review ID from the corresponding author's reviews array
//         for (let reviewId of reviewIds) {
//             const review = await Review.findById(reviewId);

//             if (review) {
//                 const reviewAuthor = await User.findById(review.author);
//                 if (reviewAuthor) {
//                     reviewAuthor.reviews.pull(reviewId);
//                     await reviewAuthor.save();
//                 }
//             }
//         }

//         // Delete associated reviews
//         await Review.deleteMany({ _id: { $in: reviewIds } });

//         req.flash('success', 'Successfully deleted hotel');
//         res.redirect('/hotels');
//     } catch (err) {
//         console.error('Error deleting hotel:', err);
//         req.flash('error', 'Failed to delete hotel');
//         res.redirect('/hotels');
//     }
// });

app.post('/hotels/:id/reviews', isLogin, isNotAuthor, checkAlreadyReviewed, catchAsync(async (req, res) => {
    // Find the hotel by ID
    const hotel = await Hotel.findById(req.params.id);

    // Create a new review
    const review = new Review(req.body.review);
    hotel.ratingSum+=review.rating;
    // Assign the current user as the author of the review
    review.author = req.user._id;
    review.hotel = req.params.id;
    // Push the new review into the hotel's reviews array
    //hotel.reviewCount[review.rating]++;
    hotel.ratingCount.set(review.rating.toString(), hotel.ratingCount.get(review.rating.toString()) + 1);
    hotel.reviews.push(review);

    // Save the review and the hotel
    await review.save();
    await hotel.save();

    // Push the review into the user's reviews array
    const user = await User.findById(req.user._id);
    user.reviews.push(review);
    await user.save();

    // Flash message for success
    req.flash('success', 'Successfully added the review');

    // Redirect back to the hotel's page
    res.redirect(`/hotels/${hotel._id}`);
}));



app.put('/hotels/:hotelId/:reviewId/reviews', isLogin, isAuthorReview, catchAsync(async (req, res) => {
    const { hotelId, reviewId } = req.params;
    const { rating, body } = req.body.review;
    const hotel = await Hotel.findById(hotelId);
    const review = await Review.findById(reviewId);

    if (!review) {
        req.flash('error', 'No such review found');
        return res.redirect(`/hotels/${hotelId}`);
    }

    // Adjust ratingSum for the hotel
    hotel.ratingSum -= review.rating;
    hotel.ratingSum += parseInt(rating);

    // Update rating counts
    if (hotel.ratingCount.has(review.rating.toString())) {
        hotel.ratingCount.set(review.rating.toString(), hotel.ratingCount.get(review.rating.toString()) - 1);
    }

    if (hotel.ratingCount.has(rating.toString())) {
        hotel.ratingCount.set(rating.toString(), hotel.ratingCount.get(rating.toString()) + 1);
    }

    // Update review details
    review.rating = rating;
    review.body = body;

    // Save the updated review and hotel
    await review.save();
    await hotel.save();

    req.flash('success', 'Successfully updated the review');
    res.redirect(`/hotels/${hotelId}`);
}));




app.delete('/hotels/:hotelId/:reviewId/reviews', isLogin, isAuthorReview, catchAsync(async (req, res, next) => {
    const { hotelId, reviewId } = req.params;

    // Find the hotel by ID
    const hotel = await Hotel.findById(hotelId);
    const review1=await Review.findById(reviewId);
    hotel.ratingSum-=review1.rating;
    //hotel.reviewCount[review1.rating]--;
    hotel.ratingCount.set(review1.rating.toString(), hotel.ratingCount.get(review1.rating.toString()) - 1);
    if (!hotel) {
        req.flash('error', 'No such hotel found');
        return res.redirect('/hotels');
    }

    // Remove the review ID from the hotel's reviews array
    hotel.reviews = hotel.reviews.filter(review => review != reviewId);
    await hotel.save();

    // Find the review by ID and delete it
    const review = await Review.findByIdAndDelete(reviewId);

    if (!review) {
        req.flash('error', 'No such review found');
        return res.redirect(`/hotels/${hotelId}`);
    }

    // Remove the review ID from the user's reviews array
    const user = await User.findById(req.user._id);
    user.reviews = user.reviews.filter(userReview => userReview != reviewId);
    await user.save();

    // Flash message for success
    req.flash('success', 'Successfully deleted the review');

    // Redirect back to the hotel's page
    res.redirect(`/hotels/${hotelId}`);
}));

app.get('/user/:id', async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id)
        .populate({
            path: 'reviews',
            populate: {
                path: 'hotel'
            }
        })
        .populate({
            path: 'hotels',
            populate: {
                path: 'reviews'
            }
        })
        .populate({
            path: 'bookings',
            populate: { path: 'hotel' } 
        });
    res.render('user/show', { user });
});



app.get('/user/:id/bookings',async(req,res)=>{
    const { id } = req.params;
    const user = await User.findById(id)
        .populate({
            path: 'bookings',
            populate: { path: 'hotel' } 
        });
    res.render('user/booking', { user });
})
app.all('*', (req, res, next) => {
    next(new AppError('Page not found', 404));
});

app.use((err, req, res, next) => {
    const { statusCode = 500, message = 'Something went wrong!' } = err;
    res.status(statusCode).render('error', { err });
});

app.listen(4000, () => {
    console.log('Serving on port 4000');
});
