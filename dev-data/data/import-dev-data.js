const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel');
const Review = require('./../../models/reviewModel')
const User = require('./../../models/userModel')

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => console.log('DB connection successful!'));

// READ JSON FILE
const tours = JSON.parse(
  // fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8')
  fs.readFileSync(`${__dirname}/tours.json`, 'utf-8')
);
const users = JSON.parse(
  // fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8')
  fs.readFileSync(`${__dirname}/users.json`, 'utf-8')
);
const reviews = JSON.parse(
  // fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8')
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

// IMPORT DATA INTO DB
const importData = async () => {
  try {
    await Tour.create(tours);
    // all of the validation that is done will be skipped because of the below option passed to user, and will get rid of the user validation failed error, for importing users to the database
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('Data successfully loaded!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// DELETE ALL DATA FROM DB
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data successfully deleted!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}


// this query is from 3.6 or later version , and doesn't work , so try a previous version if it doesn't work, for me the previous version 2.012 or later worked
// mongodb+srv://aryantrue:<PASSWORD>@cluster0.qmz58.mongodb.net/natours?retryWrites=true&w=majority