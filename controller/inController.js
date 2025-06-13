const myFunctions = require('../myFunctions')
const model = require('../model/userModel');
const users = model.users;
const chats = model.chats;
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cloudinary = require('cloudinary').v2;

// cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});
require('dotenv').config();

// it render all users page
exports.allUsers = async (req, res) => {
  try {
    const user = await users.find({ _id: { $ne: req.user } }).select('-password');
    const loginUser = await users.findById(req.user).select('-password');
    myFunctions.renderView(res, 'allUsers', { user: user, loginUser: loginUser })
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: 'internal server error. unable to take this request. pls try again later.' })
  }
}
// it saves the friend request in db
exports.saveRequest = async (sender, reciever, callback) => {
  try {
    await users.updateOne({ _id: sender }, { $push: { sentReq: reciever } })
    await users.updateOne({ _id: reciever }, { $push: { friendReq: sender } })
    const reqSender = await users.findById(sender).select('-password -sentReq -username -friends -friendReq');
    const reqReciever = await users.findById(reciever).select('-password -sentReq -username -friends')
    const friendReq = await users.find({ _id: { $in: reqReciever.friendReq } }).select('-password -sentReq -username -friends -friendReq');

    callback(null, reqSender, friendReq.length);
  } catch (error) {
    console.log(error);
    callback(error, null);
  }
}
// it shows friend reqs on webpage
exports.friends = async (req, res) => {
  try {
    const user = await users.findById(req.user);
    const friendReq = await users.find({ _id: { $in: user.friendReq } }).select('-password -sentReq -username -friends -friendReq');
    const friends = await users.find({ _id: { $in: user.friends } }).select('-password -sentReq -username -friends -friendReq');
    myFunctions.renderView(res, 'friends', { friendReq: friendReq, friends: friends });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'internal server error. unable to take this request. pls try again later.' })
  }
}
// it accpets the friend request and save it in db
exports.acceptRequest = async (sender, reciever, callback) => {
  try {
    await users.updateOne({ _id: sender }, { $push: { friends: reciever } })
    await users.updateOne({ _id: reciever }, { $push: { friends: sender } })
    await users.updateOne({ _id: sender }, { $pull: { sentReq: reciever } })
    await users.updateOne({ _id: reciever }, { $pull: { friendReq: sender } })
    const recieverObj = await users.findById(reciever).select('-password -sentReq -username -friends -friendReq');
    const senderObj = await users.findById(sender).select('-password -sentReq -username -friends -friendReq');
    callback(null, recieverObj, senderObj);
  } catch (error) {
    console.log(error);
    callback(error, null);
  }
}
// loading the users with whom login user has chat
exports.userChats = async (req, res) => {
  try {
    const usersChats = await chats.find({ $or: [{ senderId: req.user }, { receiverId: req.user }] })
    const friendList = await users.findOne({_id : req.user}).select('-password -sentReq -username -friendReq');
    console.log("hello",friendList);  
    
    myFunctions.renderView(res, 'userChats', { chatUser: usersChats,friends : friendList });

  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'internal server error. unable to take this request. pls try again later.' })
  }
}
// it render reset password page
exports.resetPassword = async (req, res) => {
  try {
    myFunctions.renderView(res, 'resetPassword', {});

  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'internal server error. unable to take this request. pls try again later.' })
  }
}
// it render profile password page
exports.profile = async (req, res) => {
  try {
    const user = await users.findById(req.user).select('-_id -password -sentReq -friends -friendReq');
    myFunctions.renderView(res, 'profile', { user: user });

  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'internal server error. unable to take this request. pls try again later.' })
  }
}
// it resets the password
var salt = bcrypt.genSaltSync(parseInt(process.env.SALT));
exports.passwordReset = async (req, res) => {
  try {
    const user = await users.findById(req.user);
    if (user.authType === 'google') {
      return res.status(200).json({ success: false, message: 'Google users cannot reset password' });
    }
    const isValid = await bcrypt.compare(req.body.oldPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid old password' });
    }
    const hashedPassword = bcrypt.hashSync(req.body.newPassword, salt);
    user.password = hashedPassword.toString('hex');
    user.save()
      .then(() => {
        console.log(hashedPassword);
        res.status(201).json({ success: true })
      })
      .catch(error => {
        console.log("Error saving password", error);
        res.status(500).json({ success: false })
      })
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: 'internal server error.pls try again later.' })
  }
}
// it updates the name is db
exports.changeName = async (req, res) => {
  try {
    await users.updateOne({ _id: req.user }, { name: req.body.name });
    res.status(200).send({ success: true, name: req.body.name });
  } catch (error) {
    console.log(err);
    res.status(500).send({ success: false })
  }
}

