const crypto = require('crypto')
const { promisify } = require('util');
const jwt = require('jsonwebtoken')
const User = require('./../models/userModel')
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError')
// const sendEmail = require('./../utils/email')
const Email = require('./../utils/email')

const signToken = id => {
  // or { id }
  return jwt.sign({id: id}, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  })
}

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id)
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true
  }

  if(process.env.NODE_ENV === 'production') cookieOptions.secure = true

  res.cookie('jwt', token, cookieOptions)

  // remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'Success',
    token,
    data: {
      user
    }
  })
}

exports.signup = catchAsync(async(req, res, next) => {
  // corrected the below .create({}) so that the user cannot login as admin
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role
  })

  // const url = 'http://localhost:3000/me';
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  // creation of token
  createSendToken(newUser, 201, res);
  // const token = signToken(newUser._id)

  // res.status(201).json({
  //   status: 'Success',
  //   token,
  //   data: {
  //     user: newUser
  //   }
  // })
})


exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1 check if email and passwords exist
  if(!email || !password){
    return next(new AppError('Please provide email and password'), 400);
  }
  //2 check if the user exists and passowrd is correct

  // we used +password string here, because in the user schema , we kept the select option to false, and so it is not shown in the output, so to show password to output we can use the below .select() method
  const user = await User.findOne({email: email}).select('+password')

  if(!user || !(await user.correctPassword(password, user.password))){
    return next(new AppError('Incorrect email or password', 401))
  }
  
  //3 if everything is ok, send token to client
  createSendToken(user, 200, res);
  // const token = signToken(user._id);

  // res.status(200).json({
  //   status: 'success',
  //   token
  // })
})

// when we are doing user based authentication, we dont need an endpoint like this (/logout) , but when a super secure way of cookie storage is used, then we need to do it this way
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  })
  res.status(200).json({ status: 'success' })
}

// mind blower code
exports.protect = catchAsync(async (req, res, next) => {
  // 1) getting token and check if it exists
  let token
  if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
    token = req.headers.authorization.split(' ')[1];
  } else if(req.cookies.jwt){
    token = req.cookies.jwt
  }
  
  if(!token) return next(new AppError('You are not logged in! Please log in to get access.', 401))

  // 2) verification token , verify() is an asynchronous function, it takes a 3rd callback func, which runs when the verification process is complete, but here a promisify func will be used to make verify() return a promise , and here decoded will hold the decoded payload from the jwt token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if(!currentUser) {
    return next(new AppError('The user belonging to this token does no longer exist', 401))
  }

  // 4) check if user changed password after the token was issued
  if(currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('Users recently changed password! Please log in again', 401));
  }

  //GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser
  res.locals.user = currentUser
  next();
})

// only for rendered pages, and there will be no errors and this middleware will run for every request to the server, it is kind of similar to protect middleware
// remove the catchAsync from this handler, as it will send an error, and just use local try/catch, and call the next() middleware in case of an error
exports.isLoggedIn = async (req, res, next) => {
  // 1) getting token and check if it exists
  // if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
  //   token = req.headers.authorization.split(' ')[1];
  // } 
  
  if(req.cookies.jwt){
    // 1) verify token
    try{
      const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET)

      // 3) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if(!currentUser) {
        return next()
      }

      // 4) check if user changed password after the token was issued
      if(currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // there is a logged in user
      // res.locals is available to pug templates, kind of like passing variables to pug templates with render() function
      res.locals.user = currentUser
      return next();
    }catch(err){
      return next();
    }
  }
  next();
}

  // only the admin and lead-guide roles can get access to the next middleware, the below function is really just fucking perfect, we can use this piece of middleware to restrict access to users
  exports.restrictTo = (...roles) => {
    return (req, res, next) => {
      // roles = ['admin', 'lead-guide']. role = 'user'
      if(!roles.includes(req.user.role)){
        return next(new AppError('You do not have permission to perform this action'), 403);
      }

      next();
  }
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. get user based on posted email
  const user = await User.findOne({ email: req.body.email })
  if(!user){
    return next(new AppError('There is no user with email address', 404));
  }

  // 2. generate the random reset token
  const resetToken = user.createPasswordResetToken();
  // the argument passed to save() , disables the validators, think later about the fact that , jonas said that validators are supposed to run at the time of creation of the document, and not when the ..save() is called, think later about this
  await user.save({ validateBeforeSave: false });

  // // 3. send it to the user's email
  // const resetURL = `${req.protocol}://${req.get('host')}/api/users/resetPassword/${resetToken}`

  // const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\n If You didn't forget your password, please ignore this email!`

  try{
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token (valid for 10min)',
    //   message
    // })
    // 3. send it to the user's email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`
    await new Email(user, resetURL).sendPasswordReset();
  
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    })
  }catch(err){
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save({ validateBeforeSave: false });

    return next(new AppError('There was an error sending the email. Try again later!', 500));
  }

})

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({ 
    passwordResetToken: hashedToken, 
    passwordResetExpires: {$gt: Date.now() } 
  })

  // 2) if token has not expired, and there is user, set the new password
  if(!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = req.body.password
  user.passwordConfirm = req.body.passwordConfirm
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) update changedPasswordAt property for the user
  // 4) log the user in, send jwt
  createSendToken(user, 200, res);
  // const token = signToken(user._id);

  // res.status(200).json({
  //   status: 'success',
  //   token
  // })
})

exports.updatePassword =catchAsync(async (req, res, next) => {
  // 1) get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) check if posted current password is correct
  if(!(await user.correctPassword(req.body.passwordCurrent, user.password))){
    return next(new AppError('Your current password is wrong', 401));
  }

  // 3) if so, update the password
  user.password  = req.body.password
  user.passwordConfirm  = req.body.passwordConfirm
  await user.save();
  // user.findByIdAndUpdate() will NOT work as intended!

  // 4) log user in, send JWT
  createSendToken(user, 200, res);
})