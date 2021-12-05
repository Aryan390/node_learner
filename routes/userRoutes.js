const express = require('express');
const multer = require('multer')
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

// // it will save all the images in the 'dest: value'option directory
// const upload = multer({ dest: 'public/img/users' })

const router = express.Router();

router.post('/signup', authController.signup)
router.post('/login', authController.login)
router.get('/logout', authController.logout)

router.post('/forgotPassword', authController.forgotPassword)
router.patch('/resetPassword/:token', authController.resetPassword)

// so this middleware will run for the below code, and ensure that the user is authenticated
// so all of the below routes are protected, and we don't have to write .protect() middleware for every route separately, (protects all routes after this middleware)
router.use(authController.protect)

router.patch('/updateMyPassword', authController.updatePassword)

router.get('/me', userController.getMe, userController.getUser)
// it is .single() because we want to only upload one single image (file)
// and then as an argument we pass on the name of the field that is going to hold the image to upload
// and by field, here it means the field in the form that is going to be uploading the image
// upload.single() middleware will put the file(photo) or at least some information about the file
// on the req object
// router.patch('/updateMe', upload.single('photo'), userController.updateMe)
router.patch(
  '/updateMe', 
  userController.uploadUserPhoto, 
  userController.resizeUserPhoto,
  userController.updateMe
)
router.delete('/deleteMe', userController.deleteMe)

// the below all middleware, can only be accessed by admin and not any user/guide/lead-guide
router.use(authController.restrictTo('admin'))

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;