// it updates the profile is db and cloudinary
exports.changeProfile = async (req, res) => {
  try {
    const user = await users.findById(req.user);
    let profileImg, profileId;
    if (user.profile.startsWith('http')) {
      profileImg = user.profile.split('/')[9];
      profileId = profileImg.slice(0, profileImg.lastIndexOf('.'));
    }
    let public_id = 'chatapp/profiles/' + profileId
    let filepath, file;
    if (req.file) {
      file = req.file;
    }

    if (file) {
      // Upload to cloudinary
      await cloudinary.uploader.upload(req.file.path, {
        folder: 'chatapp/profiles',
      }, async (err, result) => {
        if (err) {
          console.log(err);
          return res.status(500).json({
            success: false
          })
        } else {
          filepath = result.url;
          user.profile = filepath;
          await user.save();
          res.status(200).send({ success: true });
        }
      })
    }

    if (profileId && file) {
      // delete image from cloudinary
      await cloudinary.uploader
        .destroy(public_id)
        .then(() => {
          console.log("image replaced");
        })
        .catch((error) => {
          console.log(error);
        });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false })
  }
}
// it show user details when clicked on a user
exports.showUserDetails = async (req, res) => {
  try {
    const currentUser = await users.findById(req.user)
    const user = await users.findById(req.query.userId).select('-password -sentReq -friends -friendReq -username');
    const friend = await currentUser.friends.includes(req.query.userId);
    const friendReq = await currentUser.friendReq.includes(req.query.userId);
    const friendReqSent = await currentUser.sentReq.includes(req.query.userId);
    myFunctions.renderView(res, 'showUserDetails', { user: user, friends: friend, friendReq: friendReq, friendReqSent: friendReqSent });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'internal server error. unable to take this request. pls try again later.' })
  }
}
// unfriends an user
exports.unFriend = async (req, res) => {
  try {
    const user = await users.findById(req.user);
    if(!user.friends.includes(req.params.id)) {
      res.status(404).json({ message: "no user found. Refresh the page" });
    }
    await users.updateOne({ _id: req.user }, { $pull: { friends: req.params.id } })
    await users.updateOne({ _id: req.params.id }, { $pull: { friends: req.user } })
    res.status(200).send({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'internal server error. unable to take this request. pls try again later.' })
  }
}
// it cancels the sent friend request
exports.cancelSentRequest = async (req, res) => {
  try {
    const user = await users.findById(req.user);
    if(!user.sentReq.includes(req.params.id)) {
      res.status(404).json({ message: "no request found. Refresh the page" });
    }
    await users.updateOne({ _id: req.user }, { $pull: { sentReq: req.params.id } })
    await users.updateOne({ _id: req.params.id }, { $pull: { friendReq: req.user } })
    res.status(200).json({ message: "Success" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'internal server error. unable to take this request. pls try again later.' })
  }
}
// it delete the friend request
exports.deleteFriendRequest = async (req, res) => {
  try {
    const user = await users.findById(req.user);
    if(!user.friendReq.includes(req.params.id)) {
      res.status(404).json({ message: "no request found. Refresh the page" });
    }
    await users.updateOne({ _id: req.user }, { $pull: { friendReq: req.params.id } })
    await users.updateOne({ _id: req.params.id }, { $pull: { sentReq: req.user } })
    res.status(200).json({ message: "Success" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'internal server error. unable to take this request. pls try again later.' })
  }
}
exports.userChats = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user);
    const userChats = await chats.find({
      $or: [
        { sender: userId },
        { reciever: userId }
      ]
    });

    const userIdSet = new Set();

    userChats.forEach(chat => {
      const senderId = chat.sender.toString();
      const receiverId = chat.reciever.toString();
      const currentUserId = userId.toString();

      if (senderId !== currentUserId) userIdSet.add(senderId);
      if (receiverId !== currentUserId) userIdSet.add(receiverId);
    });

    const otherUserIds = Array.from(userIdSet).map(id => id !== 'undefined' ? id.toString() : console.log(id));
    console.log(otherUserIds);

    const userList = await users.find(
      { _id: { $in: otherUserIds } },
      '-password'
    );
    
    myFunctions.renderView(res, 'userChats', { chatUser: userList});
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'internal server error. unable to take this request. pls try again later.' })
  }
}