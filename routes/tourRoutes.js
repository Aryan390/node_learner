const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController')
// const reviewController = require('./../controllers/reviewController')
const reviewRouter = require('./../routes/reviewRoutes')

const router = express.Router();


// router.param('id', tourController.checkID);

// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect, 
//     authController.restrictTo('user'),
//     reviewController.createReview
//   )

// here review router doesn't get access to the tourId param here
// because by default each router has access only to the parameters of their specific routes,
// so reviewRouter, has only one path '/' in the reviewRoutes file, hence no access to the param
// in order to get the access to those params, we have to merge the params
// const router = express.Router({ mergeParams: true })
// by putting this above line of code, in reviewRoutes.js file, we can get access the tourId param
router.use('/:tourId/reviews', reviewRouter)

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect, 
    authController.restrictTo('admin', 'lead-guide', 'guide'), 
    tourController.getMonthlyPlan
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin)

// /tours=distacne?distance=233&center=-40,45&unit=mi
//  /tours-distance/233/center/-40,45/unit/mi

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances)

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect, 
    authController.restrictTo('admin', 'lead-guide'), 
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect, 
    authController.restrictTo('admin', 'lead-guide'), 
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect, 
    authController.restrictTo('admin', 'lead-guide'), 
    tourController.deleteTour
  );


module.exports = router;
