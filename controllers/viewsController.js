const Tour = require('../models/tourModel')
const Booking = require('../models/bookingModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')

exports.getOverview = catchAsync(async (req, res) => {
  // 1) get tour data from collection
  const tours = await Tour.find();
  console.log('sem');

  // 2) build template 

  // 3) render that template using tour data from step 1

  res.status(200).render('overview', {
    tour: 'The Forest Hiker',
    tours
  });
})

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) get the data, for the requested tour (including reviews and tour-guides)
  const tour = await Tour.findOne({slug: req.params.slug}).populate({
    path: 'reviews',
    fields: 'review rating user'
  })

  if(!tour) {
    return next(new AppError('There is no tour with that name.', 404))
  }

  // 2) build template

  // 3) render template using data from step 1
  
  res.status(200).render('tour', {
    title: `${tour.name} Tour`, 
    tour
  })
})

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'log into your account'
  })
}

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your Account'
  })
}

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1) find all bookings
  const bookings = await Booking.find({ user: req.user.id })

  // 2) find tours with the returned IDs
  const tourIDs = bookings.map(el => el.tour)
  // the operator will select all tours which have an ID which is in the tourIDs array
  const tours = await Tour.find({ __id: {$in : tourIDs} })
  
  res.status(200).render('overview', {
    title: 'My Tours',
    tours
  })
})