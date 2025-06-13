const express = require('express');
const router = express.Router();
const passport = require('passport');
const localStrategy = require('passport-local');
const outController = require('../controller/outController');

outController.initializePass(passport);
router
    .post('/signUp', outController.signUp)
    .post('/login',outController.login)
    .get('/dashbord',outController.isAuth,outController.openDashbord)
    .post('/dashbord/loadChat',outController.loadChat)
    .get('/dashbord/logout', outController.logOut)
    .get('/auth/google',passport.authenticate('google',{scope:["Profile","email"]}))
    .get('/auth/google/callback',passport.authenticate('google',{failureRedirect : "/",successRedirect : "/dashbord"}))
    
exports.router = router;