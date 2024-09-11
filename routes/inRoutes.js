const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.diskStorage({}) });
const inController = require('../controller/inController');

router
     .get('/allUsers', inController.allUsers)
     .get('/friends', inController.friends)
     .get('/userChats', inController.userChats)
     .get('/resetPassword', inController.resetPassword)
     .post('/passwordReset', inController.passwordReset)
     .get('/profile', inController.profile)
     .post('/changeName', inController.changeName)
     .post('/changeProfile', upload.single('image') , inController.changeProfile)
      
exports.router = router;