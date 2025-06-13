const path = require('path');
const model = require('../model/userModel');
const users = model.users;
const chats = model.chats;
const mongoose = require('mongoose');
const passport = require('passport');
const localStrategy = require('passport-local');
const googleStrategy = require('passport-google-oauth20')
const ejs = require('ejs');
const bcrypt = require('bcrypt');
require('dotenv').config();

var salt = bcrypt.genSaltSync(parseInt(process.env.SALT));

// user signUp function
exports.signUp = async (req, res) => {
  try {
    const user = await users.find({ username: req.body.username });

    if (user.length > 0) { return res.status(400).json({ message: "Email already in use" }); }
    const newUser = new users();
    const hashedPassword = bcrypt.hashSync(req.body.password, salt);


    newUser.name = req.body.name;
    newUser.profile = "/public/images/blank profile.jpg" ;
    newUser.username = req.body.username;
    newUser.password = hashedPassword.toString('hex');
    newUser.save()
      .then(() => {
        res.status(201).json({ success: true })
      })
      .catch(error => {
        console.log("Error Creating User", error);
        res.status(500).json({ success: false })
      })
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: 'internal server error.pls try again later.' })
  }



};
// user login function
exports.login = (req, res, next) => {
  try {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ success: false });
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({ redirectUrl: '/dashbord' });
      });
    })(req, res, next);
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: 'internal server error.pls try again later.' })
  }
}
// middleware between login to profile
exports.isAuth = (req, res, next) => {
  try {
    if (!req.user) {
      return res.redirect('/');
    }
    return next();
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: 'internal server error.pls try again later.' })
  }

}
// it opens user dashbord
exports.openDashbord = async (req, res) => {
  try {
    const user = await users.find({ _id: { $ne: req.user } }).select('-password');
    const loginUser = await users.findById(req.user).select('-password');
    const friendReq = await users.find({ _id: { $in: loginUser.friendReq } }).select('-password -sentReq -username -friends -friendReq');   

    ejs.renderFile(path.resolve(__dirname, '../views/dashbord.ejs'), { user: user, loginUser:loginUser,reqCount : friendReq.length}, function (err, str) {
      if(!err){res.send(str);}
      else{console.log(err)}
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: 'internal server error.pls try again later.' })
  }

}
// load old chats
exports.loadChat = async (req,res)=>{
  try {
    const userChats = await chats.find({$or : [ {sender : req.user, reciever : req.body.recieverId}, {sender : req.body.recieverId, reciever : req.user}]});
    res.json(userChats);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'internal server error. unable to open chat. pls try again later.' })
  }
}
// chat saving function
exports.saveChat = async (sender, reciever, message, callback) => {
  try {
    const newMsg = new chats();
    newMsg.sender = sender;
    newMsg.reciever = reciever;
    newMsg.message = message;
    await newMsg.save();
    callback(null, newMsg);
  } catch (error) {
    console.log(error);
    callback(error, null);
  }
}

// logout function
exports.logOut = (req, res, next) => {
  try {
    req.logout(function (err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: 'internal server error.pls try again later.' })
  }

};
// passport initialization
exports.initializePass = (passport) => {
  passport.use(new localStrategy(async function verify(username, password, done) {
    const user = await users.findOne({ username });

    if (!user) { return done(null, false); }

    bcrypt.compare(password, user.password, function (err, result) {
      if (err) {
        return done(err);
      }
      if (!result) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    });

  }));
  passport.use(new googleStrategy({
    clientID : process.env.GOOGLE_CLIENT_ID,
    clientSecret : process.env.GOOGLE_SECRET_KEY,
    callbackURL : "/auth/google/callback"
  },async(accessToken,refreshToken,profile,done)=>{
    try {
      const user = await users.findOne({username : profile.emails[0].value})
      if(!user){
        user = await users.create({
          name : profile.displayName,
          username : profile.emails[0].value,
          profile : profile.photos[0].value,
          authType: "google",
        })
      }
      return done(null,user)
    } catch (error) {
      return done(error, null);
    }
  }))

  passport.serializeUser((user, done) => {
    done(null, user._id)
  });

  passport.deserializeUser(async function (user, done) {
    done(null, user);
  });
};
