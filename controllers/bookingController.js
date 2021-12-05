const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const AppError = require('../utils/appError');
const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory')


exports.getCheckoutSession = catchAsync( async (req, res, next) => {
  // 1) get the currently booked tour
  const tour = await Tour.findById(req.params.tourId)

  // 2) create checkout session
  // creating a session will do an api call to stripe
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourID,
    // details about the product
    line_items: [
      {
        // these all field names come from stipe
        name: `${tour.name} Tour`,
        description: tour.summary,
        // these images have to already hosted on the internet, which stripe will then use,
        // it can be an array of images
        images: [`https://www.natours.dev/img/tours/tour-1-cover.jpg`],
        amount: tour.price * 100,
        currency: 'inr',
        quantity: 1
      }
    ]
  })

  // 3) create session as response( send it to the client )
  res.status(200).json({
    status: 'success',
    session
  })
})


exports.createBookingCheckout = catchAsync(async(req, res, next) => {
  // this is only temporary, because it's unsecure, everyone can make bookings without paying
  const { tour, user, price } = req.query;

  if(!tour && !user && !price) return next();

  await Booking.create({tour, user, price})

  res.redirect(req.originalUrl.split('?')[0])

})


exports.createBooking = factory.createOne(Booking)
exports.getBooking = factory.getOne(Booking)
exports.getAllBookings = factory.getAll(Booking)
exports.updateBooking = factory.updateOne(Booking)
exports.deleteBooking = factory.deleteOne(Booking)