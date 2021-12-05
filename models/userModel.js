const crypto = require('crypto')
const mongoose = require('mongoose')
const validator = require('validator');
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name']
  },
  email:{
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo: {
    type: String,
    default: 'default.jpg'
  } ,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provid a password'],
    minlength: 8, 
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm you password'],
    validate: {
      // this only works on CREATE() OR SAVE()!!!
      // if we update the password, using .update(), then the below validator won't run
      validator: function(el){
        return el === this.password;
      },
      message: 'Passwords are the not the same!'
    }
  },
  passwordChangedAt: {
    type: Date
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
})

// Salting is simply the addition of a unique, random string of characters known only to the site to each password before it is hashed, typically this “salt” is placed in front of each password. The salt value needs to be stored by the site, which means sometimes sites use the same salt for every password.

// it happens between the moment when we receive the data, and the moment where it's actually persisted to the database
userSchema.pre('save', async function(next){
  // only run this function if password was actually modified or created
  if(!this.isModified('password')) return next();

  // hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12)
  // delete passwordConfirm
  // it's a required field only in terms of user inputing the field, but it's not necessary that the field is persisted in the database
  this.passwordConfirm = undefined
  next();
})

// when resetting password
userSchema.pre('save', function(next){
  // if the password is not modified , then don't change the passwordChangedAt property, otherwise change it
  if(!this.isModified('password') || this.isNew) return next();

  // watch lecture 136 at time 17:42 exactly to understand why 1s was subtracted LOL
  this.passwordChangedAt = Date.now() - 1000;
  next();
})

// deleting the users, well not actually deleting , but showing only active users
userSchema.pre(/^find/, function(next){
  // this points to the current query
  this.find({active: {$ne: false}})
  next();
})

// instance method
userSchema.methods.correctPassword = async function(candidatePassword, userPassword){
  // this will point to the document in an instance method
  // this.password will not be available because we kept the select: false in the password field of the user Schema
  return await bcrypt.compare(candidatePassword, userPassword);
}

userSchema.methods.changedPasswordAfter = function(JWTTimestamp){
  if(this.passwordChangedAt){
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10)

    // here we compare if, the token issued time is less than the time at which we changed the password, (and the time here is in ms)
    return JWTTimestamp < changedTimestamp  //100 < 200
  }
  
  // false means not changed
  return false;
}

// we send an unencrypted version of the token to the user and store an encrypted version of the reset token in the database
// and we are just modifying the document values and not really updating/saving it , so we have to call the .save() method, and it is done in authController.js
userSchema.methods.createPasswordResetToken = function(){
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')

  // console.log({resetToken}, this.passwordResetToken);

  // the token should expire in 10 mins
  // so we put the time 10mins ahead of NOW
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
}

const User = mongoose.model('User', userSchema)

module.exports = User;