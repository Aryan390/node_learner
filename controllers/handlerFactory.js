const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError')
const APIFeatures = require('./../utils/apiFeatures');

// deleting factory handler
exports.deleteOne = Model => catchAsync(async (req, res, next) => {
  const doc = await Model.findByIdAndDelete(req.params.id);

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// updating factory handler
exports.updateOne = Model => catchAsync(async (req, res, next) => {
  const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      data : doc
    }
  });
});

// creating factory handler
exports.createOne = Model => catchAsync(async (req, res, next) => {
  const doc = await Model.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      tour: doc
    }
  });
});

// popOption = populate options
exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {
  // const doc = await Model.findById(req.params.id).populate('reviews');

  let query = Model.findById(req.params.id);
  if(popOptions) query = query.populate(popOptions)
  const doc = await query;
  
  // did the .populate() using query middleware
  // const doc = await doc.findById(req.params.id).populate({
  //   path: 'guides',
  //   select: '-__v -passwordChangedAt'
  // });
  // doc.findOne({ _id: req.params.id })
  //find this code written in docModel, as a query middleware

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      data: doc
    }
  });
});

exports.getAll = Model => catchAsync(async (req, res, next) => {
  // to all for nested GET reviews on tour (hack)
  let filter = {}
  // if there is a tourId param present in the URl , then only it should be done
  if(req.params.tourId) filter = { tour: req.params.tourId }

  const features = new APIFeatures(Model.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
    // const doc = await features.query.explain();
  const doc = await features.query;

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: doc.length,
    data: {
      data: doc
    }
  });
});

// this below code from tourController.js was taken as a template to build the above factory handler function
// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(204).json({
//     status: 'success',
//     data: null
//   });
// });


// updating template from tour controller
// exports.updateTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true
//   });

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour
//     }
//   });
// });

// create document template
// exports.createTour = catchAsync(async (req, res, next) => {
//   const newTour = await Tour.create(req.body);

//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour
//     }
//   });
// });

// exports.getTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findById(req.params.id).populate('reviews');
//   // did the .populate() using query middleware
//   // const tour = await Tour.findById(req.params.id).populate({
//   //   path: 'guides',
//   //   select: '-__v -passwordChangedAt'
//   // });
//   // Tour.findOne({ _id: req.params.id })
//   //find this code written in tourModel, as a query middleware

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour
//     }
//   });
// });


// get all tours
// exports.getAllTours = catchAsync(async (req, res, next) => {
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();
//   const tours = await features.query;

//   // SEND RESPONSE
//   res.status(200).json({
//     status: 'success',
//     results: tours.length,
//     data: {
//       tours
//     }
//   });
// });