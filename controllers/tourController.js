const multer = require('multer')
const sharp = require('sharp')
const AppError = require('../utils/appError');
const Tour = require('./../models/tourModel');
// const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
// const AppError = require('./../utils/appError');
const factory = require('./handlerFactory')

const multerStorage = multer.memoryStorage();

// we pass true, if the uploaded file is an image, and false otherwise in the callback
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')){
    cb(null, true);
  }else{
    cb(new AppError('Not an image! Please upload only images', 400), false);
  }
}

// it will save all the images in the 'dest: value'option directory
// const upload = multer({ dest: 'public/img/users' })
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
})

// if we just wanted multpile files to be uploaded with differen field names, then:
exports.uploadTourImages = upload.fields([
  // maxCount means, that we can have only one field called imageCover which can be processed
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
])

// upload.singl('image') will give req.file
// upload.array('image', 5) will give req.files

// if we just wanted multpile files to be uploaded with same name, then:
// upload.array('images', 5), where 2nd arg is maxCount

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  console.log(req.files);

  if(!req.files.imageCover || !req.files.images) return next();

  // 1) over image
  // code for uploading the cover image
  // const imageCoverFilename = `tour-${req.params.id}-${Date.now()}-cover.jpeg`
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`)
  // req.body.imageCover = imageCoverFilename

  
  // 2) images
  req.body.images = []
  // code for uploading the 3files
  // here async function inside forEach is not used correctly, because, after execution of the forEach, it will directly execute the next() function, but we want to go to next middleware only after the promise returned is resolved because to update the tour document in the database, and then only go to the next middleware, otherwise the whole code breaks, so we use Promise.all() here
  // req.files.images.forEach(async (file, i) => {
  //   const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}-cover.jpeg`

  //   await sharp(req.files.imageCover[0].buffer)
  //     .resize(2000, 1333)
  //     .toFormat('jpeg')
  //     .jpeg({ quality: 90 })
  //     .toFile(`public/img/tours/${filename}`)

  //   req.body.images.push(filename);
  // })
  // here is the solution to the above problem:
  await Promise.all(req.files.images.map(async (file, i) => {
    const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}-cover.jpeg`

    await sharp(file.buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${filename}`)

    req.body.images.push(filename);
  }))

  next();
})

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);
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

// popOptions passed
exports.getTour = factory.getOne(Tour, { path: 'reviews' })

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

exports.createTour = factory.createOne(Tour); 

// exports.createTour = catchAsync(async (req, res, next) => {
//   const newTour = await Tour.create(req.body);

//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour
//     }
//   });
// });

exports.updateTour = factory.updateOne(Tour)

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

// fucking mind blowing code
exports.deleteTour = factory.deleteOne(Tour);

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

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 }
    }
    // {
    //   $match: { _id: { $ne: 'EASY' } }
    // }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2021

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: { numTourStarts: -1 }
    },
    {
      $limit: 12
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});


// /tours=within?distance=233&center=-40,45&unit=mi
//  /tours-within/233/center/-40,45/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params
  const [lat, lng] = latlng.split(',')

  // mongodb expects the raidus field in radians, so we obtain that by dividing the number by earth's radius
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1

  if(!lat || !lng) {
    next(new AppError('Please provide latitude and longitude in the format lat, lng', 400))
  }

  // console.log(distance, lat, lng , unit);

  // a geo spatial operator has been used, by $geoWithin
  const tours = await Tour.find({ 
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } } 
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  })
})

exports.getDistances = catchAsync(async (req, res, next)=> {
  const { latlng, unit } = req.params
  const [lat, lng] = latlng.split(',')

  // mongodb expects the raidus field in radians, so we obtain that by dividing the number by earth's radius
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001

  if(!lat || !lng) {
    next(new AppError('Please provide latitude and longitude in the format lat, lng', 400))
  }

  const distances = await Tour.aggregate([
    // this is the only geospatial pipeline stage that actually exists
    // this one always needs to be the first one in the pipeline
    // geoNear requires that atleast one of our fields be a geospatial index
    // it will use that one field to perform calculation
    // but if you have multiple fields with geospatial indexes, then you need to define a key paramenter to perform calculations
    {
      $geoNear: {
        // all the distances will be calculated from this point that we define here and all start locations
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        // this is the name of the field which will be created and all the distances will be stored
        distanceField: 'distance',
        // distanceMultiplier: 0.001
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ])

  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  })
})