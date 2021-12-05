const multer= require('multer')
const sharp = require('sharp')
const e = require('express');
const AppError = require('../utils/appError');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const Review = require('../models/reviewModel');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     // cb is like next from express
//     // first arg is an error, if there is one
//     // second arg is actual destination
//     cb(null, 'public/img/users')
//   },
//   filename: (req, file, cb) => {
//     // user-98989sdafljad-233423423.jpeg
//     const ext = file.mimetype.split('/')[1]
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`)
//   }
// })

// this below way, photo file will be stored as buffer
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

exports.uploadUserPhoto = upload.single('photo')

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  // if there is no file , then go to the next middleware
  if(!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`

  // when we are doing image processing like this, it is better to save the photo file to memory and not the disk
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`)

  next();
})

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if(allowedFields.includes(el)) newObj[el] = obj[el];
  })
  return newObj;
}

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
}

// exports.getAllUsers = catchAsync(async (req, res) => {
//   const users = await User.find();

//   // SEND RESPONSE
//   res.status(200).json({
//     status: 'success',
//     results: users.length,
//     data: {
//       users
//     }
//   });
// });

exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log(req.file)
  // // our body parser cannot handle filesso we need multer
  // console.log(req.body)

  // 1) Create error if user POSTs password data
  if(req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError('This route is not for password updates. Please use /updateMyPassword', 400)
    )
  }

  // 2) Filtered out unwanted field names that are not allowed to be updated like the role field
  const filteredBody = filterObj(req.body, 'name', 'email')
  if(req.file) filteredBody.photo = req.file.filename

  // 3) update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true, 
    runValidators: true
  });
  

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  })
})

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false })

  res.status(204).json({
    status: 'success',
    data: null
  })
})


exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use signup instead'
  });
};

// no populate options
exports.getUser = factory.getOne(User)
exports.getAllUsers = factory.getAll(User)

// do not update passwords with this! because of findAndUpdateById() doesn't run the pre/post save middleware
exports.updateUser = factory.updateOne(User)
exports.deleteUser = factory.deleteOne(User)