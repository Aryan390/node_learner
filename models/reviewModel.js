const mongoose = require('mongoose')
const Tour = require('./../models/tourModel')

// ref to tour, ref to user
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'review must belong to a user']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

// the below line of code is to prevent multiple reviews from one user for one tour
// it is basically the combo of tour and user is to be unique
reviewSchema.index({ tour: 1, user: 1 }, { unique: true })

reviewSchema.pre(/^find/, function(next){
  // this.populate({
  //   path: 'tour',
  //   select: 'name'
  // }).populate({
  //   path: 'user',
  //   select: 'name photo'
  // })

  // path is actually the field name
  this.populate({
    path: 'user',
    select: 'name photo'
  })

  next();
})

// 'this' points to the current model in a static method, whereas in instance method it points to the document
reviewSchema.statics.calcAverageRatings = async function(tourId){
  const stats = await this.aggregate([
    // here we selected all the reviews that matched the current tourId and calculated the statistic for all these reviews
    {
      $match: {tour: tourId}
    },
    {
      // right side of the colon are the field name of the model, lol, typing even this is so embarassing
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: {$avg: '$rating'}
      }
    }
  ])
  console.log(stats);

  if(stats.length > 0){
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    })
  }else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    })
  }
}

// 'this' points to the current review document
reviewSchema.post('save', function(){
  // Review.calcAverageRatings(this.tour)

  // constructor is basically the model which created the 'this' document
  this.constructor.calcAverageRatings(this.tour)
  // .post() doesn't have access to next(), dont know why, find out later
  // next()
})

reviewSchema.pre(/^findOneAnd/, async function(next){
  // here 'this' is the current query and not the document
  // const r = await this.findOne()
  // this.findOne() returns the document
  this.r = await this.findOne()
  // console.log(this.r);
})

// here we are passing the above pre-function data to the below post-function so that the document can be updated

reviewSchema.post(/^findOneAnd/, async function(){
  // this.r = await this.findOne(), does not work here, query has already executed
  await this.r.constructor.calcAverageRatings(this.r.tour)
})

const Review = mongoose.model('Review', reviewSchema)

module.exports = Review;