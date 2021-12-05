const express = require('express')
const reviewController = require('./../controllers/reviewController')
const authController = require('./../controllers/authController')

const router = express.Router({ mergeParams: true })

// nested routes
// POST /tour/2343fadfa/reviews
// GET /tour/2343fadfa/reviews
// GET /tour/2343fadfa/reviews/53435jhjkdsf
// redirected from tourRoutes.js
// router.use('/:tourId/reviews', reviewRouter), by this line of code
// all of this routes will end up in the below route thanks to the mergeParams

router.use(authController.protect)

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user') ,
    reviewController.setTourUserIds,
    reviewController.createReview
  )

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(authController.restrictTo('user', 'admin'), reviewController.updateReview)
  .delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview);

module.exports = router;